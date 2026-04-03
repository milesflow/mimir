## Why

Users who install Mimir globally still need **Cursor slash commands** (`/mimir-start`, etc.) as Markdown under `.cursor/commands/` in each repo. Today those files must be created by hand or copied from docs. Shipping templates inside the npm package and installing them with an explicit CLI flag matches how OpenSpec scaffolds workflow commands and keeps the global CLI vs workspace-local contract clear.

## What Changes

- Add an optional **`--cursor`** flag to **`mimir init`** (name may be adjusted in design) that writes bundled **Cursor command templates** into **`.cursor/commands/`** under the **current working directory** (the open workspace), without changing global config behavior except as specified.
- Ship template **`.md` files** as part of the published package (e.g. extend `package.json` `files` and resolve paths from the installed package at runtime).
- Define **idempotent** behavior: default skip or merge if files exist; optional **`--force`** (or similar) to overwrite, documented in design.
- Document the commands in README briefly (short snippet only if tasks require it).

## Capabilities

### New Capabilities

- `cursor-commands`: Bundled Markdown templates for Cursor slash commands, install path (`.cursor/commands/`), tool naming (`/mimir-*`), idempotency, and interaction with the global CLI binary.

### Modified Capabilities

- `global-config`: Extend the **`mimir init`** requirement so the command MAY accept **`--cursor`** (and related flags) and, when present, SHALL install workspace Cursor command files in addition to existing global initialization behavior (including the “already initialized” path still allowing `--cursor`-only file installation where specified).

## Impact

- `src/commands/init.ts`, CLI wiring in `src/cli.ts`.
- New template directory (e.g. `templates/cursor-commands/`) and build/publish layout (`package.json` `files`).
- Optional small README addition.
