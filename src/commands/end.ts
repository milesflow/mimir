import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { readConfig } from "../config/io.js";
import { buildStudyNote } from "../notes/build-study-note.js";
import { clearActiveSession, readActiveSession, SessionIOError } from "../session/io.js";
import {
  finalizeSessionDraft,
  SessionDraftService,
} from "../session/session-draft-service.js";
import type { SectionKey } from "../draft/layout.js";
import {
  appendSectionBody,
  parseDraftMarkdown,
  serializeDraftMarkdown,
} from "../draft/markdown-draft.js";
import { MIMIR_VERSION } from "../version.js";

/**
 * End the active session and write the study note. Shared by CLI and MCP.
 */
export type EndSessionTagsInput = {
  technology?:
    | "swift"
    | "swiftui"
    | "typescript"
    | "javascript"
    | "nodejs"
    | "react"
    | "nextjs"
    | "python"
    | "java"
    | "kotlin"
    | "rust"
    | "go"
    | "csharp"
    | ".net"
    | "postgres"
    | "mysql"
    | "mongodb"
    | "redis"
    | "graphql"
    | "rest"
    | "docker"
    | "kubernetes"
    | "aws"
    | "gcp"
    | "azure"
    | "openapi"
    | "sql"
    | "other";
  technologyOther?: string;
  topic?:
    | "architecture"
    | "api"
    | "performance"
    | "security"
    | "authentication"
    | "authorization"
    | "database"
    | "concurrency"
    | "testing"
    | "observability"
    | "ui"
    | "mobile"
    | "refactor"
    | "feature"
    | "bugfix"
    | "business-logic"
    | "data-processing"
    | "design"
    | "other";
  topicOther?: string;
  hasAlgorithm?: boolean;
  businessRule?: boolean;
  architecture?: boolean;
};

export type EndSessionSectionsInput = Partial<{
  explanation: string;
  summary: string;
  key_concepts: string;
}>;

export type EndSessionReferenceInput = {
  label?: string;
  path?: string;
  lineStart?: number;
  lineEnd?: number;
  snippet?: string;
  language?: string;
};

export type EndSessionPayload = {
  sections?: EndSessionSectionsInput;
  sectionsStrategy?: "onlyFillEmpty" | "overwrite" | "append";
  tags?: EndSessionTagsInput;
  metadata?: Record<string, unknown>;
  metadataReplace?: boolean;
  references?: EndSessionReferenceInput[];
  /** Skip MCP-only checks (non-empty sections + tags). Prefer CLI `mimir end` instead. */
  skipMimirEndGuards?: boolean;
};

export type EndSessionOptions = {
  /** `mcp` enforces guards so agents cannot publish empty notes without tags. */
  source?: "cli" | "mcp";
};

export function assertMimirPublishGuards(
  sections: Record<SectionKey, string>,
  metadata: Record<string, unknown>
): void {
  const keys: SectionKey[] = ["explanation", "summary", "key_concepts"];
  const anyBody = keys.some((k) => sections[k].trim().length > 0);
  const hasTags = Object.keys(metadata).some((k) => k.startsWith("tags_"));
  if (!anyBody) {
    throw new SessionIOError(
      "MCP cannot publish this session: Explanation, Summary, and Key concepts are all empty. " +
        "Call mimir_get_session with includeDraftBody: true, then call mimir_end_session with sections summarizing the conversation (and doubts)."
    );
  }
  if (!hasTags) {
    throw new SessionIOError(
      "MCP cannot publish this session: no tags in metadata. " +
        "Pass tags (technology, topic, hasAlgorithm, businessRule, architecture) on mimir_end_session, or set them earlier with mimir_set_metadata."
    );
  }
}

function normalizeTagsToMetadataPatch(tags: EndSessionTagsInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (tags.technology) {
    if (tags.technology === "other") {
      const v = tags.technologyOther?.trim();
      if (!v) {
        throw new SessionIOError("tags.technology='other' requires tags.technologyOther.");
      }
      patch["tags_technology"] = v;
    } else {
      patch["tags_technology"] = tags.technology;
    }
  }

  if (tags.topic) {
    if (tags.topic === "other") {
      const v = tags.topicOther?.trim();
      if (!v) {
        throw new SessionIOError("tags.topic='other' requires tags.topicOther.");
      }
      patch["tags_topic"] = v;
    } else {
      patch["tags_topic"] = tags.topic;
    }
  }

  if (tags.hasAlgorithm !== undefined) {
    patch["tags_has_algorithm"] = tags.hasAlgorithm;
  }
  if (tags.businessRule !== undefined) {
    patch["tags_is_business_rule"] = tags.businessRule;
  }
  if (tags.architecture !== undefined) {
    patch["tags_is_architecture"] = tags.architecture;
  }

  return patch;
}

