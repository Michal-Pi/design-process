// schemas/src/spine.ts
// Spine ordering for the Garrett 5-plane design process.
// Consumed by: SPINE-04 check (lint-spine-linearity.mjs), Plan 05 routing.
//
// Source: CONTEXT.md SPINE-01..04; design-os-mrd-v2.md §3.5
// Implements: SPINE-04 (linear forward data flow enforced in code)

/**
 * The canonical Garrett stage order.
 * Stage 0 = strategy/scope (pre-research), 1-5b = the five planes.
 */
export const STAGE_ORDER = ["0", "1", "2", "3", "4", "5a", "5b"] as const;

/** A valid Garrett stage identifier. */
export type Stage = (typeof STAGE_ORDER)[number];

/**
 * Return the numeric index of a stage in STAGE_ORDER.
 * Stage '0' → 0, '5b' → 6.
 */
export function stageIndex(s: Stage): number {
  return STAGE_ORDER.indexOf(s);
}

/**
 * Assert that an artifact at stage `from` is allowed to depend on an artifact
 * at stage `to`.
 *
 * The Garrett spine enforces linear forward data flow: you may reference
 * artifacts from the same stage or earlier stages, never from later stages.
 *
 * @param from - Stage of the artifact that holds the dependsOn reference.
 * @param to   - Stage of the artifact being referenced.
 * @returns true when the dependency is legal (to ≤ from in stage order).
 */
export function canDependOn(from: Stage, to: Stage): boolean {
  return stageIndex(to) <= stageIndex(from);
}
