## Why

Users sometimes start a Mimir study session by mistake or decide they do not want to keep a note. Today they can only end the session by publishing (`mimir end` / `mimir_end_session`), which is the wrong outcome when the goal is to discard work. A dedicated **cancel** path makes the lifecycle explicit and gives Cursor a clear slash command (`/cancel`) that agents can follow without publishing.

## What Changes

- Add a **cancel session** operation that clears the active session **without** writing a published note: remove `active-session.json` and delete the session draft file when present (implementation may offer a safety confirmation for CLI as documented in design).
- Expose the same behavior via **CLI** (e.g. `mimir cancel` or `mimir session cancel` — exact surface in design) and **MCP** (`mimir_cancel_session` or equivalent) so IDE agents and terminal users stay aligned.
- Add a **Cursor slash-command template** `/cancel` under bundled templates and document it in the cursor-commands capability so `mimir init --cursor` can install it alongside start/status/end.
- Update **README** or user-facing help text only as needed to describe cancel vs end (minimal, no new markdown files unless required by repo conventions).

## Capabilities

### New Capabilities

- None — this extends existing **`study-session`**, **`cursor-commands`**, and **`mcp-server`** capabilities with explicit cancel semantics.

### Modified Capabilities

- **`study-session`**: Add requirements for canceling an active session: no published note, removal of active session state, and deletion of the draft file associated with the session when applicable; clear errors when there is no active session.
- **`cursor-commands`**: Require an additional bundled template for **`/cancel`** (name/id in frontmatter) and count it toward the “minimum templates” expectation where applicable, or document the expanded set explicitly.
- **`mcp-server`**: Add a tool that performs cancel with the same on-disk effects as the CLI, with structured success/error responses consistent with other session tools.

## Impact

- **Code**: `src/cli.ts` (new command), shared session helper (e.g. next to `end` / `session` I/O), `src/mcp-server.ts` (register tool), `templates/cursor-commands/` (new Markdown), any init/cursor install listing that enumerates templates.
- **Tests**: New or extended tests for cancel behavior, idempotence or “no session” errors, and draft deletion.
- **APIs**: New MCP tool; possible new CLI subcommand — **not** a breaking change for existing commands if named additively.
