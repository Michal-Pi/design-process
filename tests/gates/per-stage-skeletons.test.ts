// tests/gates/per-stage-skeletons.test.ts
// Tests that each per-stage gate returns a valid GateResult and
// calls parseChecklist without throwing when checklist file is absent.
//
// Note: Stage 1 (runStage1Gate) was a skeleton in Phase 1. Phase 2 Plan 01 replaced
// it with real provenance-checking logic. Stage-1-specific assertions live in
// tests/gates/stage-1-provenance.test.ts.
//
// Note: Stage 2 (runStage2Gate) was a skeleton in Phase 1. Phase 2 Plan 02 replaced
// it with real JTBD coverage, FID-02, orphan-node, and Mermaid validity logic.
// Stage-2-specific assertions live in tests/gates/stage-2-latch.test.ts.
// This file covers stages 3-5b skeletons.

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES = resolve(ROOT, "tests/fixtures/design-dirs");

const VALID_KINDS = [
  "pass",
  "pass_with_warnings",
  "failed_after_repair",
  "user_overridden",
  "not_runnable",
];

// Load all 6 per-stage gate modules
// @ts-ignore TS7016: no declaration for .mjs scripts
const stage1m: any = await import("../../assets/scripts/gates/stage-1.mjs");
// @ts-ignore TS7016: no declaration for .mjs scripts
const stage2m: any = await import("../../assets/scripts/gates/stage-2.mjs");
// @ts-ignore TS7016: no declaration for .mjs scripts
const stage3m: any = await import("../../assets/scripts/gates/stage-3.mjs");
// @ts-ignore TS7016: no declaration for .mjs scripts
const stage4m: any = await import("../../assets/scripts/gates/stage-4.mjs");
// @ts-ignore TS7016: no declaration for .mjs scripts
const stage5am: any = await import("../../assets/scripts/gates/stage-5a.mjs");
// @ts-ignore TS7016: no declaration for .mjs scripts
const stage5bm: any = await import("../../assets/scripts/gates/stage-5b.mjs");

// Stages 3-5b are still Phase 1 skeletons; stages 1 and 2 have real logic (Phase 2).
const skeletonGates = [
  { name: "stage-3", fn: stage3m.runStage3Gate },
  { name: "stage-4", fn: stage4m.runStage4Gate },
  { name: "stage-5b", fn: stage5bm.runStage5bGate },
];

const withInteractions = resolve(FIXTURES, "with-interactions");

describe("per-stage gate skeletons (stages 2-5b)", () => {
  for (const { name, fn } of skeletonGates) {
    it(`${name}: exports the gate function`, () => {
      expect(typeof fn).toBe("function");
    });

    it(`${name}: returns a valid GateResult kind`, async () => {
      const result = await fn(withInteractions);
      expect(result).toHaveProperty("kind");
      expect(VALID_KINDS).toContain(result.kind);
    });

    it(`${name}: returns skeleton pass result`, async () => {
      const result = await fn(withInteractions);
      expect(result.kind).toBe("pass");
      expect(result.evidence).toBe("inferred");
      expect(Array.isArray(result.findings)).toBe(true);
    });

    it(`${name}: does not throw when checklist file is absent`, async () => {
      // Use a temp dir with no checklist files
      const noInteractionsDir = resolve(FIXTURES, "no-interactions-dir");
      await expect(fn(noInteractionsDir)).resolves.toBeDefined();
    });
  }

  it("stage-5a: exports runStage5aGate", () => {
    expect(typeof stage5am.runStage5aGate).toBe("function");
  });
});

// Stage 1: Phase 2 real gate — basic smoke test (full coverage in stage-1-provenance.test.ts)
describe("stage-1 gate (Phase 2 real implementation)", () => {
  it("exports runStage1Gate", () => {
    expect(typeof stage1m.runStage1Gate).toBe("function");
  });

  it("exports computeWorstProvenance", () => {
    expect(typeof stage1m.computeWorstProvenance).toBe("function");
  });

  it("returns not_runnable when no personas/ directory exists in fixture", async () => {
    // with-interactions fixture has no personas/ — expect not_runnable (Phase 2 behavior)
    const result = await stage1m.runStage1Gate(withInteractions, {});
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("no-personas-found");
  });
});

// Stage 2: Phase 2 real gate — basic smoke test (full coverage in stage-2-latch.test.ts)
describe("stage-2 gate (Phase 2 real implementation)", () => {
  it("exports runStage2Gate", () => {
    expect(typeof stage2m.runStage2Gate).toBe("function");
  });

  it("returns not_runnable when no ia/sitemap.json exists in fixture", async () => {
    // with-interactions fixture has no ia/ directory — expect not_runnable (Phase 2 behavior)
    const result = await stage2m.runStage2Gate(withInteractions, {});
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("no-sitemap-found");
  });
});
