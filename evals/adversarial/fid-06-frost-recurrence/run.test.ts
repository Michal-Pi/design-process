// evals/adversarial/fid-06-frost-recurrence/run.test.ts
// FID-06 adversarial CI test: component at 2x total recurrence is blocked by gate-stage-5b.mjs.
//
// Builds a fixture where the "button" component appears exactly 2x:
// - 1x in wireframes/login/v3.excalidraw (element label "Button")
// - 1x in interactions/login.spec.md (body text "Button component")
//
// Asserts: gate returns failed_after_repair, reason:'frost-recurrence-not-met',
//          with finding 5b-frost-002 (checkId, status:'fail').
//
// D-70: The Frost ≥3x recurrence check is a HARD BLOCKER in Phase 3.
// D-61: Count is per-gate-run (not persisted) — computed fresh from filesystem.
//
// Source: CONTEXT.md D-61, D-70; PLAN.md T-03-03-B
// Implements: FID-06, ROADMAP SC-3, ACCEPT-02 adversarial pattern

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// @ts-ignore TS7016: no declaration for .mjs scripts
const gateModule: any = await import("../../../assets/scripts/gates/stage-5b.mjs");
const { runStage5bGate } = gateModule;

// @ts-ignore TS7016: no declaration for .mjs fixture builder
const fixtureModule: any = await import("./fixture-builder.mjs");
const { buildFid06Fixture } = fixtureModule;

describe("FID-06 adversarial: Frost recurrence BLOCKER (D-70)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "fid-06-frost-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("component 'button' at 2x total recurrence returns failed_after_repair with 5b-frost-002 BLOCKER", async () => {
    // Build fixture: button appears 2x total (1 wireframe + 1 spec)
    // This is intentionally below the D-70 threshold of ≥3x
    await buildFid06Fixture(tmpDir);

    const result = await runStage5bGate(tmpDir);

    // D-70: count < 3 → hard BLOCKER (failed_after_repair, NOT informational)
    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toBe("frost-recurrence-not-met");

    // Must have finding 5b-frost-002 with correct schema shape (Lesson 1)
    expect(Array.isArray(result.findings)).toBe(true);

    const frostFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-frost-002"
    );
    expect(frostFinding).toBeDefined();

    // Schema compliance: checkId (not findingId), status:'fail', evidence: string
    expect(frostFinding.checkId).toBe("5b-frost-002");
    expect(frostFinding.status).toBe("fail");
    expect(typeof frostFinding.evidence).toBe("string");
    expect(frostFinding.evidence.length).toBeGreaterThan(0);

    // Evidence must reference the component name and count
    expect(frostFinding.evidence.toLowerCase()).toMatch(/button/i);

    // Schema violation: must NOT have findingId (wrong field name)
    expect(frostFinding.findingId).toBeUndefined();

    // Schema violation: must NOT have severity (not in Finding schema)
    expect(frostFinding.severity).toBeUndefined();

    // Schema violation: must NOT have fixRecipe (not in Finding schema)
    expect(frostFinding.fixRecipe).toBeUndefined();
  });

  it("fixture details: 'button' component appears exactly 2x in the adversarial fixture", async () => {
    // This test verifies the fixture itself is constructed correctly
    // (ensures the adversarial intent is preserved for CI reproducibility)
    await buildFid06Fixture(tmpDir);

    // Verify fixture structure
    const { existsSync } = await import("node:fs");
    const { join: joinPath } = await import("node:path");

    // wireframes/login/v3.excalidraw must exist
    expect(existsSync(joinPath(tmpDir, "wireframes", "login", "v3.excalidraw"))).toBe(true);

    // interactions/login.spec.md must exist
    expect(existsSync(joinPath(tmpDir, "interactions", "login.spec.md"))).toBe(true);

    // tokens.json must have 'button' in component-tier
    expect(existsSync(joinPath(tmpDir, "tokens.json"))).toBe(true);

    // The fixture intentionally has button at 2x (not ≥3x)
    // If the gate does NOT block, the adversarial fixture is broken
    const result = await runStage5bGate(tmpDir);
    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toBe("frost-recurrence-not-met");
  });
});
