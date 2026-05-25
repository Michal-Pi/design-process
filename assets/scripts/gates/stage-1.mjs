// assets/scripts/gates/stage-1.mjs
// Stage 1 (Research / Personas) gate — real provenance-checking business logic.
// Phase 2: replaces the Phase 1 skeleton with full RED-01..04 enforcement.
//
// Source: CONTEXT.md D-37, D-38; PLAN.md T-02-01-A
// Implements: GATE-01, RED-01, RED-02, RED-03, RED-04, D-37, D-38

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import { globby } from "globby";

/**
 * Provenance severity order: most conservative (worst) first.
 * missing > generated > inferred > validated
 * Lower index = worse provenance.
 */
const PROVENANCE_ORDER = ["missing", "generated", "inferred", "validated"];

/**
 * Compute the worst (most conservative) provenance from an array of provenance values.
 * Precedence: 'missing' > 'generated' > 'inferred' > 'validated'
 * (worst first — missing is most conservative, validated is best).
 *
 * @param {string[]} provenances - Array of provenance values
 * @returns {string} The worst (most conservative) provenance value
 */
export function computeWorstProvenance(provenances) {
  let worstIdx = PROVENANCE_ORDER.indexOf("validated"); // start at best

  for (const p of provenances) {
    const idx = PROVENANCE_ORDER.indexOf(p);
    // Unknown provenance values are treated as 'missing' (most conservative)
    const effectiveIdx = idx === -1 ? 0 : idx;
    if (effectiveIdx < worstIdx) {
      worstIdx = effectiveIdx;
    }
  }

  return PROVENANCE_ORDER[worstIdx] ?? "missing";
}

/**
 * Read a persona file and extract its provenance from YAML frontmatter.
 * If no YAML frontmatter is found, returns 'missing' (most conservative).
 *
 * @param {string} filePath - Absolute path to the .persona.json file
 * @returns {Promise<string>} Provenance value
 */
async function readPersonaProvenance(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = matter(raw);
    const provenance = parsed.data?.provenance;
    if (!provenance || !PROVENANCE_ORDER.includes(provenance)) {
      // No frontmatter or unrecognized provenance → treat as missing (most conservative)
      return "missing";
    }
    return provenance;
  } catch {
    return "missing";
  }
}

/**
 * Run the Stage 1 gate against a design directory.
 *
 * Gate logic (D-37):
 * 1. If no *.persona.json files found → not_runnable
 * 2. If all personas have provenance:'generated' or 'missing' → pass_with_warnings, evidence:'proto'
 *    - Add WARNING finding 1-provenance-001 (synthetic-persona red line)
 *    - If ASSUMPTIONS.md is absent → add ERROR finding 1-provenance-002 (RED-03)
 * 3. If at least one persona has provenance:'validated' AND interviews/ is non-empty
 *    → pass, evidence:'validated'
 * 4. Otherwise → pass_with_warnings, evidence:'proto'
 *
 * @param {string} designDir - Path to the design directory (containing research/personas/)
 * @param {object} [config] - Optional configuration (reserved; currently unused)
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage1Gate(designDir, config = {}) {
  // Step 1: Glob for persona files
  const personaFiles = await globby("research/personas/*.persona.json", {
    cwd: designDir,
    absolute: true,
  });

  if (personaFiles.length === 0) {
    return {
      kind: "not_runnable",
      reason: "no-personas-found",
    };
  }

  // Step 2: Read provenance from each persona file
  const provenances = await Promise.all(
    personaFiles.map((f) => readPersonaProvenance(f))
  );

  // Step 3: Check whether interviews directory exists and is non-empty
  const interviewsDir = join(designDir, "research", "interviews");
  const interviewsExist =
    existsSync(interviewsDir) &&
    readdirSync(interviewsDir).filter((f) => !f.startsWith(".")).length > 0;

  // Step 4: Determine if all personas are synthetic (generated or missing)
  const allSynthetic = provenances.every(
    (p) => p === "generated" || p === "missing"
  );

  if (allSynthetic) {
    // RED-01: All personas are synthetic — hard-block VALIDATED grade
    const findings = /** @type {Array<{id: string, severity: string, message: string}>} */ ([]);

    findings.push({
      id: "1-provenance-001",
      severity: "WARNING",
      message:
        "All personas synthetic — evidence:VALIDATED grade blocked (RED-01). " +
        "Real user interviews are required for VALIDATED grade.",
    });

    // RED-03: ASSUMPTIONS.md is required when all personas are synthetic
    const assumptionsPath = join(designDir, "ASSUMPTIONS.md");
    if (!existsSync(assumptionsPath)) {
      findings.push({
        id: "1-provenance-002",
        severity: "ERROR",
        message:
          "ASSUMPTIONS.md required when all personas are synthetic (RED-03). " +
          "Document every persona claim as an item to validate.",
      });
    }

    return {
      kind: "pass_with_warnings",
      evidence: "proto",
      findings,
    };
  }

  // Step 5: Check for at least one validated persona
  const hasValidatedPersona = provenances.some((p) => p === "validated");

  if (hasValidatedPersona && interviewsExist) {
    // Full VALIDATED grade: validated persona + non-empty interviews
    return {
      kind: "pass",
      evidence: "validated",
      findings: [],
    };
  }

  // Step 6: Mixed provenances but no VALIDATED conditions met → proto-grade
  return {
    kind: "pass_with_warnings",
    evidence: "proto",
    findings: [],
  };
}
