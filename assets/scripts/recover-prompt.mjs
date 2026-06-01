// assets/scripts/recover-prompt.mjs
// Interactive wrapper around Plan 03's recover.mjs.
// Surfaces requiresConfirmation to the user via a readline prompt before re-running.
//
// Source: CONTEXT.md PERSIST-04; PLAN.md Task 3
// Implements: PERSIST-04 (confirm-before-regenerate interactive surface), RECOV-01

import { createInterface } from "node:readline/promises";
import { recover } from "./recover.mjs";

/**
 * Interactive resume: wraps recover.mjs and handles the requiresConfirmation case.
 *
 * @param {{ designDir: string, autoConfirm?: boolean }} opts
 * @returns {Promise<RecoverResult | { aborted: true, reason: string }>}
 *
 * @typedef {object} RecoverResult
 * @property {string} resumeFrom
 * @property {string|null} lastGate
 * @property {string} [sourceHash]
 * @property {boolean} [requiresConfirmation]
 * @property {string} [reason]
 */
export async function interactiveResume({ designDir, autoConfirm = false }) {
  const result = await recover({ designDir, resume: true, allowConfirm: true });

  if (!result.requiresConfirmation) {
    // No confirmation needed — return the result directly
    return result;
  }

  const { reason } = result;

  if (autoConfirm) {
    // CI / batch mode: auto-confirm and log
    console.log(`[complete-design resume] auto-confirming: ${reason}`);
    return result;
  }

  // Interactive mode: prompt user
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let answer;
  try {
    const stage = result.resumeFrom ?? "N";
    answer = await rl.question(
      `${reason}. Regenerate stage-${stage} artifacts? [y/N] `
    );
  } finally {
    rl.close();
  }

  const confirmed =
    answer.trim().toLowerCase() === "y" ||
    answer.trim().toLowerCase() === "yes";

  if (!confirmed) {
    return { aborted: true, reason: "user declined regeneration" };
  }

  return result;
}
