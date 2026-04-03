## 1. Session path, schema, and I/O

- [x] 1.1 Add `src/session/paths.ts` exporting `getActiveSessionPath()` resolving `active-session.json` next to `getConfigFilePath()`’s directory (reuse `getConfigDir()` from config).
- [x] 1.2 Add `src/session/schema.ts` with `ActiveSession` type and `parseActiveSession(raw: unknown)` validating `id`, `startedAt`, `topic`, optional `cwd` (non-empty strings; `cwd` absolute path when present).
- [x] 1.3 Add `src/session/io.ts` with `readActiveSession()`, `activeSessionExists()`, `writeActiveSession()`, `clearActiveSession()` using `fs.promises`, with English errors for invalid JSON, validation failures, and I/O errors.

## 2. Commands

- [x] 2.1 Add `src/commands/start.ts` implementing `runStart({ topic, recordCwd })`: load global config via existing `readConfig()`; if `activeSessionExists()` and `readActiveSession()` succeeds, exit path throws/returns error for CLI; otherwise write new session with `crypto.randomUUID()`, `new Date().toISOString()`, topic, optional `cwd` as absolute `process.cwd()`.
- [x] 2.2 Add `src/commands/status.ts` implementing `runStatus()`: if no file, print no active session; if invalid session file, error; else print human-readable fields.
- [x] 2.3 Add `src/commands/end.ts` implementing `runEnd()`: require `readConfig()` and valid `readActiveSession()`; build Markdown with YAML frontmatter + section template; write under `notesDir` with filename per design; on success `clearActiveSession()`; propagate errors otherwise.

## 3. Note file builder

- [x] 3.1 Add `src/notes/build-study-note.ts` (or similar) exporting a function that given session + `endedAt` ISO string + `mimirVersion` returns `{ filename, contents }` using slug + date + short id rules from `design.md`.

## 4. CLI wiring and verification

- [x] 4.1 Update `src/cli.ts`: `start` with required `--topic` and optional `--no-cwd`; `status` and `end` call respective runners; consistent `try/catch` with stderr + `process.exit(1)` on failure.
- [x] 4.2 Manual smoke: with isolated `HOME`, run `init` → `start` → `status` → `end`, assert session file gone and `.md` created under `notesDir`; verify second `start` blocked until after `end`.
- [x] 4.3 Run `npm run build` and repeat smoke on `dist/cli.js`.
