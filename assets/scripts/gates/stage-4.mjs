// assets/scripts/gates/stage-4.mjs
// Stage 4 (Interaction Design / State Maps) gate skeleton.
// No checklist ships in Phase 1 for stages 3/4 (per D-25).
// Full gate logic ships in Phase 3.
//
// Source: CONTEXT.md D-09, D-10, D-25; PLAN.md Task 1 action
// Implements: GATE-01 (stage gates as Node ESM checklists)

import { parseChecklist } from "./_parse-checklist.mjs";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
// Note: Stage 4 checklist ships in Phase 3, not Phase 1 (D-25)
const CHECKLIST_PATH = join(ROOT, "references/gates/stage-4.md");

/**
 * Run the Stage 4 gate against a design directory.
 * Phase 1 skeleton: checklist absent — returns skeleton pass result.
 * Real logic (including XState machine validation) ships in Phase 3.
 *
 * @param {string} designDir - Path to the stage 4 design directory
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage4Gate(designDir) {
  // Stage 4 checklist does not exist in Phase 1 — parseChecklist returns []
  await parseChecklist(CHECKLIST_PATH);

  return {
    kind: "pass",
    evidence: "inferred",
    findings: [],
  };
}
