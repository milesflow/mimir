import { homedir } from "node:os";
import path from "node:path";

/** Global config directory (Unix-style: ~/.config/mimir). */
export function getConfigDir(): string {
  return path.join(homedir(), ".config", "mimir");
}

export function getConfigFilePath(): string {
  return path.join(getConfigDir(), "config.json");
}
