import { randomUUID } from "node:crypto";
import process from "node:process";

import { readConfig } from "../config/io.js";
import {
  activeSessionExists,
  readActiveSession,
  writeActiveSession,
} from "../session/io.js";
import type { ActiveSession } from "../session/schema.js";

export type StartOptions = {
  topic: string;
  recordCwd: boolean;
};

export async function runStart(options: StartOptions): Promise<void> {
  const topic = options.topic.trim();
  if (!topic) {
    throw new Error('Option "--topic" is required and must not be empty.');
  }

  await readConfig();

  if (await activeSessionExists()) {
    await readActiveSession();
    throw new Error(
      "A study session is already active. Run `mimir status` or `mimir end` first."
    );
  }

  const session: ActiveSession = {
    id: randomUUID(),
    startedAt: new Date().toISOString(),
    topic,
  };
  if (options.recordCwd) {
    session.cwd = process.cwd();
  }

  await writeActiveSession(session);

  console.log("Study session started.");
  console.log(`Session id: ${session.id}`);
  console.log(`Topic: ${session.topic}`);
}
