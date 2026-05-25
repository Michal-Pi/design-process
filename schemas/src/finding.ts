// schemas/src/finding.ts
// Finding schema — a single diagnostic finding reported by a gate check.
// Source: PLAN.md interfaces_introduced_here; CONTEXT.md D-09; GATE-01..07
// Downstream consumers: Plans 03, 04

import { z } from "zod";

/**
 * A diagnostic finding produced by a gate or audit check.
 * Identified by a unique ID in the form CATEGORY-NUMBER (e.g., GATE-01, RED-03).
 */
export const Finding = z.object({
  /**
   * Unique finding identifier in the form CATEGORY-NUMBER.
   * Examples: GATE-01, RED-03, HAND-02
   */
  findingId: z.string().regex(/^[A-Z]+-\d+$/),

  /**
   * Severity level of this finding.
   * BLOCKER: prevents stage transition; WARN: should be addressed; INFO: informational.
   */
  severity: z.enum(["BLOCKER", "WARN", "INFO"]),

  /**
   * Evidence locating the source of this finding.
   */
  evidence: z.object({
    /** Path to the artifact or file that caused this finding. */
    path: z.string(),
    /** Line number within the file, if applicable. */
    line: z.number().int().nonnegative().optional(),
  }),

  /**
   * Human-readable recipe for how to fix this finding.
   */
  fixRecipe: z.string(),

  /**
   * Optional suppression token — if present, this finding was acknowledged and suppressed.
   */
  suppression: z.string().optional(),
}).meta({
  $id: "https://design-os.dev/schemas/finding.v1.json",
  title: "Finding",
  description: "A diagnostic finding produced by a gate or audit check",
});

export type FindingType = z.infer<typeof Finding>;
