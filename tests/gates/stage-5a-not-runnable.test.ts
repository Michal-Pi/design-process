// tests/gates/stage-5a-not-runnable.test.ts
// Tests for stage-5a gate hardcoded not_runnable behavior.
// GATE-07 + GATE-08 codex §16 BLOCKER fix — must work from day one.

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES = resolve(ROOT, "tests/fixtures/design-dirs");

// @ts-ignore TS7016: no declaration for .mjs script
const stage5aModule: any = await import("../../assets/scripts/gates/stage-5a.mjs");

const { runStage5aGate } = stage5aModule;

describe("stage-5a gate: not_runnable when interactions absent", () => {
  it("exports runStage5aGate as a function", () => {
    expect(typeof runStage5aGate).toBe("function");
  });

  it("returns not_runnable when interactions/ dir does not exist", async () => {
    const noInteractionsDir = resolve(FIXTURES, "no-interactions-dir");
    const result = await runStage5aGate(noInteractionsDir);
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("stage-4-artifacts-absent");
  });

  it("returns not_runnable when interactions/ dir exists but is empty", async () => {
    const emptyInteractions = resolve(FIXTURES, "empty-interactions");
    const result = await runStage5aGate(emptyInteractions);
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("stage-4-artifacts-absent");
  });

  it("returns non-not_runnable result when interactions/ contains ≥1 file", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runStage5aGate(withInteractions);
    expect(result.kind).not.toBe("not_runnable");
  });

  it("returns pass with evidence inferred when interactions/ has files", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runStage5aGate(withInteractions);
    expect(result.kind).toBe("pass");
    expect(result.evidence).toBe("inferred");
  });

  it("returns empty findings array when pass", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runStage5aGate(withInteractions);
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.findings).toHaveLength(0);
  });
});
