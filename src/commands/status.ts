import {
  activeSessionExists,
  readActiveSession,
} from "../session/io.js";

export async function runStatus(): Promise<void> {
  if (!(await activeSessionExists())) {
    console.log("No active study session.");
    return;
  }

  const session = await readActiveSession();

  console.log("Active study session");
  console.log(`  id:         ${session.id}`);
  console.log(`  startedAt:  ${session.startedAt}`);
  console.log(`  topic:      ${session.topic}`);
  if (session.cwd !== undefined) {
    console.log(`  cwd:        ${session.cwd}`);
  }
}
