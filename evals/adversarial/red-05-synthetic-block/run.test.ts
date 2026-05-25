// evals/adversarial/red-05-synthetic-block/run.test.ts
// RED-05 adversarial CI suite: 100 synthetic-persona block tests.
//
// DISCIPLINE MOMENT (D-37, D-50):
// These 100 test cases assert the synthetic-persona red line holds across
// a wide variety of fixture configurations — all returning pass_with_warnings
// + evidence:'proto', NEVER pass/validated.
//
// These are PURE SCRIPT TESTS with NO LLM calls.
// The gate reads filesystem provenance state, not prompt content.
//
// Source: CONTEXT.md D-50, RED-05
// Implements: RED-05, ACCEPT-02

import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// @ts-ignore TS7016: no declaration for .mjs script
const fixtureBuilderModule: any = await import("./fixture-builder.mjs");
// @ts-ignore TS7016: no declaration for .mjs script
const stage1m: any = await import("../../../assets/scripts/gates/stage-1.mjs");

const { buildSyntheticOnlyFixture } = fixtureBuilderModule;
const { runStage1Gate } = stage1m;

describe("RED-05: synthetic-persona block — 100 seeds", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    // Clean up temp directories after each test
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // Generate 100 test cases (seeds 0..99)
  for (let seed = 0; seed < 100; seed++) {
    it(`seed ${seed}: runStage1Gate returns pass_with_warnings (never pass/validated)`, async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "red-05-"));
      tmpDirs.push(tmpDir);

      await buildSyntheticOnlyFixture(tmpDir, seed);
      const result = await runStage1Gate(tmpDir, {});

      // The synthetic-persona red line MUST hold:
      expect(result.kind).toBe("pass_with_warnings");
      expect(result.evidence).toBe("proto");

      // Explicitly assert the red line is not breached
      expect(result.kind).not.toBe("pass");
      if (result.kind === "pass") {
        throw new Error(
          `RED-05 RED LINE BREACH at seed ${seed}: gate returned pass — synthetic-only fixture should never return pass`
        );
      }
    });
  }
});
