// tests/governance/spine-linearity.test.ts
// Tests for SPINE linearity check (SPINE-04): no artifact may depend on
// artifacts from a higher stage in the Garrett spine.
// RED phase — fails until Task 1 implementation exists.
// Implements: SPINE-04

import { describe, it, expect } from "vitest";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// @ts-ignore TS7016: no declaration file for .mjs script
const { lintSpineLinearity } = await import("../../assets/scripts/lint-spine-linearity.mjs");

// @ts-ignore TS7016: no declaration file for .mjs script
const { canDependOn, STAGE_ORDER } = await import("../../schemas/src/spine.ts");

describe("canDependOn helper", () => {
  it("allows same-stage dependency", () => {
    expect(canDependOn("1", "1")).toBe(true);
  });

  it("allows depending on earlier stage", () => {
    expect(canDependOn("3", "1")).toBe(true);
    expect(canDependOn("5a", "1")).toBe(true);
  });

  it("rejects depending on later stage", () => {
    expect(canDependOn("1", "3")).toBe(false);
    expect(canDependOn("1", "5a")).toBe(false);
  });

  it("stage-0 can only depend on stage-0", () => {
    expect(canDependOn("0", "0")).toBe(true);
    expect(canDependOn("0", "1")).toBe(false);
  });

  it("STAGE_ORDER is ['0','1','2','3','4','5a','5b']", () => {
    expect(STAGE_ORDER).toEqual(["0", "1", "2", "3", "4", "5a", "5b"]);
  });
});

describe("lintSpineLinearity: clean design dir", () => {
  it("returns { valid: true, violations: [] } for clean dir", async () => {
    const designDir = join(ROOT, "tests/fixtures/governance/design-dir-spine-clean");
    const result = await lintSpineLinearity(designDir);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});

describe("lintSpineLinearity: violation dir", () => {
  it("returns { valid: false } when stage-1 artifact depends on stage-3", async () => {
    const designDir = join(ROOT, "tests/fixtures/governance/design-dir-spine-violation");
    const result = await lintSpineLinearity(designDir);
    expect(result.valid).toBe(false);
  });

  it("reports the violating artifact and stages in the violations array", async () => {
    const designDir = join(ROOT, "tests/fixtures/governance/design-dir-spine-violation");
    const result = await lintSpineLinearity(designDir);
    expect(result.violations.length).toBeGreaterThan(0);
    const v = result.violations[0];
    expect(v).toHaveProperty("artifact");
    expect(v).toHaveProperty("stage");
    expect(v).toHaveProperty("violatingStage");
  });
});
