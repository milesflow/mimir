import path from "node:path";

export const MAX_REFERENCES = 50;
export const MAX_SNIPPET_CHARS = 32_000;
export const MAX_METADATA_KEYS = 40;

export type SessionReference = {
  id: string;
  label?: string;
  path?: string;
  lineStart?: number;
  lineEnd?: number;
  snippet?: string;
  /** Optional language identifier for code fences (e.g. "swift", "typescript"). */
  language?: string;
};

export type ActiveSession = {
  id: string;
  startedAt: string;
  topic: string;
  cwd?: string;
  /** Draft file; absent on legacy sessions created before drafts existed. */
  draftPath?: string;
  references: SessionReference[];
  metadata: Record<string, unknown>;
};

export class SessionValidationError extends Error {
  override name = "SessionValidationError";
  constructor(message: string) {
    super(message);
  }
}

function parseReference(raw: unknown, index: number): SessionReference {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new SessionValidationError(`references[${index}] must be an object.`);
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.trim() === "") {
    throw new SessionValidationError(
      `references[${index}] must include a non-empty string "id".`
    );
  }
  const ref: SessionReference = { id: o.id.trim() };
  if (o.label !== undefined) {
    if (typeof o.label !== "string") {
      throw new SessionValidationError(`references[${index}].label must be a string.`);
    }
    ref.label = o.label;
  }
  if (o.path !== undefined) {
    if (typeof o.path !== "string") {
      throw new SessionValidationError(`references[${index}].path must be a string.`);
    }
    ref.path = o.path;
  }
  if (o.lineStart !== undefined) {
    if (typeof o.lineStart !== "number" || !Number.isInteger(o.lineStart) || o.lineStart < 0) {
      throw new SessionValidationError(
        `references[${index}].lineStart must be a non-negative integer.`
      );
    }
    ref.lineStart = o.lineStart;
  }
  if (o.lineEnd !== undefined) {
    if (typeof o.lineEnd !== "number" || !Number.isInteger(o.lineEnd) || o.lineEnd < 0) {
      throw new SessionValidationError(
        `references[${index}].lineEnd must be a non-negative integer.`
      );
    }
    ref.lineEnd = o.lineEnd;
  }
  if (o.snippet !== undefined) {
    if (typeof o.snippet !== "string") {
      throw new SessionValidationError(`references[${index}].snippet must be a string.`);
    }
    ref.snippet = o.snippet;
  }
  if (o.language !== undefined) {
    if (typeof o.language !== "string") {
      throw new SessionValidationError(`references[${index}].language must be a string.`);
    }
    const lang = o.language.trim();
    if (lang.length === 0) {
      throw new SessionValidationError(`references[${index}].language must not be empty.`);
    }
    // Keep it as a raw language id; consumers decide how to format it in Markdown.
    ref.language = lang;
  }
  return ref;
}

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (raw === undefined) return {};
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new SessionValidationError('"metadata" must be a JSON object.');
  }
  const o = raw as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length > MAX_METADATA_KEYS) {
    throw new SessionValidationError(
      `Too many metadata keys (max ${MAX_METADATA_KEYS}).`
    );
  }
  for (const k of keys) {
    if (k.trim() === "") {
      throw new SessionValidationError("Metadata keys must be non-empty strings.");
    }
  }
  return { ...o };
}

export function parseActiveSession(raw: unknown): ActiveSession {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new SessionValidationError("Session file must contain a JSON object.");
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== "string" || obj.id.trim() === "") {
    throw new SessionValidationError('Session must include a non-empty string "id".');
  }
  if (typeof obj.startedAt !== "string" || obj.startedAt.trim() === "") {
    throw new SessionValidationError(
      'Session must include a non-empty string "startedAt".'
    );
  }
  if (typeof obj.topic !== "string" || obj.topic.trim() === "") {
    throw new SessionValidationError(
      'Session must include a non-empty string "topic".'
    );
  }

  const session: ActiveSession = {
    id: obj.id.trim(),
    startedAt: obj.startedAt.trim(),
    topic: obj.topic.trim(),
    references: [],
    metadata: {},
  };

  if (obj.cwd !== undefined) {
    if (typeof obj.cwd !== "string" || obj.cwd.trim() === "") {
      throw new SessionValidationError(
        'If present, "cwd" must be a non-empty string.'
      );
    }
    const cwd = obj.cwd.trim();
    if (!path.isAbsolute(cwd)) {
      throw new SessionValidationError(
        'If present, "cwd" must be an absolute path.'
      );
    }
    session.cwd = cwd;
  }

  if (obj.draftPath !== undefined) {
    if (typeof obj.draftPath !== "string" || obj.draftPath.trim() === "") {
      throw new SessionValidationError(
        'If present, "draftPath" must be a non-empty string.'
      );
    }
    const dp = obj.draftPath.trim();
    if (!path.isAbsolute(dp)) {
      throw new SessionValidationError(
        'If present, "draftPath" must be an absolute path.'
      );
    }
    session.draftPath = dp;
  }

  if (obj.references !== undefined) {
    if (!Array.isArray(obj.references)) {
      throw new SessionValidationError('"references" must be an array.');
    }
    if (obj.references.length > MAX_REFERENCES) {
      throw new SessionValidationError(`Too many references (max ${MAX_REFERENCES}).`);
    }
    session.references = obj.references.map((r, i) => parseReference(r, i));
  }

  if (obj.metadata !== undefined) {
    session.metadata = parseMetadata(obj.metadata);
  }

  return session;
}
