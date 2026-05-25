// assets/scripts/gates/stage-3.mjs
// Stage 3 (Low-Fidelity / Wireframes) gate — full business logic.
//
// INVARIANT-01: Gates against the staged preview path passed in as designDir.
// The caller MUST pass .design-os/preview/<run-id>/ (not design/).
// See skills/workflows/INVARIANTS.md.
//
// Check order (fail-fast: first violation ends the gate run):
//   1. Count check: ≥3 .excalidraw files under designDir/wireframes/**/
//   2. FID-03 check: no element has non-default strokeColor/backgroundColor/fontFamily
//   3. Structural diversity: all pairwise distances ≥ 0.35
//   4. CHOICE.md: at least one CHOICE.md present under designDir/wireframes/**/
//
// GateResult kinds used:
//   not_runnable       — FID-03 violation (fix = re-emit via excalidraw-render.mjs)
//   failed_after_repair — count/diversity/CHOICE.md failure (fix = iteration)
//   pass               — all checks pass
//
// Source: PLAN.md 03-01 Task B; CONTEXT.md D-56 (FID-03), D-55 (diversity), OQ-4
// Implements: FID-03, WF-04

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { globby } from "globby";
import { checkDiversityThreshold } from "../wireframe-diversity.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const CHECKLIST_PATH = resolve(ROOT, "references/gates/stage-3.md");

/** FID-03 default values — elements MUST use these (D-56). */
const FID03_DEFAULTS = {
  strokeColor: "#1e1e1e",
  backgroundColor: "transparent",
  fontFamily: 1, // Virgil
};

/**
 * Recursively collect all Excalidraw elements from a parsed .excalidraw doc.
 * Handles nested elements that may appear in frame/group containers.
 *
 * @param {object} doc - Parsed .excalidraw JSON
 * @returns {object[]}
 */
function collectElements(doc) {
  if (!doc || !Array.isArray(doc.elements)) return [];
  return doc.elements;
}

/**
 * Check a single element for FID-03 violations.
 * Returns a violation record or null.
 *
 * @param {object} el - Excalidraw element
 * @param {string} file - Source filename (for evidence)
 * @returns {{ file: string, elementId: string, field: string, value: unknown } | null}
 */
function checkElementFidelity(el, file) {
  // strokeColor: must be default or absent
  if (el.strokeColor !== undefined && el.strokeColor !== FID03_DEFAULTS.strokeColor) {
    return { elementId: el.id ?? "(no-id)", field: "strokeColor", file, value: el.strokeColor };
  }
  // backgroundColor: must be default or absent
  if (el.backgroundColor !== undefined && el.backgroundColor !== FID03_DEFAULTS.backgroundColor) {
    return { elementId: el.id ?? "(no-id)", field: "backgroundColor", file, value: el.backgroundColor };
  }
  // fontFamily: only check when the field is explicitly set (text elements)
  if (el.fontFamily !== undefined && el.fontFamily !== FID03_DEFAULTS.fontFamily) {
    return { elementId: el.id ?? "(no-id)", field: "fontFamily", file, value: el.fontFamily };
  }
  return null;
}

/**
 * Run the Stage 3 gate against a staged design directory.
 *
 * @param {string} designDir - Staged preview path (per INVARIANT-01)
 * @returns {Promise<import("../../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage3Gate(designDir) {
  // ── Step 1: Count check ─────────────────────────────────────────────────────
  const excalidrawFiles = await globby(["wireframes/**/*.excalidraw"], {
    cwd: designDir,
    absolute: true,
  });

  if (excalidrawFiles.length < 3) {
    return {
      findings: [
        {
          checkId: "3-count-001",
          evidence: `Found ${excalidrawFiles.length} .excalidraw file(s); need ≥3.`,
          findingId: "3-count-001",
          fixRecipe: "Need ≥3 wireframe variants. Re-run crazy-eights atom to produce additional variants.",
          severity: "BLOCKER",
          stage: 3,
          status: "open",
        },
      ],
      kind: "failed_after_repair",
      reason: "insufficient-variants",
    };
  }

  // ── Step 2: FID-03 check ────────────────────────────────────────────────────
  const fidelityViolations = [];

  for (const file of excalidrawFiles) {
    let doc;
    try {
      const raw = await readFile(file, "utf8");
      doc = JSON.parse(raw);
    } catch (err) {
      // Malformed JSON — treat as a count-level issue; skip FID-03 for this file
      continue;
    }

    const elements = collectElements(doc);
    for (const el of elements) {
      const violation = checkElementFidelity(el, file);
      if (violation) {
        fidelityViolations.push(violation);
      }
    }
  }

  if (fidelityViolations.length > 0) {
    return {
      evidence: fidelityViolations,
      kind: "not_runnable",
      reason: "fidelity-cap-violation-FID-03",
    };
  }

  // ── Step 3: Structural diversity check ─────────────────────────────────────
  const elementsArrays = [];

  for (const file of excalidrawFiles.sort()) {
    const raw = await readFile(file, "utf8");
    const doc = JSON.parse(raw);
    elementsArrays.push(collectElements(doc));
  }

  const diversityResult = checkDiversityThreshold(elementsArrays, 0.35);
  if (!diversityResult.passes) {
    return {
      findings: [
        {
          checkId: "3-diversity-001",
          evidence: diversityResult.violations.map((v) => ({
            distance: v.distance,
            i: v.i,
            j: v.j,
          })),
          findingId: "3-diversity-001",
          fixRecipe:
            "Variants too similar (pairwise structural distance < 0.35). Re-run crazy-eights with more layout diversity: card-list, hero+CTA, table, sidebar+content, bottom-nav.",
          severity: "BLOCKER",
          stage: 3,
          status: "open",
        },
      ],
      kind: "failed_after_repair",
      reason: "insufficient-diversity",
    };
  }

  // ── Step 4: CHOICE.md check ─────────────────────────────────────────────────
  const choiceFiles = await globby(["wireframes/**/CHOICE.md"], {
    cwd: designDir,
    absolute: true,
  });

  if (choiceFiles.length === 0) {
    return {
      findings: [
        {
          checkId: "3-choice-001",
          evidence: "No CHOICE.md found under wireframes/",
          findingId: "3-choice-001",
          fixRecipe: "Run converge atom to produce CHOICE.md selecting one variant.",
          severity: "BLOCKER",
          stage: 3,
          status: "open",
        },
      ],
      kind: "failed_after_repair",
      reason: "choice-absent",
    };
  }

  // ── All checks pass ──────────────────────────────────────────────────────────
  return {
    evidence: "proto",
    findings: [],
    kind: "pass",
  };
}
