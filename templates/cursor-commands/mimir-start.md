---
name: /mimir-start
id: mimir-start
category: Workflow
description: Start a Mimir study session (MCP)
---

Start a Mimir study session for this workspace.

Use the **Mimir MCP** tool **`mimir_start_session`** with:

- **`topic`**: short title or question for this session (required).
- **`recordCwd`**: optional boolean; default `true` (omit or `false` if you should not record the working directory).

Then call **`mimir_get_session`** to confirm the session is active and inspect `id`, `draftPath`, etc.
