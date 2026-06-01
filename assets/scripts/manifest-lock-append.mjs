// assets/scripts/manifest-lock-append.mjs
// Append-only SHA-256 hash chain for .complete-design/manifest.lock.
// Every gate run appends one JSONL entry; tampering is detectable via
// verifyManifestLockChain.
//
// Source: CONTEXT.md Pattern 5 (manifest.lock as Append-Only Hash Chain)
// Implements: PERSIST-01 (decision log + hash chain), T-02-01, T-02-02

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Zero-hash for the first entry (sha256: + 64 zeros) */
const ZERO_HASH = "sha256:" + "0".repeat(64);

/**
 * Recursively sort object keys alphabetically for deterministic canonical JSON.
 * Matches the canonicalize() helper in emit.mjs (single algorithm).
 */
function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalize(value[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Compute a canonical hash of an object via sorted-key JSON stringify.
 * @param {object} obj - Object to hash (entryHash must be excluded before calling)
 * @returns {string} sha256: + 64-hex-char hash
 */
function hashObject(obj) {
  const canonical = JSON.stringify(canonicalize(obj));
  return "sha256:" + createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Append one entry to .complete-design/manifest.lock.
 * Creates the file if it does not exist.
 *
 * @param {string} designOsDir - Path to the .complete-design directory
 * @param {{ stage: string, gate: string, result: object, sourceHash: string }} entry
 */
export async function appendManifestLockEntry(designOsDir, { stage, gate, result, sourceHash }) {
  await mkdir(designOsDir, { recursive: true });

  const lockPath = join(designOsDir, "manifest.lock");

  // Read existing entries to determine seq and prevHash
  let seq = 0;
  let prevHash = ZERO_HASH;

  if (existsSync(lockPath)) {
    const content = await readFile(lockPath, "utf8");
    const trimmed = content.trim();
    if (trimmed.length > 0) {
      const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
      const lastLine = lines[lines.length - 1];
      const lastEntry = JSON.parse(lastLine);
      seq = lastEntry.seq + 1;
      prevHash = lastEntry.entryHash;
    }
  }

  // Build entry without entryHash first (for canonical hash computation)
  const entryWithoutHash = {
    seq,
    timestamp: new Date().toISOString(),
    stage,
    gate,
    result,
    sourceHash,
    prevHash,
  };

  // Compute entryHash over the canonical form of the entry (sans entryHash)
  const entryHash = hashObject(entryWithoutHash);

  // Full entry
  const fullEntry = { ...entryWithoutHash, entryHash };

  // Append to manifest.lock as a single JSONL line
  const line = JSON.stringify(fullEntry) + "\n";
  await writeFile(lockPath, line, { flag: "a" });
}

/**
 * Verify the manifest.lock hash chain integrity.
 * Walks every entry, recomputes entryHash, and verifies prevHash continuity.
 *
 * @param {string} designOsDir - Path to the .complete-design directory
 * @returns {{ valid: boolean, brokenAt?: number }}
 */
export async function verifyManifestLockChain(designOsDir) {
  const lockPath = join(designOsDir, "manifest.lock");

  if (!existsSync(lockPath)) {
    return { valid: true };
  }

  const content = await readFile(lockPath, "utf8");
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { valid: true };
  }

  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  let expectedPrevHash = ZERO_HASH;

  for (let i = 0; i < lines.length; i++) {
    const entry = JSON.parse(lines[i]);
    const { entryHash, ...rest } = entry;

    // Recompute entryHash
    const recomputed = hashObject(rest);

    if (recomputed !== entryHash) {
      return { valid: false, brokenAt: i };
    }

    if (entry.prevHash !== expectedPrevHash) {
      return { valid: false, brokenAt: i };
    }

    expectedPrevHash = entryHash;
  }

  return { valid: true };
}
