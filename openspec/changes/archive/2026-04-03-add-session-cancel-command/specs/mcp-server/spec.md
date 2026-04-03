## ADDED Requirements

### Requirement: Tool — cancel session

The server SHALL provide a tool named `mimir_cancel_session` that abandons the active study session without publishing a note, using the same on-disk rules as the CLI `mimir cancel` command (including deletion of the draft file when `draftPath` is present and path checks pass, and removal of `active-session.json`).

#### Scenario: Cancel succeeds with active session

- **WHEN** `mimir_cancel_session` is invoked while a valid active session exists
- **THEN** the tool SHALL return a success response with structured JSON indicating completion
- **AND** afterward `mimir_get_session` SHALL report that there is no active session

#### Scenario: Cancel with no active session

- **WHEN** `mimir_cancel_session` is invoked and no active session exists
- **THEN** the tool SHALL return an error result with a clear message and SHALL NOT throw an unhandled error
