// tests/gates/stage-5b-frost.test.ts
// Unit tests for Stage 5b Frost recurrence hard BLOCKER (D-61, D-70, FID-06).
//
// Phase 3 upgrade: Frost ≥3× recurrence is now a hard BLOCKER (failed_after_repair),
// NOT the Phase 2 informational 'status:na' finding.
//
// Test 1: component appearing 2× (1 wireframe + 1 spec) → failed_after_repair, 5b-frost-002
// Test 2: component appearing exactly 3× → no frost-recurrence blocker
// Test 3: component 0× wireframe + 3× spec → no frost-recurrence blocker (count from both)
// Test 4: component 1× wireframe + 1× spec = 2× total → failed_after_repair, 5b-frost-002
//
// D-61: count per-component across both .excalidraw labels AND .spec.md body text.
// D-70: threshold = 3×; below threshold = hard BLOCKER (failed_after_repair).
// T-03-03-03: literal case-insensitive string match (not regex) for component name search.
//
// Implements: FID-06, D-61, D-70, ROADMAP SC-3

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// @ts-ignore TS7016: no declaration for .mjs scripts
const mod: any = await import("../../assets/scripts/gates/stage-5b.mjs");
const { runStage5bGate } = mod;

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal valid tokens.json with 'button' in component-tier */
const TOKENS_WITH_BUTTON_COMPONENT = `---
artifact: tokens
stage: 5a
evidence: INFERRED
schemaVersion: 1
generated: 2026-05-25T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "DTCG v2025.10 design tokens",
  "component": {
    "button": {
      "background": { "$type": "color", "$value": "oklch(60% 0.2 270)" }
    }
  }
}`;

/** Valid DESIGN.md with evidence:INFERRED */
const VALID_DESIGN_MD = `---
name: "Test Design"
tokens: 5000
version: "2026.04"
$extensions:
  design-os:
    evidence: "INFERRED"
    stage: "5b-lite"
    generatedBy: "design-os/systematize"
---

## Typography rationale

Inter for body text.

## Color system rationale

OKLCH primary.

## Spacing rationale

8px base unit.

## Component decisions

- **button**: Promoted component.
`;

/**
 * Build a minimal .excalidraw file JSON with one element labeled 'Button'.
 * @param {string} label - The component label to include
 */
function makeExcalidrawContent(label: string): string {
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: [
      {
        id: "el1",
        type: "rectangle",
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        label: label,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        fillStyle: "hachure",
      },
    ],
    appState: { gridSize: null, viewBackgroundColor: "#ffffff" },
    files: {},
  });
}

/**
 * Build a .spec.md file with component name referenced N times in the body.
 * @param {string} componentName - Component name to reference
 * @param {number} count - How many times to mention it
 */
function makeSpecMdContent(componentName: string, count: number): string {
  const mentions = Array(count).fill(`Uses the ${componentName} component.`).join("\n");
  return `---
artifact: interaction-spec
stage: 4
generated: 2026-05-25T00:00:00.000Z
schemaVersion: 1
---

# Interaction Spec

${mentions}
`;
}

/**
 * Set up a fixture where 'button' appears in exactly N wireframes + M specs.
 * Returns tmpDir.
 */
