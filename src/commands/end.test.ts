import assert from "node:assert/strict";
import test from "node:test";

import { SECTION_KEYS, type SectionKey } from "../draft/layout.js";
import { assertMimirPublishGuards } from "./end.js";

function emptySections(): Record<SectionKey, string> {
  return Object.fromEntries(SECTION_KEYS.map((k) => [k, ""])) as Record<
    SectionKey,
    string
  >;
}

test("assertMimirPublishGuards requires at least one non-empty study section", () => {
  const s = emptySections();
  assert.throws(() => assertMimirPublishGuards(s, { tags_technology: "swift" }), /empty/i);
});

test("assertMimirPublishGuards requires tags_* in metadata", () => {
  const s = emptySections();
  s.explanation = "Something.";
  assert.throws(() => assertMimirPublishGuards(s, {}), /tags/i);
});

test("assertMimirPublishGuards passes with body and tags", () => {
  const s = emptySections();
  s.summary = "Done.";
  assert.doesNotThrow(() =>
    assertMimirPublishGuards(s, { tags_technology: "swift" })
  );
});
