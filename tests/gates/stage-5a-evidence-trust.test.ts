// tests/gates/stage-5a-evidence-trust.test.ts
// Tests for Stage 5a evidence-trust enforcement (Codex review Finding 2 — P2).
//
// Problem: stage-5a.mjs line ~169 explicitly allowed tokens.json evidence:'INFERRED'
// to pass the full gate condition (`evidence !== "INFERRED"` was excluded from the
// fail branch). D-60 requires the full gate to accept ONLY 'proto' or 'validated';
// INFERRED is the lite-mode trust level (Stage 5b systematize) and must not pass.
//
// Fix: A dedicated check 5a-evidence-trust-001 triggers when evidence === 'INFERRED'
// in the full-gate path, returning pass_with_warnings (not pass). D-60 full-gate
// failures are warnings not hard blocks (Phase 4 gate hardening deferred).
//
// Tests:
//   A. Full-gate fixture with tokens.json evidence:'INFERRED' → must NOT return kind:'pass'
//      (must be pass_with_warnings). Finding 5a-evidence-trust-001 must be present.
//   B. Full-gate fixture with tokens.json evidence:'proto' → passes (no evidence-trust finding).
//   C. Full-gate fixture with tokens.json evidence:'validated' → passes (no evidence-trust finding).
//   D. Lite-gate path (interactions/ EMPTY) with tokens.json evidence:'INFERRED' → still
//      returns not_runnable (lite back-compat preserved; evidence check never reached).
//
// Check ID: '5a-evidence-trust-001' per canonical finding shape {checkId, status, evidence: string}.
//
// Implements: Codex review Finding 2 (P2), D-60, ROADMAP SC-1, Lesson 1

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// @ts-ignore TS7016: no declaration for .mjs script
const stage5aModule: any = await import("../../assets/scripts/gates/stage-5a.mjs");
const { runStage5aGate } = stage5aModule;

// ─────────────────────────────────────────────────────────────────────────────
// Fixture content
// ─────────────────────────────────────────────────────────────────────────────

/** A minimal .spec.md to enable the full-gate path */
const SPEC_MD = `---
artifact: interaction-spec
stage: 4
generated: 2026-05-26T00:00:00.000Z
schemaVersion: 1
asyncOperations: false
stateCount: 2
hasConditionalTransitions: false
---

# Interaction Spec: Login

## States
- idle
- success
`;

/** CHOICE.md for wireframes */
const CHOICE_MD = `---
artifact: wireframe-choice
stage: 3
---

# Wireframe Choice: Login

**Selected:** v1
`;

/** Sitemap with one route */
const SITEMAP_ONE_ROUTE = JSON.stringify({
  $schema: "https://complete-design.dev/schemas/sitemap.v1.json",
  artifact: "sitemap",
  stage: "2",
  schemaVersion: 1,
  routes: [{ id: "login", path: "/login", label: "Login" }],
});

/** tokens.json with evidence:'INFERRED' (lite-mode trust level) */
const TOKENS_INFERRED = `---
artifact: tokens
stage: 5a
evidence: INFERRED
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "primitive": {
    "color": { "primary": { "$type": "color", "$value": "oklch(60% 0.2 270)" } }
  }
}`;

/** tokens.json with evidence:'proto' (LLM-generated, unreviewed) */
const TOKENS_PROTO = `---
artifact: tokens
stage: 5a
evidence: proto
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "primitive": {
    "color": { "primary": { "$type": "color", "$value": "oklch(60% 0.2 270)" } }
  }
}`;

/** tokens.json with evidence:'validated' (human-reviewed) */
const TOKENS_VALIDATED = `---
artifact: tokens
stage: 5a
evidence: validated
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "primitive": {
    "color": { "primary": { "$type": "color", "$value": "oklch(60% 0.2 270)" } }
  }
}`;

// ─────────────────────────────────────────────────────────────────────────────
// Fixture builder: full-gate conditions (interactions/ non-empty)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a fixture with the full-gate path activated (interactions/ has .spec.md).
 * Writes tokens.json with the provided content, plus sitemap + CHOICE.md.
 */
