#!/usr/bin/env node
import { Command } from "commander";

import { runEnd } from "./commands/end.js";
import { runInit } from "./commands/init.js";
import {
  runSessionAddReference,
  runSessionAppendSection,
  runSessionPatchSection,
  runSessionSetMetadata,
} from "./commands/session.js";
import { runStart } from "./commands/start.js";
import { runStatus } from "./commands/status.js";

const program = new Command();

program
  .name("mimir")
  .description(
    "Study-driven development: turn AI-assisted sessions into persistent notes."
  )
  .version("0.1.0");

program
  .command("init")
  .description("Initial setup (notes directory, preferences)")
  .option("--notes-dir <path>", "Directory for study notes")
  .option(
    "--cursor",
    "Install Cursor slash-command templates into ./.cursor/commands (run from repo root)",
    false
  )
  .option(
    "--cursor-force",
    "Overwrite existing Cursor command files (requires --cursor)",
    false
  )
  .action(
    async (opts: {
      notesDir?: string;
      cursor?: boolean;
      cursorForce?: boolean;
    }) => {
      try {
        if (opts.cursorForce === true && opts.cursor !== true) {
          console.error("Error: --cursor-force requires --cursor");
          process.exit(1);
        }
        await runInit({
          notesDir: opts.notesDir,
          cursor: opts.cursor === true,
          cursorForce: opts.cursorForce === true,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(msg);
        process.exit(1);
      }
    }
  );

program
  .command("start")
  .description("Start a study session")
  .requiredOption("--topic <text>", "Initial question or title for this session")
  .option("--no-cwd", "Do not record current working directory")
  .action(async (opts: { topic: string; noCwd?: boolean }) => {
    try {
      await runStart({
        topic: opts.topic,
        recordCwd: opts.noCwd !== true,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(msg);
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Show the active session")
  .action(async () => {
    try {
      await runStatus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(msg);
      process.exit(1);
    }
  });

program
  .command("end")
  .description("End session and generate a note (Markdown + frontmatter)")
  .action(async () => {
    try {
      await runEnd();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(msg);
      process.exit(1);
    }
  });

const sessionCmd = program
  .command("session")
  .description("Update the active study session (draft file + metadata)");

sessionCmd
  .command("add-reference")
  .description("Add a reference; updates session JSON and the draft References section")
  .option("--label <text>", "Label for the reference")
  .option("--path <path>", "Source file path")
  .option("--line-start <n>", "Start line number")
  .option("--line-end <n>", "End line number")
  .option("--snippet <text>", "Code or excerpt text")
  .option("--language <lang>", "Optional language identifier for Markdown code fences (e.g. swift, typescript)")
  .option("--snippet-file <path>", "Read snippet from file (instead of --snippet)")
  .action(
    async (opts: {
      label?: string;
      path?: string;
      lineStart?: string;
      lineEnd?: string;
      snippet?: string;
      snippetFile?: string;
      language?: string;
    }) => {
      try {
        let snippet = opts.snippet;
        if (opts.snippetFile !== undefined) {
          const { readFile } = await import("node:fs/promises");
          snippet = await readFile(opts.snippetFile, "utf8");
        }
        await runSessionAddReference({
          label: opts.label,
          path: opts.path,
          lineStart: opts.lineStart,
          lineEnd: opts.lineEnd,
          snippet,
          language: opts.language,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(msg);
        process.exit(1);
      }
    }
  );

sessionCmd
  .command("set-metadata")
  .description("Merge JSON metadata into the active session")
  .requiredOption(
    "--json <object>",
    'Metadata object as JSON string, e.g. \'{"language":"swift"}\''
  )
  .option("--replace", "Replace metadata instead of merging", false)
  .action(async (opts: { json: string; replace?: boolean }) => {
    try {
      await runSessionSetMetadata({
        json: opts.json,
        replace: opts.replace === true,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(msg);
      process.exit(1);
    }
  });

sessionCmd
  .command("patch-section")
  .description("Replace explanation, summary, or key_concepts body in the draft")
  .requiredOption(
    "--section <name>",
    "One of: explanation, summary, key_concepts"
  )
  .option("--text <markdown>", "New section body")
  .option("--file <path>", "Read new section body from file")
  .action(
    async (opts: { section: string; text?: string; file?: string }) => {
      try {
        await runSessionPatchSection(opts);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(msg);
        process.exit(1);
      }
    }
  );

sessionCmd
  .command("append-section")
  .description("Append Markdown to explanation, summary, or key_concepts")
  .requiredOption("--section <name>", "explanation | summary | key_concepts")
  .option("--text <markdown>", "Text to append")
  .option("--file <path>", "Read text to append from file")
  .action(
    async (opts: { section: string; text?: string; file?: string }) => {
      try {
        await runSessionAppendSection(opts);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(msg);
        process.exit(1);
      }
    }
  );

program.parse();
