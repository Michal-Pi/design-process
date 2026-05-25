// assets/scripts/wireframe-diversity.mjs
// 3-factor structural diversity metric for Crazy 8s wireframe variants.
//
// Prevents near-clone wireframe variants from passing the Stage 3 gate.
// Three factors (per D-55 / RESEARCH.md §3.3):
//   F1: bounding-box 3×3 grid histogram cosine distance
//   F2: |countA - countB| / max(countA, countB)
//   F3: |depthA - depthB| / max(depthA, depthB)
//   Composite: (F1 + F2 + F3) / 3
// Minimum threshold: 0.35 (OQ-4 resolution)
//
// All functions are pure and deterministic — no LLM imports (INVARIANT-05).
//
// Source: PLAN.md 03-01 Task A; CONTEXT.md D-55
// Implements: WF-04 (structural diversity gate)

/**
 * Compute the bounding box of all elements in the array.
 *
 * Supports both skeleton IR format (w/h) and Excalidraw v2 element format (width/height).
 * Excalidraw v2 uses `width` and `height`; IR objects use `w` and `h`.
 *
 * @param {Array<{x: number, y: number, width?: number, height?: number, w?: number, h?: number, children?: Array}>} elements
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number }}
 */
function computeBoundingBox(elements) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function visit(el) {
    if (typeof el.x === "number" && typeof el.y === "number") {
      // Support Excalidraw v2 (width/height) and skeleton IR (w/h)
      const elWidth = el.width ?? el.w ?? 0;
      const elHeight = el.height ?? el.h ?? 0;
      const x2 = el.x + elWidth;
      const y2 = el.y + elHeight;
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    }
    if (Array.isArray(el.children)) {
      for (const child of el.children) visit(child);
    }
  }

  for (const el of elements) visit(el);

  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  }
  // Ensure non-zero extent
  return {
    minX,
    minY,
    maxX: maxX <= minX ? minX + 1 : maxX,
    maxY: maxY <= minY ? minY + 1 : maxY,
  };
}

/**
 * Flatten element tree (including children) into a single array.
 *
 * @param {Array} elements
 * @returns {Array}
 */
function flattenElements(elements) {
  const result = [];
  function visit(el) {
    result.push(el);
    if (Array.isArray(el.children)) {
      for (const child of el.children) visit(child);
    }
  }
  for (const el of elements) visit(el);
  return result;
}

/**
 * Compute which 3×3 grid cell an element's center falls in.
 * Returns a cell index 0-8 (row-major: cell 0 = top-left, 8 = bottom-right).
 *
 * Supports both skeleton IR format (w/h) and Excalidraw v2 element format (width/height).
 *
 * @param {object} el - Element with x, y, width/height (Excalidraw v2) or w/h (IR)
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} bbox
 * @returns {number} 0-8
 */
function cellIndex(el, bbox) {
  const totalW = bbox.maxX - bbox.minX;
  const totalH = bbox.maxY - bbox.minY;
  // Support Excalidraw v2 (width/height) and skeleton IR (w/h)
  const elWidth = el.width ?? el.w ?? 0;
  const elHeight = el.height ?? el.h ?? 0;
  const cx = (el.x ?? 0) + elWidth / 2;
  const cy = (el.y ?? 0) + elHeight / 2;
  const normX = (cx - bbox.minX) / totalW;
  const normY = (cy - bbox.minY) / totalH;
  const col = Math.min(2, Math.floor(normX * 3));
  const row = Math.min(2, Math.floor(normY * 3));
  return row * 3 + col;
}

/**
 * Compute maximum nesting depth from element tree.
 * Elements with children[] contribute +1 to depth per level.
 *
 * @param {Array} elements - IR or Excalidraw element array
 * @returns {number} max depth (0 = flat, 1 = one level of children, etc.)
 */
function computeMaxDepth(elements) {
  function depth(el, d) {
    if (!Array.isArray(el.children) || el.children.length === 0) return d;
    return Math.max(...el.children.map((c) => depth(c, d + 1)));
  }
  if (elements.length === 0) return 0;
  return Math.max(...elements.map((el) => depth(el, 0)));
}

/**
 * Compute the structural fingerprint of an element array.
 *
 * @param {Array<{type: string, x: number, y: number, w: number, h: number, children?: Array}>} elements
 * @returns {{ gridHistogram: number[], elementCount: number, maxDepth: number }}
 */
