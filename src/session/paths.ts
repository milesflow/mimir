import path from "node:path";

import { getConfigDir } from "../config/paths.js";

export function getActiveSessionPath(): string {
  return path.join(getConfigDir(), "active-session.json");
}
