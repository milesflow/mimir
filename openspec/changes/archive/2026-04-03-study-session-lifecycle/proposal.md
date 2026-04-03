## Why

`mimir init` defines where notes live, but there is no way to record an in-progress study session or to close the loop by materializing a note. The next MVP step is a **session lifecycle**: persist what the developer is studying, surface it with `status`, and end with a **first-class Markdown artifact** under `notesDir`.

## What Changes

- Add `active-session.json` under the global Mimir config directory (alongside `config.json`), holding a minimal session record: `id`, `startedAt`, `topic` (initial question/title), optional `cwd`.
- Implement **`mimir start`**: create a session; **if a session already exists, exit with a non-zero status and a clear message** (no interactive confirmation in this iteration—user runs `mimir end` first).
- Implement **`mimir status`**: print the active session details or report that there is none; exit 0.
- Implement **`mimir end`**: require an active session and valid global config; write a Markdown file in `notesDir` with **YAML frontmatter** and a **fixed section template** (initial question, explanation, summary, key concepts—body can start empty or with placeholders); then **remove** `active-session.json`.
- Reuse existing global config (`notesDir`) from `openspec/specs/global-config` behavior; **no change** to global-config requirements.

## Capabilities

### New Capabilities

- `study-session`: Active session persistence (`active-session.json`), `mimir start`, `mimir status`, `mimir end`, and first-note Markdown output under `notesDir`.

### Modified Capabilities

- _(none — `global-config` requirements stay as-is; this change only consumes them.)_

## Impact

- `src/cli.ts` (`start`, `status`, `end` no longer stubs).
- New modules: session path/schema, session I/O, commands (`start`, `status`, `end`), note template rendering.
- User filesystem: `~/.config/mimir/active-session.json` (when a session is open); new `.md` files under `notesDir` on `end`.
