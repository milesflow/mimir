## Why

Many users run `mimir init` without reading the documentation and never discover that they can choose where notes are stored. A short, optional interactive prompt on first-time init makes that choice visible while preserving today’s default when the user presses Enter.

## What Changes

- On **first-time** `mimir init` (no existing global config), when stdin is a TTY and `--notes-dir` is **not** provided, prompt once for the notes directory path (English copy).
- Empty input (user presses Enter) keeps the **current** default: `~/Documents/mimir-notes` (resolved per existing behavior).
- Non-empty input is resolved and used as `notesDir` (same validation and creation rules as today).
- When `--notes-dir` is passed, or stdin is not interactive, **no prompt** — behavior matches non-interactive/scripted use and existing CLI contract.

## Capabilities

### New Capabilities

- _(none — behavior extends existing global init / config.)_

### Modified Capabilities

- `global-config`: Add requirements for optional interactive notes-directory prompt during first-time `mimir init`, including TTY detection, English prompt text, and “Enter = default” behavior; clarify precedence vs `--notes-dir`.

## Impact

- `src/commands/init.ts` (or a small helper): readline/prompt logic, TTY check.
- `src/cli.ts`: pass through whether `--notes-dir` was explicitly set (may need distinction from “unset” vs default for Commander) — **design** will specify how to avoid double-prompting or breaking scripts.
- Tests: non-TTY / `--notes-dir` paths unchanged; optional tests for prompt path with mocked stdin if feasible.
