// evals/adversarial/inferred-disclaimer/fixture-builder.mjs
// Fixture builder for the inferred-disclaimer adversarial CI suite.
//
// Creates a temp dir with design/inferred/research/personas/test.persona.md that has:
//   - YAML frontmatter: provenance:'inferred', inferredDisclaimer, evidence:'INFERRED'
//   - Body WITHOUT the required '> **INFERRED**...' banner
//
// This is the adversarial case: a file that declares provenance:inferred but
// omits the mandatory body disclaimer. frontmatter-validate.mjs Rule A must
// reject it with 'inferred-disclaimer-missing'.
//
// No LLM calls — all content is hardcoded fixture data (INVARIANT-05).
//
// Source: PLAN.md T-03-04-A action block, D-64
// Implements: inferred-disclaimer adversarial suite

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Artifact content with provenance:inferred but MISSING the INFERRED banner */
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

This artifact was reverse-engineered from an existing prototype but the
required INFERRED banner blockquote has been deliberately omitted.

## Demographics

- Age: 30-45
- Role: Product Manager
- Primary goal: Ship features faster

## Jobs-to-be-Done

- Build feature X quickly
- Get team buy-in

Note: This file intentionally lacks the '> **INFERRED** — ...' blockquote banner.
frontmatter-validate.mjs should reject this file with 'inferred-disclaimer-missing'.
`;

/**
 * Build the inferred-disclaimer adversarial fixture directory.
 *
 * Creates:
 *   <tmpDir>/design/inferred/research/personas/test.persona.md
 *
 * The file has provenance:inferred in frontmatter but NO '> **INFERRED**...' body banner.
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
