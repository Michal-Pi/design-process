// tests/adversarial/frontmatter-worst-provenance.test.ts
// Tests for the --check-worst-provenance extension to frontmatter-validate.mjs.
// Enforces D-38: every downstream artifact citing a generated persona
// must carry worstProvenance in its YAML frontmatter.
//
// TDD RED phase — these tests MUST fail before the extension is implemented.
//
// Implements: D-38, RED-04, OF-02

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES = resolve(ROOT, "tests/fixtures/worst-provenance");

// @ts-ignore TS7016: no declaration for .mjs script
const fmValidateModule: any = await import(
  "../../assets/scripts/frontmatter-validate.mjs"
);

const { validateFrontmatter, checkWorstProvenance } = fmValidateModule;

describe("frontmatter-validate --check-worst-provenance", () => {
  it("exports checkWorstProvenance function", () => {
    expect(typeof checkWorstProvenance).toBe("function");
  });

  it("returns { valid: true } for artifact with correct worstProvenance:generated citing a synthetic persona", async () => {
    const artifactPath = resolve(FIXTURES, "artifact-with-worst-provenance.md");
    const result = await checkWorstProvenance(artifactPath, FIXTURES);
    expect(result.valid).toBe(true);
  });

  it("returns { valid: false } for artifact missing worstProvenance field when citing a generated persona", async () => {
    const artifactPath = resolve(
      FIXTURES,
      "artifact-missing-worst-provenance.md"
    );
    const result = await checkWorstProvenance(artifactPath, FIXTURES);
    expect(result.valid).toBe(false);
  });

  it("returns an error message mentioning worstProvenance when validation fails", async () => {
    const artifactPath = resolve(
      FIXTURES,
      "artifact-missing-worst-provenance.md"
    );
    const result = await checkWorstProvenance(artifactPath, FIXTURES);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/worstProvenance/i);
  });

  it("computeWorstProvenance(['generated','generated','validated']) returns 'generated'", async () => {
    // Import computeWorstProvenance from stage-1.mjs (it's imported by frontmatter-validate)
    // @ts-ignore TS7016
    const stage1m: any = await import("../../assets/scripts/gates/stage-1.mjs");
    const { computeWorstProvenance } = stage1m;
    expect(computeWorstProvenance(["generated", "generated", "validated"])).toBe(
      "generated"
    );
  });

  it("computeWorstProvenance(['validated','validated']) returns 'validated'", async () => {
    // @ts-ignore TS7016
    const stage1m: any = await import("../../assets/scripts/gates/stage-1.mjs");
    const { computeWorstProvenance } = stage1m;
    expect(computeWorstProvenance(["validated", "validated"])).toBe("validated");
  });

  it("correct base dir (design/) resolves personas correctly and validates worstProvenance", async () => {
    // Simulate synthesize.md correct invocation: base = design/ (FIXTURES here)
    // artifact cites personas/synth-1.persona.json relative to FIXTURES
    const artifactPath = resolve(FIXTURES, "artifact-with-worst-provenance.md");
    const result = await checkWorstProvenance(artifactPath, FIXTURES);
    expect(result.valid).toBe(true);
  });

  it("incorrect base dir (design/research/) causes persona lookup to fail — validates Finding 3 regression guard", async () => {
    // Simulate the pre-fix bug: passing a sub-directory as base dir so that
    // "personas/synth-1.persona.json" resolves to "FIXTURES/personas/personas/synth-1.persona.json"
    // which does not exist. The validator reads provenance as 'missing' and the computed
    // worstProvenance is 'missing', which is MORE conservative than the declared 'generated'.
    // checkWorstProvenance returns valid:false because declared < computed.
    //
    // This test guards the regression: if the base dir is wrong (too deep), the validator
    // either fails to find the persona files (returns valid:false) or computes wrong provenance.
    const artifactPath = resolve(FIXTURES, "artifact-with-worst-provenance.md");
    // Pass FIXTURES/personas as base — creates the design/research/ → design/research/research/ bug
    const wrongBase = resolve(FIXTURES, "personas");
    const result = await checkWorstProvenance(artifactPath, wrongBase);
    // With wrong base, persona files are not found; provenance defaults to 'missing'
    // Computed worst = 'missing'; declared = 'generated' → declared is LESS conservative → invalid
    expect(result.valid).toBe(false);
  });
});
