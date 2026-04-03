#!/usr/bin/env node
import * as z from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { endSessionAndPublish } from "./commands/end.js";
import type { SectionKey } from "./draft/layout.js";
import { readActiveSession } from "./session/io.js";
import {
  createSessionWithDraft,
  SessionDraftService,
} from "./session/session-draft-service.js";

const svc = new SessionDraftService();

async function main(): Promise<void> {
  const server = new McpServer(
    { name: "mimir", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "mimir_start_session",
    {
      description:
        "Start a new Mimir study session: writes active session state and creates a draft markdown file under the configured notes directory. If a session is already active, the call fails until it is ended (use mimir_end_session or mimir end).",
      inputSchema: {
        topic: z
          .string()
          .describe("Title or initial question for this study session"),
        recordCwd: z
          .boolean()
          .optional()
          .describe(
            "When true (default), record process working directory on the session. Set false to skip (same as mimir start --no-cwd)."
          ),
      },
    },
    async ({ topic, recordCwd }) => {
      await createSessionWithDraft({
        topic,
        recordCwd: recordCwd !== false,
      });
      const session = await readActiveSession();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                id: session.id,
                topic: session.topic,
                startedAt: session.startedAt,
                draftPath: session.draftPath,
                cwd: session.cwd,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "mimir_get_session",
    {
      description:
        "Return whether a Mimir study session is active, session JSON fields, and optionally the full draft markdown body.",
      inputSchema: {
        includeDraftBody: z
          .boolean()
          .optional()
          .describe("When true, include the draft .md file contents"),
      },
    },
    async ({ includeDraftBody }) => {
      const state = await svc.getSessionState(includeDraftBody === true);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(state, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "mimir_add_reference",
    {
      description:
        "Add a code or text reference to the active session; updates active-session.json and the draft References section.",
      inputSchema: {
        label: z.string().optional().describe("Short label for the reference"),
        path: z.string().optional().describe("Filesystem path to the source file"),
        lineStart: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Start line (1-based optional convention per project)"),
        lineEnd: z.number().int().nonnegative().optional().describe("End line"),
        snippet: z.string().optional().describe("Quoted code or excerpt"),
        language: z
          .string()
          .optional()
          .describe(
            "Optional language identifier for Markdown code fences (e.g. 'swift', 'typescript')."
          ),
      },
    },
    async (input) => {
      const { id } = await svc.addReference({
        label: input.label,
        path: input.path,
        lineStart: input.lineStart,
        lineEnd: input.lineEnd,
        snippet: input.snippet,
        language: input.language,
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true, id }) }],
      };
    }
  );

  server.registerTool(
    "mimir_patch_section",
    {
      description:
        "Replace the body of a draft section (explanation, summary, or key_concepts).",
      inputSchema: {
        section: z
          .enum(["explanation", "summary", "key_concepts"])
          .describe("Section key to replace"),
        body: z.string().describe("New Markdown body for the section (no heading)"),
      },
    },
    async ({ section, body }) => {
      await svc.patchSection(section as SectionKey, body);
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true, section }) }],
      };
    }
  );

  server.registerTool(
    "mimir_append_section",
    {
      description:
        "Append Markdown to explanation, summary, or key_concepts in the draft.",
      inputSchema: {
        section: z.enum(["explanation", "summary", "key_concepts"]),
        text: z.string().describe("Markdown to append"),
      },
    },
    async ({ section, text }) => {
      await svc.appendSection(section as SectionKey, text);
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true, section }) }],
      };
    }
  );

  server.registerTool(
    "mimir_set_metadata",
    {
      description:
        "Merge or replace metadata on the active session (reflected in note frontmatter on end).",
      inputSchema: {
        patch: z
          .record(z.string(), z.any())
          .describe("Object of metadata keys to merge"),
        replace: z
          .boolean()
          .optional()
          .describe("When true, replace metadata entirely"),
      },
    },
    async ({ patch, replace }) => {
      await svc.setMetadata(patch as Record<string, unknown>, replace === true);
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true }) }],
      };
    }
  );

  server.registerTool(
    "mimir_end_session",
    {
      description:
        "End the active study session and publish the Markdown note. From Cursor/MCP this enforces non-empty draft sections and at least one tags_* metadata key after merge—call mimir_get_session (includeDraftBody:true) first, then pass sections + tags from the conversation. Default sectionsStrategy is append. Use skipMimirEndGuards only for rare bypass. CLI `mimir end` has no such enforcement.",
      inputSchema: z
        .object({
          sections: z
            .object({
              explanation: z.string().optional(),
              summary: z.string().optional(),
              key_concepts: z.string().optional(),
            })
            .optional(),
          sectionsStrategy: z
            .enum(["onlyFillEmpty", "overwrite", "append"])
            .optional()
            .describe(
              "MCP default: append. onlyFillEmpty fills blanks only; overwrite replaces; append appends to existing section body."
            ),
          tags: z
            .object({
              technology: z
                .enum([
                  "swift",
                  "swiftui",
                  "typescript",
                  "javascript",
                  "nodejs",
                  "react",
                  "nextjs",
                  "python",
                  "java",
                  "kotlin",
                  "rust",
                  "go",
                  "csharp",
                  ".net",
                  "postgres",
                  "mysql",
                  "mongodb",
                  "redis",
                  "graphql",
                  "rest",
                  "docker",
                  "kubernetes",
                  "aws",
                  "gcp",
                  "azure",
                  "openapi",
                  "sql",
                  "other",
                ])
                .optional(),
              technologyOther: z.string().optional(),
              topic: z
                .enum([
                  "architecture",
                  "api",
                  "performance",
                  "security",
                  "authentication",
                  "authorization",
                  "database",
                  "concurrency",
                  "testing",
                  "observability",
                  "ui",
                  "mobile",
                  "refactor",
                  "feature",
                  "bugfix",
                  "business-logic",
                  "data-processing",
                  "design",
                  "other",
                ])
                .optional(),
              topicOther: z.string().optional(),
              hasAlgorithm: z.boolean().optional(),
              businessRule: z.boolean().optional(),
              architecture: z.boolean().optional(),
            })
            .optional(),
          metadata: z.record(z.string(), z.any()).optional(),
          metadataReplace: z.boolean().optional(),
          references: z
            .array(
              z.object({
                label: z.string().optional(),
                path: z.string().optional(),
                lineStart: z.number().int().nonnegative().optional(),
                lineEnd: z.number().int().nonnegative().optional(),
                snippet: z.string().optional(),
                language: z.string().optional(),
              })
            )
            .optional(),
          skipMimirEndGuards: z
            .boolean()
            .optional()
            .describe("Bypass MCP checks (empty sections / missing tags). Prefer fixing payload instead."),
        })
        .partial(),
    },
    async (input) => {
      const { publishedPath } = await endSessionAndPublish(input, { source: "mcp" });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, publishedPath }, null, 2),
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
