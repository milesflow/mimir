import { randomUUID } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";

import { readConfig } from "../config/io.js";
import type { MimirConfig } from "../config/schema.js";
import {
  appendSectionBody,
  buildInitialDraftMarkdown,
  mergeFinalDraft,
  patchSectionBody,
  renderReferencesMarkdown,
  setSectionBody,
} from "../draft/markdown-draft.js";
import { APPENDABLE_SECTIONS, PATCHABLE_SECTIONS } from "../draft/layout.js";
import type { SectionKey } from "../draft/layout.js";
import { buildPublishedFilename } from "../notes/build-study-note.js";
import { MIMIR_VERSION } from "../version.js";
import {
  activeSessionExists,
  readActiveSession,
  writeActiveSession,
  SessionIOError,
} from "./io.js";
import type { ActiveSession, SessionReference } from "./schema.js";
import {
  MAX_METADATA_KEYS,
  MAX_REFERENCES,
  MAX_SNIPPET_CHARS,
} from "./schema.js";

export type StartLikeOptions = {
  topic: string;
  recordCwd: boolean;
};

function ensureDraftInNotesDir(notesDir: string, draftPath: string): void {
  const root = path.resolve(notesDir) + path.sep;
  const d = path.resolve(draftPath);
  if (!d.startsWith(root)) {
    throw new SessionIOError(
      "Draft path must be inside the configured notes directory."
    );
  }
}