export function computeStructuralFingerprint(elements) {
  const flat = flattenElements(elements);
  const bbox = computeBoundingBox(flat);
  const elementCount = flat.length;

  // Build 3×3 grid histogram (9 cells)
  const histogram = new Array(9).fill(0);
  for (const el of flat) {
    if (typeof el.x !== "number") continue;
    const cell = cellIndex(el, bbox);
    histogram[cell]++;
  }

  // Normalize to sum=1
  const total = histogram.reduce((s, v) => s + v, 0);
  const gridHistogram =
    total > 0 ? histogram.map((v) => v / total) : histogram.map(() => 1 / 9);

  const maxDepth = computeMaxDepth(elements);

  return { elementCount, gridHistogram, maxDepth };
}

/**
 * Compute cosine similarity between two 9-element grid histograms.
 * Returns value in [0, 1] where 1.0 = identical distribution.
 *
 * @param {number[]} h1 - 9-element normalized histogram
 * @param {number[]} h2 - 9-element normalized histogram
 * @returns {number} cosine similarity [0, 1]
 */
export function gridCosineSimilarity(h1, h2) {
  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;
  for (let i = 0; i < 9; i++) {
    dot += h1[i] * h2[i];
    mag1 += h1[i] * h1[i];
    mag2 += h2[i] * h2[i];
  }
  const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
  if (denom === 0) return 1; // both zero-vectors = identical (fully degenerate)
  return dot / denom;
}

/**
 * Compute composite structural distance between two fingerprints.
 *
 * Factor 1 (F1): grid histogram distance = 1 - cosine_similarity
 * Factor 2 (F2): element count difference = |cA - cB| / max(cA, cB)
 * Factor 3 (F3): max-depth difference = |dA - dB| / max(dA, dB)
 * Composite: (F1 + F2 + F3) / 3
 *
 * @param {{ gridHistogram: number[], elementCount: number, maxDepth: number }} fpA
 * @param {{ gridHistogram: number[], elementCount: number, maxDepth: number }} fpB
 * @returns {number} composite distance in [0, 1]
 */
export function pairwiseDistance(fpA, fpB) {
  // F1: grid histogram distance
  const cosineSim = gridCosineSimilarity(fpA.gridHistogram, fpB.gridHistogram);
  const f1 = 1 - cosineSim;

  // F2: element count difference
  const cA = fpA.elementCount;
  const cB = fpB.elementCount;
  const f2 = cA === 0 && cB === 0 ? 0 : Math.abs(cA - cB) / Math.max(cA, cB);

  // F3: max-depth difference
  const dA = fpA.maxDepth;
  const dB = fpB.maxDepth;
  const f3 = dA === 0 && dB === 0 ? 0 : Math.abs(dA - dB) / Math.max(dA, dB, 1);

  return (f1 + f2 + f3) / 3;
}

/**
 * Compute all pairwise structural distances for an array of element arrays.
 * Returns C(n,2) = n*(n-1)/2 pairs.
 *
 * @param {Array<Array>} elementsArrays - Array of element arrays (one per wireframe variant)
 * @returns {Array<{ i: number, j: number, distance: number }>}
 */
export function computePairwiseDistances(elementsArrays) {
  const fingerprints = elementsArrays.map((arr) => computeStructuralFingerprint(arr));
  const results = [];
  for (let i = 0; i < fingerprints.length; i++) {
    for (let j = i + 1; j < fingerprints.length; j++) {
      results.push({
        distance: pairwiseDistance(fingerprints[i], fingerprints[j]),
        i,
        j,
      });
    }
  }
  return results;
}

/**
 * Check whether all pairwise distances meet the minimum diversity threshold.
 *
 * @param {Array<Array>} elementsArrays - Array of element arrays (one per wireframe variant)
 * @param {number} [threshold=0.35] - Minimum required pairwise distance (D-55, OQ-4)
 * @returns {{ passes: boolean, violations: Array<{ i: number, j: number, distance: number }> }}
 */
export function checkDiversityThreshold(elementsArrays, threshold = 0.35) {
  const pairs = computePairwiseDistances(elementsArrays);
  const violations = pairs.filter((p) => p.distance < threshold);
  return { passes: violations.length === 0, violations };
}
