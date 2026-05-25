// assets/scripts/gates/stage-2.mjs
// Stage 2 (Information Architecture / Sitemap) gate skeleton.
// Reads references/gates/stage-2.md checklist at runtime.
// Phase 1: skeleton only — returns pass with evidence 'inferred'.
//
// Source: CONTEXT.md D-09, D-10, D-26; PLAN.md Task 1 action
// Implements: GATE-01 (stage gates as Node ESM checklists)

import { parseChecklist } from "./_parse-checklist.mjs";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const CHECKLIST_PATH = join(ROOT, "references/gates/stage-2.md");

/**
 * Run the Stage 2 gate against a design directory.
 * Phase 1 skeleton: parses checklist (no-op if absent) and returns
 * the skeleton pass result. Real logic ships in Phase 2/3.
 *
 * @param {string} designDir - Path to the stage 2 design directory
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage2Gate(designDir) {
  await parseChecklist(CHECKLIST_PATH);

  return {
    kind: "pass",
    evidence: "inferred",
    findings: [],
  };
}
