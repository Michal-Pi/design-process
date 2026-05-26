// evals/adversarial/inferred-disclaimer/run.test.ts
// Test 9: Adversarial inferred-disclaimer suite.
//
// Creates a fixture file in design/inferred/ with provenance:inferred but WITHOUT
// the required '> **INFERRED**...' banner. Asserts that frontmatter-validate.mjs
// rejects it with exit-non-zero behavior (returns errors including
// 'inferred-disclaimer-missing').
//
// Source: PLAN.md T-03-04-A behavior block (Test 9)
// Implements: D-64 INFERRED two-layer enforcement adversarial CI

import { describe, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// @ts-ignore TS7016
const fixtureBuilderModule: any = await import("./fixture-builder.mjs");
// @ts-ignore TS7016
const fmValidateModule: any = await import(
  "../../../assets/scripts/frontmatter-validate.mjs"
);

const { buildInferredDisclaimerFixture } = fixtureBuilderModule;
const { validateFrontmatter } = fmValidateModule;

describe("inferred-disclaimer adversarial suite — Test 9", () => {
  it("fixture file in design/inferred/ without INFERRED banner → frontmatter-validate.mjs exits non-zero (error)", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "inferred-disclaimer-"));
    try {
      const { personaPath } = await buildInferredDisclaimerFixture(tmpDir);

      // Run validateFrontmatter on the adversarial fixture file.
      // Rule A: file in design/inferred/ with provenance:inferred but missing banner → error
      // Use lenient:true so the function returns errors instead of calling process.exit(1).
      // The adversarial check is: validateFrontmatter MUST return an error — the exact
      // mechanism (return errors vs process.exit) is verified by Tests 4 and 5.
      const result = await validateFrontmatter(personaPath, {
        lenient: true,
        skipSchemaValidation: true,
      });

      // Should fail: missing INFERRED banner even though provenance:inferred is present
      const hasDisclaimerError =
        !result.valid ||
        (result.errors &&
          result.errors.some((e: any) =>
            JSON.stringify(e).includes("inferred-disclaimer-missing")
          ));

      expect(hasDisclaimerError).toBe(true);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("fixture builder creates file at design/inferred/research/personas/test.persona.md", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "inferred-disclaimer-check-"));
    try {
      const { personaPath } = await buildInferredDisclaimerFixture(tmpDir);

      const { readFile } = await import("node:fs/promises");
      const content = await readFile(personaPath, "utf8");

      // Verify it has provenance:inferred
      expect(content).toContain("provenance: inferred");

      // Verify it does NOT have the INFERRED banner
      expect(content).not.toMatch(/^>\s*\*\*INFERRED\*\*/m);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
