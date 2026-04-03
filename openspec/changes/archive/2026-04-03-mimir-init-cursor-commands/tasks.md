## 1. Package layout and templates

- [x] 1.1 Add `templates/cursor-commands/` with three Markdown command files (`mimir-start`, `mimir-status`, `mimir-end` or equivalent names) including YAML frontmatter (`name`, `description`, `category`) and body instructions for the agent (CLI and/or MCP).
- [x] 1.2 Extend `package.json` `files` and build pipeline so `templates/` is published alongside `dist/`; document path resolution from `dist/cli.js` (or `import.meta.url`).

## 2. Install logic

- [x] 2.1 Implement a small module (e.g. `src/cursor/install-commands.ts`) that copies templates to `cwd/.cursor/commands/`, creates directories, honors skip-on-exists vs `--cursor-force`, and prints absolute paths and skip notices.
- [x] 2.2 Wire `mimir init` in `src/commands/init.ts` to accept `--cursor` and `--cursor-force`; run install after existing init logic, including when config already exists and init returns early.

## 3. CLI and docs

- [x] 3.1 Register options on `command("init")` in `src/cli.ts` with English help text; reject or ignore `--cursor-force` without `--cursor` per design.
- [x] 3.2 Add a short README subsection: global install vs repo `.cursor/commands/`, example `mimir init --cursor` from repo root.

## 4. Verification

- [x] 4.1 `npm run build`; run `mimir init --cursor` in a temp directory and assert files exist; repeat for skip and force behavior.
- [x] 4.2 Manual: reload Cursor and confirm slash commands appear.
