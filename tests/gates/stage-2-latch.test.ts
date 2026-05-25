// tests/gates/stage-2-latch.test.ts
// Unit tests for gate-stage-2.mjs JTBD coverage, FID-02, orphan-node, Mermaid validity.
// TDD RED phase — tests MUST fail against the Phase 1 skeleton.
//
// Implements: D-39, D-40, FID-02, GATE-08, T-02-02-A

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const STAGE2_FIXTURES = resolve(ROOT, "tests/fixtures/stage2-gate");

// @ts-ignore TS7016: no declaration for .mjs script
const stage2m: any = await import("../../assets/scripts/gates/stage-2.mjs");

const { runStage2Gate } = stage2m;

// ─────────────────────────────────────────────────────────────────────────────
// not_runnable: no sitemap directory/file
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage2Gate — not_runnable", () => {
  it("returns not_runnable when design/ia/ directory is absent", async () => {
    const dir = resolve(STAGE2_FIXTURES, "no-sitemap");
    const result = await runStage2Gate(dir, {});
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("no-sitemap-found");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FID-02: color/font fields cause failed_after_repair (BLOCKER)
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage2Gate — FID-02 color/font rejection", () => {
  it("returns failed_after_repair when any sitemap node has a color field", async () => {
    const dir = resolve(STAGE2_FIXTURES, "sitemap-with-color");
    const result = await runStage2Gate(dir, {});
    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toMatch(/fidelity/i);
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it("includes finding id '2-fidelity-001' when color field present", async () => {
    const dir = resolve(STAGE2_FIXTURES, "sitemap-with-color");
    const result = await runStage2Gate(dir, {});
    const fid = result.findings?.find((f: any) => f.checkId === "2-fidelity-001");
    expect(fid).toBeDefined();
    expect(fid?.status).toBe("fail");
  });

  it("returns failed_after_repair when any sitemap node has a font field", async () => {
    const dir = resolve(STAGE2_FIXTURES, "sitemap-with-font");
    const result = await runStage2Gate(dir, {});
    expect(result.kind).toBe("failed_after_repair");
  });

  it("includes finding id '2-fidelity-002' when font field present", async () => {
    const dir = resolve(STAGE2_FIXTURES, "sitemap-with-font");
    const result = await runStage2Gate(dir, {});
    const fid = result.findings?.find((f: any) => f.checkId === "2-fidelity-002");
    expect(fid).toBeDefined();
    expect(fid?.status).toBe("fail");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JTBD coverage check
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage2Gate — JTBD coverage", () => {
  it("returns pass_with_warnings with coverage finding when a JTBD slug is missing from sitemap", async () => {
    // missing-jtbd fixture: checkout is in the bundle but not in the sitemap nodes
    const dir = resolve(STAGE2_FIXTURES, "missing-jtbd");
    const result = await runStage2Gate(dir, {});
    // Should still pass (not failed_after_repair) but with a warning/finding
    expect(result.kind).toBe("pass_with_warnings");
    const cov = result.findings?.find((f: any) => f.checkId === "2-coverage-001");
    expect(cov).toBeDefined();
  });

  it("valid sitemap with all JTBDs covered passes without coverage finding", async () => {
    const dir = resolve(STAGE2_FIXTURES, "valid-sitemap");
    const result = await runStage2Gate(dir, {});
    // Should not have coverage finding
    const cov = result.findings?.find((f: any) => f.checkId === "2-coverage-001");
    expect(cov).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Orphan node check
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage2Gate — orphan node check", () => {
  it("returns pass_with_warnings with orphan finding for node with no parent and no children", async () => {
    const dir = resolve(STAGE2_FIXTURES, "orphan-node");
    const result = await runStage2Gate(dir, {});
    expect(result.kind).toBe("pass_with_warnings");
    const orphan = result.findings?.find((f: any) => f.checkId === "2-orphan-001");
    expect(orphan).toBeDefined();
    expect(orphan?.status).toBe("fail");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mermaid validity check
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage2Gate — Mermaid validity", () => {
  it("returns failed_after_repair when a .flow.mmd file has invalid Mermaid syntax", async () => {
    const dir = resolve(STAGE2_FIXTURES, "invalid-mermaid");
    const result = await runStage2Gate(dir, {});
    expect(result.kind).toBe("failed_after_repair");
    const mermaidFinding = result.findings?.find((f: any) => f.checkId === "2-mermaid-001");
    expect(mermaidFinding).toBeDefined();
  }, 30_000); // mermaid-cli can be slow
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path: valid sitemap, valid Mermaid, all JTBDs covered
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage2Gate — happy path", () => {
  it("returns pass_with_warnings with evidence:proto when sitemap is valid and Mermaid flows are valid", async () => {
    const dir = resolve(STAGE2_FIXTURES, "valid-sitemap");
    const result = await runStage2Gate(dir, {});
    expect(result.kind).toBe("pass_with_warnings");
    expect(result.evidence).toBe("proto");
  }, 30_000);

  it("includes no-tree-test warning in pass_with_warnings result", async () => {
    const dir = resolve(STAGE2_FIXTURES, "valid-sitemap");
    const result = await runStage2Gate(dir, {});
    expect(result.kind).toBe("pass_with_warnings");
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    // Should mention tree-test
    const warningText = result.warnings.join(" ").toLowerCase();
    expect(warningText).toMatch(/tree.?test/i);
  }, 30_000);

  it("has no FID-02 or orphan findings on clean sitemap", async () => {
    const dir = resolve(STAGE2_FIXTURES, "valid-sitemap");
    const result = await runStage2Gate(dir, {});
    const fid = result.findings?.find((f: any) =>
      f.checkId === "2-fidelity-001" || f.checkId === "2-fidelity-002"
    );
    expect(fid).toBeUndefined();
    const orphan = result.findings?.find((f: any) => f.checkId === "2-orphan-001");
    expect(orphan).toBeUndefined();
  }, 30_000);
});
