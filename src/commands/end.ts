import { writeFile } from "node:fs/promises";
import path from "node:path";

import { readConfig } from "../config/io.js";
import { buildStudyNote } from "../notes/build-study-note.js";
import { clearActiveSession, readActiveSession, SessionIOError } from "../session/io.js";
import { finalizeSessionDraft } from "../session/session-draft-service.js";
import { MIMIR_VERSION } from "../version.js";

/**
 * End the active session and write the study note. Shared by CLI and MCP.
 */
export async function endSessionAndPublish(): Promise<{ publishedPath: string }> {
  const session = await readActiveSession();

  if (session.draftPath === undefined) {
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

  const { publishedPath } = await finalizeSessionDraft();
  await clearActiveSession();
  return { publishedPath };
}

export async function runEnd(): Promise<void> {
  const { publishedPath } = await endSessionAndPublish();
  console.log("Study session ended.");
  console.log(`Note written: ${publishedPath}`);
}