async function patchDraftSectionsIfNeeded(
  draftPath: string,
  sections: EndSessionSectionsInput,
  strategy: "onlyFillEmpty" | "overwrite" | "append"
): Promise<void> {
  const draftContent = await readFile(draftPath, "utf8");

  const updates: Array<{ key: SectionKey; value: string | undefined }> = [
    { key: "explanation", value: sections.explanation },
    { key: "summary", value: sections.summary },
    { key: "key_concepts", value: sections.key_concepts },
  ];

  if (strategy === "append") {
    let next = draftContent;
    for (const { key, value } of updates) {
      if (value === undefined) continue;
      const trimmed = value.trimEnd();
      if (trimmed.length === 0) continue;
      next = appendSectionBody(next, key, trimmed);
    }
    await writeFile(draftPath, next, "utf8");
    return;
  }

  const parsed = parseDraftMarkdown(draftContent);

  for (const { key, value } of updates) {
    if (value === undefined) continue;
    const trimmed = value.trimEnd();

    if (strategy === "onlyFillEmpty") {
      if (parsed.sections[key].trim().length === 0) {
        parsed.sections[key] = trimmed;
      }
    } else {
      parsed.sections[key] = trimmed;
    }
  }

  const updatedDraft = serializeDraftMarkdown(parsed.frontmatterBlock, parsed.sections);
  await writeFile(draftPath, updatedDraft, "utf8");
}

export async function endSessionAndPublish(
  input: EndSessionPayload = {},
  options: EndSessionOptions = {}
): Promise<{ publishedPath: string }> {
  const source = options.source ?? "cli";
  const session = await readActiveSession();

  if (session.draftPath === undefined) {
    const hasPayload =
      input.sections !== undefined ||
      input.tags !== undefined ||
      input.metadata !== undefined ||
      input.references !== undefined;
    if (hasPayload) {
      throw new SessionIOError(
        "Cannot auto-save draft sections/tags/references for a legacy session. Start a new session with `mimir start`."
      );
    }
    const config = await readConfig();
    const endedAt = new Date().toISOString();
    const { filename, contents } = buildStudyNote({
      session,
      endedAt,
      mimirVersion: MIMIR_VERSION,
    });
    const filePath = path.join(config.notesDir, filename);
    try {
      await writeFile(filePath, contents, "utf8");
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      throw new SessionIOError(
        `Cannot write study note at ${filePath}: ${err.message}`,
        { cause: e }
      );
    }
    await clearActiveSession();
    return { publishedPath: filePath };
  }

  const svc = new SessionDraftService();

  const tagsPatch =
    input.tags !== undefined ? normalizeTagsToMetadataPatch(input.tags) : {};
  const metadataPatch = input.metadata ?? {};
  const combinedMetadataPatch = { ...tagsPatch, ...metadataPatch };

  const replace = input.metadataReplace === true;
  // Default behavior: do not overwrite metadata keys already set by the user mid-session.
  const patchToApply =
    replace
      ? combinedMetadataPatch
      : Object.fromEntries(
          Object.entries(combinedMetadataPatch).filter(
            ([k]) => !(k in session.metadata)
          )
        );

  if (Object.keys(patchToApply).length > 0) {
    await svc.setMetadata(
      patchToApply,
      replace
    );
  }

  if (input.references && input.references.length > 0) {
    for (const ref of input.references) {
      await svc.addReference({
        label: ref.label,
        path: ref.path,
        lineStart: ref.lineStart,
        lineEnd: ref.lineEnd,
        snippet: ref.snippet,
        language: ref.language,
      });
    }
  }

  if (input.sections && Object.keys(input.sections).length > 0) {
    const strategy =
      input.sectionsStrategy ?? (source === "mcp" ? "append" : "onlyFillEmpty");
    await patchDraftSectionsIfNeeded(
      session.draftPath,
      input.sections,
      strategy
    );
  }

  if (source === "mcp" && input.skipMimirEndGuards !== true) {
    const fresh = await readActiveSession();
    if (!fresh.draftPath) {
      throw new SessionIOError("Session lost draftPath before finalize.");
    }
    const draftText = await readFile(fresh.draftPath, "utf8");
    const parsed = parseDraftMarkdown(draftText);
    assertMimirPublishGuards(parsed.sections, fresh.metadata);
  }

  const { publishedPath } = await finalizeSessionDraft();
  await clearActiveSession();
  return { publishedPath };
}

export async function runEnd(): Promise<void> {
  const { publishedPath } = await endSessionAndPublish({}, { source: "cli" });
  console.log("Study session ended.");
  console.log(`Note written: ${publishedPath}`);
}
