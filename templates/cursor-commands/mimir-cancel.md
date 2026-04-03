---
name: /cancel
id: mimir-cancel
category: Workflow
description: Cancel the Mimir study session without publishing (discard draft)
---

The user wants to **stop the current Mimir study session** and **not** save a published note (e.g. started by mistake or they changed their mind).

**Do not** call `mimir_end_session` — that publishes a note.

### Required workflow

1. Call **`mimir_cancel_session`** (no arguments).
2. Confirm with **`mimir_get_session`** that no session is active (`active: false`).

### Notes

- This **deletes the draft** under `.mimir/drafts/` when the session has one.
- If there is no active session, the tool returns an error — surface it and stop.
