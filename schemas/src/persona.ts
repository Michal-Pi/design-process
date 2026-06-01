// schemas/src/persona.ts
// Zod source for Persona v1 — Indi Young thinking-style format + RED-04 provenance carrier.
// Source: CONTEXT.md D-01, D-02; RESEARCH.md Pattern 2; complete-design-mrd-v2.md §3.6.
// Implements: SCHEMA-01, FORMAT-02, ART-03

import { z } from "zod";
import { FrontmatterCommon } from "./frontmatter-common.js";

/**
 * Persona v1 schema.
 * Extends FrontmatterCommon with Indi Young thinking-style fields.
 * $id: https://complete-design.dev/schemas/persona.v1.json
 */
export const PersonaV1 = FrontmatterCommon.extend({
  artifact: z.literal("persona"),
  stage: z.literal("1"),

  /** Display name for this persona. */
  name: z.string().min(1),

  /** Jobs-to-be-done: what this persona is trying to accomplish. */
  jobsToBeDone: z.array(z.string()).min(1),

  /**
   * Indi Young thinking-style fields.
   * Source: indi-young-thinking-styles reference; MRD §3.22.
   */
  thinkingStyle: z.object({
    /** The cognitive / mental-space descriptor (Indi Young terminology). */
    cognitiveSpace: z.string().min(1),

    /** Emotional reactions this persona has in the context of the problem. */
    emotionalReactions: z.array(z.string()).min(1),

    /** Core guiding principles that drive decisions. */
    guidingPrinciples: z.array(z.string()).min(1),
  }),
}).meta({
  $id: "https://complete-design.dev/schemas/persona.v1.json",
  title: "Persona (Stage 1)",
  description:
    "Indi Young thinking-style format with NN/g provenance gating (RED-04 carrier)",
});

export type PersonaV1Type = z.infer<typeof PersonaV1>;
