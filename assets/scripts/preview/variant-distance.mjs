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
//          design-os-mrd-v2.md §3.11

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
