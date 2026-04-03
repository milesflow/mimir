import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type InstallCursorCommandsResult = {
  destDir: string;
  installed: string[];
  skipped: string[];
};

/**
 * Directory containing `*.md` Cursor command templates (next to `dist/` in the package).
 */
export function cursorCommandsTemplatesDir(): string {
  const here = fileURLToPath(new URL(".", import.meta.url));
  return path.normalize(path.join(here, "..", "..", "templates", "cursor-commands"));
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

/**
 * Copy bundled templates into `<cwd>/.cursor/commands/`.
 * Existing files are skipped unless `force` is true.
 */
export async function installCursorCommands(
  cwd: string,
  force: boolean
): Promise<InstallCursorCommandsResult> {
  const templatesDir = cursorCommandsTemplatesDir();
  const destDir = path.resolve(cwd, ".cursor", "commands");
  await mkdir(destDir, { recursive: true });

  const entries = await readdir(templatesDir);
  const mdFiles = entries.filter((f) => f.endsWith(".md")).sort();

  const installed: string[] = [];
  const skipped: string[] = [];

  for (const name of mdFiles) {
    const from = path.join(templatesDir, name);
    const to = path.join(destDir, name);
    if (!force && (await fileExists(to))) {
      skipped.push(name);
      continue;
    }
    await copyFile(from, to);
    installed.push(name);
  }

  return { destDir, installed, skipped };
}
