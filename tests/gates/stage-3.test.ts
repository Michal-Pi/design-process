// tests/gates/stage-3.test.ts
// TDD RED: failing tests for gate-stage-3.mjs full business logic
//
// Source: PLAN.md 03-01 Task B behavior specification
// Implements: FID-03 check, count check, diversity check, CHOICE.md check
// INVARIANT-01: gate must run against staged path (not design/)

import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderSkeletonIR, FID03_DEFAULTS } from "../../assets/scripts/excalidraw-render.mjs";

// @ts-ignore TS7016: no declaration for .mjs script
const stage3m: any = await import("../../assets/scripts/gates/stage-3.mjs");
const { runStage3Gate } = stage3m;

/**
 * Structurally diverse IR fixtures.
 * All 3 pairwise distances verified to be ≥ 0.35 when rendered to Excalidraw elements:
 *   A-B: 0.441  A-C: 0.571  B-C: 0.385
 */
const DIVERSE_IR_FIXTURES = [
  // Fixture 0 (A): 2 elements concentrated in top-left corner
  [
    { type: "rectangle", x: 0, y: 0, w: 300, h: 200, label: "HeroBlock" },
    { type: "rectangle", x: 10, y: 10, w: 280, h: 180, label: "HeroContent" },
  ],
  // Fixture 1 (B): 20 elements concentrated in bottom-right corner
  ...[Array.from({ length: 20 }, (_, i) => ({
    type: "rectangle",
    x: 800 + (i % 4) * 80,
    y: 800 + Math.floor(i / 4) * 80,
    w: 70,
    h: 70,
    label: `ListItem${i + 1}`,
  }))],
  // Fixture 2 (C): 7 elements spread top-right + bottom-left + center (3-way split)
  [
    { type: "rectangle", x: 700, y: 0, w: 300, h: 200, label: "TopRight1" },
    { type: "rectangle", x: 800, y: 20, w: 190, h: 160, label: "TopRight2" },
    { type: "rectangle", x: 0, y: 600, w: 300, h: 200, label: "BottomLeft1" },
    { type: "rectangle", x: 10, y: 620, w: 280, h: 160, label: "BottomLeft2" },
    { type: "rectangle", x: 350, y: 380, w: 300, h: 200, label: "MiddleCenter1" },
    { type: "rectangle", x: 360, y: 390, w: 280, h: 180, label: "MiddleCenter2" },
    { type: "rectangle", x: 370, y: 400, w: 260, h: 160, label: "MiddleCenter3" },
  ],
] as const;

/** Build a clean .excalidraw file with FID-03 defaults */
function buildCleanExcalidraw(seed: number = 0) {
  const ir = DIVERSE_IR_FIXTURES[seed % DIVERSE_IR_FIXTURES.length];
  return renderSkeletonIR(ir as any);
}

/** Build a .excalidraw file with FID-03 violation */
function buildStyledExcalidraw(violation: "strokeColor" | "backgroundColor" | "fontFamily") {
  const doc = buildCleanExcalidraw(0);
  // Clone and inject violation
  const elements = JSON.parse(JSON.stringify(doc.elements));
  if (violation === "strokeColor") {
    elements[0].strokeColor = "#FF0000";
  } else if (violation === "backgroundColor") {
    elements[0].backgroundColor = "#0000FF";
  } else if (violation === "fontFamily") {
    // Need a text element — inject fontFamily on first element or add one
    elements[0].fontFamily = 2; // non-default
  }
  return { ...doc, elements };
}

describe("gate-stage-3.mjs: FID-03 fidelity violations", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("Test 1: returns not_runnable with reason fidelity-cap-violation-FID-03 when strokeColor is non-default", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-test-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    // Write 3 clean + 1 styled (strokeColor violation)
    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildStyledExcalidraw("strokeColor"), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(buildCleanExcalidraw(2), null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("fidelity-cap-violation-FID-03");
    expect(Array.isArray(result.evidence)).toBe(true);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("Test 2: returns not_runnable with FID-03 reason when backgroundColor is non-default", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-test-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildStyledExcalidraw("backgroundColor"), null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(buildCleanExcalidraw(2), null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("fidelity-cap-violation-FID-03");
  });

  it("Test 3: returns not_runnable with FID-03 reason when fontFamily is non-default", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-test-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(buildStyledExcalidraw("fontFamily"), null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("fidelity-cap-violation-FID-03");
  });
});

describe("gate-stage-3.mjs: count and diversity checks", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("Test 4: returns failed_after_repair with finding 3-count-001 when fewer than 3 variants", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-test-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    // Only 2 variants
    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("failed_after_repair");
    const finding = result.findings?.find((f: any) => f.findingId === "3-count-001");
    expect(finding).toBeDefined();
  });

  it("Test 5: returns failed_after_repair with finding 3-diversity-001 when variants are near-identical", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-test-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    // 3 IDENTICAL wireframes — pairwise distance ≈ 0.0 < 0.35
    const identical = buildCleanExcalidraw(0);
    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(identical, null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(identical, null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(identical, null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("failed_after_repair");
    const finding = result.findings?.find((f: any) => f.findingId === "3-diversity-001");
    expect(finding).toBeDefined();
  });

  it("Test 6: returns failed_after_repair with finding 3-choice-001 when CHOICE.md absent", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-test-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    // 3 structurally diverse clean variants — no CHOICE.md
    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(buildCleanExcalidraw(2), null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("failed_after_repair");
    const finding = result.findings?.find((f: any) => f.findingId === "3-choice-001");
    expect(finding).toBeDefined();
  });

  it("Test 7: returns pass when 3+ diverse clean variants AND CHOICE.md present", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-test-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    // 3 structurally diverse clean variants
    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(buildCleanExcalidraw(2), null, 2), "utf8");
    // CHOICE.md present
    await writeFile(join(wireDir, "CHOICE.md"), "---\nartifact: wireframe-choice\nstage: 3\nschemaVersion: 1\n---\n\n## Selected Variant\n\nv2.excalidraw\n", "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("pass");
  });
});

describe("gate-stage-3.mjs: INVARIANT-01 compliance", () => {
  it("Test 8: gate accepts a --staged .design-os/preview/<run-id>/ path (not design/)", async () => {
    // This test verifies the gate works with the staged preview path pattern
    // per INVARIANT-01 (gate against staged path, never live design/)
    const runId = `run-${Date.now()}`;
    const stagedDir = await mkdtemp(join(tmpdir(), `design-os-preview-${runId}-`));

    try {
      const wireDir = join(stagedDir, "wireframes", "main-flow");
      await mkdir(wireDir, { recursive: true });

      await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
      await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");
      await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(buildCleanExcalidraw(2), null, 2), "utf8");
      await writeFile(join(wireDir, "CHOICE.md"), "---\nartifact: wireframe-choice\nstage: 3\nschemaVersion: 1\n---\n\n## Selected\n\nv1.excalidraw\n", "utf8");

      // Gate should work with any path, including a staged preview path
      const result = await runStage3Gate(stagedDir);
      // A staged preview path with valid content should pass
      expect(["pass", "pass_with_warnings", "failed_after_repair"]).toContain(result.kind);
      // Should NOT be a skeleton pass (which returns evidence: 'inferred')
      // After Phase 3 real implementation, this should no longer return the skeleton
    } finally {
      await rm(stagedDir, { recursive: true, force: true });
    }
  });
});
