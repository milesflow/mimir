#!/usr/bin/env node
import { Command } from "commander";

import { runEnd } from "./commands/end.js";
import { runInit } from "./commands/init.js";
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
  .action(async (opts: { notesDir?: string }) => {
    try {
      await runInit({ notesDir: opts.notesDir });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(msg);
      process.exit(1);
    }
  });

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

program.parse();
