---
name: /mimir-end
id: mimir-end
category: Workflow
description: End the Mimir study session and write the study note (CLI)
---

End the active study session and publish the Markdown note under the configured notes directory.

There is no MCP tool for **end** in the default server: use the CLI:

```bash
mimir end
```

If no session is active, surface the CLI error and stop.
