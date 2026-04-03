## Context

Mimir already supports `init`, `start`, `status`, and `end` with `active-session.json` and a single-shot note template. Canonical specs live under `openspec/specs/study-session` and `openspec/specs/global-config`. The product goal is **agent-first** updates during an open session, surfaced via **MCP** and mirrored in the **CLI** for scripting.

## Goals / Non-Goals

**Goals:**

- **Single internal module** (e.g. `SessionDraftService`) used by:
  - `mimir session …` subcommands
  - MCP tool handlers
- **Deterministic draft layout** so both machine (patch) and human (open in editor) can read it.
- **Tool names** aligned with user expectations: at minimum `mimir_get_session`, `mimir_add_reference`, `mimir_patch_section`; support **append** either as `mimir_append_section` or a `mode` flag on patch—pick one and document.
- **Stdio MCP** transport (Cursor-friendly); one process per workspace is acceptable for MVP.

**Non-Goals:**

- HTTP/SSE MCP transport in this change.
- Semantic search, Obsidian sync, or cloud backup.
- Conflict resolution for two concurrent writers beyond “last write wins” on section replace.
- Automatic clipboard capture without explicit tool/CLI invocation.

## Decisions

1. **Draft location**  
   - **Choice:** `<notesDir>/.mimir/drafts/<session-id>.md`  
   - **Rationale:** Keeps drafts with notes vault; easy to `.gitignore` `.mimir` if needed.

2. **Section contract**  
   - **Choice:** Fixed set of Markdown `##` headings: `Initial question`, `References`, `Explanation`, `Summary`, `Key concepts`.  
   - **Patch/append** targets a **section key** enum: `initial_question` | `references` | `explanation` | `summary` | `key_concepts` (implementation maps to headings).  
   - **Rationale:** Stable targets for MCP and CLI; `Initial question` body seeded with `topic` on start.

3. **References**  
   - **Choice:** Dual representation:  
     - Structured array in `active-session.json` under `references[]` with `{ id, label?, path?, lineStart?, lineEnd?, snippet? }`  
     - Rendered **append-only** subsection under `## References` when `mimir_add_reference` runs (or regenerated on each add from JSON—pick one; prefer **regenerate References section from JSON** on each add for consistency).  
   - **Rationale:** Agent can query JSON via `mimir_get_session`; note stays readable.

4. **Metadata**  
   - **Choice:** `metadata` object on session JSON; on finalize, merge selected keys into YAML frontmatter (allowlist or prefix `meta_` to avoid clashes).  
   - **Rationale:** Simple merge rules; document which keys propagate.

5. **MCP package**  
   - **Choice:** Add `@modelcontextprotocol/sdk` (verify current package name at implementation). Entry: `node dist/mcp-server.js` or dedicated bin.  
   - **Rationale:** Official protocol support.

6. **CLI shape**  
   - **Choice:** `mimir session add-reference …`, `mimir session set-metadata …`, `mimir session append-section …`, `mimir session patch-section …` using `commander` subcommand group.  
   - **Alternative considered:** flat `mimir add-reference`—rejected to avoid polluting top-level namespace.

7. **Limits**  
   - **Choice:** Cap total snippet characters per reference and total session JSON size; return clear errors when exceeded.  
   - **Rationale:** Protects disk and MCP payloads.

## Risks / Trade-offs

- **Large snippets** in JSON bloat session file → **Mitigation:** caps + optional “path-only” references.  
- **Draft edited manually** while agent patches → **Mitigation:** document “last writer wins”; future CRDT out of scope.  
- **Partial draft parse failure** on `end` → **Mitigation:** fail `end` with actionable error; keep session active.

## Migration Plan

Existing users with old `active-session.json` (no `references`/`metadata`/`draftPath`): on next `start`, new schema applies. If an old session file exists without draft, `end` may still use legacy behavior OR require `end` to only support new schema—**implementation SHALL migrate or reject** old sessions with a clear message (state explicitly in tasks).

## Open Questions

- Exact frontmatter key names for metadata export (`tags` vs `meta_tags`).  
- Whether `mimir_get_session` returns full draft body or a summary to save tokens (default: return structured session + optional `includeDraft: boolean`).
