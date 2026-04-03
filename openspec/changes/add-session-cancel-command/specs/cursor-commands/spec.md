## MODIFIED Requirements

### Requirement: Bundled Cursor command templates

The published npm package SHALL include one or more Markdown files intended for Cursor slash commands (YAML frontmatter plus body), stored under a stable path relative to the package root (for example `templates/cursor-commands/`). Each file SHALL be valid input for Cursor’s project command discovery (distinct `name` in frontmatter, human-readable description).

#### Scenario: Package contains templates

- **WHEN** a consumer inspects the installed `mimir` package contents
- **THEN** it SHALL include at least four template files covering starting a study session, showing session status, ending a session, and canceling a session without publishing a note (exact filenames are implementation-defined but SHALL remain stable across patch releases unless documented otherwise)
