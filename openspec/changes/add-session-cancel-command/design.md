## Context

Mimir keeps at most one active study session in `active-session.json` and, for current flows, a Markdown draft on disk. Ending a session normally **publishes** a note under `notesDir` and removes state (`src/commands/end.ts`, `SessionDraftService.finalizeSessionDraft`). There is no first-class way to **discard** the session and draft when the user opened a session by mistake or does not want a published note. Cursor slash commands live as Markdown templates under `templates/cursor-commands/` and are copied by `mimir init --cursor` (`src/cursor/install-commands.ts`). MCP tools mirror CLI session behavior (`src/mcp-server.ts`).

## Goals / Non-Goals

**Goals:**

- Provide **cancel** semantics: clear active session state and remove the session draft **without** writing a published note under `notesDir`.
- Align **CLI**, **MCP**, and a new **`/cancel`** Cursor template so agents and users get one consistent behavior.
- Apply the same **safety rules** as other draft operations (e.g. draft path constrained to the configured `notesDir` where applicable).

**Non-Goals:**

- Undoing a **published** note (already written final `.md` in `notesDir` from a prior successful `mimir end`).
- Interactive multi-step confirmation in MCP (agents call a single tool; optional CLI `--force` only if we add it in implementation).
- Changing `mimir end` or MCP publish guards.

## Decisions

1. **CLI surface: top-level `mimir cancel`**

   - **Rationale**: Matches `mimir start` / `mimir end` as session lifecycle verbs and is easy to document and discover.
   - **Alternative considered**: `mimir session cancel` — valid but nests cancel under `session`, which today is mostly “mutate draft,” not lifecycle; top-level keeps parity with start/end.

2. **Shared implementation: single internal function used by CLI and MCP**

   - **Rationale**: Same guarantees as `endSessionAndPublish` / finalize paths; avoids drift between tools.
   - **Alternative considered**: MCP-only — rejected because README and Cursor template expect CLI parity.

3. **On-disk behavior**

   - Read active session; if none, fail with the same class of error as other session commands (`SessionIOError` / clear message).
   - If `draftPath` is set: verify draft lives under configured `notesDir` (reuse existing guard patterns from `SessionDraftService`), delete the draft file, then remove `active-session.json`.
   - If legacy session without `draftPath`: remove `active-session.json` only (no published note, no draft deletion).
   - **Rationale**: Matches user expectation (“no note”) without leaving orphan drafts when a draft exists.

4. **MCP tool: `mimir_cancel_session`**

   - **Rationale**: Naming aligns with `mimir_end_session` and other `mimir_*` tools.
   - Return JSON with `ok: true` and identifiers (`id`, `canceledDraft: boolean` or similar) on success; structured error text on failure.

5. **Cursor template: `templates/cursor-commands/mimir-cancel.md` with `name: /cancel` (or project convention)**

   - **Rationale**: Parallel to `mimir-end.md`; body instructs the agent to call `mimir_cancel_session` (and not publish). Install is automatic via existing `readdir` of `*.md`.

6. **No change to `mimir start` blocking rule**

   - After cancel, `active-session.json` is absent, so `mimir start` works again — same as after `mimir end`.

## Risks / Trade-offs

- **[Risk] Accidental data loss** — User runs cancel and loses draft content.  
  **Mitigation**: Clear command/help text; optional future `--confirm` flag; Cursor template text warns that cancel is destructive.

- **[Risk] Partial failure** — Draft deleted but session file not cleared (or the reverse).  
  **Mitigation**: Define order of operations and error handling in implementation (e.g. delete draft first then unlink session, or use documented recovery); add tests for failure paths where feasible.

- **[Trade-off]** Cancel does not archive drafts — by design; users who want retention should use `mimir end` or copy the draft first.

## Migration Plan

- Ship additively: new CLI command, new MCP tool, new template file.
- Existing users run `mimir init --cursor` (or copy the new template) to get `/cancel`; no database or config format migration.
- **Rollback**: Revert code and remove template; no persisted schema change.

## Open Questions

- Whether the CLI should require a **`--yes`** / **`--force`** flag for non-interactive safety (can default to no flag for parity with `mimir end` simplicity — resolve during implementation).
