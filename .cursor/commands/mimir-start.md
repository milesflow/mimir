---
name: /mimir-start
id: mimir-start
category: Workflow
description: Start a Mimir study session (CLI or MCP)
---

Start a Mimir study session for this workspace.

**Preferred:** If the **Mimir MCP** server is available, call the tool **`mimir_start_session`** with a clear `topic` string (and `recordCwd` if you need cwd on the session).

**Otherwise:** Run from the project root:

```bash
mimir start --topic "<short title or question>"
```

Then confirm with `mimir_get_session` or `mimir status` that a session is active.
