// assets/scripts/recover.mjs
// Recovery semantics: reads .complete-design/manifest.lock and identifies the resume point.
//
// Implements RECOV-01 (confirm-before-regenerate), RECOV-02 (equivalent end-state
// assertion), RECOV-03 (scripted-test 100% pass), PERSIST-04 (the machinery;
// interactive UX surfaces in Plan 04).
//
// Source: CONTEXT.md RECOV-01..03, PERSIST-04
// Plan: 01-03 Task 3

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Default stage sequence for Phase 1 (Plan 05 overrides with route-aware sequences).
 * Maps each gate stage to its successor.
 */
const NEXT_STAGE = {
  "1": "2",
  "2": "3",
  "3": "4",
  "4": "5a",
  "5a": "5b",
  "5b": null, // terminal
};

/**
 * Stage-specific required artifact directories.
 * If the gate passed but these directories are absent, requiresConfirmation fires.
 * Key = stage that produced the artifact; Value = relative path from designDir.
 */
const STAGE_ARTIFACTS = {
  "1": "research",
  "2": "sitemap.json", // file (check via existsSync)
  "3": "wireframes",
  "4": "interactions",
};

/**
 * Detect whether a required stage artifact is present in the design directory.
 *
 * @param {string} designDir
 * @param {string} stage
 * @returns {boolean} true if artifact is present (or no check needed for this stage)
 */
function isArtifactPresent(designDir, stage) {
  const rel = STAGE_ARTIFACTS[stage];
  if (!rel) return true; // No required artifact check for this stage
  return existsSync(join(designDir, rel));
}

/**
 * Recover: inspect manifest.lock and return the resume point.
 *
 * @param {{ designDir: string, resume?: boolean, allowConfirm?: boolean }} opts
 * @returns {Promise<RecoverResult>}
 *
 * @typedef {object} RecoverResult
 * @property {string} resumeFrom - Next stage to run ('0' if no lock, next stage id if locked)
 * @property {string|null} lastGate - 'stage-N' string or null if no lock
 * @property {string} [sourceHash] - sourceHash from last manifest entry
 * @property {boolean} [requiresConfirmation] - true if artifacts missing but gate passed
 * @property {string} [reason] - Human-readable reason for requiresConfirmation
 */
export async function recover({ designDir, resume = true, allowConfirm = false }) {
  const lockPath = join(designDir, ".complete-design", "manifest.lock");

  // No lock → start from stage 0
  if (!existsSync(lockPath)) {
    return { resumeFrom: "0", lastGate: null };
  }

  const content = await readFile(lockPath, "utf8");
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { resumeFrom: "0", lastGate: null };
  }

  // Parse all entries, find last one
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  const lastEntry = JSON.parse(lines[lines.length - 1]);

  const lastStage = lastEntry.stage;
  const lastGate = `stage-${lastStage}`;
  const lastKind = lastEntry.result?.kind;
  const sourceHash = lastEntry.sourceHash;

  // If the last gate was a pass, verify that stage-level artifacts still exist.
  // A missing artifact after a pass indicates interrupted workflow or manual deletion.
  if (lastKind === "pass") {
    const artifactPresent = isArtifactPresent(designDir, lastStage);
    if (!artifactPresent) {
      const artifactPath = STAGE_ARTIFACTS[lastStage] ?? "<unknown>";
      return {
        requiresConfirmation: true,
        reason: `design/${artifactPath} missing but manifest.lock records stage-${lastStage} PASS`,
        lastGate,
        sourceHash,
        resumeFrom: lastStage, // Re-run current stage (user must confirm)
      };
    }
  }

  // Compute next stage from the sequence
  const resumeFrom = NEXT_STAGE[lastStage] ?? lastStage;

  return {
    resumeFrom,
    lastGate,
    sourceHash,
  };
}
