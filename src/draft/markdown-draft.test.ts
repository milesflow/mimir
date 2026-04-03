import assert from "node:assert/strict";
import test from "node:test";

import {
  appendSectionBody,
  buildInitialDraftMarkdown,
  parseDraftMarkdown,
  patchSectionBody,
  renderReferencesMarkdown,
} from "./markdown-draft.js";

test("buildInitialDraft then parseDraftMarkdown roundtrip keeps sections", () => {
  const md = buildInitialDraftMarkdown({
    id: "abc",
    startedAt: "2026-01-01T00:00:00.000Z",
    topic: "What is a UIViewController?",
    mimirVersion: "0.1.0",
  });
  const parsed = parseDraftMarkdown(md);
  assert.equal(
    parsed.sections.initial_question.trim(),
    "What is a UIViewController?"
  );
  assert.ok(parsed.sections.references.includes("No references"));
});

test("patchSectionBody replaces explanation only", () => {
  const md = buildInitialDraftMarkdown({
    id: "id",
    startedAt: "2026-01-01T00:00:00.000Z",
    topic: "Q",
    mimirVersion: "0.1.0",
  });
  const next = patchSectionBody(md, "explanation", "First explanation.");
  const parsed = parseDraftMarkdown(next);
  assert.equal(parsed.sections.explanation.trim(), "First explanation.");
  assert.ok(parsed.sections.summary.length === 0);
});

test("appendSectionBody appends to summary", () => {
  const md = buildInitialDraftMarkdown({
    id: "id",
    startedAt: "2026-01-01T00:00:00.000Z",
    topic: "Q",
    mimirVersion: "0.1.0",
  });
  const a = appendSectionBody(md, "summary", "Line A.");
  const b = appendSectionBody(a, "summary", "Line B.");
  const parsed = parseDraftMarkdown(b);
  assert.match(parsed.sections.summary, /Line A/);
  assert.match(parsed.sections.summary, /Line B/);
});

test("renderReferencesMarkdown renders snippet block", () => {
  const text = renderReferencesMarkdown([
    {
      id: "r1",
      label: "VC",
      path: "/App/VC.swift",
      lineStart: 1,
      lineEnd: 10,
      snippet: "class X {}",
    },
  ]);
  assert.match(text, /VC\.swift/);
  assert.match(text, /class X/);
});
