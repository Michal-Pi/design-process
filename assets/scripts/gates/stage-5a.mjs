// assets/scripts/gates/stage-5a.mjs
// Stage 5a (Hi-Fi / Interaction-complete) gate.
// GATE-07 + GATE-08: hardcoded not_runnable when design/interactions/ is
// empty or missing. This is the codex §16 BLOCKER fix — must work from day one.
//
// Source: CONTEXT.md D-09, D-10, D-25, D-26; PLAN.md Task 1 action
// Source: design-os-mrd-v2.md §16 (codex §16 BLOCKER fix)
// Implements: GATE-07 (not_runnable required from day one), GATE-08

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { parseChecklist } from "./_parse-checklist.mjs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const CHECKLIST_PATH = join(ROOT, "references/gates/stage-5a.md");

/**
 * Run the Stage 5a gate against a design directory.
 *
 * GATE-07 + GATE-08: If design/interactions/ does not exist OR is empty,
 * return not_runnable with reason 'stage-4-artifacts-absent'.
 * This is the codex §16 BLOCKER fix — stage 5a cannot run before stage 4
 * has produced interaction specifications.
 *
 * When interactions/ has ≥1 file, returns skeleton pass (Phase 1 only).
 * Full validation logic ships in Phase 3.
 *
 * @param {string} designDir - Path to the design directory (parent of interactions/)
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage5aGate(designDir) {
  const interactionsDir = join(designDir, "interactions");

  // GATE-07 + GATE-08: Refuse to run if stage 4 artifacts are absent.
  // This is a day-one terminal state, NOT a failure — it means prerequisites
  // are absent. Per Pitfall F: not_runnable is distinct from failed_after_repair.
  if (!existsSync(interactionsDir)) {
    return {
      kind: "not_runnable",
      reason: "stage-4-artifacts-absent",
    };
  }

  const entries = await readdir(interactionsDir);
  // Filter out hidden files like .gitkeep — real artifacts only
  const realFiles = entries.filter((f) => !f.startsWith("."));

  // D-43 v2.0a hard-coded terminal state: always not_runnable regardless of
  // interactions content. The FULL gate that promotes to PASS based on interactions
  // ships in Phase 3 when Stage 4 interaction specs (Mermaid stateDiagram-v2 +
  // XState machines) are fully scaffolded. In v2.0a, interactions/ content is
  // present at most as stubs — the gate must not award PASS on stubs.
  // This hard-code is intentional and is the CI guard that prevents premature promotion.
  return {
    kind: "not_runnable",
    reason: "stage-4-artifacts-absent",
  };
}
