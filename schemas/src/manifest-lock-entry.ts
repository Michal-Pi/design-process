// schemas/src/manifest-lock-entry.ts
// ManifestLockEntry schema — one hash-chain entry in .design-os/manifest.lock.
// Source: PLAN.md interfaces_introduced_here; CONTEXT.md Pattern 5; PERSIST-01..04
// Downstream consumers: Plans 03, 04

import { z } from "zod";
import { GateResult } from "./gate-result.js";

/** SHA-256 hash prefix pattern: sha256: + 64 lowercase hex chars */
const Sha256Hash = z.string().regex(/^sha256:[0-9a-f]{64}$/);

/**
 * A single entry in the .design-os/manifest.lock append-only hash chain.
 * Each gate run appends one entry; entries form a SHA-256 hash chain where
 * each entry's prevHash matches the previous entry's entryHash.
 *
 * Source: CONTEXT.md Pattern 5 (manifest.lock as Append-Only Hash Chain)
 * Implements: PERSIST-01 (decision log + hash chain)
 */
export const ManifestLockEntry = z.object({
  /** Monotonically increasing sequence number; 0-indexed. */
  seq: z.number().int().nonnegative(),

  /** ISO 8601 datetime when this gate run was recorded. */
  timestamp: z.iso.datetime({ offset: true }),

  /** Garrett stage this gate ran against (e.g., "1", "5a"). */
  stage: z.string(),

  /** Gate identifier (e.g., "stage-1", "stage-5a"). */
  gate: z.string(),

  /** The GateResult returned by this gate run. */
  result: GateResult,

  /** SHA-256 hash of the designDir content when this gate ran. */
  sourceHash: Sha256Hash,

  /**
   * Hash of the previous entry's canonical serialization.
   * Zero-hash (sha256: + 64 zeros) for the first entry.
   */
  prevHash: Sha256Hash,

  /**
   * SHA-256 hash of this entry's canonical serialization (excl. entryHash itself).
   * Computed via: sha256(canonicalize({...entry_without_entryHash}))
   */
  entryHash: Sha256Hash,
}).meta({
  $id: "https://design-os.dev/schemas/manifest-lock-entry.v1.json",
  title: "Manifest Lock Entry",
  description: "One hash-chain entry in the .design-os/manifest.lock append-only audit log",
});

export type ManifestLockEntryType = z.infer<typeof ManifestLockEntry>;
