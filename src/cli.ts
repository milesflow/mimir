#!/usr/bin/env node
import { Command } from "commander";

import { runInit } from "./commands/init.js";

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
  .action(() => {
    console.log("mimir start — coming soon: open a study session.");
  });

program
  .command("status")
  .description("Show the active session")
  .action(() => {
    console.log("mimir status — coming soon: show active session.");
  });

program
  .command("end")
  .description("End session and generate a note (Markdown + frontmatter)")
  .action(() => {
    console.log("mimir end — coming soon: write structured note.");
  });

program.parse();
