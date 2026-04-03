## 1. Config path and types

- [x] 1.1 Add `src/config/paths.ts` to resolve the global config directory and `config.json` path (Unix-like: `~/.config/mimir/config.json` via `os.homedir()` and `path.join`).
- [x] 1.2 Add `src/config/schema.ts` with a TypeScript type for the config object and a function to validate parsed JSON (require non-empty string `notesDir`; normalize to absolute path).

## 2. Config I/O

- [x] 2.1 Add `src/config/io.ts` with `readConfig()` / `configExists()` / `writeConfig()` using `fs.promises` (handle missing file, invalid JSON, and permission errors with clear English messages).
- [x] 2.2 Add `ensureNotesDir(notesDir)` that creates the directory recursively if missing, or throws a clear error if the path exists and is not a directory.

## 3. `mimir init` command

- [x] 3.1 Implement `runInit` (e.g. `src/commands/init.ts`): if valid config exists, print “already initialized” with config path and `notesDir`, exit 0; otherwise write config with default `notesDir` (`~/Documents/mimir-notes` resolved absolute), ensure notes dir, print success paths.
- [x] 3.2 Add optional `--notes-dir <path>` to `mimir init` (resolve to absolute path before save) and pass through to `runInit`.
- [x] 3.3 Wire `init` in `src/cli.ts` to call `runInit`; use `process.exit(1)` on failure after printing to stderr.

## 4. Verification

- [x] 4.1 Manually run `npm run dev -- init` on a clean home config path and confirm files created; run again and confirm idempotent message.
- [x] 4.2 Run `npm run build` and smoke-test `node dist/cli.js init`.
