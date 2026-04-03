/** Fixed study-note section keys (stable API for CLI + MCP). */
export const SECTION_KEYS = [
  "initial_question",
  "references",
  "explanation",
  "summary",
  "key_concepts",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_HEADING: Record<SectionKey, string> = {
  initial_question: "Initial question",
  references: "References",
  explanation: "Explanation",
  summary: "Summary",
  key_concepts: "Key concepts",
};

/** Sections agents may replace entirely via patch. */
export const PATCHABLE_SECTIONS: ReadonlySet<SectionKey> = new Set([
  "explanation",
  "summary",
  "key_concepts",
]);

/** Sections agents may append to. */
export const APPENDABLE_SECTIONS: ReadonlySet<SectionKey> = new Set([
  "explanation",
  "summary",
  "key_concepts",
]);

export function isSectionKey(s: string): s is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(s);
}
