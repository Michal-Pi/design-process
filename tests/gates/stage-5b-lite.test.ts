// tests/gates/stage-5b-lite.test.ts
// Unit tests for gate-stage-5b.mjs lite-mode business logic (Plan 02-04 T-02-04-A).
//
// Covers all 7 behavior cases from PLAN.md:
// 1. tokens.json absent → not_runnable
// 2. DESIGN.md absent → pass_with_warnings (finding: 5b-missing-001 status:fail)
// 3. DESIGN.md present but fails schema → failed_after_repair (finding: 5b-schema-001 status:fail)
// 4. DESIGN.md present with evidence:validated (not INFERRED) → failed_after_repair (5b-evidence-002 BLOCKER)
// 5. tokens.json with ≥1 component-tier token → pass_with_warnings evidence:proto (5b-frost-001 INFO)
// 6. tokens.json with zero component-tier tokens → pass_with_warnings (5b-component-001 WARNING)
// 7. Valid tokens.json + valid DESIGN.md + evidence:INFERRED + ≥1 component → pass_with_warnings evidence:proto
//
// Implements: D-44, D-51, WF-07, MVPA-04

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// @ts-ignore TS7016: no declaration for .mjs scripts
const mod: any = await import("../../assets/scripts/gates/stage-5b.mjs");
const { runStage5bGate } = mod;

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal valid tokens.json with YAML frontmatter + DTCG component tier */
const VALID_TOKENS_WITH_COMPONENT = `---
artifact: tokens
stage: 5a-lite
evidence: INFERRED
schemaVersion: 1
generated: 2026-05-25T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "DTCG v2025.10 design tokens — Stage 5a-lite, evidence:INFERRED",
  "component": {
    "button": {
      "background": { "$type": "color", "$value": "oklch(60% 0.2 270)" }
    }
  }
}`;

/** Valid tokens.json with NO component-tier tokens */
const VALID_TOKENS_NO_COMPONENT = `---
artifact: tokens
stage: 5a-lite
evidence: INFERRED
schemaVersion: 1
generated: 2026-05-25T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "DTCG v2025.10 design tokens — Stage 5a-lite",
  "primitive": {
    "color": {
      "primary": { "$type": "color", "$value": "oklch(60% 0.2 270)" }
    }
  }
}`;

/** Valid DESIGN.md with evidence:INFERRED */
const VALID_DESIGN_MD_INFERRED = `---
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

Inter for body text; system-ui fallback.

## Color system rationale

OKLCH primary at 60% lightness.

## Spacing rationale

8px base unit, 1:2 scale.

## Component decisions

- **button**: Promoted from component tier (≥1 appearance in Stage 5a output).
`;

/** DESIGN.md with evidence:validated (should be INFERRED) — BLOCKER */
const DESIGN_MD_EVIDENCE_VALIDATED = `---
name: "Test Design"
tokens: 5000
version: "2026.04"
$extensions:
  design-os:
    evidence: "validated"
    stage: "5b-lite"
    generatedBy: "design-os/systematize"
---

## Typography rationale

Some text.
`;

