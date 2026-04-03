import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolvedNotesDirFromPromptLine, runInit } from "./init.js";

const repoRoot = path.join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  ".."
);
const cliEntry = path.join(repoRoot, "src", "cli.ts");

function runMimir(
  args: string[],
  env: NodeJS.ProcessEnv
): { status: number | null; stderr: string } {
  const r = spawnSync(
    process.execPath,
    ["--import", "tsx", cliEntry, ...args],
    {
      env,
      encoding: "utf8",
      cwd: repoRoot,
    }
  );
  return { status: r.status, stderr: r.stderr ?? "" };
}

test("resolvedNotesDirFromPromptLine uses default when empty or whitespace", () => {
  const def = "/default/notes";
  assert.equal(resolvedNotesDirFromPromptLine("", def), def);
  assert.equal(resolvedNotesDirFromPromptLine("   ", def), def);
  assert.equal(resolvedNotesDirFromPromptLine("\t\n", def), def);
});

test("resolvedNotesDirFromPromptLine resolves non-empty path", () => {
  const def = "/default/notes";
  const rel = path.join("custom", "notes");
  assert.equal(
    resolvedNotesDirFromPromptLine(rel, def),
    path.resolve(rel)
  );
});

test("mimir init without --notes-dir uses default path when stdin is not a TTY", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "mimir-init-"));
  const env = { ...process.env, HOME: home };
  const expectedNotes = path.join(home, "Documents", "mimir-notes");

  assert.equal(runMimir(["init"], env).status, 0);
  const raw = await readFile(
    path.join(home, ".config", "mimir", "config.json"),
    "utf8"
  );
  const cfg = JSON.parse(raw) as { notesDir: string };
  assert.equal(cfg.notesDir, expectedNotes);

  await rm(home, { recursive: true, force: true });
});

test("runInit programmatic: notesDirFromCli bypasses default without TTY", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "mimir-init-"));
  const custom = path.join(home, "my-notes");
  await mkdir(path.join(home, ".config", "mimir"), { recursive: true });
  const prevHome = process.env.HOME;
  process.env.HOME = home;
  try {
    await runInit({ notesDir: custom, notesDirFromCli: true });
    const raw = await readFile(
      path.join(home, ".config", "mimir", "config.json"),
      "utf8"
    );
    const cfg = JSON.parse(raw) as { notesDir: string };
    assert.equal(cfg.notesDir, path.resolve(custom));
  } finally {
    process.env.HOME = prevHome;
    await rm(home, { recursive: true, force: true });
  }
});
