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
