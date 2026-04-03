## Context

Mimir ships as a global CLI; Cursor reads slash commands only from `.cursor/commands/` in the workspace. Users expect a one-step way to scaffold those files, analogous to OpenSpec’s project-local command templates.

## Goals / Non-Goals

**Goals:**

- Install bundled Markdown templates into `./.cursor/commands/` relative to `process.cwd()` when the user opts in via `mimir init --cursor`.
- Keep templates inside the published npm package (`package.json` `files` includes a `templates/` tree).
- Idempotent default: do not overwrite user-edited files unless `--cursor-force` is passed (exact flag name in implementation; document in CLI help).

**Non-Goals:**

- Registering commands globally in Cursor (not possible via npm alone).
- Non-Cursor editors or non-Markdown workflow systems.
- Auto-detecting git root vs cwd (use cwd only for MVP; document clearly).

## Decisions

1. **Flag shape:** `mimir init --cursor` plus optional `--cursor-force` (boolean). Works together with existing `--notes-dir`; order of operations: perform existing global init logic unchanged, then if `--cursor` is set, run the template copy phase (so “already initialized” still allows adding Cursor files when `--cursor` is passed).

2. **Template resolution:** Resolve directory adjacent to the running CLI entrypoint via `import.meta.url` / `fileURLToPath` to a `templates/cursor-commands/` folder shipped beside `dist/` (or copy templates into `dist/` during build). Avoid hard-coded absolute paths.

3. **Template set (initial):** At minimum three commands aligned with core session lifecycle: start session, status/session read, end session. Names like `/mimir-start`, `/mimir-status`, `/mimir-end` with frontmatter `name`, `description`, `category`. Body instructs the agent to use CLI or MCP consistently with repo docs.

4. **Overwrite policy:** If target file exists and `--cursor-force` is false, skip that file and print a one-line notice per skipped file; exit zero. If `--cursor-force`, replace. Empty `.cursor/commands/` may be created without other files.

5. **Errors:** If cwd is not writable or `mkdir` fails, non-zero exit and English error; do not partially claim success.

## Risks / Trade-offs

- **[Risk]** User runs `mimir init --cursor` outside any project → files appear in an unexpected directory. **Mitigation:** Print absolute path of `.cursor/commands` created; document “run from repo root.”

- **[Risk]** Package layout differs between `npm link` and production. **Mitigation:** Single supported layout documented; test resolves from `dist/cli.js` relative to `templates/`.

## Migration Plan

N/A (additive feature). Existing `mimir init` without flags unchanged.

## Open Questions

- Whether to add a dedicated `mimir setup cursor` later that only copies templates without touching global config (could be a follow-up change).
