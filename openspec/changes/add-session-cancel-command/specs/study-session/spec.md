## ADDED Requirements

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
