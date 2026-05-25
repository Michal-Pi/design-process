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
});
