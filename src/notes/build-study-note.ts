import type { ActiveSession } from "../session/schema.js";

function slugTopic(topic: string, maxLen = 50): string {
  const s = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return s.length > 0 ? s : "study";
}

function yamlDoubleQuoted(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

export type BuildStudyNoteInput = {
  session: ActiveSession;
  endedAt: string;
  mimirVersion: string;
};

export type BuildStudyNoteResult = {
  filename: string;
  contents: string;
};

/** Published note filename (same rule for draft-finalized and legacy notes). */
export function buildPublishedFilename(
  session: Pick<BuildStudyNoteInput["session"], "id" | "topic">,
  endedAt: string
): string {
  const datePrefix = endedAt.slice(0, 10);
  const shortId = session.id.replace(/-/g, "").slice(0, 8);
  const slug = slugTopic(session.topic);
  return `${datePrefix}-${slug}-${shortId}.md`;
}

/**
 * Builds Markdown note filename and body (YAML frontmatter + section template).
 */
export function buildStudyNote(input: BuildStudyNoteInput): BuildStudyNoteResult {
  const { session, endedAt, mimirVersion } = input;
  const filename = buildPublishedFilename(session, endedAt);

  const lines: string[] = ["---"];
  lines.push(`mimir_session_id: ${yamlDoubleQuoted(session.id)}`);
  lines.push(`started_at: ${yamlDoubleQuoted(session.startedAt)}`);
  lines.push(`ended_at: ${yamlDoubleQuoted(endedAt)}`);
  lines.push(`topic: ${yamlDoubleQuoted(session.topic)}`);
  lines.push(`mimir_version: ${yamlDoubleQuoted(mimirVersion)}`);
  if (session.cwd !== undefined) {
    lines.push(`cwd: ${yamlDoubleQuoted(session.cwd)}`);
  }
  lines.push("---", "");
  lines.push("## Initial question", "", session.topic, "");
  lines.push(
    "## Explanation",
    "",
    "_Fill in after your study session._",
    ""
  );
  lines.push("## Summary", "", "_Fill in after your study session._", "");
  lines.push("## Key concepts", "", "_Fill in after your study session._", "");

  return { filename, contents: lines.join("\n") };
}
