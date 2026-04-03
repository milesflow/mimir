## Why

Study sessions today only persist a minimal `active-session.json` and generate a mostly empty note on `mimir end`. The intended workflow is **agent-driven**: while the user studies (often inside Cursor), the assistant should **incrementally capture** references (e.g. selected code), **metadata**, and evolving section text (*Explanation*, *Summary*, *Key concepts*) so the closing note reflects the whole conversation—not a one-shot template.

An **MCP server** exposes those mutations as tools (`mimir_get_session`, `mimir_add_reference`, `mimir_patch_section`, etc.) so the agent can read/write the same state as the CLI without ad-hoc file editing.

## What Changes

- Extend active session persistence with **`references`** (ordered list with optional path, line range, label, snippet), **`metadata`** (string-keyed JSON object), and a stable **`draftPath`** (or equivalent) pointing to a **Markdown draft** under the configured `notesDir` (e.g. `.mimir/drafts/<session-id>.md`).
- On **`mimir start`**, create the draft file with initial frontmatter (session id, started time, topic, mimir version) and empty section scaffolding aligned with the published note shape.
- Add **`mimir session` subcommands** (or equivalent top-level commands) so humans/scripts can: add a reference, set/merge metadata, **append** to a named section, and **replace** a named section body (patch). Same validation and errors as MCP tools.
- Implement a **`mimir-mcp`** (or `mimir mcp`) **stdio MCP server** entry point registering tools that call the **same internal service layer** as the CLI.
- Update **`mimir end`** to **finalize** the published note from the draft (sections + references rendered into the body or an appendix), refresh YAML frontmatter (including `ended_at`, metadata keys), write the final filename under `notesDir`, then remove draft + `active-session.json`. If the draft is missing or unreadable, the command SHALL fail without deleting the session unless explicitly designed otherwise.

## Capabilities

### New Capabilities

- `mcp-server`: MCP (stdio) server bundled with Mimir; tool catalog and behavior for reading/updating session state and draft content via shared internals.
- `session-draft`: Draft Markdown lifecycle, enriched `active-session.json`, `mimir session …` commands, and `mimir end` finalization rules.

### Modified Capabilities

- _(none listed as MODIFIED deltas; new requirements are ADDED under the existing `study-session` capability folder to extend archived behavior.)_

## Impact

- New dependency: official **Model Context Protocol** SDK for Node (`@modelcontextprotocol/sdk` or successor documented at implementation time).
- New source: MCP server bootstrap, tool handlers, shared session/draft service used by CLI and MCP.
- `package.json` bin or script for launching MCP (e.g. `mimir-mcp` or `mimir mcp`).
- Documentation: how to register the MCP server in Cursor; mapping tools ↔ CLI.
- Disk: drafts directory under `notesDir`; larger `active-session.json` when references/snippets grow (may need size limits in design).
