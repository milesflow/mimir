---
name: /mimir-end
id: mimir-end
category: Workflow
description: End the Mimir study session and publish the note (MCP)
---

End the active study session and write the published Markdown note under the configured notes directory.

**Do not call `mimir_end_session` until you have read the draft and synthesized the conversation.**

### Required workflow (order matters)

1. Call **`mimir_get_session`** with **`includeDraftBody: true`**. Use `draft`, `topic`, `references`, and `metadata` to see what is already captured.
2. From the **current chat transcript** (not only the draft), prepare:
   - **`sections`**: at least one of `explanation`, `summary`, `key_concepts` with the important outcomes, decisions, and **open questions/doubts**. If the user already wrote in a section, default behavior is **`append`** (MCP) so you add without wiping their text.
   - **`tags`**: set from the conversation using the enums (`technology`, `topic`, and booleans `hasAlgorithm`, `businessRule`, `architecture`). If `technology` or `topic` is `other`, fill `technologyOther` / `topicOther`.
3. Call **`mimir_end_session`** with that payload.

### MCP behavior (important)

- **`mimir_end_session` from MCP will fail** if, after your updates, the note would still have **all three** of Explanation / Summary / Key concepts empty, or if there is **no** `tags_*` key in session metadata. This prevents “closing with nothing saved.”
- **`sectionsStrategy`**: MCP default is **`append`**. Use **`overwrite`** only when the user explicitly wants to replace a section. Use **`onlyFillEmpty`** only to fill blanks without appending.
- **`references`**: pass `language` (e.g. `"swift"`) so snippets use fenced code with an idiom like ```swift ... ```.
- **`skipMimirEndGuards`**: last resort only; almost always **omit** it and fix `sections` + `tags`.

CLI **`mimir end`** does not apply these MCP guards (empty publish is still possible from the terminal).

On success the result includes **`publishedPath`**.

If there is no active session or publishing fails, surface the tool error and stop.
