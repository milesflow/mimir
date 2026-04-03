import type { SessionReference } from "../session/schema.js";
import {
  SECTION_HEADING,
  SECTION_KEYS,
  type SectionKey,
} from "./layout.js";

export type ParsedDraft = {
  frontmatterBlock: string;
  sections: Record<SectionKey, string>;
};

function headingToKey(heading: string): SectionKey | undefined {
  const t = heading.trim();
  for (const key of SECTION_KEYS) {
    if (SECTION_HEADING[key] === t) return key;
  }
  return undefined;
}

/**
 * Splits draft markdown into frontmatter (without outer --- delimiters) and section bodies.
 */
export function parseDraftMarkdown(full: string): ParsedDraft {
  let rest = full.replace(/^\uFEFF/, "");
  let frontmatterBlock = "";

  if (rest.startsWith("---\n")) {
    const end = rest.indexOf("\n---\n", 4);
    if (end === -1) {
      throw new Error("Draft has unclosed YAML frontmatter.");
    }
    frontmatterBlock = rest.slice(4, end).trimEnd();
    rest = rest.slice(end + 5);
  }

  const sections = Object.fromEntries(
    SECTION_KEYS.map((k) => [k, ""])
  ) as Record<SectionKey, string>;

  const lines = rest.split("\n");
  let currentKey: SectionKey | undefined;
  const bodyLines: string[] = [];

  const flush = () => {
    if (currentKey !== undefined) {
      sections[currentKey] = bodyLines
        .join("\n")
        .replace(/^\n+/, "")
        .replace(/\n+$/, "");
    }
    bodyLines.length = 0;
  };

  for (const line of lines) {
    const m = /^## (.+)$/.exec(line);
    if (m) {
      const key = headingToKey(m[1] ?? "");
      if (key !== undefined) {
        flush();
        currentKey = key;
        continue;
      }
    }
    bodyLines.push(line);
  }
  flush();

  return { frontmatterBlock, sections };
}

export function serializeDraftMarkdown(
  frontmatterBlock: string,
  sections: Record<SectionKey, string>
): string {
  const fm = frontmatterBlock.trimEnd();
  const parts: string[] = [];
  if (fm.length > 0) {
    parts.push("---", fm, "---", "");
  }
  for (const key of SECTION_KEYS) {
    parts.push(`## ${SECTION_HEADING[key]}`, "", sections[key] ?? "", "");
  }
  return parts.join("\n").replace(/\n+$/, "\n");
}

export function patchSectionBody(
  full: string,
  key: SectionKey,
  newBody: string
): string {
  const parsed = parseDraftMarkdown(full);
  parsed.sections[key] = newBody.replace(/\n+$/, "");
  return serializeDraftMarkdown(parsed.frontmatterBlock, parsed.sections);
}

export function appendSectionBody(
  full: string,
  key: SectionKey,
  text: string
): string {
  const parsed = parseDraftMarkdown(full);
  const cur = parsed.sections[key] ?? "";
  const add = text.trimEnd();
  if (add.length === 0) return full;
  parsed.sections[key] = cur.length === 0 ? add : `${cur.trimEnd()}\n\n${add}`;
  return serializeDraftMarkdown(parsed.frontmatterBlock, parsed.sections);
}

export function setSectionBody(
  full: string,
  key: SectionKey,
  body: string
): string {
  const parsed = parseDraftMarkdown(full);
  parsed.sections[key] = body.replace(/\n+$/, "");
  return serializeDraftMarkdown(parsed.frontmatterBlock, parsed.sections);
}

function yamlQuoted(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

export function buildInitialDraftMarkdown(input: {
  id: string;
  startedAt: string;
  topic: string;
  cwd?: string;
  mimirVersion: string;
}): string {
  const lines: string[] = [
    "mimir_session_id: " + yamlQuoted(input.id),
    "started_at: " + yamlQuoted(input.startedAt),
    "topic: " + yamlQuoted(input.topic),
    "mimir_version: " + yamlQuoted(input.mimirVersion),
  ];
  if (input.cwd !== undefined) {
    lines.push("cwd: " + yamlQuoted(input.cwd));
  }
  const frontmatter = lines.join("\n");
  const sections = Object.fromEntries(
    SECTION_KEYS.map((k) => [k, ""])
  ) as Record<SectionKey, string>;
  sections.initial_question = input.topic;
  sections.references = "_No references yet._";
  return serializeDraftMarkdown(frontmatter, sections);
}

export function renderReferencesMarkdown(refs: SessionReference[]): string {
  if (refs.length === 0) {
    return "_No references yet._";
  }
  const blocks: string[] = [];
  for (const r of refs) {
    const title = r.label?.trim() || r.id;
    blocks.push(`### ${title}`);
    if (r.path) {
      const loc =
        r.lineStart !== undefined
          ? ` (lines ${r.lineStart}${r.lineEnd !== undefined ? `–${r.lineEnd}` : ""})`
          : "";
      blocks.push("", `- **Path:** \`${r.path}\`${loc}`, "");
    }
    if (r.snippet?.trim()) {
      const lang = r.language?.trim();
      if (lang) {
        blocks.push(`\`\`\`${lang}`, r.snippet.trimEnd(), "```", "");
      } else {
        blocks.push("```", r.snippet.trimEnd(), "```", "");
      }
    }
  }
  return blocks.join("\n").trimEnd();
}

/**
 * Merges ended_at and metadata into draft frontmatter; keeps body from parsed draft.
 */
export function finalizeDraftFrontmatter(
  frontmatterBlock: string,
  input: {
    endedAt: string;
    metadata: Record<string, unknown>;
  }
): string {
  const yamlKeyForMetadataKey = (k: string): string => {
    // Tags are meant to be first-class filterable YAML keys, not meta_* blobs.
    if (k === "tags" || k.startsWith("tags_")) return k;
    return `meta_${k}`;
  };

  const metaKeyNames = new Set(
    Object.keys(input.metadata)
      .filter((k) => /^[a-zA-Z0-9_-]+$/.test(k))
      .map((k) => `${yamlKeyForMetadataKey(k)}:`)
  );
  const kept = frontmatterBlock
    .split("\n")
    .filter((line) => {
      const t = line.trimStart();
      if (t.startsWith("ended_at:")) return false;
      for (const prefix of metaKeyNames) {
        if (t.startsWith(prefix)) return false;
      }
      return true;
    })
    .filter((l) => l.trim().length > 0);

  const out = [...kept];
  out.push(`ended_at: ${yamlQuoted(input.endedAt)}`);

  for (const [k, v] of Object.entries(input.metadata)) {
    if (!/^[a-zA-Z0-9_-]+$/.test(k)) continue;
    const metaKey = yamlKeyForMetadataKey(k);
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out.push(`${metaKey}: ${yamlQuoted(String(v))}`);
    } else {
      out.push(`${metaKey}: ${yamlQuoted(JSON.stringify(v))}`);
    }
  }

  return out.join("\n");
}

export function mergeFinalDraft(
  draftFull: string,
  session: { metadata: Record<string, unknown> },
  endedAt: string
): string {
  const parsed = parseDraftMarkdown(draftFull);
  const fm = finalizeDraftFrontmatter(parsed.frontmatterBlock, {
    endedAt,
    metadata: session.metadata,
  });
  return serializeDraftMarkdown(fm, parsed.sections);
}
