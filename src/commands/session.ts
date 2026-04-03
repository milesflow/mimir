import { isSectionKey, type SectionKey } from "../draft/layout.js";
import { SessionDraftService } from "../session/session-draft-service.js";

const svc = new SessionDraftService();

function parseOptionalInt(s: string | undefined): number | undefined {
  if (s === undefined || s.trim() === "") return undefined;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export async function runSessionAddReference(opts: {
  label?: string;
  path?: string;
  lineStart?: string;
  lineEnd?: string;
  snippet?: string;
}): Promise<void> {
  const { id } = await svc.addReference({
    label: opts.label,
    path: opts.path,
    lineStart: parseOptionalInt(opts.lineStart),
    lineEnd: parseOptionalInt(opts.lineEnd),
    snippet: opts.snippet,
  });
  console.log(`Reference added (id: ${id}).`);
}

export async function runSessionSetMetadata(opts: {
  json?: string;
  replace?: boolean;
}): Promise<void> {
  if (!opts.json?.trim()) {
    throw new Error('Provide --json \'{"key":"value"}\' for metadata to merge.');
  }
  let patch: Record<string, unknown>;
  try {
    patch = JSON.parse(opts.json) as Record<string, unknown>;
  } catch (e: unknown) {
    throw new Error(`Invalid JSON for --json: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
    throw new Error("--json must be a JSON object.");
  }
  await svc.setMetadata(patch, opts.replace === true);
  console.log("Metadata updated.");
}

export async function runSessionPatchSection(opts: {
  section: string;
  file?: string;
  text?: string;
}): Promise<void> {
  if (!isSectionKey(opts.section)) {
    throw new Error(
      `Invalid section "${opts.section}". Use: explanation, summary, key_concepts.`
    );
  }
  let body: string;
  if (opts.file !== undefined) {
    const { readFile } = await import("node:fs/promises");
    body = await readFile(opts.file, "utf8");
  } else if (opts.text !== undefined) {
    body = opts.text;
  } else {
    throw new Error("Provide --text or --file <path> for the new section body.");
  }
  await svc.patchSection(opts.section as SectionKey, body);
  console.log(`Section "${opts.section}" replaced.`);
}

export async function runSessionAppendSection(opts: {
  section: string;
  file?: string;
  text?: string;
}): Promise<void> {
  if (!isSectionKey(opts.section)) {
    throw new Error(
      `Invalid section "${opts.section}". Use: explanation, summary, key_concepts.`
    );
  }
  let text: string;
  if (opts.file !== undefined) {
    const { readFile } = await import("node:fs/promises");
    text = await readFile(opts.file, "utf8");
  } else if (opts.text !== undefined) {
    text = opts.text;
  } else {
    throw new Error("Provide --text or --file <path> to append.");
  }
  await svc.appendSection(opts.section as SectionKey, text);
  console.log(`Appended to section "${opts.section}".`);
}
