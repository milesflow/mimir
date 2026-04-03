## Purpose

Define how Mimir records an active study session on disk, starts and ends sessions, emits study notes, and (with related deltas) keeps draft notes and tooling aligned across CLI and MCP.

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

### Requirement: Enriched session state and draft note path

The system SHALL extend the active session record (in `active-session.json`) beyond the fields defined in the baseline `study-session` specification by supporting:

- `references`: an array (possibly empty) of reference objects, each with a stable `id` string, optional `label`, optional `path`, optional `lineStart` and `lineEnd` (non-negative integers when present), and optional `snippet` text  
- `metadata`: a JSON object whose keys are non-empty strings and values are JSON primitives or nested objects/arrays as allowed by implementation (documented limits apply)  
- `draftPath`: an absolute path to the session’s Markdown draft file under `notesDir`

When a new session starts, the system SHALL create the draft file on disk and SHALL persist `draftPath` in `active-session.json`. The draft SHALL include YAML frontmatter and the section headings `Initial question`, `References`, `Explanation`, `Summary`, and `Key concepts` as second-level Markdown headings, with `Initial question` initially containing the session `topic`.

#### Scenario: Start creates draft and enriched session

- **WHEN** `mimir start` completes successfully after this change
- **THEN** `active-session.json` SHALL include `references`, `metadata`, and `draftPath`, and the draft file SHALL exist at `draftPath` with the required headings

### Requirement: Session recording commands (CLI)

The CLI SHALL provide a `mimir session` command group with subcommands that mutate the active session and draft using the same rules as MCP tools:

- **add-reference**: add one reference object to `references` and update the draft’s **References** section to reflect all references  
- **set-metadata**: merge or replace metadata keys (behavior documented; default merge)  
- **append-section**: append Markdown body text to one of the fixed sections (`explanation`, `summary`, `key_concepts`, or as documented)  
- **patch-section**: replace the entire body of a named section (excluding the heading line) with new Markdown text  

If no active session exists or global config is invalid, each subcommand SHALL fail with a non-zero exit status and a clear English error.

#### Scenario: Add reference updates session and draft

- **WHEN** `mimir session add-reference` runs with valid arguments while a session is active
- **THEN** the new reference SHALL appear in `active-session.json` and the draft’s References section SHALL be updated accordingly

### Requirement: End session finalizes draft into published note

The `mimir end` command SHALL read the draft file at `draftPath`, incorporate references and metadata into the published Markdown (at minimum: metadata keys exported to YAML frontmatter per design, and references present in the body or appendix as specified), write the final `.md` file under `notesDir` using the existing filename rules or an updated rule documented in this change, and SHALL remove both `active-session.json` and the draft file only after a successful write of the final note. If reading or parsing the draft fails, the command SHALL exit with a non-zero status and SHALL NOT delete the active session state.

#### Scenario: Successful end publishes draft content

- **WHEN** `mimir end` runs with valid config, a valid session, and a readable draft
- **THEN** the published note SHALL contain content derived from the draft sections and references, and both the draft file and `active-session.json` SHALL be removed afterward

#### Scenario: End with unreadable draft retains session

- **WHEN** `mimir end` runs but the draft cannot be read or parsed according to implementation rules
- **THEN** the CLI SHALL exit with a non-zero status and SHALL leave `active-session.json` in place

### Requirement: Cancel session without publishing (`mimir cancel`)

The CLI SHALL provide `mimir cancel` to abandon the active study session **without** writing a published Markdown note under `notesDir`. The command SHALL require a valid active session. When the session includes `draftPath`, the implementation SHALL delete the draft file at that path only after the same path-safety checks used for other draft mutations (the draft SHALL reside under the configured `notesDir`). After successful cancellation, `active-session.json` SHALL NOT exist. When the session has no `draftPath` (legacy session), the command SHALL still remove `active-session.json` and SHALL NOT create a published note.

#### Scenario: Successful cancel with draft

- **WHEN** `mimir cancel` runs with valid global configuration, a valid active session, and a `draftPath` pointing to an existing draft under `notesDir`
- **THEN** the CLI SHALL delete that draft file, SHALL remove `active-session.json`, and SHALL exit with status zero
- **AND** the CLI SHALL NOT create a new published note file in `notesDir` as part of this command

#### Scenario: Cancel with no active session

- **WHEN** `mimir cancel` runs and there is no active session
- **THEN** the CLI SHALL exit with a non-zero status and SHALL print a clear English error

#### Scenario: Successful cancel without draft (legacy session)

- **WHEN** `mimir cancel` runs with a valid active session that has no `draftPath`
- **THEN** the CLI SHALL remove `active-session.json` and SHALL exit with status zero

#### Scenario: Draft deletion failure retains session state

- **WHEN** `mimir cancel` runs but deleting the draft file fails (for example permissions or unexpected I/O error)
- **THEN** the CLI SHALL exit with a non-zero status and SHALL leave `active-session.json` unchanged

