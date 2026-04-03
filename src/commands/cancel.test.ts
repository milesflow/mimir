import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  constants as fsConstants,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const cliEntry = path.join(repoRoot, "src", "cli.ts");

function runMimir(
  args: string[],
  env: NodeJS.ProcessEnv
): { status: number | null; stderr: string } {
  const r = spawnSync(process.execPath, ["--import", "tsx", cliEntry, ...args], {
    env,
    encoding: "utf8",
    cwd: repoRoot,
  });
  return { status: r.status, stderr: r.stderr ?? "" };
}

function sessionPath(home: string): string {
  return path.join(home, ".config", "mimir", "active-session.json");
}

test("mimir cancel fails when no active session", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "mimir-cancel-"));
  const notesDir = path.join(home, "notes");
  await mkdir(path.join(home, ".config", "mimir"), { recursive: true });
  await writeFile(
    path.join(home, ".config", "mimir", "config.json"),
    `${JSON.stringify({ version: 1, notesDir }, null, 2)}\n`,
    "utf8"
  );
  const env = { ...process.env, HOME: home };
  assert.equal(runMimir(["cancel"], env).status, 1);
});

test("mimir cancel removes draft and active session", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "mimir-cancel-"));
  const notesDir = path.join(home, "notes");
  const env = { ...process.env, HOME: home };

  assert.equal(runMimir(["init", "--notes-dir", notesDir], env).status, 0);
  assert.equal(runMimir(["start", "--topic", "Test cancel"], env).status, 0);

  const sessionRaw = await readFile(sessionPath(home), "utf8");
  const session = JSON.parse(sessionRaw) as { draftPath: string };
  assert.ok(session.draftPath);
  await access(session.draftPath, fsConstants.F_OK);

  assert.equal(runMimir(["cancel"], env).status, 0);

  await assert.rejects(access(sessionPath(home), fsConstants.F_OK));
  await assert.rejects(access(session.draftPath, fsConstants.F_OK), /ENOENT/);
});

test("mimir cancel clears legacy session without draftPath", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "mimir-cancel-"));
  const notesDir = path.join(home, "notes");
  const env = { ...process.env, HOME: home };

  assert.equal(runMimir(["init", "--notes-dir", notesDir], env).status, 0);

  const legacy = {
    id: "legacy-id",
    startedAt: new Date().toISOString(),
    topic: "Legacy",
    references: [],
    metadata: {},
  };
  await writeFile(sessionPath(home), `${JSON.stringify(legacy, null, 2)}\n`, "utf8");

  assert.equal(runMimir(["cancel"], env).status, 0);
  await assert.rejects(access(sessionPath(home), fsConstants.F_OK));
});

test("mimir cancel leaves session when draft cannot be removed", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "mimir-cancel-"));
  const notesDir = path.join(home, "notes");
  const env = { ...process.env, HOME: home };

  assert.equal(runMimir(["init", "--notes-dir", notesDir], env).status, 0);
  assert.equal(runMimir(["start", "--topic", "Blocked unlink"], env).status, 0);

  const sessionRaw = await readFile(sessionPath(home), "utf8");
  const session = JSON.parse(sessionRaw) as { draftPath: string };
  await rm(session.draftPath);
  await mkdir(session.draftPath, { recursive: true });

  assert.equal(runMimir(["cancel"], env).status, 1);
  await access(sessionPath(home), fsConstants.F_OK);
});
