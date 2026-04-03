---
name: /mimir-end
id: mimir-end
category: Workflow
description: End the Mimir study session and publish the note (MCP)
---

End the active study session and write the published Markdown note under the configured notes directory.

Use the **Mimir MCP** tool **`mimir_end_session`** (no arguments). On success the result includes **`publishedPath`**.

If there is no active session or publishing fails, surface the tool error and stop.
