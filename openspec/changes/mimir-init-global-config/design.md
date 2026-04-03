## Context

Mimir is a Node.js/TypeScript CLI (`commander`, ESM). Commands `start`, `status`, and `end` are stubs. There is no persisted configuration yet. Users need a single, predictable place for global settings and a dedicated directory for generated study notes.

Constraints:

- English for user-facing CLI strings and project docs.
- Node.js ≥ 20; prefer `node:fs`, `node:path`, `node:os` without new runtime dependencies unless justified.
- Cross-platform: implement macOS/Linux paths first using `os.homedir()` + XDG-style config; Windows-specific layout can be a follow-up (document as non-goal for MVP).

## Goals / Non-Goals

**Goals:**

- Resolve default global config directory and file path (`config.json`).
- Define a minimal JSON schema: at least `notesDir` (string, absolute normalized path).
- `mimir init` creates parent dirs as needed, writes default or user-supplied `notesDir`, creates the notes directory if missing, and exits with clear stdout/stderr.
- If valid config already exists, do not overwrite; print an informative message and exit successfully (or use a documented non-zero exit—pick one and keep it consistent).

**Non-Goals:**

- Interactive prompts beyond what is needed for init in this change (optional: can be deferred).
- Session files, note templates, or AI integration.
- Full Windows `%APPDATA%` support in the first iteration (stub or TODO acceptable if code path is isolated).

## Decisions

1. **Config location (Unix-like)**  
   - **Choice:** `~/.config/mimir/config.json` (create `~/.config/mimir` if needed).  
   - **Rationale:** Matches common XDG-style user config on macOS/Linux; easy to document.  
   - **Alternatives:** `~/.mimirrc` (single file, less structured); env-only (no file—harder for `start`/`end`).

2. **Format**  
   - **Choice:** JSON with a top-level object, field `notesDir` required after init.  
   - **Rationale:** Native `JSON.parse`/`stringify`, no extra deps.  
   - **Alternatives:** YAML (adds dependency); TOML (same).

3. **Default `notesDir`**  
   - **Choice:** `~/Documents/mimir-notes` (or `~/mimir-notes`—pick one and document). Use absolute resolved path in the file.  
   - **Rationale:** Documents folder is a sensible default for markdown notes on desktop OSes.  
   - **Alternatives:** Current working directory (surprising); `~/.local/share/mimir/notes` (more hidden).

4. **Idempotency**  
   - **Choice:** If `config.json` exists and parses with required fields, print “already initialized” (include path to config and `notesDir`) and exit 0; do not clobber.  
   - **Rationale:** Safe reruns in scripts; user can manually edit JSON to change paths later.  
   - **Alternatives:** `--force` overwrite (can be a later flag).

5. **Module layout**  
   - **Choice:** Small modules, e.g. `src/config/paths.ts` (resolve config file path), `src/config/schema.ts` (types + validation), `src/config/io.ts` (read/write), `src/commands/init.ts` (orchestration).  
   - **Rationale:** Keeps `cli.ts` thin and testable.

6. **Errors**  
   - **Choice:** On missing parent permissions, invalid path, or disk errors, print a concise English error to stderr and exit with code 1.  
   - **Rationale:** Standard CLI behavior.

## Risks / Trade-offs

- **[Risk]** `~/.config` may not exist → **Mitigation:** `mkdir` with recursive flag for config dir and notes dir where applicable.  
- **[Risk]** `notesDir` points to a file or non-directory → **Mitigation:** After `path.resolve`, check `stat`; if exists and not a directory, fail with clear message.  
- **[Risk]** Windows users get Unix-oriented docs → **Mitigation:** note in README non-goal or partial support until implemented.

## Migration Plan

Not applicable (greenfield). First `mimir init` on a machine creates config; no prior version to migrate.

## Open Questions

- Whether `mimir init` accepts `--notes-dir <path>` in MVP (recommended yes for CI and power users).
- Exact default folder name (`mimir-notes` under Documents vs home).
