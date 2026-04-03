import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  cursorCommandsTemplatesDir,
  installCursorCommands,
} from "./install-commands.js";

test("cursorCommandsTemplatesDir contains .md templates", async () => {
  const dir = cursorCommandsTemplatesDir();
  const names = await readdir(dir);
  const md = names.filter((f) => f.endsWith(".md"));
  assert.ok(md.length >= 3, `expected templates in ${dir}`);
});

test("installCursorCommands copies templates; second run skips; force overwrites", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "mimir-cursor-"));
  try {
    const r1 = await installCursorCommands(dir, false);
    assert.ok(r1.installed.length >= 3);
    assert.equal(r1.skipped.length, 0);

    const r2 = await installCursorCommands(dir, false);
    assert.equal(r2.installed.length, 0);
    assert.ok(r2.skipped.length >= 3);

    await writeFile(
      path.join(dir, ".cursor", "commands", r2.skipped[0]!),
      "stale",
      "utf8"
    );
    const r3 = await installCursorCommands(dir, true);
    assert.ok(r3.installed.length >= 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
