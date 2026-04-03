## Purpose

Define Mimir’s global user-level configuration (`config.json`, `notesDir`) and the `mimir init` command that creates or validates it.

## Requirements
### Requirement: Global configuration file

The CLI SHALL persist global settings in a JSON file at a stable user-level path. On macOS and Linux, the default path SHALL be `~/.config/mimir/config.json` (the `~/.config/mimir` directory SHALL be created when missing if the user runs initialization).

#### Scenario: Config path resolution

- **WHEN** the CLI needs the global configuration location on a Unix-like system
- **THEN** it SHALL resolve the file path to `$HOME/.config/mimir/config.json` (using the process environment and home directory semantics)

### Requirement: Configuration schema

The configuration file SHALL be valid JSON containing an object with at least a string field `notesDir`. The value SHALL be an absolute, normalized filesystem path pointing to the directory where study notes are stored.

#### Scenario: Valid configuration after initialization

- **WHEN** initialization completes successfully
- **THEN** the configuration file SHALL exist, parse as JSON, and include `notesDir` as a non-empty string absolute path

### Requirement: Initialize Mimir (`mimir init`)

The CLI SHALL provide a `mimir init` command that prepares global configuration and the notes directory. If the configuration file does not exist, the command SHALL create the configuration directory, write `config.json` with `notesDir`, and ensure the notes directory exists. If the configuration file already exists and is valid, the command SHALL not overwrite it and SHALL print a clear message indicating Mimir is already initialized (including paths).

#### Scenario: First-time initialization

- **WHEN** `mimir init` runs and no valid configuration file exists yet
- **THEN** the CLI SHALL create `~/.config/mimir` if needed, write `config.json` with `notesDir`, create the notes directory if it does not exist, and print a success message with the paths used

#### Scenario: Already initialized

- **WHEN** `mimir init` runs and a valid configuration file already exists
- **THEN** the CLI SHALL not modify the existing file and SHALL print a message that Mimir is already initialized, including the config file path and current `notesDir`

### Requirement: Notes directory creation and validation

During initialization, if `notesDir` does not exist, the CLI SHALL create it (including parent directories as needed). If `notesDir` resolves to an existing path that is not a directory, the CLI SHALL fail with a clear error and SHALL NOT overwrite the configuration file.

#### Scenario: Create missing notes directory

- **WHEN** initialization runs and `notesDir` does not exist on disk
- **THEN** the CLI SHALL create that directory and succeed

#### Scenario: Conflict with non-directory path

- **WHEN** `notesDir` resolves to an existing file or non-directory entry
- **THEN** the CLI SHALL exit with a non-zero status and print an error explaining the conflict

### Requirement: Interactive notes directory prompt on first-time init

When `mimir init` performs first-time initialization (no existing valid global configuration file), the CLI MAY prompt the user on a single line of English text for the filesystem path where study notes SHALL be stored. The prompt SHALL only occur when standard input is an interactive terminal (TTY) and the user did not provide the `--notes-dir` option. When the prompt is not shown, the CLI SHALL determine `notesDir` exactly as specified for the existing first-time initialization behavior (default path or value from `--notes-dir`).

The prompt SHALL indicate that pressing Enter without typing a path SHALL select the same default notes directory as the existing specification (the implementation’s default path, historically under the user’s home directory). When the user submits an empty line, the CLI SHALL use that default. When the user submits a non-empty line, the CLI SHALL resolve and use that path as `notesDir` subject to the same creation and validation rules as when `--notes-dir` is provided.

When `--notes-dir` is provided, the CLI SHALL NOT display this prompt and SHALL use the given path as today.

#### Scenario: First-time init interactive with Enter for default

- **WHEN** no valid global configuration file exists, stdin is a TTY, `--notes-dir` is not provided, and the user submits only an empty line in response to the prompt
- **THEN** the CLI SHALL write `config.json` with `notesDir` set to the same default path as when `--notes-dir` is omitted in non-interactive first-time init, and SHALL create the notes directory as needed

#### Scenario: First-time init interactive with custom path

- **WHEN** no valid global configuration file exists, stdin is a TTY, `--notes-dir` is not provided, and the user enters a non-empty path
- **THEN** the CLI SHALL resolve that path to an absolute path, use it as `notesDir`, and SHALL apply the same validation and directory-creation rules as for `--notes-dir`

#### Scenario: First-time init non-interactive without `--notes-dir`

- **WHEN** no valid global configuration file exists, stdin is not a TTY (or is otherwise non-interactive), and `--notes-dir` is not provided
- **THEN** the CLI SHALL NOT prompt for input and SHALL initialize using the same default `notesDir` as today

#### Scenario: First-time init with `--notes-dir` and TTY

- **WHEN** no valid global configuration file exists, stdin is a TTY, and `--notes-dir` is provided with a path
- **THEN** the CLI SHALL NOT prompt for input and SHALL use the provided path as `notesDir`

#### Scenario: Already initialized

- **WHEN** a valid global configuration file already exists
- **THEN** the CLI SHALL not prompt for the notes directory and SHALL behave as specified for the existing “already initialized” case

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

