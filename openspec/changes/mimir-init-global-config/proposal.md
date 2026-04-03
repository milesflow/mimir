## Why

`mimir start` and `mimir end` need a stable contract for where notes live and how settings are stored. Without a first-run setup, every command would guess paths or fail inconsistently. `mimir init` establishes global configuration on disk (including `notesDir`) so later commands share one source of truth.

## What Changes

- Implement `mimir init` as the primary bootstrap for Mimir on a machine.
- Write a global config file (default: `~/.config/mimir/config.json` on macOS/Linux; follow platform conventions on Windows when addressed).
- Persist at least `notesDir` (absolute path where study notes are stored).
- Create the notes directory if it does not exist (or validate it exists and is usable).
- When config already exists, print a clear message (no silent overwrite unless explicitly designed later).
- Add internal modules/paths for resolving config location and reading/writing config (implementation detail in design).

## Capabilities

### New Capabilities

- `global-config`: Global Mimir configuration file, default paths, schema for `notesDir`, and CLI behavior for `mimir init` (first run, already initialized, directory creation).

### Modified Capabilities

- _(none — no existing specs in `openspec/specs/`.)_

## Impact

- `src/cli.ts` (wire `init` to real implementation).
- New source files for config path resolution, JSON read/write, and init orchestration.
- User filesystem: `~/.config/mimir/` and the configured notes directory.
- Documentation: README may mention init flow (optional follow-up outside this change’s code scope).
