import path from "node:path";

export type MimirConfig = {
  notesDir: string;
};

export class ConfigValidationError extends Error {
  override name = "ConfigValidationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * Validates parsed JSON and returns config with `notesDir` as an absolute path.
 */
export function parseAndValidateConfig(raw: unknown): MimirConfig {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ConfigValidationError("Config must be a JSON object.");
  }

  const obj = raw as Record<string, unknown>;
  if (typeof obj.notesDir !== "string" || obj.notesDir.trim() === "") {
    throw new ConfigValidationError(
      'Config must include a non-empty string field "notesDir".'
    );
  }

  return { notesDir: path.resolve(obj.notesDir.trim()) };
}
