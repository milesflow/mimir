import path from "node:path";

export type ActiveSession = {
  id: string;
  startedAt: string;
  topic: string;
  cwd?: string;
};

export class SessionValidationError extends Error {
  override name = "SessionValidationError";
  constructor(message: string) {
    super(message);
  }
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

  return session;
}
