# Mimir

Mimir is a CLI that turns day-to-day coding work into **durable knowledge** (inspired by [OpenSpec](https://github.com/Fission-AI/OpenSpec) and spec-driven workflows).

It lets you run **study sessions** on code, technical decisions, and business logic, work with an AI agent to understand what was done, and automatically save that learning as **structured, reusable notes**.

Instead of AI finishing tasks while the knowledge disappears, Mimir turns each interaction into something the developer can actually reuse.

---

## Problem

Today, AI:

- speeds up development
- helps you work with unfamiliar tech

But it creates a gap: **code gets written faster than it gets understood**.

That leads to:

- shallow understanding
- over-reliance on AI
- harder maintenance and scaling
- lost implicit knowledge (technical and domain)

---

## Solution: study-driven development

Mimir is a flow where work can become a learning session:

1. You open a session about code or a question.
2. You use AI to understand what the code does, why it is shaped that way, and what business rules sit behind it.
3. You close the session.
4. Mimir writes a structured note for you.

**Outcome:** persistent, searchable, reusable knowledge.

---

## MVP scope

### Local CLI

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `mimir init`   | Initial setup                        |
| `mimir start`  | Start a study session                |
| `mimir status` | Show the active session              |
| `mimir end`    | End session and generate a note      |

### Study sessions

- Grounded in real questions from the developer.
- Support technical analysis and business logic.

### Note generation

- **Markdown** with **YAML frontmatter**.
- Content: initial question, explanation, summary, key concepts.

### Local storage

- Global configuration.
- Active sessions.
- Notes in a configurable directory.

---

## Development

Requires **Node.js ≥ 20**.

```bash
npm install
npm run dev -- --help
```

Build and run the binary:

```bash
npm run build
npm start -- --help
```

Link globally while developing:

```bash
npm link
mimir --help
```

---

## Post-MVP ideas

- Editor integration (VS Code / Cursor).
- Automatic context (git, diff, files).
- Quizzes and active recall.
- Semantic search across sessions.
- Tools like Obsidian.
- Deeper OpenSpec integration (spec → learning).

---

## Positioning

Mimir does not replace AI coding tools—it **complements** them.

- Other tools help you **ship faster**.
- Mimir helps you **understand and remember**.

---

## One-liner

> Mimir turns AI-generated code into real developer knowledge.
