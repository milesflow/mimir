import { constants as fsConstants } from "node:fs";
import {
  access,
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";

import type { MimirConfig } from "./schema.js";
import { ConfigValidationError, parseAndValidateConfig } from "./schema.js";
import { getConfigDir, getConfigFilePath } from "./paths.js";

export class ConfigIOError extends Error {
  override name = "ConfigIOError";
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export async function configExists(): Promise<boolean> {
  const filePath = getConfigFilePath();
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return false;
    throw new ConfigIOError(
      `Cannot access config file at ${filePath}: ${err.message}`,
      { cause: e }
    );
  }
}

export async function readConfig(): Promise<MimirConfig> {
  const filePath = getConfigFilePath();
  let text: string;
  try {
    text = await readFile(filePath, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new ConfigIOError(`Config file not found at ${filePath}.`, {
        cause: e,
      });
    }
    throw new ConfigIOError(
      `Cannot read config file at ${filePath}: ${err.message}`,
      { cause: e }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (e: unknown) {
    throw new ConfigIOError(
      `Config file at ${filePath} is not valid JSON.`,
      { cause: e }
    );
  }

  try {
    return parseAndValidateConfig(parsed);
  } catch (e: unknown) {
    if (e instanceof ConfigValidationError) {
      throw new ConfigIOError(
        `Invalid config in ${filePath}: ${e.message}`,
        { cause: e }
      );
    }
    throw e;
  }
}

export async function writeConfig(config: MimirConfig): Promise<void> {
  const dir = getConfigDir();
  const filePath = getConfigFilePath();
  try {
    await mkdir(dir, { recursive: true });
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new ConfigIOError(
      `Cannot create config directory ${dir}: ${err.message}`,
      { cause: e }
    );
  }

  const body = `${JSON.stringify(config, null, 2)}\n`;
  try {
    await writeFile(filePath, body, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new ConfigIOError(
      `Cannot write config file at ${filePath}: ${err.message}`,
      { cause: e }
    );
  }
}

/**
 * Ensures `notesDir` exists as a directory. Creates parent directories as needed.
 * @throws If the path exists and is not a directory.
 */
export async function ensureNotesDir(notesDir: string): Promise<void> {
  try {
    const s = await stat(notesDir);
    if (!s.isDirectory()) {
      throw new ConfigIOError(
        `Notes path exists but is not a directory: ${notesDir}`
      );
    }
    return;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      if (e instanceof ConfigIOError) throw e;
      throw new ConfigIOError(
        `Cannot access notes directory ${notesDir}: ${err.message}`,
        { cause: e }
      );
    }
  }

  try {
    await mkdir(notesDir, { recursive: true });
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    throw new ConfigIOError(
      `Cannot create notes directory ${notesDir}: ${err.message}`,
      { cause: e }
    );
  }
}
