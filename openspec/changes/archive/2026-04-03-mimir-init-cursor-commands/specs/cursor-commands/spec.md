## Purpose

Define how Mimir ships and installs Cursor slash-command templates into a workspace (`.cursor/commands/`) from the published npm package.

## ADDED Requirements

### Requirement: Bundled Cursor command templates

The published npm package SHALL include one or more Markdown files intended for Cursor slash commands (YAML frontmatter plus body), stored under a stable path relative to the package root (for example `templates/cursor-commands/`). Each file SHALL be valid input for Cursor’s project command discovery (distinct `name` in frontmatter, human-readable description).

#### Scenario: Package contains templates

- **WHEN** a consumer inspects the installed `mimir` package contents
- **THEN** it SHALL include at least three template files covering starting a study session, showing session status, and ending a session (exact filenames are implementation-defined but SHALL remain stable across patch releases unless documented otherwise)

### Requirement: Install into workspace `.cursor/commands/`

When the CLI runs the documented install path (see `global-config` delta for `mimir init --cursor`), it SHALL create `.cursor/commands/` under the process current working directory if needed and SHALL copy or write each bundled template into that directory using predictable target basenames (one Markdown file per command).

#### Scenario: Successful install

- **WHEN** the install runs with a writable current working directory and no conflicting files (or with force as specified)
- **THEN** each selected template SHALL exist under `.cursor/commands/` and the CLI SHALL print confirmation including the absolute directory path

### Requirement: Idempotent install without force

When a target file under `.cursor/commands/` already exists and the user has not requested force overwrite, the CLI SHALL leave that file unchanged and SHALL continue processing remaining templates, reporting which files were skipped.

#### Scenario: Skip existing file

- **WHEN** a template would write to a path that already exists and force overwrite is not enabled
- **THEN** that path SHALL not be modified and the CLI SHALL indicate the skip without failing the command
