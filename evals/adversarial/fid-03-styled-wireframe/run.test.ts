// evals/adversarial/fid-03-styled-wireframe/run.test.ts
// FID-03 adversarial CI suite.
//
// DISCIPLINE MOMENT (D-56, FID-03):
// These 40 test cases assert the FID-03 fidelity cap holds across a wide variety
// of styled wireframe configurations:
//   - 20/20 styled fixtures MUST be rejected with { kind:'not_runnable', reason:'fidelity-cap-violation-FID-03' }
//   - 20/20 clean fixtures MUST NOT be rejected for FID-03 (may fail for other reasons)
//
// These are PURE SCRIPT TESTS with NO LLM calls.
// The gate reads filesystem content only.
//
// Source: PLAN.md 03-01 Task B; CONTEXT.md D-56
// Implements: FID-03 adversarial suite

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// @ts-ignore TS7016: no declaration for .mjs script
const fixtureBuilderModule: any = await import("./fixture-builder.mjs");
// @ts-ignore TS7016: no declaration for .mjs script
const stage3m: any = await import("../../../assets/scripts/gates/stage-3.mjs");

const { buildFid03Fixtures } = fixtureBuilderModule;
const { runStage3Gate } = stage3m;

let baseDir: string;
let styledDirs: string[];
let cleanDirs: string[];

beforeAll(async () => {
  // Build all 40 fixtures once before tests run
  baseDir = await mkdtemp(join(tmpdir(), "fid-03-adversarial-"));
  const result = await buildFid03Fixtures(baseDir);
  styledDirs = result.styledDirs;
  cleanDirs = result.cleanDirs;
});

afterAll(async () => {
  if (baseDir) {
    await rm(baseDir, { recursive: true, force: true });
  }
});

describe("FID-03 adversarial: styled wireframes (20/20 must be rejected)", () => {
  for (let i = 0; i < 20; i++) {
    it(`styled fixture ${i}: gate returns not_runnable with reason fidelity-cap-violation-FID-03`, async () => {
      const result = await runStage3Gate(styledDirs[i]);

      expect(result.kind).toBe("not_runnable");
      expect(result.reason).toBe("fidelity-cap-violation-FID-03");

      // Evidence must be present and non-empty
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(result.evidence.length).toBeGreaterThan(0);

      // RED LINE: styled fixture must NEVER return pass
      if (result.kind !== "not_runnable" || result.reason !== "fidelity-cap-violation-FID-03") {
        throw new Error(
          `FID-03 RED LINE BREACH at styled fixture ${i}: ` +
          `got kind=${result.kind} reason=${result.reason} — ` +
          `styled wireframe should always return not_runnable/fidelity-cap-violation-FID-03`
        );
      }
    });
  }
});

describe("FID-03 adversarial: clean wireframes (20/20 must NOT be FID-03-rejected)", () => {
  for (let i = 0; i < 20; i++) {
    it(`clean fixture ${i}: gate does NOT return not_runnable/fidelity-cap-violation-FID-03`, async () => {
      const result = await runStage3Gate(cleanDirs[i]);

      // Clean fixtures may fail for other reasons (count < 3, no CHOICE.md, diversity)
      // but NEVER for FID-03 violation
      const isFid03Rejected =
        result.kind === "not_runnable" && result.reason === "fidelity-cap-violation-FID-03";

      if (isFid03Rejected) {
        throw new Error(
          `FID-03 FALSE POSITIVE at clean fixture ${i}: ` +
          `gate incorrectly rejected a clean wireframe as FID-03 violation. ` +
          `Evidence: ${JSON.stringify(result.evidence)}`
        );
      }

      // Assert: not a FID-03 false positive
      expect(isFid03Rejected).toBe(false);

      // The result must be a valid gate result kind
      expect(["pass", "pass_with_warnings", "failed_after_repair", "not_runnable"]).toContain(
        result.kind
      );

      // If not_runnable, reason must not be FID-03
      if (result.kind === "not_runnable") {
        expect(result.reason).not.toBe("fidelity-cap-violation-FID-03");
      }
    });
  }
});
