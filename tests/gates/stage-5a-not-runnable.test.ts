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

  it("returns not_runnable even when interactions/ contains ≥1 file (D-43 v2.0a hard-code)", async () => {
    // D-43: gate is hard-coded not_runnable in v2.0a regardless of interactions content.
    // The FULL gate that promotes to PASS based on real Stage 4 artifacts ships in Phase 3.
    // This asserts the hard-code is in place.
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runStage5aGate(withInteractions);
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("stage-4-artifacts-absent");
  });

  it("not_runnable result has no evidence field (discriminated union shape)", async () => {
    // not_runnable shape: { kind: 'not_runnable', reason: string }
    // pass shape: { kind: 'pass', evidence: string, findings: [] }
    // In v2.0a gate always returns not_runnable — verify shape is correct.
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runStage5aGate(withInteractions);
    expect(result.kind).toBe("not_runnable");
    expect(result.evidence).toBeUndefined();
  });

  it("not_runnable result has no findings field (discriminated union shape)", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runStage5aGate(withInteractions);
    expect(result.kind).toBe("not_runnable");
    expect(result.findings).toBeUndefined();
  });
});
