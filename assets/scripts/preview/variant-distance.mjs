// assets/scripts/preview/variant-distance.mjs
// 6-axis visual-style distance metric for Stage 5a variant comparison.
// Preserved from v1.0.1 per PREV-05.
//
// Stage 3 structural-diversity metric is explicitly deferred to Phase 3
// per CONTEXT.md deferred section + PROJECT.md research flag:
//   "Stage 3 structural-diversity metric design — Phase 3 deep research
//    (the metric is unprecedented; v1.0.1's 6-axis visual-style metric
//    does not apply to greyscale wireframes)."
//
// Sources: CONTEXT.md PREV-05, PLAN.md Task 1 behavior block,
//          complete-design-mrd-v2.md §3.11

/**
 * The 6 axes for Stage 5a visual-style distance measurement.
 * All axis values are normalized to [0, 1].
 */
export const AXES = /** @type {const} */ ([
  'hue',
  'saturation',
  'lightness',
  'typographyContrast',
  'spacingRhythm',
  'cornerRoundness',
]);

/**
 * Compute Euclidean distance across the 6 visual-style axes.
 * Missing axis values are treated as 0.
 *
 * @param a  First variant — object with numeric values per axis (0..1)
 * @param b  Second variant — object with numeric values per axis (0..1)
 * @returns  Euclidean distance (≥0)
 */
export function distance(a, b) {
  return Math.sqrt(
    AXES.reduce((sum, axis) => {
      const diff = (a[axis] ?? 0) - (b[axis] ?? 0);
      return sum + diff * diff;
    }, 0)
  );
}

/**
 * Whether Stage 3 structural-diversity metric is deferred.
 * Consuming code can check this flag before calling stage3StructuralDistance.
 */
export const STAGE_3_STRUCTURAL_DEFERRED = true;

/**
 * Stub for the Stage 3 structural-diversity metric.
 * Will be implemented in Phase 3 alongside the gate runners.
 *
 * @throws Error always — Stage 3 structural-diversity metric ships in Phase 3
 */
export function stage3StructuralDistance() {
  throw new Error(
    'Stage 3 structural-diversity metric ships in Phase 3 per project research flag. ' +
    'The v1.0.1 6-axis visual-style metric (AXES + distance()) does not apply to ' +
    'greyscale wireframes. Design of this metric is a Phase 3 deep research item.'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 2 Sitemap Structural Distance (Phase 2 — T-02-02-A)
// ─────────────────────────────────────────────────────────────────────────────
// Computes a [0,1] structural diversity score between two sitemap variants.
// Used in the `structure` workflow to verify LATCH diversity before presenting
// variants to the user (D-39: any two variants scoring < 0.3 trigger regeneration).
//
// Three components:
//   (a) Scheme diversity:    different LATCH schemes → +0.4; same → +0.0
//   (b) Top-level node count ratio:  |countA - countB| / max(countA, countB) → up to +0.3
//   (c) Label overlap (Jaccard distance): 1 - |A ∩ B| / |A ∪ B| → up to +0.3
// Sum capped at 1.0.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the Jaccard distance between two sets of strings.
 * Distance = 1 - |A ∩ B| / |A ∪ B|
 * Empty-set edge case: two empty sets → 0.0 (identical); one empty → 1.0.
 *
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {number} Jaccard distance in [0, 1]
 */
function jaccardDistance(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return 1 - intersection.size / union.size;
}

/**
 * Extract the top-level node labels from a sitemap variant.
 * "Top-level" = nodes whose parent is the root node (the first node without a parent).
 * If the variant has no hierarchy (all nodes without parents), all labels are returned.
 *
 * @param {{ nodes: Array<{id: string, label: string, parent?: string}> }} variant
 * @returns {string[]} Lowercase labels of top-level nodes
 */
function getTopLevelLabels(variant) {
  const nodes = variant.nodes ?? [];
  if (nodes.length === 0) return [];

  // Find root: first node without a parent
  const nodesWithParent = new Set(nodes.filter((n) => n.parent != null).map((n) => n.id));
  const rootNode = nodes.find((n) => !nodesWithParent.has(n.id));

  if (!rootNode) {
    // No clear root; all nodes are "top-level"
    return nodes.map((n) => (n.label ?? '').toLowerCase());
  }

  // Top-level nodes: those whose parent is the root
  const topLevel = nodes.filter((n) => n.parent === rootNode.id);
  if (topLevel.length === 0) {
    // Single-level sitemap; only the root node exists
    return [(rootNode.label ?? '').toLowerCase()];
  }

  return topLevel.map((n) => (n.label ?? '').toLowerCase());
}

/**
 * Compute structural diversity score between two sitemap variants.
 *
 * Formula:
 *   score = schemePenalty + countPenalty + labelPenalty
 *
 * Where:
 *   schemePenalty  = 0.4 if schemes differ, 0.0 if same
 *   countPenalty   = 0.3 × (|countA - countB| / max(countA, countB, 1))
 *   labelPenalty   = 0.3 × jaccardDistance(topLabelsA, topLabelsB)
 *
 * Score is clamped to [0, 1].
 *
 * @param {{ scheme: string, nodes: Array<{id: string, label: string, parent?: string}> }} sitemapA
 * @param {{ scheme: string, nodes: Array<{id: string, label: string, parent?: string}> }} sitemapB
 * @returns {number} Structural diversity score in [0.0, 1.0]; 0.0 = identical, 1.0 = maximally diverse
 */
export function sitemapStructuralDistance(sitemapA, sitemapB) {
  // (a) Scheme diversity — different LATCH schemes signal a fundamentally different
  // organizational principle, which is the primary diversity signal.
  // Weight: 0.5 (dominant factor, ensures different schemes score ≥0.5 on their own)
  const schemePenalty = sitemapA.scheme !== sitemapB.scheme ? 0.5 : 0.0;

  // (b) Top-level node count ratio (up to +0.25)
  const topLabelsA = getTopLevelLabels(sitemapA);
  const topLabelsB = getTopLevelLabels(sitemapB);
  const countA = topLabelsA.length;
  const countB = topLabelsB.length;
  const maxCount = Math.max(countA, countB, 1);
  const countPenalty = 0.25 * (Math.abs(countA - countB) / maxCount);

  // (c) Label overlap (Jaccard distance on top-level label sets, up to +0.25)
  const setA = new Set(topLabelsA);
  const setB = new Set(topLabelsB);
  const labelPenalty = 0.25 * jaccardDistance(setA, setB);

  // Sum and clamp
  const raw = schemePenalty + countPenalty + labelPenalty;
  return Math.min(1.0, Math.max(0.0, raw));
}
