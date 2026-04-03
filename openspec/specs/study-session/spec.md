## Requirements

### Requirement: Session state file

The CLI SHALL persist at most one active study session in a JSON file named `active-session.json` located in the global Mimir configuration directory (the same directory that contains `config.json`). The file SHALL NOT exist when no session is active. When present, it SHALL contain:

- `id`: non-empty string uniquely identifying the session  
- `startedAt`: non-empty string timestamp in ISO-8601 UTC  
- `topic`: non-empty string (initial question or title)  
- `cwd`: optional string; when present, SHALL be an absolute directory path representing the working directory captured at session start  

#### Scenario: Session file path

- **WHEN** the CLI resolves the active session file location
- **THEN** it SHALL use `active-session.json` alongside the global `config.json` in the Mimir config directory

### Requirement: Preconditions for session commands

The commands `mimir start` and `mimir end` SHALL require a valid global configuration readable via the existing configuration mechanism, including a usable `notesDir`. The command `mimir status` SHALL NOT require global configuration **only to report “no active session”** when `active-session.json` is absent; if `active-session.json` exists but is invalid, the CLI SHALL surface an error.

#### Scenario: Start without global config

- **WHEN** `mimir start` runs and global configuration is missing or invalid
- **THEN** the CLI SHALL exit with a non-zero status and print a clear English error

#### Scenario: End without global config

- **WHEN** `mimir end` runs and global configuration is missing or invalid
- **THEN** the CLI SHALL exit with a non-zero status and print a clear English error

### Requirement: Start a study session (`mimir start`)

The CLI SHALL provide `mimir start` with a required non-empty `--topic` argument (after trim). The command SHALL create `active-session.json` with a new `id`, `startedAt` set to the current time (ISO-8601 UTC), `topic` from the flag, and `cwd` set to the absolute current working directory unless the user passes an option to omit `cwd` as specified in implementation. If a valid active session file already exists, the command SHALL NOT overwrite it and SHALL exit with a non-zero status with a clear message instructing the user to run `mimir end` (or inspect `mimir status`) first.

#### Scenario: Successful start

- **WHEN** `mimir start --topic "Understand auth flow"` runs, global config is valid, and no active session exists
- **THEN** the CLI SHALL write `active-session.json` with the required fields and SHALL exit with status zero

#### Scenario: Start blocked by active session

- **WHEN** `mimir start` runs and a valid active session already exists
- **THEN** the CLI SHALL exit with a non-zero status and SHALL NOT modify the existing session file

### Requirement: Show session status (`mimir status`)

The CLI SHALL provide `mimir status`. If no `active-session.json` exists, the CLI SHALL print that there is no active session and SHALL exit with status zero. If the file exists and is valid, the CLI SHALL print session details (including `id`, `startedAt`, `topic`, and `cwd` when present). If the file exists but is invalid JSON or fails schema validation, the CLI SHALL exit with a non-zero status and print a clear error.

#### Scenario: No active session

- **WHEN** `mimir status` runs and `active-session.json` does not exist
- **THEN** the CLI SHALL indicate no active session and SHALL exit with status zero

#### Scenario: Active session displayed

- **WHEN** `mimir status` runs and a valid session file exists
- **THEN** the CLI SHALL print the session fields in human-readable form

### Requirement: End session and write note (`mimir end`)

The CLI SHALL provide `mimir end`. The command SHALL require a valid active session and valid global configuration. It SHALL write a new Markdown file under `notesDir` whose content includes YAML frontmatter and body sections for at minimum: **Initial question** (or equivalent heading aligned with the template), **Explanation**, **Summary**, and **Key concepts**. The frontmatter SHALL include `mimir_session_id`, `started_at`, `ended_at` (ISO-8601 UTC at end time), `topic`, and `mimir_version`. If `cwd` was stored on the session, the frontmatter SHOULD include `cwd`. After the note is written successfully, the CLI SHALL remove `active-session.json`. If writing the note fails, the CLI SHALL NOT remove the session file.

#### Scenario: Successful end

- **WHEN** `mimir end` runs with valid global config and a valid active session
- **THEN** the CLI SHALL create a `.md` file under `notesDir`, SHALL remove `active-session.json`, and SHALL exit with status zero

#### Scenario: End with no session

- **WHEN** `mimir end` runs and there is no active session
- **THEN** the CLI SHALL exit with a non-zero status and print a clear error

#### Scenario: Note write failure retains session

- **WHEN** `mimir end` runs but writing the Markdown file fails (for example, permissions or full disk)
- **THEN** the CLI SHALL exit with a non-zero status and SHALL leave `active-session.json` unchanged