async function readDraftOrThrow(session: ActiveSession): Promise<string> {
  if (!session.draftPath) {
    throw new SessionIOError(
      "This session has no draft (legacy). Start a new session with mimir start."
    );
  }
  try {
    return await readFile(session.draftPath, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new SessionIOError(
      `Cannot read draft at ${session.draftPath}: ${err.message}`,
      { cause: e }
    );
  }
}

async function writeDraftOrThrow(draftPath: string, body: string): Promise<void> {
  try {
    await writeFile(draftPath, body, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new SessionIOError(
      `Cannot write draft at ${draftPath}: ${err.message}`,
      { cause: e }
    );
  }
}

export async function createSessionWithDraft(
  options: StartLikeOptions
): Promise<void> {
  const topic = options.topic.trim();
  if (!topic) {
    throw new Error('Option "--topic" is required and must not be empty.');
  }

  const config = await readConfig();

  if (await activeSessionExists()) {
    await readActiveSession();
    throw new Error(
      "A study session is already active. Run `mimir status` or `mimir end` first."
    );
  }

  const id = randomUUID();
  const startedAt = new Date().toISOString();
  const draftsDir = path.join(config.notesDir, ".mimir", "drafts");
  await mkdir(draftsDir, { recursive: true });
  const draftPath = path.join(draftsDir, `${id}.md`);

  const session: ActiveSession = {
    id,
    startedAt,
    topic,
    references: [],
    metadata: {},
    draftPath,
  };
  if (options.recordCwd) {
    session.cwd = process.cwd();
  }

  ensureDraftInNotesDir(config.notesDir, draftPath);

  const md = buildInitialDraftMarkdown({
    id,
    startedAt,
    topic,
    cwd: session.cwd,
    mimirVersion: MIMIR_VERSION,
  });

  await writeDraftOrThrow(draftPath, md);
  await writeActiveSession(session);
}

export async function finalizeSessionDraft(): Promise<{ publishedPath: string }> {
  const config = await readConfig();
  const session = await readActiveSession();
  const endedAt = new Date().toISOString();

  if (!session.draftPath) {
    throw new SessionIOError(
      "Session has no draftPath; use legacy finalize path in runEnd."
    );
  }

  ensureDraftInNotesDir(config.notesDir, session.draftPath);

  let draftContent: string;
  try {
    draftContent = await readFile(session.draftPath, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new SessionIOError(
      `Cannot read draft at ${session.draftPath}: ${err.message}`,
      { cause: e }
    );
  }

  let finalMd: string;
  try {
    finalMd = mergeFinalDraft(draftContent, session, endedAt);
  } catch (e: unknown) {
    const err = e as Error;
    throw new SessionIOError(`Draft is invalid: ${err.message}`, { cause: e });
  }
  const filename = buildPublishedFilename(session, endedAt);
  const publishedPath = path.join(config.notesDir, filename);

  try {
    await writeFile(publishedPath, finalMd, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new SessionIOError(
      `Cannot write study note at ${publishedPath}: ${err.message}`,
      { cause: e }
    );
  }

  try {
    await unlink(session.draftPath);
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw new SessionIOError(
        `Cannot remove draft at ${session.draftPath}: ${err.message}`,
        { cause: e }
      );
    }
  }

  return { publishedPath };
}

export class SessionDraftService {
  private async load(): Promise<{ config: MimirConfig; session: ActiveSession }> {
    const config = await readConfig();
    const session = await readActiveSession();
    if (session.draftPath) {
      ensureDraftInNotesDir(config.notesDir, session.draftPath);
    }
    return { config, session };
  }

  async getSessionState(includeDraftBody: boolean): Promise<
    { active: false } | { active: true; session: ActiveSession; draft?: string }
  > {
    if (!(await activeSessionExists())) {
      return { active: false };
    }
    const session = await readActiveSession();
    if (!includeDraftBody || !session.draftPath) {
      return { active: true, session };
    }
    try {
      const draft = await readFile(session.draftPath, "utf8");
      return { active: true, session, draft };
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      throw new SessionIOError(
        `Cannot read draft at ${session.draftPath}: ${err.message}`,
        { cause: e }
      );
    }
  }

  async addReference(input: {
    label?: string;
    path?: string;
    lineStart?: number;
    lineEnd?: number;
    snippet?: string;
  }): Promise<{ id: string }> {
    const { session } = await this.load();
    if (!session.draftPath) {
      throw new SessionIOError("No draft for this session (legacy session).");
    }
    if (session.references.length >= MAX_REFERENCES) {
      throw new SessionIOError(`Maximum references reached (${MAX_REFERENCES}).`);
    }
    const snip = input.snippet ?? "";
    if (snip.length > MAX_SNIPPET_CHARS) {
      throw new SessionIOError(
        `Snippet exceeds maximum length (${MAX_SNIPPET_CHARS} characters).`
      );
    }

    const ref: SessionReference = {
      id: randomUUID(),
      label: input.label,
      path: input.path,
      lineStart: input.lineStart,
      lineEnd: input.lineEnd,
      snippet: input.snippet,
    };

    session.references.push(ref);
    const draft = await readDraftOrThrow(session);
    const refsMd = renderReferencesMarkdown(session.references);
    const updated = setSectionBody(draft, "references", refsMd);
    await writeDraftOrThrow(session.draftPath, updated);
    await writeActiveSession(session);
    return { id: ref.id };
  }

  async setMetadata(
    patch: Record<string, unknown>,
    replace: boolean
  ): Promise<void> {
    const { session } = await this.load();
    session.metadata = replace ? { ...patch } : { ...session.metadata, ...patch };
    const keys = Object.keys(session.metadata);
    if (keys.length > MAX_METADATA_KEYS) {
      throw new SessionIOError(
        `Too many metadata keys after merge (max ${MAX_METADATA_KEYS}).`
      );
    }
    await writeActiveSession(session);
  }

  async patchSection(sectionKey: SectionKey, body: string): Promise<void> {
    if (!PATCHABLE_SECTIONS.has(sectionKey)) {
      throw new SessionIOError(
        `Section "${sectionKey}" cannot be patched (allowed: ${[...PATCHABLE_SECTIONS].join(", ")}).`
      );
    }
    const { session } = await this.load();
    if (!session.draftPath) {
      throw new SessionIOError("No draft for this session.");
    }
    const draft = patchSectionBody(await readDraftOrThrow(session), sectionKey, body);
    await writeDraftOrThrow(session.draftPath, draft);
  }

  async appendSection(sectionKey: SectionKey, text: string): Promise<void> {
    if (!APPENDABLE_SECTIONS.has(sectionKey)) {
      throw new SessionIOError(
        `Section "${sectionKey}" does not support append (allowed: ${[...APPENDABLE_SECTIONS].join(", ")}).`
      );
    }
    const { session } = await this.load();
    if (!session.draftPath) {
      throw new SessionIOError("No draft for this session.");
    }
    const draft = appendSectionBody(
      await readDraftOrThrow(session),
      sectionKey,
      text
    );
    await writeDraftOrThrow(session.draftPath, draft);
  }
}
