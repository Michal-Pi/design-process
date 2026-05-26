// evals/adversarial/inferred-disclaimer/fixture-builder.mjs
// Fixture builder for the inferred-disclaimer adversarial CI suite.
//
// Creates a temp dir with design/inferred/research/personas/test.persona.md that has:
//   - YAML frontmatter: provenance:'inferred', inferredDisclaimer, evidence:'INFERRED'
//   - Body WITHOUT the required INFERRED banner blockquote
//
// This is the adversarial case: a file that declares provenance:inferred in frontmatter
// but omits the mandatory body disclaimer blockquote. frontmatter-validate.mjs Rule A
// must reject it with 'inferred-disclaimer-missing'.
//
// IMPORTANT: The fixture body must not contain any > **INFERRED** text pattern
// because the Rule A check uses regex />\s*\*\*INFERRED\*\*/i against the body.
//
// No LLM calls — all content is hardcoded fixture data (INVARIANT-05).
//
// Source: PLAN.md T-03-04-A action block, D-64
// Implements: inferred-disclaimer adversarial suite

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Artifact content with provenance:inferred but MISSING the required disclaimer banner.
 * The body deliberately contains no blockquote starting with bold INFERRED text.
 */
const ARTIFACT_WITHOUT_BANNER = `---
artifact: design-doc
stage: 1
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
provenance: inferred
inferredDisclaimer: "INFERRED — validate before treating as ground truth"
evidence: INFERRED
---

# Inferred Persona: Busy Professional

This artifact has the provenance:inferred frontmatter field but deliberately omits
the mandatory body disclaimer. The disclaimer blockquote is absent.

## Demographics

- Age: 30-45
- Role: Product Manager
- Primary goal: Ship features faster

## Jobs-to-be-Done

- Build feature X quickly
- Get team buy-in

## Status

This artifact is incomplete — it is missing the mandatory body disclaimer
that must appear as the first paragraph when provenance is inferred.
The frontmatter-validate.mjs tool should detect this omission.
`;

/**
 * Build the inferred-disclaimer adversarial fixture directory.
 *
 * Creates:
 *   <tmpDir>/design/inferred/research/personas/test.persona.md
 *
 * The file has provenance:inferred in frontmatter but NO disclaimer banner blockquote.
 *
 * @param {string} tmpDir - Temporary directory to build fixture in
 * @returns {Promise<{ personaPath: string }>} Path to the created adversarial fixture
 */
export async function buildInferredDisclaimerFixture(tmpDir) {
  const personasDir = join(
    tmpDir,
    "design",
    "inferred",
    "research",
    "personas"
  );
  await mkdir(personasDir, { recursive: true });

  const personaPath = join(personasDir, "test.persona.md");
  await writeFile(personaPath, ARTIFACT_WITHOUT_BANNER, "utf8");

  return { personaPath };
}
