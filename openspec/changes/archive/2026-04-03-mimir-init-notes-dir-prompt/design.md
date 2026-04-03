## Context

`mimir init` already supports `--notes-dir <path>` and defaults first-time `notesDir` to `~/Documents/mimir-notes` (`defaultNotesDir()` in `src/commands/init.ts`). Non-interactive and scripted invocations rely on deterministic behavior with no stdin reads.

## Goals / Non-Goals

**Goals:**

- On **first-time** init only, when the user did not pass `--notes-dir` and stdin is interactive, show a **single** English prompt so users discover they can choose a notes directory.
- **Empty line** (Enter only) keeps the same default path and behavior as today.
- **Non-interactive** runs (no TTY, piped stdin, automation) behave exactly as today: no prompt, use default unless `--notes-dir` is set.

**Non-Goals:**

- Localization beyond English for this prompt.
- Changing the default path or config file location.
- Interactive prompts for `--cursor` or other flags in this change.

## Decisions

### Where to implement the prompt

**Decision:** Resolve the optional path inside `runInit` (or a dedicated helper imported by it), after confirming config does not exist and before `ensureNotesDir` / `writeConfig`.

**Rationale:** Keeps all first-time init path logic in one place; `cli.ts` only needs to pass whether `--notes-dir` was provided (see below).

### Detecting “user did not pass `--notes-dir`”

**Decision:** Pass a boolean such as `notesDirFromCli?: boolean` or `explicitNotesDir?: boolean` from the Commander action. When `true`, use `opts.notesDir` as today (required to be defined when flag is present). When `false`, and first-time + TTY, run the prompt; otherwise use `defaultNotesDir()`.

**Rationale:** Commander’s optional `.option("--notes-dir <path>")` yields `undefined` when omitted — same as “not passed”. That is sufficient if we only need to distinguish “flag omitted” vs “flag provided”. No extra sentinel is required unless we later need to support an empty string from the flag (not a current requirement).

**Alternative considered:** `MIMIR_INIT_NO_PROMPT` env var — omitted to reduce surface area; TTY detection covers CI and pipes. Can be added later if needed.

### TTY and prompt API

**Decision:** Treat stdin as interactive when `process.stdin.isTTY === true` (and optionally ensure stdout is a TTY for sensible UX). Use Node’s `readline` (`readline/promises` `createInterface` on `stdin`/`stdout`) to read one line, `trim()`, then treat empty string as default.

**Rationale:** Standard pattern; no new dependencies.

### Prompt copy (English)

**Decision:** One line that states the default explicitly and that Enter accepts it, e.g. asking for the directory and noting that Enter uses the default `~/Documents/mimir-notes` (display the resolved default path for clarity, e.g. using `defaultNotesDir()`).

**Rationale:** Matches the user request; makes the default obvious without reading docs.

### Error handling

**Decision:** Non-empty user input is passed through `path.resolve` (same as current `options.notesDir ?? defaultNotesDir()` flow). Invalid paths / not-a-directory conflicts follow existing `ensureNotesDir` / validation behavior.

## Risks / Trade-offs

- **[Risk]** Users running `mimir init` in an environment that reports a TTY but cannot block for input (rare) → **Mitigation:** Rely on standard TTY checks; document remains the escape hatch of `--notes-dir`.
- **[Risk]** Tests that spawn the CLI without a TTY must not hang → **Mitigation:** Existing tests already non-interactive; add coverage that interactive prompt path is skipped without TTY.

## Migration Plan

No data migration. Behavior change is CLI-only; default path unchanged when the user presses Enter or when non-interactive.

## Open Questions

- None blocking; exact English string can be finalized during implementation for brevity vs clarity.
