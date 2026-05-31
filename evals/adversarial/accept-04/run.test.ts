// evals/adversarial/accept-04/run.test.ts
// ACCEPT-04 adversarial CI suite: 100 hi-fi-without-state-maps refusal tests.
//
// DISCIPLINE MOMENT (Lesson 1 + Lesson 5 — INVARIANTS.md):
// These 100 test cases assert Stage 5a refuses to run when design/interactions/
// is absent or contains zero .spec.md files.
//
// Count assertion: all 100 seeds return not_runnable
// Identity assertion (semantic): every result has reason === 'stage-4-artifacts-absent'
//
// CRITICAL (Lesson 1): not_runnable results have NO findings field
// (GateResult schema additionalProperties:false). Assert kind + reason ONLY.
// Do NOT attempt to read result.findings on a not_runnable result.
//
// These are PURE SCRIPT TESTS with NO LLM calls.
//
// Source: 04-01-PLAN.md Task 2; CONTEXT.md D-76; GATE-08
// Implements: ACCEPT-04

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// @ts-ignore TS7016: no declaration for .mjs script
const fixtureBuilderModule: any = await import("./fixture-builder.mjs");
// @ts-ignore TS7016: no declaration for .mjs script
const stage5am: any = await import("../../../assets/scripts/gates/stage-5a.mjs");

const { buildHiFiWithoutStateMapsFixture } = fixtureBuilderModule;
const { runStage5aGate } = stage5am;

describe("ACCEPT-04: hi-fi-without-state-maps refusal — 100 seeds", () => {
  let baseDir: string;
  const fixtureDirs: string[] = [];

  beforeAll(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "accept-04-"));
    // Build all 100 fixture dirs upfront
    for (let seed = 0; seed < 100; seed++) {
      const dir = join(baseDir, `seed-${seed}`);
      await buildHiFiWithoutStateMapsFixture(dir, seed);
      fixtureDirs.push(dir);
    }
  });

  afterAll(async () => {
    if (baseDir) {
      await rm(baseDir, { recursive: true, force: true });
    }
  });

  const results: Array<{ seed: number; kind: string; reason: string }> = [];

  for (let seed = 0; seed < 100; seed++) {
    it(`seed ${seed}: runStage5aGate returns not_runnable with stage-4-artifacts-absent`, async () => {
      const result = await runStage5aGate(fixtureDirs[seed]);

      // ACCEPT-04 behavioral contract (GATE-08):
      // 1. Must return not_runnable (interactions/ absent or has 0 .spec.md files)
      expect(result.kind).toBe("not_runnable");

      // 2. Identity assertion (Lesson 5): reason must be 'stage-4-artifacts-absent'
      expect(result.reason).toBe("stage-4-artifacts-absent");

      // 3. not_runnable MUST NOT have a findings field (Lesson 1 — schema constraint)
      expect("findings" in result).toBe(false);

      // RED LINE: stage 5a must never run without stage 4 artifacts
      if (result.kind !== "not_runnable" || result.reason !== "stage-4-artifacts-absent") {
        throw new Error(
          `ACCEPT-04 RED LINE BREACH at seed ${seed}: ` +
          `got kind=${result.kind} reason=${result.reason} — ` +
          `hi-fi-without-state-maps should always return not_runnable/stage-4-artifacts-absent`
        );
      }

      results.push({ seed, kind: result.kind, reason: result.reason });
    });
  }

  // Count assertion (INVARIANTS.md Lesson 5): all 100 must be not_runnable
  it("count assertion: all 100 seeds return not_runnable (stage-4-artifacts-absent)", () => {
    const notRunnableResults = results.filter(
      (r) => r.kind === "not_runnable" && r.reason === "stage-4-artifacts-absent"
    );
    expect(notRunnableResults.length).toBe(100);
  });

  // Semantic identity assertion across all 100
  it("identity assertion: all 100 results carry stage-4-artifacts-absent reason", () => {
    const withCorrectReason = results.filter(
      (r) => r.reason === "stage-4-artifacts-absent"
    );
    expect(withCorrectReason.length).toBe(100);
  });
});
