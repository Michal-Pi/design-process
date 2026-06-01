// schemas/src/handoff-bundle.ts
// Zod source for stage handoff bundle — deterministic frame for LLM-summarized bodies.
// Source: CONTEXT.md D-05..D-08; PLAN.md <interfaces>; complete-design-mrd-v2.md §3.9.
// Implements: SCHEMA-06, HAND-01..04, ART-03

import { z } from "zod";
import { FrontmatterCommon } from "./frontmatter-common.js";

/**
 * A decision captured in the handoff bundle.
 * Downstream workflows rely on terminal-state + evidence-grade.
 */
const DecisionEntry = z.object({
  /** Human-readable description of the decision made. */
  decision: z.string().min(1),

  /**
   * The terminal gate state associated with this decision.
   * Source: D-09 GateResult discriminated union.
   */
  terminalState: z.enum([
    "pass",
    "pass_with_warnings",
    "failed_after_repair",
    "user_overridden",
    "not_runnable",
  ]),

  /**
   * Evidence quality grade for this decision.
   * Source: D-09 evidence enum.
   */
  evidenceGrade: z.enum(["validated", "proto", "inferred", "missing"]),
});

/**
 * A brief inventory entry for a design artifact.
 */
const ArtifactInventoryEntry = z.object({
  /** Relative path to the artifact from the design/ root. */
  path: z.string().min(1),

  /** One-sentence description of what this artifact contains. */
  brief: z.string().min(1),
});

/**
 * HandoffBundle v1 schema.
 * Extends FrontmatterCommon with bundle-specific frontmatter and section content.
 * Note: stage overrides the base enum — format is "N → M" or "Na → Nb".
 * $id: https://complete-design.dev/schemas/handoff-bundle.v1.json
 */
export const HandoffBundleV1 = FrontmatterCommon.extend({
  artifact: z.literal("handoff-bundle"),

  /**
   * Stage transition this bundle covers.
   * Format: "1 → 2" or "5a → 5b" etc.
   */
  stage: z.string().regex(/^\d(a|b)? → \d(a|b)?$/),

  /**
   * Number of tokens in the bundle body as measured by tiktoken (cl100k_base).
   * Range 3000..15000 enforced per D-06.
   */
  tokenCount: z.number().int().min(3000).max(15000),

  /**
   * Warning message if the bundle was truncated to fit within the token budget.
   * Null when no truncation occurred.
   */
  truncationWarning: z.string().nullable(),

  // === Required sections (D-07) ===

  /** Goal and scope for the next stage; what the receiving agent needs to accomplish. */
  goalAndScope: z.string().min(1),

  /** Decisions made in the upstream stage, with terminal states and evidence grades. */
  decisionsMade: z.array(DecisionEntry),

  /** Unresolved questions that the next stage should investigate. */
  openQuestions: z.array(z.string()),

  /** Flat inventory of artifacts produced by the upstream stage. */
  artifactsInventory: z.array(ArtifactInventoryEntry),

  /**
   * Explicit pointers to raw artifacts downstream can fetch for verification.
   * Implements "Pointers to verify" per D-07.
   */
  pointersToVerify: z.array(z.string()),

  /**
   * Worst-case provenance of the upstream stage's artifacts.
   * Implements "Provenance (worst-case)" per D-07; RED-04 carrier.
   */
  provenanceWorstCase: z.enum(["generated", "validated", "inferred", "missing"]),

  // === Optional sections (D-07) ===

  /** Risks surfaced during the upstream stage. Empty array when none. */
  risksSurfaced: z.array(z.string()).optional(),
}).meta({
  $id: "https://complete-design.dev/schemas/handoff-bundle.v1.json",
  title: "Handoff Bundle (stage transition)",
  description:
    "Stage handoff bundle with deterministic frame and LLM-summarized sections; 3–15k token budget",
});

export type HandoffBundleV1Type = z.infer<typeof HandoffBundleV1>;
