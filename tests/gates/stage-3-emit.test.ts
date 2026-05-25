// tests/gates/stage-3-emit.test.ts
// TDD RED: failing tests for excalidraw-render.mjs + wireframe-diversity.mjs
//
// Source: PLAN.md 03-01 Task A behavior specification
// Implements: D-54 (excalidraw IR via convertToExcalidrawElements), D-55 (wireframe diversity)

import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";

// @ts-ignore TS7016: no declaration for .mjs script
const renderMod: any = await import("../../assets/scripts/excalidraw-render.mjs");
// @ts-ignore TS7016: no declaration for .mjs script
const diversityMod: any = await import("../../assets/scripts/wireframe-diversity.mjs");
// @ts-ignore TS7016: no declaration for .mjs script
const lintMod: any = await import("../../assets/scripts/lint-determinism.mjs");

const { renderSkeletonIR } = renderMod;
const { computePairwiseDistances, checkDiversityThreshold, pairwiseDistance, computeStructuralFingerprint } = diversityMod;
const { lintDeterminism } = lintMod;

// Minimal IR fixtures
const MINIMAL_IR = [{ type: "rectangle", x: 0, y: 0, w: 100, h: 50, label: "Nav" }];

const THREE_ELEMENT_IR = [
  { type: "rectangle", x: 0, y: 0, w: 200, h: 60, label: "Header" },
  { type: "rectangle", x: 0, y: 80, w: 200, h: 300, label: "Content" },
  { type: "text", x: 10, y: 10, w: 180, h: 30, label: "Title" },
];

// Structurally DISTINCT IR arrays for diversity testing
// Array A: header-centric layout, sparse — top-heavy, wide
const IR_LAYOUT_A = [
  { type: "rectangle", x: 0, y: 0, w: 1200, h: 80, label: "Header" },
  { type: "rectangle", x: 0, y: 90, w: 1200, h: 40, label: "Nav" },
  { type: "rectangle", x: 0, y: 140, w: 1200, h: 600, label: "MainContent" },
];

// Array B: sidebar + content layout — 3x deeper nesting, different grid distribution
const IR_LAYOUT_B = [
  { type: "rectangle", x: 0, y: 0, w: 250, h: 800, label: "Sidebar", children: [
    { type: "rectangle", x: 10, y: 10, w: 230, h: 30, label: "SidebarItem1" },
    { type: "rectangle", x: 10, y: 50, w: 230, h: 30, label: "SidebarItem2" },
    { type: "rectangle", x: 10, y: 90, w: 230, h: 30, label: "SidebarItem3" },
  ]},
  { type: "rectangle", x: 260, y: 0, w: 940, h: 400, label: "Content" },
  { type: "rectangle", x: 260, y: 410, w: 460, h: 380, label: "Details" },
  { type: "rectangle", x: 730, y: 410, w: 470, h: 380, label: "Preview" },
  { type: "rectangle", x: 260, y: 800, w: 940, h: 60, label: "ActionBar" },
  { type: "rectangle", x: 260, y: 870, w: 940, h: 40, label: "Footer" },
];

describe("T-03-01-A: excalidraw-render.mjs", () => {
  it("Test 1: given minimal IR, produces valid JSON with at least one element", () => {
    const result = renderSkeletonIR(MINIMAL_IR);
    expect(result).toHaveProperty("type", "excalidraw");
    expect(result).toHaveProperty("version", 2);
    expect(result).toHaveProperty("elements");
    expect(Array.isArray(result.elements)).toBe(true);
    expect(result.elements.length).toBeGreaterThanOrEqual(1);
    expect(result).toHaveProperty("appState");
    expect(result).toHaveProperty("files");
  });

  it("Test 2: output is byte-identical on two consecutive runs from same IR (determinism)", () => {
    const run1 = renderSkeletonIR(THREE_ELEMENT_IR);
    const run2 = renderSkeletonIR(THREE_ELEMENT_IR);
    const hash1 = createHash("sha256").update(JSON.stringify(run1)).digest("hex");
    const hash2 = createHash("sha256").update(JSON.stringify(run2)).digest("hex");
    expect(hash1).toBe(hash2);
  });
});

