## 1. Core session logic

- [x] 1.1 Implement `cancelSession` (or equivalent) in `src/commands/` that reads the active session, applies `notesDir` path-safety for `draftPath`, deletes the draft when present, and calls `clearActiveSession`; handle legacy sessions without `draftPath`; surface `SessionIOError` with clear messages on failure.
- [x] 1.2 Add unit tests for cancel: success with draft, success legacy without draft, no session error, and draft deletion failure leaves session file intact.

## 2. CLI

- [x] 2.1 Register top-level `mimir cancel` in `src/cli.ts` wired to the shared cancel implementation; print concise success output (and match existing CLI error handling).
- [x] 2.2 Add or extend CLI integration tests if the project pattern covers session commands end-to-end.

## 3. MCP

- [x] 3.1 Register `mimir_cancel_session` in `src/mcp-server.ts` returning structured JSON on success and tool errors when no session or on I/O failure.

## 4. Cursor template and docs

- [x] 4.1 Add `templates/cursor-commands/mimir-cancel.md` with frontmatter (`name`, `id`, `description`) for `/cancel` and body instructing use of `mimir_cancel_session` when the user wants to discard the session without publishing.
- [x] 4.2 Update `README.md` MCP tools list and any session command tables to include cancel alongside start/end/status.

## 5. Specs and validation

- [x] 5.1 Run `openspec validate add-session-cancel-command` (or project equivalent) and fix any issues before merge.
