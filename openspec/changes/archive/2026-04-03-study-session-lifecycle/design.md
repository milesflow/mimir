## Context

Mimir already writes `~/.config/mimir/config.json` with `notesDir` (`global-config` spec). CLI commands `start`, `status`, and `end` are placeholders. This change adds durable session state next to config and produces the first real study note on `end`.

## Goals / Non-Goals

**Goals:**

- Single active session at a time, represented by one JSON file.
- Deterministic, scriptable behavior (suitable for CI or aliases): **no TTY prompts** when a session already exists—fail fast with instructions.
- `end` writes a note and clears session state atomically enough for MVP: write note then delete session file; if note write fails, session remains.
- English CLI messages; English keys in JSON for machine readability.

**Non-Goals:**

- Multi-session stacks, session history DB, or server sync.
- Rich interactive prompts (`readline` “overwrite?”) in this change.
- AI-generated note content (template/placeholders only).
- Renaming or moving existing `global-config` files or schema.

## Decisions

1. **Session file path**  
   - **Choice:** `path.join(getConfigDir(), "active-session.json")` (same directory as `config.json`).  
   - **Rationale:** One obvious place for machine-local Mimir state; matches user expectation (“under ~/.config/mimir/”).

2. **Session identity**  
   - **Choice:** `id` as a `crypto.randomUUID()` string; `startedAt` as ISO-8601 UTC (`toISOString()`).  
   - **Rationale:** Stable, collision-resistant filenames and frontmatter.

3. **Topic input**  
   - **Choice:** Required `--topic <string>` on `start` (non-empty after trim).  
   - **Rationale:** Avoids ambiguous positional args; easy to document.

4. **Optional `cwd`**  
   - **Choice:** Persist `cwd` as absolute `process.cwd()` at `start` time when not disabled; optional flag `--no-cwd` to omit.  
   - **Rationale:** Useful context for later editor/git integration without extra questions.

5. **Concurrent session**  
   - **Choice:** If `active-session.json` exists and validates, `start` SHALL exit code 1 and print that a session is active and suggest `mimir status` / `mimir end`.  
   - **Rationale:** Simpler than confirmation prompts; matches MVP guardrail.

6. **Note filename**  
   - **Choice:** `${YYYY-MM-DD}-${slug(topic)}-${shortId}.md` under `notesDir`, with slug rules (lowercase, hyphen, max length) and `shortId` from first 8 chars of UUID hex without dashes.  
   - **Rationale:** Human-sortable, unique, filesystem-safe.

7. **Frontmatter**  
   - **Choice:** YAML (unquoted strings where safe) with at least: `mimir_session_id`, `started_at`, `ended_at`, `topic`, optional `cwd`, `mimir_version` (from package.json or constant).  
   - **Rationale:** Obsidian-friendly; aligns with MVP “metadata structured”.

8. **Corrupt session file**  
   - **Choice:** `status`, `start`, `end` treat invalid JSON/schema as an error with a message pointing at the file path (exit non-zero for start/end; status may exit 1 or print error—pick one: **exit 1 with stderr** for consistency).

## Risks / Trade-offs

- **[Risk]** Note write succeeds but delete session fails → duplicate notes on retry. **Mitigation:** delete session only after successful write; document rare orphan session if delete fails (user can `rm` file).
- **[Risk]** Topic slug collisions same day. **Mitigation:** include short UUID fragment in filename.
- **[Risk]** `notesDir` removed mid-session. **Mitigation:** `end` fails with clear error; session kept until resolved.

## Migration Plan

Not applicable. New file appears only when a session starts.

## Open Questions

- Whether `start` should implicitly run `init`—**out of scope**; commands SHALL require existing valid global config (clear error if missing).
