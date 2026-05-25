// schemas/src/frontmatter-common.ts
// Shared frontmatter contract for all canonical design-os artifacts.
// Source: CONTEXT.md D-01, D-02; PLAN.md interfaces block; §3.6 per-artifact YAML frontmatter contract.
// Implements: ART-03 (per-artifact YAML frontmatter), FORMAT-01..06

import { z } from "zod";

/**
 * YAML frontmatter shared by every canonical design-os artifact.
 * Every artifact-specific schema extends this via `.extend()`.
 */
export const FrontmatterCommon = z.object({
  /** The artifact type name (literal per artifact schema). */
  artifact: z.string(),

  /** Garrett stage this artifact belongs to. */
  stage: z.enum(["0", "1", "2", "3", "4", "5a", "5b", "cross-stage"]),

  /** Monotonically increasing integer; bumped on breaking schema changes. */
  schemaVersion: z.literal(1),

  /**
   * SHA-256 hash of the source material this artifact was derived from.
   * Format: sha256:<64 hex chars>
   */
  sourceHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),

  /** ISO 8601 datetime when this artifact was generated. */
  generated: z.iso.datetime({ offset: true }),

  /**
   * How this artifact's content was established.
   * - generated: produced by LLM/script without user review
   * - validated: user-confirmed accuracy
   * - inferred: derived from evidence but not directly stated
   * - missing: provenance unknown
   */
  provenance: z.enum(["generated", "validated", "inferred", "missing"]),

  /**
   * Worst-case provenance of any upstream artifact in the chain.
   * RED-04 carrier: downstream workflows rely on this to surface degraded confidence.
   */
  worstProvenance: z
    .enum(["generated", "validated", "inferred", "missing"])
    .optional(),

  /** Owner email or identifier (non-empty string). */
  owner: z.string().min(1),

  /** ISO 8601 datetime of the last human review. */
  lastReviewedAt: z.iso.datetime({ offset: true }),
});

export type FrontmatterCommonType = z.infer<typeof FrontmatterCommon>;
