// tests/gates/stage-3-schema.test.ts
// Schema conformance tests for gate-stage-3.mjs GateResult output.
//
// Finding 1 fix verification: gate-stage-3 must emit GateResult shapes that
// pass Zod validation (GateResult discriminated union) for both the
// not_runnable (FID-03 violation) and failed_after_repair (diversity fail) paths.
//
// Finding 3 fix verification: a corrupted .excalidraw file in the diversity pass
// must return a failed_after_repair GateResult, not throw an exception.
//
// Source: codex-review findings 1 and 3 on plan 03-01

import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GateResult } from "../../schemas/src/gate-result.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// @ts-ignore TS7016: no declaration for .mjs script
const stage3m: any = await import("../../assets/scripts/gates/stage-3.mjs");
const { runStage3Gate } = stage3m;

// @ts-ignore TS7016: no declaration for .mjs script
const renderMod: any = await import("../../assets/scripts/excalidraw-render.mjs");
const { renderSkeletonIR } = renderMod;

/**
 * Structurally diverse IR fixtures (identical to stage-3.test.ts DIVERSE_IR_FIXTURES).
 * All pairwise distances verified ≥ 0.35 with the corrected width/height dimension keys.
 */
const DIVERSE_IR_FIXTURES = [
  // A: top-heavy layout
  [
    { type: "rectangle", x: 0, y: 0, w: 1200, h: 80, label: "TopBar" },
    { type: "rectangle", x: 0, y: 90, w: 1200, h: 40, label: "SubBar" },
    { type: "rectangle", x: 0, y: 140, w: 1200, h: 600, label: "Main" },
    { type: "rectangle", x: 0, y: 750, w: 1200, h: 50, label: "Footer" },
  ],
  // B: bottom-heavy card grid
  Array.from({ length: 16 }, (_, i) => ({
    type: "rectangle",
    x: (i % 4) * 300,
    y: 400 + Math.floor(i / 4) * 100,
    w: 280,
    h: 80,
    label: `Card${i}`,
  })),
  // C: left rail + content panel
  [
    { type: "rectangle", x: 0, y: 0, w: 60, h: 800, label: "NavRail" },
    { type: "rectangle", x: 70, y: 0, w: 1130, h: 800, label: "Content" },
  ],
];

function buildCleanExcalidraw(seed: number = 0) {
  const ir = DIVERSE_IR_FIXTURES[seed % DIVERSE_IR_FIXTURES.length];
  return renderSkeletonIR(ir as any);
}

function buildStyledExcalidraw() {
  const doc = buildCleanExcalidraw(0);
  const elements = JSON.parse(JSON.stringify(doc.elements));
  elements[0].strokeColor = "#FF0000"; // FID-03 violation
  return { ...doc, elements };
}

/** Validate a gate result against the GateResult Zod discriminated union. */
function assertSchemaValid(result: unknown): void {
  const parsed = GateResult.safeParse(result);
  if (!parsed.success) {
    throw new Error(`GateResult schema validation failed:\n${JSON.stringify(parsed.error.issues, null, 2)}`);
  }
}

describe("stage-3 GateResult schema conformance (Finding 1)", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("not_runnable (FID-03 violation) result passes GateResult schema validation", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-schema-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildStyledExcalidraw(), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(buildCleanExcalidraw(2), null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("not_runnable");
    // Schema: not_runnable has only { kind, reason } — no evidence, no findings
    expect(result.reason).toBe("fidelity-cap-violation-FID-03");
    expect(result).not.toHaveProperty("evidence");
    expect(result).not.toHaveProperty("findings");
    assertSchemaValid(result);
  });

  it("failed_after_repair (diversity violation) result passes GateResult schema validation", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-schema-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    // Three identical wireframes — diversity distance ≈ 0 < 0.35
    const identical = buildCleanExcalidraw(0);
    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(identical, null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(identical, null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(identical, null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toBe("insufficient-diversity");
    // Each finding must have checkId + status (pass|fail|na); no extra top-level fields
    expect(Array.isArray(result.findings)).toBe(true);
    for (const f of result.findings) {
      expect(f).toHaveProperty("checkId");
      expect(["pass", "fail", "na"]).toContain(f.status);
      expect(f).not.toHaveProperty("findingId");
      expect(f).not.toHaveProperty("severity");
      expect(f).not.toHaveProperty("fixRecipe");
      expect(f).not.toHaveProperty("stage");
    }
    assertSchemaValid(result);
  });

  it("failed_after_repair (count < 3) result passes GateResult schema validation", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-schema-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("failed_after_repair");
    assertSchemaValid(result);
  });

  it("pass result passes GateResult schema validation", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-schema-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), JSON.stringify(buildCleanExcalidraw(2), null, 2), "utf8");
    await writeFile(
      join(wireDir, "CHOICE.md"),
      "---\nartifact: wireframe-choice\nstage: 3\nschemaVersion: 1\n---\n\n## Selected\n\nv1.excalidraw\n",
      "utf8",
    );

    const result = await runStage3Gate(stagedDir);
    expect(result.kind).toBe("pass");
    assertSchemaValid(result);
  });
});

describe("stage-3 corrupted excalidraw JSON handling (Finding 3)", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("returns failed_after_repair (not a thrown exception) when one .excalidraw file is truncated/corrupt", async () => {
    const stagedDir = await mkdtemp(join(tmpdir(), "stage3-corrupt-"));
    tmpDirs.push(stagedDir);
    const wireDir = join(stagedDir, "wireframes", "screen");
    await mkdir(wireDir, { recursive: true });

    // v1 and v2 are valid; v3 is truncated — passes count check and FID-03 step
    // (step 2 silently skips parse errors), but fails in the diversity-pass re-parse.
    await writeFile(join(wireDir, "v1.excalidraw"), JSON.stringify(buildCleanExcalidraw(0), null, 2), "utf8");
    await writeFile(join(wireDir, "v2.excalidraw"), JSON.stringify(buildCleanExcalidraw(1), null, 2), "utf8");
    await writeFile(join(wireDir, "v3.excalidraw"), '{"type":"excalidraw","elements":[{"strokeColor":"#1e1e1e"', "utf8");

    // Must NOT throw — must return a GateResult
    let result: any;
    let threw = false;
    try {
      result = await runStage3Gate(stagedDir);
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(result).toBeDefined();
    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toBe("malformed-excalidraw-json");

    // The finding must identify the corrupt file path
    const finding = result.findings?.find((f: any) => f.checkId === "3-diversity-parse-001");
    expect(finding).toBeDefined();
    expect(finding?.status).toBe("fail");
    expect(finding?.evidence).toContain("v3.excalidraw");

    // Must also pass schema validation
    assertSchemaValid(result);
  });
});
