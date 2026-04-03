## ADDED Requirements

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
