// schemas/src/manifest.ts
// Zod source for MANIFEST.md frontmatter + per-artifact entry index.
// Source: CONTEXT.md D-01, D-04; complete-design-mrd-v2.md §3.6.
// Implements: SCHEMA-03, ART-03, PERSIST-01

import { z } from "zod";
import { FrontmatterCommon } from "./frontmatter-common.js";

/**
 * A single artifact entry in the MANIFEST.md index.
 */
const ManifestEntry = z.object({
  /** Relative path to the artifact file from the design/ root. */
  path: z.string().min(1),

  /** Artifact type name. */
  artifact: z.string().min(1),

  /** Garrett stage this artifact belongs to. */
  stage: z.string().min(1),

  /** ISO 8601 datetime when this artifact was generated. */
  generated: z.iso.datetime({ offset: true }),

  /**
   * Paths to artifacts that depend on this one.
   * Downstream plans use this for impact analysis.
   */
  dependents: z.array(z.string()),
});

/**
 * Manifest v1 schema.
 * Extends FrontmatterCommon with a flat entry-list index.
 * $id: https://complete-design.dev/schemas/manifest.v1.json
 */
export const ManifestV1 = FrontmatterCommon.extend({
  artifact: z.literal("manifest"),
  stage: z.literal("cross-stage"),

  /** Ordered list of all tracked design artifacts. */
  entries: z.array(ManifestEntry),
}).meta({
  $id: "https://complete-design.dev/schemas/manifest.v1.json",
  title: "Manifest (cross-stage)",
  description:
    "MANIFEST.md frontmatter + per-artifact entry index; consumed by manifest-reconcile.mjs",
});

export type ManifestV1Type = z.infer<typeof ManifestV1>;