/** DESIGN.md missing required fields (invalid schema — missing 'name') */
const INVALID_DESIGN_MD_MISSING_NAME = `---
tokens: 5000
version: "2026.04"
---

## Typography rationale

Some text.
`;

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage5bGate — lite-mode business logic (D-44, D-51)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "stage-5b-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── Case 1: tokens.json absent → not_runnable ──────────────────────────────

  it("returns not_runnable when tokens.json is absent", async () => {
    const result = await runStage5bGate(tmpDir);
    expect(result.kind).toBe("not_runnable");
    expect(result.reason).toBe("no-tokens-found");
  });

  // ── Case 2: tokens.json present, DESIGN.md absent → pass_with_warnings ────

  it("returns pass_with_warnings when DESIGN.md is absent (tokens.json with component)", async () => {
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_WITH_COMPONENT);

    const result = await runStage5bGate(tmpDir);

    expect(result.kind).toBe("pass_with_warnings");
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);

    // Should have finding 5b-missing-001 (DESIGN.md not yet emitted)
    const finding5bMissing = result.findings?.find(
      (f: any) => f.checkId === "5b-missing-001"
    );
    expect(finding5bMissing).toBeDefined();
    expect(finding5bMissing.status).toBe("fail");

    // Should also have 5b-frost-001 (INFO: Frost ≥3× deferred)
    const frostFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-frost-001"
    );
    expect(frostFinding).toBeDefined();
  });

  // ── Case 3: DESIGN.md fails schema validation → failed_after_repair ────────

  it("returns failed_after_repair when DESIGN.md is present but fails schema validation", async () => {
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_WITH_COMPONENT);
    await writeFile(join(tmpDir, "DESIGN.md"), INVALID_DESIGN_MD_MISSING_NAME);

    const result = await runStage5bGate(tmpDir);

    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toBe("schema-violation");

    const finding = result.findings?.find(
      (f: any) => f.checkId === "5b-schema-001"
    );
    expect(finding).toBeDefined();
    expect(finding.status).toBe("fail");
  });

  // ── Case 4: DESIGN.md has evidence:validated → failed_after_repair BLOCKER ─

  it("returns failed_after_repair when DESIGN.md carries evidence:validated (must be INFERRED)", async () => {
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_WITH_COMPONENT);
    await writeFile(join(tmpDir, "DESIGN.md"), DESIGN_MD_EVIDENCE_VALIDATED);

    const result = await runStage5bGate(tmpDir);

    expect(result.kind).toBe("failed_after_repair");
    expect(result.reason).toBe("schema-violation");

    const finding = result.findings?.find(
      (f: any) => f.checkId === "5b-evidence-002"
    );
    expect(finding).toBeDefined();
    expect(finding.status).toBe("fail");
  });

  // ── Case 5: tokens.json with ≥1 component → pass_with_warnings (5b-frost-001 INFO) ──

  it("records 5b-frost-001 INFO when tokens.json has ≥1 component-tier token (D-44: Frost ≥3× NOT enforced)", async () => {
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_WITH_COMPONENT);

    const result = await runStage5bGate(tmpDir);

    expect(result.kind).toBe("pass_with_warnings");

    // D-44: Frost ≥3× is NOT enforced as a gate blocker — only recorded as INFO
    const frostFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-frost-001"
    );
    expect(frostFinding).toBeDefined();
    // Status must be 'na' (informational) — NOT fail/error
    expect(frostFinding.status).toBe("na");
    // Evidence must reference the Phase 3 deferral
    expect(frostFinding.evidence).toMatch(/Frost.*3.*Phase 3/i);
  });

  // ── Case 6: tokens.json with zero component-tier tokens → pass_with_warnings (5b-component-001 WARNING) ──

  it("returns pass_with_warnings with 5b-component-001 when no component-tier tokens found", async () => {
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_NO_COMPONENT);

    const result = await runStage5bGate(tmpDir);

    // Not failed — just a warning (no components is expected for minimal setups)
    expect(result.kind).toBe("pass_with_warnings");

    const compFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-component-001"
    );
    expect(compFinding).toBeDefined();
    expect(compFinding.status).toBe("fail");
  });

  // ── Case 7: Valid tokens + valid DESIGN.md + evidence:INFERRED + ≥1 component → pass_with_warnings evidence:proto ──

  it("returns pass_with_warnings evidence:proto for valid tokens + valid DESIGN.md (D-44: full pass requires Phase 3)", async () => {
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_WITH_COMPONENT);
    await writeFile(join(tmpDir, "DESIGN.md"), VALID_DESIGN_MD_INFERRED);

    const result = await runStage5bGate(tmpDir);

    // v2.0a lite-mode: never returns kind:'pass' — always pass_with_warnings
    expect(result.kind).toBe("pass_with_warnings");
    expect(result.evidence).toBe("proto");
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);

    // The Frost INFO finding must be present (D-44: count recorded, not enforced)
    const frostFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-frost-001"
    );
    expect(frostFinding).toBeDefined();
    expect(frostFinding.status).toBe("na");

    // No BLOCKER findings
    const blockerFindings = result.findings?.filter(
      (f: any) => f.checkId.includes("schema") || f.checkId.includes("evidence-002")
    );
    expect(blockerFindings?.length ?? 0).toBe(0);
  });

  // ── Additional: evidence:INFERRED on tokens.json is NOT a blocker ─────────

  it("does not block when tokens.json has evidence:INFERRED (correct value)", async () => {
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_WITH_COMPONENT);
    await writeFile(join(tmpDir, "DESIGN.md"), VALID_DESIGN_MD_INFERRED);

    const result = await runStage5bGate(tmpDir);

    // Should not have 5b-evidence-001 (that's only for tokens with NON-INFERRED evidence)
    const tokenEvidenceFinding = result.findings?.find(
      (f: any) => f.checkId === "5b-evidence-001"
    );
    expect(tokenEvidenceFinding).toBeUndefined();
  });

  // ── Additional: tokens.json with wrong evidence value ─────────────────────

  it("returns failed_after_repair when tokens.json has evidence:validated (must be INFERRED)", async () => {
    const tokensWithWrongEvidence = `---
artifact: tokens
stage: 5a-lite
evidence: validated
schemaVersion: 1
generated: 2026-05-25T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "component": {
    "button": { "bg": { "$type": "color", "$value": "oklch(60% 0.2 270)" } }
  }
}`;

    await writeFile(join(tmpDir, "tokens.json"), tokensWithWrongEvidence);

    const result = await runStage5bGate(tmpDir);

    expect(result.kind).toBe("failed_after_repair");

    const finding = result.findings?.find(
      (f: any) => f.checkId === "5b-evidence-001"
    );
    expect(finding).toBeDefined();
    expect(finding.status).toBe("fail");
  });
});