describe("T-03-01-A: wireframe-diversity.mjs", () => {
  it("Test 3: identical element arrays return composite distance ≈ 0.0 (< 0.35 threshold)", () => {
    const fpA = computeStructuralFingerprint(IR_LAYOUT_A);
    const fpB = computeStructuralFingerprint(IR_LAYOUT_A); // same array
    const dist = pairwiseDistance(fpA, fpB);
    expect(dist).toBeCloseTo(0.0, 1); // near-zero
    expect(dist).toBeLessThan(0.35); // fails threshold
  });

  it("Test 4: structurally distinct arrays return distance ≥ 0.35", () => {
    const fpA = computeStructuralFingerprint(IR_LAYOUT_A);
    const fpB = computeStructuralFingerprint(IR_LAYOUT_B);
    const dist = pairwiseDistance(fpA, fpB);
    expect(dist).toBeGreaterThanOrEqual(0.35);
  });

  it("Test 5: computePairwiseDistances([a, b, c]) returns 3 pairwise distances (nC2 for n=3)", () => {
    const c = [
      { type: "rectangle", x: 0, y: 0, w: 800, h: 50, label: "TopBar" },
      { type: "rectangle", x: 0, y: 200, w: 200, h: 600, label: "LeftPanel" },
    ];
    const pairs = computePairwiseDistances([IR_LAYOUT_A, IR_LAYOUT_B, c]);
    expect(Array.isArray(pairs)).toBe(true);
    expect(pairs).toHaveLength(3); // C(3,2) = 3
    for (const pair of pairs) {
      expect(pair).toHaveProperty("i");
      expect(pair).toHaveProperty("j");
      expect(pair).toHaveProperty("distance");
      expect(typeof pair.distance).toBe("number");
    }
    // Indices must be unique pairs
    const seenPairs = new Set(pairs.map((p: any) => `${p.i}-${p.j}`));
    expect(seenPairs.size).toBe(3);
  });
});

describe("T-03-01-A: wireframe-diversity.mjs — Excalidraw v2 width/height keys (Finding 4)", () => {
  it("Test 6: two wireframes differing only in element widths score diversity > 0 (Excalidraw v2 width/height keys)", () => {
    // Before the fix, `el.w` and `el.h` were used instead of `el.width`/`el.height`.
    // Excalidraw v2 elements use `width` and `height`. With the old code, all elements
    // appeared to have zero size — bounding boxes were computed from top-left corners only.
    // Same-position, different-size elements would score distance ≈ 0 (incorrectly).
    const SAME_POSITION_NARROW = [
      { type: "rectangle", x: 0, y: 0, width: 50, height: 50, label: "A" },
      { type: "rectangle", x: 200, y: 0, width: 50, height: 50, label: "B" },
      { type: "rectangle", x: 400, y: 0, width: 50, height: 50, label: "C" },
    ];
    const SAME_POSITION_WIDE = [
      { type: "rectangle", x: 0, y: 0, width: 450, height: 400, label: "A" },
      { type: "rectangle", x: 200, y: 0, width: 350, height: 400, label: "B" },
      { type: "rectangle", x: 400, y: 0, width: 250, height: 400, label: "C" },
    ];

    const fpNarrow = computeStructuralFingerprint(SAME_POSITION_NARROW);
    const fpWide = computeStructuralFingerprint(SAME_POSITION_WIDE);
    const dist = pairwiseDistance(fpNarrow, fpWide);

    // With the fix (width/height), the cell-center positions differ because
    // center = x + width/2 — wide elements' centers land in different grid cells.
    // The distance should be meaningfully > 0 (was 0 before the fix).
    expect(dist).toBeGreaterThan(0);
  });

  it("Test 7: Excalidraw v2 elements (width/height) and IR elements (w/h) both produce non-zero fingerprints", () => {
    // IR format uses w/h; Excalidraw v2 format uses width/height.
    // Both must produce non-degenerate fingerprints.
    const excalidrawElements = [
      { type: "rectangle", x: 0, y: 0, width: 200, height: 100 },
      { type: "rectangle", x: 0, y: 200, width: 200, height: 300 },
    ];
    const irElements = [
      { type: "rectangle", x: 0, y: 0, w: 200, h: 100, label: "Header" },
      { type: "rectangle", x: 0, y: 200, w: 200, h: 300, label: "Body" },
    ];

    const fpExcalidraw = computeStructuralFingerprint(excalidrawElements);
    const fpIr = computeStructuralFingerprint(irElements);

    // Both should produce equivalent fingerprints (same positions, same sizes)
    expect(fpExcalidraw.elementCount).toBe(fpIr.elementCount);
    // Grid distributions should be equal (same geometry regardless of key name)
    for (let i = 0; i < 9; i++) {
      expect(fpExcalidraw.gridHistogram[i]).toBeCloseTo(fpIr.gridHistogram[i], 6);
    }
  });
});

describe("T-03-01-A: lint-determinism checks", () => {
  it("Test 6: lint-determinism scan of new scripts reports zero violations", async () => {
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    // Scan just the two new scripts
    const { ok, violations } = await lintDeterminism({
      scope: resolve(dirname(fileURLToPath(import.meta.url)), "../../assets/scripts"),
    });
    // Filter violations to only new files
    const relevant = violations.filter(
      (v: any) =>
        v.file.includes("excalidraw-render") || v.file.includes("wireframe-diversity")
    );
    expect(relevant).toHaveLength(0);
  });
});
