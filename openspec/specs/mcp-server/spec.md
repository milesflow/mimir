# mcp-server Specification

## Purpose

Describe the Mimir MCP server (stdio): tools that read and mutate the active study session and its draft so clients can mirror CLI behavior.

## Requirements
### Requirement: Mimir MCP server (stdio)

The project SHALL ship an MCP server executable (Node.js) that communicates over **stdio** using the Model Context Protocol and exposes tools for session inspection and mutation. The server SHALL reuse the same internal session/draft logic as the CLI `mimir session` subcommands so that behavior stays consistent.

#### Scenario: Server starts

- **WHEN** the MCP server process is launched by a compatible client
- **THEN** it SHALL advertise its tool list and SHALL handle `tools/call` requests without requiring network access

### Requirement: Tool — get session

The server SHALL provide a tool named `mimir_get_session` that returns structured data for the active session, including at minimum: `id`, `startedAt`, `topic`, optional `cwd`, `references`, `metadata`, `draftPath`, and whether a session exists. The tool MAY accept a parameter to include or omit the full draft body to control payload size.

#### Scenario: No active session

- **WHEN** `mimir_get_session` is invoked and no `active-session.json` exists
- **THEN** the response SHALL indicate that there is no active session and SHALL NOT throw an unhandled error

#### Scenario: Active session

- **WHEN** `mimir_get_session` is invoked while a valid session exists
- **THEN** the response SHALL include the session fields and reference list

### Requirement: Tool — add reference

The server SHALL provide a tool named `mimir_add_reference` that accepts parameters equivalent to the CLI `add-reference` command (including optional `label`, `path`, `lineStart`, `lineEnd`, and `snippet`). The tool SHALL append a reference to the session and SHALL update the draft References section consistently with the CLI.

#### Scenario: Add reference succeeds

- **WHEN** `mimir_add_reference` is called with valid arguments during an active session
- **THEN** the session and draft SHALL update and the tool SHALL return a success acknowledgement with the new reference `id`

### Requirement: Tool — patch section

The server SHALL provide a tool named `mimir_patch_section` that replaces the body of a named section in the draft (section key as documented, e.g. `explanation`). The tool SHALL reject unknown section keys with a clear error.

#### Scenario: Patch unknown section

- **WHEN** `mimir_patch_section` is called with an unknown section identifier
- **THEN** the tool SHALL return an error result without corrupting the draft

### Requirement: Tool — append section

The server SHALL provide a tool named `mimir_append_section` that appends Markdown text to a named section’s body (same section key set as patch, excluding sections where append is disallowed by design such as `initial_question` or `references`). If append to a disallowed section is requested, the tool SHALL return an error.

#### Scenario: Append to explanation

- **WHEN** `mimir_append_section` targets `explanation` with non-empty text during an active session
- **THEN** the draft SHALL include the additional text under the **Explanation** heading

### Requirement: Tool — set metadata

The server SHALL provide a tool named `mimir_set_metadata` that merges or sets metadata keys on the active session JSON and SHALL persist changes atomically with respect to other single-tool operations (last concurrent write wins at file level is acceptable for MVP).

#### Scenario: Set metadata keys

- **WHEN** `mimir_set_metadata` is called with a JSON object of keys to merge
- **THEN** `active-session.json` SHALL reflect the updated `metadata` object

