---
name: /mimir-status
id: mimir-status
category: Workflow
description: Show the active Mimir study session (MCP)
---

Inspect the active Mimir study session via the **Mimir MCP** tool **`mimir_get_session`**.

- Set **`includeDraftBody`** to `true` only when you need the full draft Markdown (larger payload).

Interpret the JSON: `active`, session fields (`id`, `topic`, `references`, `metadata`, `draftPath`, …), and optional `draft` body.
