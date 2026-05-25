// tests/gates/override-banner.test.ts
// Tests for the override banner format and presence on result.
// Source: CONTEXT.md D-11 (override path + overrideBanner propagation)

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES = resolve(ROOT, "tests/fixtures/design-dirs");

// @ts-ignore TS7016: no declaration for .mjs script
const gateBaseModule: any = await import("../../assets/scripts/gates/base.mjs");

const { runGate } = gateBaseModule;

describe("override banner", () => {
  it("overrideBanner follows the canonical format: ⚠ Gate stage-N overridden: <reason>", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("1", withInteractions, {
      overrideReason: "shipping anyway",
    });
    expect(result.overrideBanner).toMatch(
      /^⚠ Gate stage-\S+ overridden: .+$/
    );
  });

  it("overrideBanner includes the stage identifier", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("2", withInteractions, {
      overrideReason: "deadline",
    });
    expect(result.overrideBanner).toContain("stage-2");
  });

  it("overrideBanner includes the override reason", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("1", withInteractions, {
      overrideReason: "explicit approval from PM",
    });
    expect(result.overrideBanner).toContain("explicit approval from PM");
  });

  it("result.reason matches the override reason", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const reason = "customer demanded it";
    const result = await runGate("1", withInteractions, { overrideReason: reason });
    expect(result.reason).toBe(reason);
  });

  it("result.kind is user_overridden", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("5b", withInteractions, {
      overrideReason: "any reason",
    });
    expect(result.kind).toBe("user_overridden");
  });

  it("result.findings is an empty array on override", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const result = await runGate("1", withInteractions, {
      overrideReason: "any",
    });
    expect(result.findings).toEqual([]);
  });
});
