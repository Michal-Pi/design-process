// tests/schemas/gate-result.test.ts
// Tests for GateResult discriminated union.
// Validates all 5 terminal states including not_runnable (GATE-07).

import { describe, it, expect } from "vitest";
import { GateResult } from "../../schemas/src/gate-result.js";

describe("GateResult discriminated union", () => {
  it("accepts 'pass' kind with evidence and findings", () => {
    const result = {
      kind: "pass",
      evidence: "validated",
      findings: [],
    };
    expect(() => GateResult.parse(result)).not.toThrow();
    const parsed = GateResult.parse(result);
    expect(parsed.kind).toBe("pass");
  });

  it("rejects 'pass' kind that omits 'evidence'", () => {
    const invalid = {
      kind: "pass",
      findings: [],
    };
    const result = GateResult.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("evidence"))).toBe(true);
    }
  });

  it("accepts 'pass_with_warnings' kind with warnings array", () => {
    const result = {
      kind: "pass_with_warnings",
      evidence: "proto",
      findings: [],
      warnings: ["Synthetic persona used — no interviews validated"],
    };
    expect(() => GateResult.parse(result)).not.toThrow();
    const parsed = GateResult.parse(result);
    if (parsed.kind === "pass_with_warnings") {
      expect(parsed.warnings.length).toBe(1);
    }
  });

  it("accepts 'failed_after_repair' kind with reason and findings", () => {
    const result = {
      kind: "failed_after_repair",
      reason: "Automated repair could not fix missing provenance field",
      findings: [
        {
          checkId: "PROV-CHECK-01",
          status: "fail",
          evidence: "provenance field is missing",
          citation: "D-07",
        },
      ],
    };
    expect(() => GateResult.parse(result)).not.toThrow();
  });

  it("accepts 'user_overridden' kind with reason, overrideBanner, and findings", () => {
    const result = {
      kind: "user_overridden",
      reason: "PM approved override — deadline constraint",
      overrideBanner: "⚠️ Gate 1 was manually overridden by user on 2026-05-24",
      findings: [],
    };
    expect(() => GateResult.parse(result)).not.toThrow();
    const parsed = GateResult.parse(result);
    if (parsed.kind === "user_overridden") {
      expect(parsed.overrideBanner).toBeTruthy();
    }
  });

  it("accepts 'not_runnable' kind with only a reason", () => {
    const result = {
      kind: "not_runnable",
      reason: "stage-4-artifacts-absent",
    };
    expect(() => GateResult.parse(result)).not.toThrow();
    const parsed = GateResult.parse(result);
    expect(parsed.kind).toBe("not_runnable");
    if (parsed.kind === "not_runnable") {
      expect(parsed.reason).toBe("stage-4-artifacts-absent");
    }
  });

  it("rejects an object with an unknown 'kind'", () => {
    const invalid = {
      kind: "unknown_state",
      reason: "something",
    };
    const result = GateResult.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects 'not_runnable' with no reason field", () => {
    const invalid = {
      kind: "not_runnable",
    };
    const result = GateResult.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("reason"))).toBe(true);
    }
  });
});
