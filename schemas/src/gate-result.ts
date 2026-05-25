// schemas/src/gate-result.ts
// Discriminated union for GateResult — 5 kinds including not_runnable (GATE-07).
// Source: CONTEXT.md D-09; RESEARCH.md Pattern 3; design-os-mrd-v2.md §3.22.
// Implements: GATE-01..07, SCHEMA-07

import { z } from "zod";

/**
 * A single finding reported by a gate check.
 * Extended by per-stage gate implementations.
 */
export const Finding = z.object({
  /** Unique check identifier. */
  checkId: z.string().min(1),

  /** Status of this check. */
  status: z.enum(["pass", "fail", "na"]),

  /** Evidence supporting this check result. */
  evidence: z.string().optional(),

  /** Canon citation for this check requirement. */
  citation: z.string().optional(),
});

export type FindingType = z.infer<typeof Finding>;

/**
 * GateResult discriminated union — all 5 terminal states.
 * Source: D-09 + GATE-07 (not_runnable required from day one).
 *
 * TypeScript's exhaustiveness checking at every call site is enforced
 * by this discriminated union shape.
 */
export const GateResult = z.discriminatedUnion("kind", [
  /**
   * Gate passed — artifact meets all required criteria.
   * evidence grade indicates confidence level.
   */
  z.object({
    kind: z.literal("pass"),
    evidence: z.enum(["validated", "proto", "inferred"]),
    findings: z.array(Finding),
  }),

  /**
   * Gate passed but with non-blocking warnings.
   * Workflow may proceed; warnings should be surfaced.
   */
  z.object({
    kind: z.literal("pass_with_warnings"),
    evidence: z.enum(["validated", "proto", "inferred"]),
    findings: z.array(Finding),
    warnings: z.array(z.string()),
  }),

  /**
   * Gate failed; an automated repair was attempted but the gate still didn't pass.
   * Workflow should halt and surface the reason.
   */
  z.object({
    kind: z.literal("failed_after_repair"),
    reason: z.string(),
    findings: z.array(Finding),
  }),

  /**
   * A user manually overrode a gate failure.
   * Reason and banner persisted in manifest.lock per D-11.
   */
  z.object({
    kind: z.literal("user_overridden"),
    reason: z.string(),
    overrideBanner: z.string(),
    findings: z.array(Finding),
  }),

  /**
   * Gate cannot run because prerequisites are absent.
   * GATE-07: This is a day-one terminal state — NOT the same as failure.
   * Example: Stage 5a gate returns not_runnable when Stage 4 artifacts are absent.
   */
  z.object({
    kind: z.literal("not_runnable"),
    reason: z.string(),
  }),
]);

export type GateResultType = z.infer<typeof GateResult>;
