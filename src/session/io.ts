import { constants as fsConstants } from "node:fs";
import {
  access,
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";

import { getConfigDir } from "../config/paths.js";
import { parseActiveSession, SessionValidationError } from "./schema.js";
import type { ActiveSession } from "./schema.js";
import { getActiveSessionPath } from "./paths.js";

export class SessionIOError extends Error {
  override name = "SessionIOError";
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export async function activeSessionExists(): Promise<boolean> {
  const filePath = getActiveSessionPath();
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return false;
    throw new SessionIOError(
      `Cannot access session file at ${filePath}: ${err.message}`,
      { cause: e }
    );
  }
}

export async function readActiveSession(): Promise<ActiveSession> {
  const filePath = getActiveSessionPath();
  let text: string;
  try {
    text = await readFile(filePath, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new SessionIOError("No active study session.", { cause: e });
    }
    throw new SessionIOError(
      `Cannot read session file at ${filePath}: ${err.message}`,
      { cause: e }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (e: unknown) {
    throw new SessionIOError(
      `Session file at ${filePath} is not valid JSON.`,
      { cause: e }
    );
  }

  try {
    return parseActiveSession(parsed);
  } catch (e: unknown) {
    if (e instanceof SessionValidationError) {
      throw new SessionIOError(
        `Invalid session data in ${filePath}: ${e.message}`,
        { cause: e }
      );
    }
    throw e;
  }
}

export async function writeActiveSession(session: ActiveSession): Promise<void> {
  const dir = getConfigDir();
  const filePath = getActiveSessionPath();
  try {
    await mkdir(dir, { recursive: true });
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new SessionIOError(
      `Cannot create config directory ${dir}: ${err.message}`,
      { cause: e }
    );
  }

  const body = `${JSON.stringify(session, null, 2)}\n`;
  try {
    await writeFile(filePath, body, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new SessionIOError(
      `Cannot write session file at ${filePath}: ${err.message}`,
      { cause: e }
    );
  }
}

export async function clearActiveSession(): Promise<void> {
  const filePath = getActiveSessionPath();
  try {
    await unlink(filePath);
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return;
    throw new SessionIOError(
      `Cannot remove session file at ${filePath}: ${err.message}`,
      { cause: e }
    );
  }
}
