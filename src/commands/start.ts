import { readActiveSession } from "../session/io.js";
import { createSessionWithDraft } from "../session/session-draft-service.js";

export type StartOptions = {
  topic: string;
  recordCwd: boolean;
};

export async function runStart(options: StartOptions): Promise<void> {
  await createSessionWithDraft(options);
  const session = await readActiveSession();

  console.log("Study session started.");
  console.log(`Session id: ${session.id}`);
  console.log(`Topic: ${session.topic}`);
  if (session.draftPath !== undefined) {
    console.log(`Draft: ${session.draftPath}`);
  }
}
