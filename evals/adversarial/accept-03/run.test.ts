// evals/adversarial/accept-03/run.test.ts
// ACCEPT-03 adversarial CI suite: 100 styled-wireframe rejection tests.
//
// DISCIPLINE MOMENT (Lesson 5 — INVARIANTS.md):
// These 100 test cases assert the FID-03 fidelity cap rejects styled wireframes
// across 100 distinct violation profiles.
//
// Count assertion: all 100 seeds return not_runnable
// Identity assertion (semantic): every result has reason === 'fidelity-cap-violation-FID-03'
//
// NOTE: not_runnable results have NO findings field (additionalProperties:false in schema).
// We assert kind + reason, NOT findings.checkId (see Lesson 1 — GateResult discriminated union).
//
// These are PURE SCRIPT TESTS with NO LLM calls.
//
// Source: 04-01-PLAN.md Task 2; CONTEXT.md D-76
// Implements: ACCEPT-03

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// @ts-ignore TS7016: no declaration for .mjs script
const fixtureBuilderModule: any = await import("./fixture-builder.mjs");
// @ts-ignore TS7016: no declaration for .mjs script
const stage3m: any = await import("../../../assets/scripts/gates/stage-3.mjs");

const { buildStyledWireframeFixture } = fixtureBuilderModule;
const { runStage3Gate } = stage3m;

describe("ACCEPT-03: styled-wireframe rejection — 100 seeds", () => {
  let baseDir: string;
  const styledDirs: string[] = [];

  beforeAll(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "accept-03-"));
    // Build all 100 styled fixture dirs upfront
    for (let seed = 0; seed < 100; seed++) {
      const dir = join(baseDir, `seed-${seed}`);
      await buildStyledWireframeFixture(dir, seed);
      styledDirs.push(dir);
    }
  });

  afterAll(async () => {
    if (baseDir) {
      await rm(baseDir, { recursive: true, force: true });
    }
  });

  const results: Array<{ seed: number; kind: string; reason: string }> = [];

  for (let seed = 0; seed < 100; seed++) {
    it(`seed ${seed}: runStage3Gate returns not_runnable with fidelity-cap-violation-FID-03`, async () => {
      const result = await runStage3Gate(styledDirs[seed]);

      // ACCEPT-03 behavioral contract:
      // 1. Must return not_runnable (FID-03 fidelity cap triggered)
      expect(result.kind).toBe("not_runnable");

      // 2. Identity assertion: reason must match FID-03 semantic identity
      expect(result.reason).toBe("fidelity-cap-violation-FID-03");

      // 3. not_runnable has NO findings (per GateResult schema — Lesson 1)
      // Do NOT assert findings existence on not_runnable results
      expect("findings" in result).toBe(false);

      // RED LINE: must never return pass
      if (result.kind === "pass") {
        throw new Error(
          `ACCEPT-03 RED LINE BREACH at seed ${seed}: ` +
          `gate returned pass — styled wireframe should always be rejected with FID-03`
        );
      }

      results.push({ seed, kind: result.kind, reason: result.reason });
    });
  }

  // Count assertion (INVARIANTS.md Lesson 5): all 100 must be blocked
  it("count assertion: all 100 seeds are blocked by FID-03", () => {
    const blockedResults = results.filter(
      (r) => r.kind === "not_runnable" && r.reason === "fidelity-cap-violation-FID-03"
    );
    expect(blockedResults.length).toBe(100);
  });

  // Semantic identity assertion across all 100
  it("identity assertion: all 100 results carry fidelity-cap-violation-FID-03 reason", () => {
    const withFid03Reason = results.filter(
      (r) => r.reason === "fidelity-cap-violation-FID-03"
    );
    expect(withFid03Reason.length).toBe(100);
  });
});
