## 1. Domain model and draft format

- [x] 1.1 Define TypeScript types for enriched `ActiveSession` (`references`, `metadata`, `draftPath`) and reference entries; extend `parseActiveSession` with backward compatibility for sessions missing new fields (defaults).
- [x] 1.2 Specify draft Markdown layout (headings, frontmatter keys) as constants in `src/` and a small parser/updater utility (patch section / append / render references).

## 2. Session draft service (shared core)

- [x] 2.1 Implement `SessionDraftService` (name adjustable) with methods: `getSessionState`, `addReference`, `setMetadata`, `appendSection`, `patchSection`, `createDraftOnStart`, `finalizeEnd`—all operating on `active-session.json` + draft file under `<notesDir>/.mimir/drafts/`.
- [x] 2.2 Wire `mimir start` to create enriched session + draft; adjust `mimir end` to finalize from draft per spec (errors retain session on draft failure).
- [x] 2.3 Add `mimir session` subcommands calling the service; mirror validation and English error messages.

## 3. MCP server

- [x] 3.1 Add MCP SDK dependency and new entry module (e.g. `src/mcp-server.ts`) using stdio transport; register `mimir_get_session`, `mimir_add_reference`, `mimir_patch_section`, `mimir_append_section`, `mimir_set_metadata`.
- [x] 3.2 Add `package.json` bin or documented script `mimir-mcp` (or `mimir mcp`) pointing to built output; document Cursor MCP config snippet in README (short).

## 4. Tests and verification

- [x] 4.1 Add unit tests for section patch/append and reference rendering (no live MCP client required).
- [x] 4.2 Manual: run MCP server locally, invoke one tool via MCP inspector or Cursor; CLI parity check (`session add-reference` vs tool).
- [x] 4.3 `npm run build` green; smoke `init` → `start` → `session` mutations → `end` produces note with populated sections.
