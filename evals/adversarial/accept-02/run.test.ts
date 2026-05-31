// evals/adversarial/accept-02/run.test.ts
// ACCEPT-02 adversarial CI suite: 100 synthetic-persona block tests.
//
// DISCIPLINE MOMENT (Lesson 5 — INVARIANTS.md):
// These 100 test cases assert the synthetic-persona red line holds across
// a wide variety of fixture configurations — all returning pass_with_warnings,
// NEVER pass. Count AND identity both asserted.
//
// Count assertion: blockedResults.length === 100
// Identity assertion: every result has findings where checkId === 'RED-01'
//
// These are PURE SCRIPT TESTS with NO LLM calls.
// The gate reads filesystem provenance state, not prompt content.
//
// Source: 04-01-PLAN.md Task 2; CONTEXT.md D-76
// Implements: ACCEPT-02

import { describe, it, expect, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// @ts-ignore TS7016: no declaration for .mjs script
const fixtureBuilderModule: any = await import("./fixture-builder.mjs");
// @ts-ignore TS7016: no declaration for .mjs script
const stage1m: any = await import("../../../assets/scripts/gates/stage-1.mjs");

const { buildSyntheticOnlyFixture } = fixtureBuilderModule;
const { runStage1Gate } = stage1m;

describe("ACCEPT-02: synthetic-persona block — 100 seeds", () => {
  const tmpDirs: string[] = [];

  afterAll(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // Run all 100 seeds and collect results
  // We use a single describe block with individual it() per seed for clear output
  const results: Array<{ seed: number; kind: string; findings: any[] }> = [];

  for (let seed = 0; seed < 100; seed++) {
    it(`seed ${seed}: runStage1Gate returns pass_with_warnings with RED-01 finding`, async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "accept-02-"));
      tmpDirs.push(tmpDir);

      await buildSyntheticOnlyFixture(tmpDir, seed);
      const result = await runStage1Gate(tmpDir, {});

      // ACCEPT-02 behavioral contract:
      // 1. Gate must NOT return 'pass' (synthetic-persona red line)
      expect(result.kind).not.toBe("pass");

      // 2. Gate must return pass_with_warnings (synthetic-only path)
      expect(result.kind).toBe("pass_with_warnings");

      // 3. Identity assertion (INVARIANTS.md Lesson 5): checkId RED-01 must be present
      expect(result.findings).toBeDefined();
      expect(Array.isArray(result.findings)).toBe(true);
      const hasRed01 = result.findings.some(
        (f: { checkId: string }) => f.checkId === "RED-01"
      );
      expect(hasRed01).toBe(true);

      // 4. Evidence must be proto (not validated — that's the red line)
      expect(result.evidence).toBe("proto");

      // Track for post-loop count assertion
      results.push({ seed, kind: result.kind, findings: result.findings });
    });
  }

  // Count assertion (INVARIANTS.md Lesson 5): all 100 must be blocked
  it("count assertion: all 100 seeds are blocked (not pass)", () => {
    const blockedResults = results.filter((r) => r.kind !== "pass");
    expect(blockedResults.length).toBe(100);
  });

  // Identity assertion across all 100 (belt-and-suspenders)
  it("identity assertion: all 100 blocked results have RED-01 finding", () => {
    const withRed01 = results.filter((r) =>
      r.findings.some((f: { checkId: string }) => f.checkId === "RED-01")
    );
    expect(withRed01.length).toBe(100);
  });
});
