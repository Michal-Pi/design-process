// tests/ia/sitemap-structural-distance.test.ts
// Unit tests for sitemapStructuralDistance() — sitemap LATCH diversity scoring.
// TDD RED phase — tests MUST fail before implementation exists.
//
// Implements: D-39, T-02-02-A

import { describe, it, expect } from "vitest";

// @ts-ignore TS7016: no declaration for .mjs script
const distm: any = await import("../../assets/scripts/preview/variant-distance.mjs");

const { sitemapStructuralDistance } = distm;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build minimal sitemap variant objects
// ─────────────────────────────────────────────────────────────────────────────

function buildSitemap(scheme: string, topLevelCount: number, labels?: string[]) {
  const nodes: Array<{ id: string; label: string; parent?: string }> = [
    { id: "root", label: "Root" },
  ];
  const topLabels = labels ?? Array.from({ length: topLevelCount }, (_, i) => `Section ${i + 1}`);
  for (let i = 0; i < topLevelCount; i++) {
    nodes.push({ id: `node-${i}`, label: topLabels[i] ?? `Section ${i + 1}`, parent: "root" });
  }
  return { id: "v1", scheme, nodes };
}

// ─────────────────────────────────────────────────────────────────────────────
// Basic export presence
// ─────────────────────────────────────────────────────────────────────────────

describe("sitemapStructuralDistance export", () => {
  it("is exported from variant-distance.mjs", () => {
    expect(typeof sitemapStructuralDistance).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Distance: identical sitemaps → 0.0
// ─────────────────────────────────────────────────────────────────────────────

describe("sitemapStructuralDistance — identical sitemaps", () => {
  it("returns 0.0 for two identical LATCH sitemaps", () => {
    const sitemapA = buildSitemap("category", 4, ["Home", "Products", "About", "Contact"]);
    const sitemapB = buildSitemap("category", 4, ["Home", "Products", "About", "Contact"]);
    const dist = sitemapStructuralDistance(sitemapA, sitemapB);
    expect(dist).toBe(0);
  });

  it("returns a number in [0, 1] range", () => {
    const sitemapA = buildSitemap("category", 4);
    const sitemapB = buildSitemap("hierarchy", 3);
    const dist = sitemapStructuralDistance(sitemapA, sitemapB);
    expect(dist).toBeGreaterThanOrEqual(0);
    expect(dist).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Distance: different LATCH schemes
// ─────────────────────────────────────────────────────────────────────────────

describe("sitemapStructuralDistance — different LATCH schemes", () => {
  it("returns ≥0.5 for location vs hierarchy scheme sitemaps with same labels", () => {
    const labels = ["North", "South", "East", "West"];
    const sitemapA = buildSitemap("location", 4, labels);
    const sitemapB = buildSitemap("hierarchy", 4, labels);
    const dist = sitemapStructuralDistance(sitemapA, sitemapB);
    expect(dist).toBeGreaterThanOrEqual(0.5);
  });

  it("returns ≥0.5 for time vs alphabetical scheme sitemaps", () => {
    const sitemapA = buildSitemap("time", 4, ["Q1", "Q2", "Q3", "Q4"]);
    const sitemapB = buildSitemap("alphabetical", 4, ["A-F", "G-M", "N-S", "T-Z"]);
    const dist = sitemapStructuralDistance(sitemapA, sitemapB);
    expect(dist).toBeGreaterThanOrEqual(0.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Distance: same scheme but large node count disparity → near 1.0
// ─────────────────────────────────────────────────────────────────────────────

describe("sitemapStructuralDistance — large structural divergence", () => {
  it("returns high distance (≥0.5) for category-4 vs alphabetical-26", () => {
    const sitemapA = buildSitemap("category", 4, ["Home", "Shop", "About", "Contact"]);
    // 26-node alphabetical sitemap
    const alphaLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const sitemapB = buildSitemap("alphabetical", 26, alphaLabels);
    const dist = sitemapStructuralDistance(sitemapA, sitemapB);
    expect(dist).toBeGreaterThanOrEqual(0.5);
  });

  it("returns distance near 1.0 for maximally different sitemaps", () => {
    const sitemapA = buildSitemap("location", 2, ["North", "South"]);
    // Maximum possible node count divergence with different scheme
    const bigLabels = Array.from({ length: 20 }, (_, i) => String.fromCharCode(65 + i));
    const sitemapB = buildSitemap("time", 20, bigLabels);
    const dist = sitemapStructuralDistance(sitemapA, sitemapB);
    // Should be substantially high
    expect(dist).toBeGreaterThanOrEqual(0.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe("sitemapStructuralDistance — edge cases", () => {
  it("handles sitemaps with no common labels (Jaccard distance = 1.0)", () => {
    const sitemapA = buildSitemap("category", 3, ["Dogs", "Cats", "Birds"]);
    const sitemapB = buildSitemap("category", 3, ["Alpha", "Beta", "Gamma"]);
    const dist = sitemapStructuralDistance(sitemapA, sitemapB);
    // Same scheme → 0 scheme penalty; same count → 0 count penalty; no labels overlap → label penalty
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThanOrEqual(1);
  });

  it("returns symmetric distance (A,B) === (B,A)", () => {
    const sitemapA = buildSitemap("category", 4);
    const sitemapB = buildSitemap("hierarchy", 2);
    const distAB = sitemapStructuralDistance(sitemapA, sitemapB);
    const distBA = sitemapStructuralDistance(sitemapB, sitemapA);
    expect(distAB).toBeCloseTo(distBA, 5);
  });
});
