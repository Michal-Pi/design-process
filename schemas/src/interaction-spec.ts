// schemas/src/interaction-spec.ts
// Zod source for IxD spec — Markdown body + optional XState v5 machine.
// Source: CONTEXT.md D-01; design-os-mrd-v2.md §3.22; PLAN.md <interfaces>.
// Implements: SCHEMA-04, FORMAT-05, ART-03
//
// Note: XState v5 machine is optional — required only for async + ≥3 states +
// conditional transitions (MVPB-08). For simpler interactions, Mermaid is the
// canonical designer artifact.

import { z } from "zod";
import { FrontmatterCommon } from "./frontmatter-common.js";

/**
 * A transition from one state to another, triggered by an event.
 */
const Transition = z.object({
  /** Event that triggers this transition. */
  event: z.string().min(1),

  /** Target state id. */
  target: z.string().min(1),

  /** Optional guard condition expression. */
  guard: z.string().optional(),
});

/**
 * A single state in the interaction spec.
 */
const InteractionState = z.object({
  /** Unique identifier for this state. */
  id: z.string().min(1),

  /** Human-readable label. */
  label: z.string().min(1),

  /** Outgoing transitions from this state. */
  transitions: z.array(Transition),
});

/**
 * InteractionSpec v1 schema.
 * Extends FrontmatterCommon with IxD spec content.
 * $id: https://design-os.dev/schemas/interaction-spec.v1.json
 */
export const InteractionSpecV1 = FrontmatterCommon.extend({
  artifact: z.literal("interaction-spec"),
  stage: z.literal("4"),

  /** Screen or component this spec governs. */
  screen: z.string().min(1),

  /** State list for this interaction flow. */
  states: z.array(InteractionState).min(1),

  /**
   * Mermaid stateDiagram-v2 source string.
   * This is the canonical designer-readable format (MRD §3.22).
   */
  mermaidStateDiagram: z.string().min(1),

  /**
   * Optional XState v5 machine definition (JSON-serialized).
   * Present only when: async + ≥3 states + conditional transitions (MVPB-08).
   */
  xstateMachine: z.string().optional(),
}).meta({
  $id: "https://design-os.dev/schemas/interaction-spec.v1.json",
  title: "Interaction Spec (Stage 4)",
  description:
    "IxD specification with Mermaid stateDiagram-v2 (canonical) + optional XState v5 machine",
});

export type InteractionSpecV1Type = z.infer<typeof InteractionSpecV1>;
