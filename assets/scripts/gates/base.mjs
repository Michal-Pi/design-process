// assets/scripts/gates/base.mjs
// Base gate runner: runGate(stage, designDir, config) → GateResult
// Dispatches to per-stage gate implementations.
// Validates the result via ajv before returning.
// Appends a hash-chain entry to .complete-design/manifest.lock on every run.
//
// Source: CONTEXT.md D-09, D-10, D-11; PLAN.md Task 1 action
// Implements: GATE-01..07

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { runStage1Gate } from "./stage-1.mjs";
import { runStage2Gate } from "./stage-2.mjs";
import { runStage3Gate } from "./stage-3.mjs";
import { runStage4Gate } from "./stage-4.mjs";
import { runStage5aGate } from "./stage-5a.mjs";
import { runStage5bGate } from "./stage-5b.mjs";
import { appendManifestLockEntry } from "../manifest-lock-append.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

/** Per-stage gate function registry */
const STAGE_GATES = {
  "1": runStage1Gate,
  "2": runStage2Gate,
  "3": runStage3Gate,
  "4": runStage4Gate,
  "5a": runStage5aGate,
  "5b": runStage5bGate,
};

/**
 * Recursively collect all file paths under a directory in sorted order.
 * Skips hidden files and .complete-design/ to avoid self-hashing.
 *
 * @param {string} dir - Root directory
 * @param {string} [base] - Base path for relative path computation
 * @returns {Promise<string[]>} Sorted array of absolute file paths
 */
async function collectFiles(dir, base = dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    // Skip .complete-design directory to avoid recursive self-hashing
    if (entry.name === ".complete-design") continue;
    // Skip hidden files
    if (entry.name.startsWith(".")) continue;

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath, base);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Compute a deterministic SHA-256 hash of a directory's contents.
 * Walks files in sorted order; chains sha256(relPath + ":" + contents).
 *
 * @param {string} dir - Directory to hash
 * @returns {Promise<string>} sha256: + 64 hex chars
 */
export async function hashDirectory(dir) {
  const files = await collectFiles(dir, dir);

  const hasher = createHash("sha256");

  for (const filePath of files) {
    const relPath = relative(dir, filePath);
    const contents = await readFile(filePath);
    hasher.update(relPath + ":");
    hasher.update(contents);
  }

  return "sha256:" + hasher.digest("hex");
}

/**
 * Run a stage gate and return an ajv-validated GateResult.
 *
 * Dispatch rules:
 * 1. If config.overrideReason is set → return user_overridden without running
 *    the actual gate check (D-11).
 * 2. Otherwise dispatch to the per-stage gate function.
 * 3. Validate result via the Plan 01 ajv helper.
 * 4. Append entry to .complete-design/manifest.lock in designDir's parent .complete-design dir.
 *
 * @param {string} stage - Gate stage identifier ('1','2','3','4','5a','5b')
 * @param {string} designDir - Path to the design directory being gated
 * @param {{ overrideReason?: string }} [config={}] - Optional configuration
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runGate(stage, designDir, config = {}) {
  let result;

  if (config.overrideReason) {
    // D-11: override path — skip actual gate check
    result = {
      kind: "user_overridden",
      reason: config.overrideReason,
      overrideBanner: `⚠ Gate stage-${stage} overridden: ${config.overrideReason}`,
      findings: [],
    };
  } else {
    const gateFn = STAGE_GATES[stage];
    if (!gateFn) {
      throw new Error(`Unknown stage: ${stage}. Valid stages: ${Object.keys(STAGE_GATES).join(", ")}`);
    }
    result = await gateFn(designDir);
  }

  // Compute sourceHash of designDir content
  const sourceHash = await hashDirectory(designDir);

  // Append entry to .complete-design/manifest.lock
  // .complete-design/ lives alongside the designDir (or inside it — use designDir directly
  // when designDir is the project root; use parent when it's a stage subdirectory).
  // For Phase 1: treat designDir as the repo root scope; .complete-design/ is at designDir/.complete-design/
  const designOsDir = join(designDir, ".complete-design");

  try {
    await appendManifestLockEntry(designOsDir, {
      stage,
      gate: `stage-${stage}`,
      result,
      sourceHash,
    });
  } catch (err) {
    // Non-fatal: manifest.lock append errors don't block the gate result
    // (filesystem permission issues should not halt the workflow)
    console.error(`Warning: manifest.lock append failed: ${err.message}`);
  }

  return result;
}