async function buildFrostFixture(
  tmpDir: string,
  wireframeCount: number,
  specCount: number
): Promise<void> {
  // tokens.json with 'button' promoted component
  await writeFile(join(tmpDir, "tokens.json"), TOKENS_WITH_BUTTON_COMPONENT);

  // DESIGN.md
  await writeFile(join(tmpDir, "DESIGN.md"), VALID_DESIGN_MD);

  // wireframes/ with N .excalidraw files each labeling 'Button' once
  if (wireframeCount > 0) {
    await mkdir(join(tmpDir, "wireframes"), { recursive: true });
    for (let i = 0; i < wireframeCount; i++) {
      await mkdir(join(tmpDir, "wireframes", `screen-${i}`), { recursive: true });
      await writeFile(
        join(tmpDir, "wireframes", `screen-${i}`, `v${i + 1}.excalidraw`),
        makeExcalidrawContent("Button")
      );
    }
  }

  // interactions/ with M .spec.md files each mentioning 'Button' once
  if (specCount > 0) {
    await mkdir(join(tmpDir, "interactions"), { recursive: true });
    for (let i = 0; i < specCount; i++) {
      await writeFile(
        join(tmpDir, "interactions", `screen-${i}.spec.md`),
        makeSpecMdContent("Button", 1)
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage5bGate — Frost recurrence hard BLOCKER (D-61, D-70)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "stage-5b-frost-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── Test 1: 1 wireframe + 1 spec = 2× total → BLOCKER ─────────────────────

  it("Test 1: component appearing 2× (1 wireframe + 1 spec) returns failed_after_repair with 5b-frost-002", async () => {
    await buildFrostFixture(tmpDir, 1, 1); // 1 wireframe + 1 spec = 2×

    const result = await runStage5bGate(tmpDir);

    // D-70: count < 3 → hard BLOCKER (failed_after_repair), NOT informational
    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toBe("frost-recurrence-not-met");

    // Must have finding 5b-frost-002 (BLOCKER) with checkId and fail status
    const frostFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-frost-002"
    );
    expect(frostFinding).toBeDefined();
    expect(frostFinding.status).toBe("fail");
    expect(frostFinding.evidence).toBeDefined();
    expect(typeof frostFinding.evidence).toBe("string");
    // Evidence must mention the component name and counts
    expect(frostFinding.evidence.toLowerCase()).toMatch(/button/i);
  });

  // ── Test 2: 3× total → no frost BLOCKER ───────────────────────────────────

  it("Test 2: component appearing exactly 3× returns no frost-recurrence-not-met finding", async () => {
    await buildFrostFixture(tmpDir, 2, 1); // 2 wireframes + 1 spec = 3×

    const result = await runStage5bGate(tmpDir);

    // 3× meets the threshold — no frost BLOCKER
    expect(result.kind).not.toBe("failed_after_repair");
    // Or if failed_after_repair, it must not be for frost reason
    if (result.kind === "failed_after_repair") {
      expect(result.reason).not.toBe("frost-recurrence-not-met");
    }

    // Must not have finding 5b-frost-002
    const frostFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-frost-002"
    );
    expect(frostFinding).toBeUndefined();
  });

  // ── Test 3: 0× wireframe + 3× spec = 3× total → no frost BLOCKER ──────────

  it("Test 3: component 0× in wireframes + 3× in specs = 3× total → no frost-recurrence blocker", async () => {
    await mkdir(join(tmpDir, "interactions"), { recursive: true });
    // 3 spec files each mentioning 'Button' once
    for (let i = 0; i < 3; i++) {
      await writeFile(
        join(tmpDir, "interactions", `screen-${i}.spec.md`),
        makeSpecMdContent("Button", 1)
      );
    }
    await writeFile(join(tmpDir, "tokens.json"), TOKENS_WITH_BUTTON_COMPONENT);
    await writeFile(join(tmpDir, "DESIGN.md"), VALID_DESIGN_MD);
    // No wireframes/ directory — all count from specs only

    const result = await runStage5bGate(tmpDir);

    // 3× total (from specs only) meets threshold — no frost BLOCKER
    expect(result.kind).not.toBe("failed_after_repair");
    if (result.kind === "failed_after_repair") {
      expect(result.reason).not.toBe("frost-recurrence-not-met");
    }

    const frostFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-frost-002"
    );
    expect(frostFinding).toBeUndefined();
  });

  // ── Test 4: 1× wireframe + 1× spec = 2× total → BLOCKER (same as Test 1) ──

  it("Test 4: component 1× wireframe + 1× spec = 2× total → failed_after_repair BLOCKER", async () => {
    await buildFrostFixture(tmpDir, 1, 1); // identical to Test 1

    const result = await runStage5bGate(tmpDir);

    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toBe("frost-recurrence-not-met");

    const frostFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-frost-002"
    );
    expect(frostFinding).toBeDefined();
    expect(frostFinding.status).toBe("fail");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema compliance: finding shape must match GateResult schema
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage5bGate — Frost BLOCKER finding schema compliance (Lesson 1)", () => {
  it("failed_after_repair findings use checkId (not findingId) and string evidence", async () => {
    const tmpDir2 = await mkdtemp(join(tmpdir(), "stage-5b-frost-schema-"));
    try {
      await buildFrostFixture(tmpDir2, 1, 1); // 2× — triggers BLOCKER

      const result = await runStage5bGate(tmpDir2);

      expect(result.kind).toBe("failed_after_repair");
      expect(Array.isArray(result.findings)).toBe(true);

      for (const finding of result.findings ?? []) {
        // Lesson 1: must use 'checkId', NOT 'findingId'
        expect(finding).toHaveProperty("checkId");
        expect(finding.findingId).toBeUndefined();

        // status must be 'pass' | 'fail' | 'na'
        expect(["pass", "fail", "na"]).toContain(finding.status);

        // evidence must be a string (not an object)
        if (finding.evidence !== undefined) {
          expect(typeof finding.evidence).toBe("string");
        }

        // severity is NOT a Finding schema field — must not be present
        expect(finding.severity).toBeUndefined();

        // fixRecipe is NOT a Finding schema field — must not be present
        expect(finding.fixRecipe).toBeUndefined();
      }
    } finally {
      await rm(tmpDir2, { recursive: true, force: true });
    }
  });
});
