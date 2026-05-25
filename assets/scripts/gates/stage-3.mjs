// assets/scripts/gates/stage-3.mjs
// Stage 3 (Low-Fidelity / Wireframes) gate skeleton.
// No checklist ships in Phase 1 for stages 3/4 (per D-25: only 1, 2, 5a, 5b
// checklists ship in v1.5). Full gate logic ships in Phase 3.
//
// Source: CONTEXT.md D-09, D-10, D-25; PLAN.md Task 1 action
// Implements: GATE-01 (stage gates as Node ESM checklists)

import { parseChecklist } from "./_parse-checklist.mjs";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
// Note: Stage 3 checklist ships in Phase 3, not Phase 1 (D-25)
const CHECKLIST_PATH = join(ROOT, "references/gates/stage-3.md");

/**
 * Run the Stage 3 gate against a design directory.
 * Phase 1 skeleton: checklist absent — returns skeleton pass result.
 * Real logic (including Excalidraw element validation) ships in Phase 3.
 *
 * @param {string} designDir - Path to the stage 3 design directory
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage3Gate(designDir) {
  // Stage 3 checklist does not exist in Phase 1 — parseChecklist returns []
  await parseChecklist(CHECKLIST_PATH);

  return {
    kind: "pass",
    evidence: "inferred",
    findings: [],
  };
}
