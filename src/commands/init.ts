import { homedir } from "node:os";
import path from "node:path";

import {
  configExists,
  ensureNotesDir,
  readConfig,
  writeConfig,
} from "../config/io.js";
import { installCursorCommands } from "../cursor/install-commands.js";
import { getConfigFilePath } from "../config/paths.js";

export type InitOptions = {
  /** If set, used as notes directory (resolved to absolute). */
  notesDir?: string;
  /** Install Cursor slash-command templates into `./.cursor/commands` under cwd. */
  cursor?: boolean;
  /** Overwrite existing command files (requires `cursor`). */
  cursorForce?: boolean;
};

function defaultNotesDir(): string {
  return path.join(homedir(), "Documents", "mimir-notes");
}

/**
 * First-time: writes global config and ensures notes directory exists.
 * If valid config already exists: prints paths and returns without overwriting.
 */
export async function runInit(options: InitOptions = {}): Promise<void> {
  if (options.cursorForce === true && options.cursor !== true) {
    throw new Error("--cursor-force requires --cursor");
  }

  const configPath = getConfigFilePath();

  if (await configExists()) {
    const existing = await readConfig();
    console.log("Mimir is already initialized.");
    console.log(`Config: ${configPath}`);
    console.log(`Notes directory: ${existing.notesDir}`);
  } else {
    const notesDir = path.resolve(options.notesDir ?? defaultNotesDir());
    await ensureNotesDir(notesDir);
    await writeConfig({ notesDir });

    console.log("Mimir initialized.");
    console.log(`Config: ${configPath}`);
    console.log(`Notes directory: ${notesDir}`);
  }

  if (options.cursor === true) {
    const { destDir, installed, skipped } = await installCursorCommands(
      process.cwd(),
      options.cursorForce === true
    );
    console.log(`Cursor commands directory: ${destDir}`);
    for (const f of installed) {
      console.log(`  installed ${f}`);
    }
    for (const f of skipped) {
      console.log(
        `  skipped (exists, use --cursor-force to overwrite) ${f}`
      );
    }
  }
}