// ── Regression: gate result shape matches GateResult schema ──────────────────

describe("runStage5bGate — GateResult shape compliance", () => {
  it("pass_with_warnings has required warnings array (lesson 1 from codex review)", async () => {
    const tmpDir2 = await mkdtemp(join(tmpdir(), "stage-5b-shape-"));
    try {
      await writeFile(join(tmpDir2, "tokens.json"), VALID_TOKENS_WITH_COMPONENT);
      await writeFile(join(tmpDir2, "DESIGN.md"), VALID_DESIGN_MD_INFERRED);

      const result = await runStage5bGate(tmpDir2);

      if (result.kind === "pass_with_warnings") {
        // Lesson 1: pass_with_warnings MUST have warnings: string[]
        expect(result.warnings).toBeDefined();
        expect(Array.isArray(result.warnings)).toBe(true);
        result.warnings.forEach((w: unknown) => {
          expect(typeof w).toBe("string");
        });
      }
    } finally {
      await rm(tmpDir2, { recursive: true, force: true });
    }
  });

  it("findings array entries have checkId and status fields", async () => {
    const tmpDir3 = await mkdtemp(join(tmpdir(), "stage-5b-findings-"));
    try {
      await writeFile(join(tmpDir3, "tokens.json"), VALID_TOKENS_WITH_COMPONENT);

      const result = await runStage5bGate(tmpDir3);

      if (result.findings && result.findings.length > 0) {
        for (const finding of result.findings) {
          expect(finding).toHaveProperty("checkId");
          expect(finding).toHaveProperty("status");
          expect(typeof finding.checkId).toBe("string");
          expect(["pass", "fail", "na"]).toContain(finding.status);
        }
      }
    } finally {
      await rm(tmpDir3, { recursive: true, force: true });
    }
  });
});
