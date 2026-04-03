import { cancelActiveSessionAndDiscard } from "../session/session-draft-service.js";

export async function runCancel(): Promise<void> {
  const { draftRemoved } = await cancelActiveSessionAndDiscard();
  console.log("Study session canceled.");
  if (draftRemoved) {
    console.log("Draft discarded; no note was published.");
  } else {
    console.log("Active session cleared (no draft on file).");
  }
}
