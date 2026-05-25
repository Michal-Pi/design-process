// evals/adversarial/worst-provenance/run.test.ts
// worstProvenance propagation test (D-50, D-38, OF-02).
//
// Tests that:
// 1. Stage 1 gate on mixed-persona fixture (2 synthetic + 1 validated) → pass_with_warnings
// 2. frontmatter-validate --check-worst-provenance on synthesis.md with worstProvenance:generated → valid
// 3. Same check on artifact with worstProvenance removed → invalid (exits with error)
//
// These are PURE SCRIPT TESTS with NO LLM calls.
//
// Source: CONTEXT.md D-38, D-50, OF-02
// Implements: RED-04, worstProvenance propagation invariant

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(__dirname, "fixture/design");

// @ts-ignore TS7016: no declaration for .mjs script
const stage1m: any = await import("../../../assets/scripts/gates/stage-1.mjs");
// @ts-ignore TS7016: no declaration for .mjs script
const fmValidateModule: any = await import(
  "../../../assets/scripts/frontmatter-validate.mjs"
);

const { runStage1Gate } = stage1m;
const { checkWorstProvenance } = fmValidateModule;

describe("worstProvenance propagation", () => {
  describe("Stage 1 gate on mixed-persona fixture", () => {
    it("returns pass_with_warnings (not pass/validated) for fixture with 2 synthetic + 1 validated persona", async () => {
      const result = await runStage1Gate(FIXTURE_DIR, {});
      // Mixed provenances with no interviews → pass_with_warnings, evidence:'proto'
      // The validated persona alone (without non-empty interviews/) is insufficient for VALIDATED grade.
      expect(result.kind).toBe("pass_with_warnings");
      expect(result.evidence).toBe("proto");
    });

    it("does NOT return pass/validated because interviews/ is absent", async () => {
      const result = await runStage1Gate(FIXTURE_DIR, {});
      // Even though one persona is validated, interviews/ must be non-empty for VALIDATED grade
      expect(result.kind).not.toBe("pass");
      if (result.kind === "pass" && result.evidence === "validated") {
        throw new Error(
          "RED LINE BREACH: gate returned pass/validated without a non-empty interviews/ directory"
        );
      }
    });
  });

  describe("checkWorstProvenance on synthesis.md with worstProvenance:generated", () => {
    it("returns valid:true when worstProvenance:generated is declared and 2 synthetic personas are cited", async () => {
      const synthesisPath = resolve(FIXTURE_DIR, "research/synthesis.md");
      const result = await checkWorstProvenance(synthesisPath, FIXTURE_DIR);
      expect(result.valid).toBe(true);
    });

    it("computedWorstProvenance is 'generated' for 2 synthetic + 1 validated", async () => {
      const synthesisPath = resolve(FIXTURE_DIR, "research/synthesis.md");
      const result = await checkWorstProvenance(synthesisPath, FIXTURE_DIR);
      // valid:true path still exposes computedWorstProvenance
      expect(result.computedWorstProvenance).toBe("generated");
    });
  });

  describe("checkWorstProvenance detects missing worstProvenance field", () => {
    it("returns valid:false when synthesis cites generated persona but has no worstProvenance field", async () => {
      // Create an in-memory artifact without worstProvenance and test directly
      // by using the test fixture from tests/fixtures/worst-provenance/
      const missingWpPath = resolve(
        __dirname,
        "../../../tests/fixtures/worst-provenance/artifact-missing-worst-provenance.md"
      );
      const missingWpBase = resolve(
        __dirname,
        "../../../tests/fixtures/worst-provenance"
      );
      const result = await checkWorstProvenance(missingWpPath, missingWpBase);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/worstProvenance/i);
    });
  });
});
