// tests/gates/stage-1-provenance.test.ts
// Unit tests for gate-stage-1.mjs provenance business logic.
// TDD RED phase — these tests MUST fail before the real implementation exists
// (the Phase 1 skeleton returns unconditional pass/inferred).
//
// Implements: D-37, RED-01..RED-04, T-02-01-A

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GateResult } from "../../schemas/src/gate-result.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const STAGE1_FIXTURES = resolve(ROOT, "tests/fixtures/stage1-gate");

// @ts-ignore TS7016: no declaration for .mjs script
const stage1m: any = await import("../../assets/scripts/gates/stage-1.mjs");

const { runStage1Gate, computeWorstProvenance } = stage1m;

describe("runStage1Gate — provenance logic", () => {
  describe("no-personas-found", () => {
    it("returns not_runnable when personas/ directory is absent", async () => {
      const dir = resolve(STAGE1_FIXTURES, "no-personas");
      const result = await runStage1Gate(dir, {});
      expect(result.kind).toBe("not_runnable");
      expect(result.reason).toBe("no-personas-found");
    });
  });

  describe("all-synthetic + no interviews", () => {
    it("returns pass_with_warnings when all personas are generated and no interviews/ dir", async () => {
      const dir = resolve(STAGE1_FIXTURES, "all-synthetic-no-interviews");
      const result = await runStage1Gate(dir, {});
      expect(result.kind).toBe("pass_with_warnings");
    });

    it("returns evidence:'proto' when all personas are generated", async () => {
      const dir = resolve(STAGE1_FIXTURES, "all-synthetic-no-interviews");
      const result = await runStage1Gate(dir, {});
      expect(result.evidence).toBe("proto");
    });

    it("includes finding RED-01 (fail) when all personas are synthetic", async () => {
      const dir = resolve(STAGE1_FIXTURES, "all-synthetic-no-interviews");
      const result = await runStage1Gate(dir, {});
      expect(Array.isArray(result.findings)).toBe(true);
      const red01 = result.findings.find(
        (f: any) => f.checkId === "RED-01"
      );
      expect(red01).toBeDefined();
      expect(red01.status).toBe("fail");
    });
  });

  describe("all-synthetic + empty interviews directory", () => {
    it("returns pass_with_warnings when all personas are generated and interviews/ is empty", async () => {
      const dir = resolve(STAGE1_FIXTURES, "all-synthetic-empty-interviews");
      const result = await runStage1Gate(dir, {});
      expect(result.kind).toBe("pass_with_warnings");
      expect(result.evidence).toBe("proto");
    });
  });

  describe("one-validated + non-empty interviews", () => {
    it("returns pass when at least one persona is validated and interviews/ has files", async () => {
      const dir = resolve(STAGE1_FIXTURES, "one-validated-with-interviews");
      const result = await runStage1Gate(dir, {});
      expect(result.kind).toBe("pass");
    });

    it("returns evidence:'validated' when validated persona + non-empty interviews present", async () => {
      const dir = resolve(STAGE1_FIXTURES, "one-validated-with-interviews");
      const result = await runStage1Gate(dir, {});
      expect(result.evidence).toBe("validated");
    });

    it("returns empty findings array when fully validated", async () => {
      const dir = resolve(STAGE1_FIXTURES, "one-validated-with-interviews");
      const result = await runStage1Gate(dir, {});
      expect(Array.isArray(result.findings)).toBe(true);
      expect(result.findings).toHaveLength(0);
    });
  });

  describe("one-validated + EMPTY interviews directory", () => {
    it("returns pass_with_warnings when validated persona exists but interviews/ is empty", async () => {
      const dir = resolve(STAGE1_FIXTURES, "one-validated-empty-interviews");
      const result = await runStage1Gate(dir, {});
      expect(result.kind).toBe("pass_with_warnings");
      expect(result.evidence).toBe("proto");
    });
  });

  describe("synthetic personas without ASSUMPTIONS.md", () => {
    it("includes finding RED-03 (fail) when ASSUMPTIONS.md is absent and all personas are synthetic", async () => {
      const dir = resolve(STAGE1_FIXTURES, "synthetic-no-assumptions");
      const result = await runStage1Gate(dir, {});
      expect(result.kind).toBe("pass_with_warnings");
      const red03 = result.findings.find(
        (f: any) => f.checkId === "RED-03"
      );
      expect(red03).toBeDefined();
      expect(red03.status).toBe("fail");
    });
  });
});

describe("pass_with_warnings GateResult schema compliance", () => {
  it("pass_with_warnings result satisfies GateResult schema (has warnings array)", async () => {
    const dir = resolve(STAGE1_FIXTURES, "all-synthetic-no-interviews");
    const result = await runStage1Gate(dir, {});
    expect(result.kind).toBe("pass_with_warnings");
    // Validate against the canonical GateResult discriminated union schema
    const parsed = GateResult.safeParse(result);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.kind === "pass_with_warnings") {
      expect(Array.isArray(parsed.data.warnings)).toBe(true);
    }
  });

  it("pass_with_warnings findings use checkId and status (not id/severity)", async () => {
    const dir = resolve(STAGE1_FIXTURES, "all-synthetic-no-interviews");
    const result = await runStage1Gate(dir, {});
    expect(result.kind).toBe("pass_with_warnings");
    for (const finding of result.findings) {
      expect(typeof finding.checkId).toBe("string");
      expect(finding.checkId.length).toBeGreaterThan(0);
      expect(["pass", "fail", "na"]).toContain(finding.status);
      // Old field names must NOT be present
      expect((finding as any).id).toBeUndefined();
      expect((finding as any).severity).toBeUndefined();
    }
  });
});

describe("computeWorstProvenance", () => {
  it("is exported from stage-1.mjs", () => {
    expect(typeof computeWorstProvenance).toBe("function");
  });

  it("returns 'generated' when input includes generated and validated", () => {
    expect(computeWorstProvenance(["generated", "generated", "validated"])).toBe(
      "generated"
    );
  });

  it("returns 'validated' when all inputs are validated", () => {
    expect(computeWorstProvenance(["validated", "validated"])).toBe("validated");
  });

  it("returns 'missing' when any input is missing (highest severity)", () => {
    expect(computeWorstProvenance(["validated", "missing"])).toBe("missing");
  });

  it("returns 'inferred' as worse than validated but better than generated", () => {
    expect(computeWorstProvenance(["inferred", "validated"])).toBe("inferred");
  });

  it("returns 'generated' as worse than inferred", () => {
    expect(computeWorstProvenance(["generated", "inferred"])).toBe("generated");
  });

  it("returns 'missing' as worst of all", () => {
    expect(
      computeWorstProvenance(["missing", "generated", "inferred", "validated"])
    ).toBe("missing");
  });

  it("handles single-element array", () => {
    expect(computeWorstProvenance(["validated"])).toBe("validated");
  });
});