async function buildFullGateFixture(dir: string, tokensContent: string): Promise<void> {
  // interactions/ — triggers full-gate path
  await mkdir(join(dir, "interactions"), { recursive: true });
  await writeFile(join(dir, "interactions", "login.spec.md"), SPEC_MD);

  // sitemap
  await mkdir(join(dir, "ia"), { recursive: true });
  await writeFile(join(dir, "ia", "sitemap.json"), SITEMAP_ONE_ROUTE);

  // wireframes CHOICE.md
  await mkdir(join(dir, "wireframes", "login"), { recursive: true });
  await writeFile(join(dir, "wireframes", "login", "CHOICE.md"), CHOICE_MD);

  // tokens.json (caller controls evidence)
  await writeFile(join(dir, "tokens.json"), tokensContent);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite: evidence-trust enforcement in full-gate path
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage5aGate — evidence-trust enforcement (Codex review Finding 2, D-60)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "stage-5a-evtrust-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── Test A: evidence:'INFERRED' in full-gate → must NOT return pass ────────

  it(
    "Test A: full-gate with tokens.json evidence:'INFERRED' does NOT return kind:'pass' " +
      "and has 5a-evidence-trust-001 finding",
    async () => {
      await buildFullGateFixture(tmpDir, TOKENS_INFERRED);

      const result = await runStage5aGate(tmpDir);

      // Must enter full-gate path (not not_runnable)
      expect(result.kind).not.toBe("not_runnable");

      // D-60: INFERRED is not acceptable at the full gate — must NOT return 'pass'
      expect(result.kind).not.toBe("pass");

      // Must be pass_with_warnings (D-60 full-gate failures are warnings, not hard blocks)
      expect(result.kind).toBe("pass_with_warnings");

      // Must have finding 5a-evidence-trust-001 (canonical check ID)
      const evidenceFinding = result.findings?.find(
        (f: any) => f.checkId === "5a-evidence-trust-001"
      );
      expect(evidenceFinding).toBeDefined();
      expect(evidenceFinding.status).toBe("fail");
      expect(typeof evidenceFinding.evidence).toBe("string");

      // Evidence must mention INFERRED and the requirement
      expect(evidenceFinding.evidence).toMatch(/INFERRED/);
      expect(evidenceFinding.evidence).toMatch(/proto|validated/i);
    }
  );

  // ── Test B: evidence:'proto' → passes (no evidence-trust finding) ──────────

  it(
    "Test B: full-gate with tokens.json evidence:'proto' passes — no 5a-evidence-trust-001",
    async () => {
      await buildFullGateFixture(tmpDir, TOKENS_PROTO);

      const result = await runStage5aGate(tmpDir);

      // Must enter full-gate path
      expect(result.kind).not.toBe("not_runnable");

      // Must pass (all conditions met, evidence:'proto' is acceptable)
      expect(result.kind === "pass" || result.kind === "pass_with_warnings").toBe(true);

      // Must NOT have 5a-evidence-trust-001 finding
      const evidenceFinding = result.findings?.find(
        (f: any) => f.checkId === "5a-evidence-trust-001"
      );
      expect(evidenceFinding).toBeUndefined();
    }
  );

  // ── Test C: evidence:'validated' → passes (no evidence-trust finding) ──────

  it(
    "Test C: full-gate with tokens.json evidence:'validated' passes — no 5a-evidence-trust-001",
    async () => {
      await buildFullGateFixture(tmpDir, TOKENS_VALIDATED);

      const result = await runStage5aGate(tmpDir);

      // Must enter full-gate path
      expect(result.kind).not.toBe("not_runnable");

      // Must pass
      expect(result.kind === "pass" || result.kind === "pass_with_warnings").toBe(true);

      // Must NOT have 5a-evidence-trust-001 finding
      const evidenceFinding = result.findings?.find(
        (f: any) => f.checkId === "5a-evidence-trust-001"
      );
      expect(evidenceFinding).toBeUndefined();
    }
  );

  // ── Test D: lite-gate path (empty interactions/) with INFERRED → not_runnable ─

  it(
    "Test D: lite-gate path (interactions/ empty) with tokens.json evidence:'INFERRED' " +
      "returns not_runnable (lite back-compat preserved; evidence check not reached)",
    async () => {
      // Empty interactions/ → not_runnable path (GATE-07/GATE-08)
      await mkdir(join(tmpDir, "interactions"), { recursive: true });
      // No .spec.md files — interactions/ is empty
      await writeFile(join(tmpDir, "tokens.json"), TOKENS_INFERRED);

      const result = await runStage5aGate(tmpDir);

      // GATE-07/GATE-08: empty interactions/ → not_runnable (back-compat)
      expect(result.kind).toBe("not_runnable");
      expect(result.reason).toBe("stage-4-artifacts-absent");

      // Evidence check is never reached in not_runnable path
      // (no findings on not_runnable result per schema)
      expect(result.findings).toBeUndefined();
      expect(result.evidence).toBeUndefined();
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Finding schema compliance (Lesson 1)
// ─────────────────────────────────────────────────────────────────────────────

describe("5a-evidence-trust-001 finding shape (Lesson 1)", () => {
  it(
    "5a-evidence-trust-001 uses checkId (not findingId) and string evidence (Lesson 1)",
    async () => {
      const tmpDir2 = await mkdtemp(join(tmpdir(), "5a-evtrust-schema-"));
      try {
        await buildFullGateFixture(tmpDir2, TOKENS_INFERRED);

        const result = await runStage5aGate(tmpDir2);

        expect(result.kind).not.toBe("not_runnable");

        for (const finding of result.findings ?? []) {
          // Lesson 1: must use 'checkId', NOT 'findingId'
          expect(finding).toHaveProperty("checkId");
          expect((finding as any).findingId).toBeUndefined();

          // status must be 'pass' | 'fail' | 'na'
          expect(["pass", "fail", "na"]).toContain(finding.status);

          // evidence must be a string if present
          if ((finding as any).evidence !== undefined) {
            expect(typeof (finding as any).evidence).toBe("string");
          }
        }
      } finally {
        await rm(tmpDir2, { recursive: true, force: true });
      }
    }
  );
});
