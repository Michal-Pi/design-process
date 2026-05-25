// tests/gates/base.test.ts
// Tests for the base gate runner: runGate returns ajv-valid GateResult;
// override path produces user_overridden + banner text format.
// TDD RED phase — these tests MUST fail before implementation exists.

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES = resolve(ROOT, "tests/fixtures/design-dirs");

// @ts-ignore TS7016: no declaration for .mjs script
const gateBaseModule: any = await import("../../assets/scripts/gates/base.mjs");

const { runGate } = gateBaseModule;

const VALID_KINDS = [
  "pass",
  "pass_with_warnings",
  "failed_after_repair",
  "user_overridden",
  "not_runnable",
];

describe("runGate base", () => {
  it("exports runGate as a function", () => {
    expect(typeof runGate).toBe("function");
  });

  it("returns a GateResult with a valid kind for stage 1", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("1", withInteractions, {});
    expect(result).toHaveProperty("kind");
    expect(VALID_KINDS).toContain(result.kind);
  });

  it("returns a GateResult for stage 2", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("2", withInteractions, {});
    expect(result).toHaveProperty("kind");
    expect(VALID_KINDS).toContain(result.kind);
  });

  it("returns not_runnable for stage 5a with empty interactions/", async () => {
    const emptyInteractions = resolve(FIXTURES, "empty-interactions");
    const result = await runGate("5a", emptyInteractions, {});
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("stage-4-artifacts-absent");
  });

  it("override path produces user_overridden result", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("1", withInteractions, {
      overrideReason: "shipping anyway",
    });
    expect(result.kind).toBe("user_overridden");
    expect(result.reason).toBe("shipping anyway");
  });

  it("override path produces overrideBanner with correct format", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("1", withInteractions, {
      overrideReason: "shipping anyway",
    });
    expect(result.overrideBanner).toBe(
      "⚠ Gate stage-1 overridden: shipping anyway"
    );
  });

  it("override path produces findings array", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("1", withInteractions, {
      overrideReason: "shipping anyway",
    });
    expect(Array.isArray(result.findings)).toBe(true);
  });
});
