import { homedir } from "node:os";
import path from "node:path";

import {
  configExists,
  ensureNotesDir,
  readConfig,
  writeConfig,
} from "../config/io.js";
import { getConfigFilePath } from "../config/paths.js";

export type InitOptions = {
  /** If set, used as notes directory (resolved to absolute). */
  notesDir?: string;
};

function defaultNotesDir(): string {
  return path.join(homedir(), "Documents", "mimir-notes");
}

/**
 * First-time: writes global config and ensures notes directory exists.
 * If valid config already exists: prints paths and returns without overwriting.
 */
export async function runInit(options: InitOptions = {}): Promise<void> {
  const configPath = getConfigFilePath();

  if (await configExists()) {
    const existing = await readConfig();
    console.log("Mimir is already initialized.");
    console.log(`Config: ${configPath}`);
    console.log(`Notes directory: ${existing.notesDir}`);
    return;
  }

  const notesDir = path.resolve(options.notesDir ?? defaultNotesDir());
  await ensureNotesDir(notesDir);
  await writeConfig({ notesDir });

  console.log("Mimir initialized.");
  console.log(`Config: ${configPath}`);
  console.log(`Notes directory: ${notesDir}`);
}
