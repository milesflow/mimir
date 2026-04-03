## 1. Core behavior (`runInit`)

- [x] 1.1 Add a small helper (or internal function) that reads one line from stdin using `readline` when `process.stdin.isTTY` is true, returning a trimmed string; export only what tests need.
- [x] 1.2 In the first-time init branch, when `notesDir` is not supplied via CLI and stdin is a TTY, print an English one-line prompt that states the default notes path and that Enter accepts it; resolve `notesDir` to `path.resolve(trimmed input)` when non-empty, otherwise `defaultNotesDir()`.
- [x] 1.3 When stdin is not a TTY or `notesDir` is supplied via CLI, skip the prompt and preserve existing resolution (`options.notesDir ?? defaultNotesDir()`).

## 2. CLI wiring

- [x] 2.1 In `cli.ts`, pass an explicit signal that `--notes-dir` was omitted (e.g. `explicitNotesDir: opts.notesDir !== undefined`) **or** document that `undefined` means "not passed" and rely on that in `runInit`; align `InitOptions` with the chosen approach.
- [x] 2.2 Confirm `--notes-dir` continues to bypass the prompt in all cases.

## 3. Verification

- [x] 3.1 Add or extend tests so first-time init without TTY and without `--notes-dir` still uses the default (no hang, no prompt); keep existing `mimir init --notes-dir` tests passing.
- [x] 3.2 Add a test that covers the interactive path if feasible (mocked `stdin.isTTY` and readline), or document manual verification steps in the PR if not.

## 4. Specs

- [x] 4.1 After implementation, run the OpenSpec apply/archive flow so `openspec/specs/global-config/spec.md` incorporates the delta from this change (per project workflow).
