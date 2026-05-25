// schemas/src/sitemap.ts
// Zod source for Sitemap v1 — DTCG-style custom $type schema.
// Source: CONTEXT.md D-01, D-02; design-os-mrd-v2.md §3.6; DTCG v2025.10.
// Implements: SCHEMA-02, FORMAT-03, ART-03

import { z } from "zod";
import { FrontmatterCommon } from "./frontmatter-common.js";

/**
 * A single node in the sitemap tree.
 */
const SitemapNode = z.object({
  /** Unique identifier for this node within the sitemap. */
  id: z.string().min(1),

  /** Human-readable label for this node. */
  label: z.string().min(1),

  /** Parent node id; absent for root nodes. */
  parent: z.string().optional(),
});

/**
 * A sitemap variant using one of the LATCH organizational schemes.
 * LATCH: Location, Alphabetical, Time, Category, Hierarchy.
 */
const SitemapVariant = z.object({
  /** Unique identifier for this variant. */
  id: z.string().min(1),

  /**
   * LATCH-derived organizational scheme.
   * Source: Rosenfeld IA §3; PLAN.md <interfaces>.
   */
  scheme: z.enum([
    "location",
    "alphabetical",
    "time",
    "category",
    "hierarchy",
  ]),

  /** Flat list of nodes; hierarchy encoded via parent references. */
  nodes: z.array(SitemapNode).min(1),

  /** Optional Mermaid flowchart for visual representation of this variant. */
  mermaidFlow: z.string().optional(),
});

/**
 * Sitemap v1 schema.
 * Extends FrontmatterCommon with DTCG-style custom $type schema.
 * $id: https://design-os.dev/schemas/sitemap.v1.json
 */
export const SitemapV1 = FrontmatterCommon.extend({
  artifact: z.literal("sitemap"),
  stage: z.literal("2"),

  /** One or more LATCH-diverse sitemap variants. */
  variants: z.array(SitemapVariant).min(1),
}).meta({
  $id: "https://design-os.dev/schemas/sitemap.v1.json",
  title: "Sitemap (Stage 2)",
  description:
    "LATCH-diverse sitemap with DTCG-style custom $type organizational scheme",
});

export type SitemapV1Type = z.infer<typeof SitemapV1>;
