## ADDED Requirements

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
