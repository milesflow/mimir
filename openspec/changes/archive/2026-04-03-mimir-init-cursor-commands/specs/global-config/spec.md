## ADDED Requirements

### Requirement: Optional Cursor command installation (`mimir init --cursor`)

The CLI SHALL extend `mimir init` with an optional boolean flag `--cursor`. When `--cursor` is present, after the command has completed its existing global initialization behavior (including the case where configuration already exists and is left unchanged), the CLI SHALL install bundled Cursor command templates into `.cursor/commands/` under the process current working directory according to the `cursor-commands` specification.

The CLI SHALL also provide an optional flag (for example `--cursor-force`) that, when set together with `--cursor`, SHALL overwrite existing files in `.cursor/commands/` that would otherwise be skipped; when `--cursor` is omitted, `--cursor-force` SHALL either be ignored or rejected with a clear error (implementation choice documented in CLI help).

#### Scenario: Already initialized but adding Cursor commands

- **WHEN** `mimir init --cursor` runs and a valid global configuration file already exists
- **THEN** the CLI SHALL not modify the global configuration file and SHALL still install Cursor command templates into `.cursor/commands/` under the current working directory when that directory is writable

#### Scenario: First-time init with Cursor commands

- **WHEN** `mimir init --cursor` runs and no valid configuration file exists yet
- **THEN** the CLI SHALL perform first-time global initialization as today and SHALL install Cursor command templates into `.cursor/commands/` under the current working directory when that directory is writable

#### Scenario: Init without --cursor unchanged

- **WHEN** `mimir init` runs without `--cursor`
- **THEN** the CLI SHALL not create or modify `.cursor/commands/` and SHALL behave exactly as specified in the baseline global configuration specification for initialization
