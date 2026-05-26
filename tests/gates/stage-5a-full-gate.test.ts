// tests/gates/stage-5a-full-gate.test.ts
// Unit tests for the Stage 5a full-gate checklist (D-60, Phase 3).
//
// These tests exercise runFullStage5aChecklist() via the conditional branch
// in stage-5a.mjs that fires when interactions/ contains ≥1 .spec.md file.
//
// Test A: full valid fixture → {kind:'pass'} or {kind:'pass_with_warnings'}
// Test B: missing tokens.json → finding referencing tokens.json
// Test C: tokens.json with stage:'5a-lite' → finding about outdated stage marker
// Test D: zero CHOICE.md files in wireframes/ → finding about missing CHOICE.md
// Test E: sitemap route has no matching .spec.md → finding about coverage gap
//
// Implements: D-60, GATE-07, GATE-08, ROADMAP SC-1

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// @ts-ignore TS7016: no declaration for .mjs script
const stage5aModule: any = await import("../../assets/scripts/gates/stage-5a.mjs");
const { runStage5aGate } = stage5aModule;

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

/** A minimal .spec.md file content for interactions/ */
const SPEC_MD_CONTENT = `---
artifact: interaction-spec
stage: 4
generated: 2026-05-25T00:00:00.000Z
schemaVersion: 1
asyncOperations: false
stateCount: 3
hasConditionalTransitions: false
---

# Interaction Spec: Login Screen

## States
- idle
- loading
- success

## Transitions
- idle --> loading : on SUBMIT
- loading --> success : on DONE
`;

/** A minimal sitemap.json with one route */
const SITEMAP_JSON_ONE_ROUTE = JSON.stringify({
  $schema: "https://design-os.dev/schemas/sitemap.v1.json",
  artifact: "sitemap",
  stage: "2",
  schemaVersion: 1,
  routes: [
    { id: "login", path: "/login", label: "Login Screen" },
  ],
});

/** A sitemap.json with two routes (for coverage-gap test) */
const SITEMAP_JSON_TWO_ROUTES = JSON.stringify({
  $schema: "https://design-os.dev/schemas/sitemap.v1.json",
  artifact: "sitemap",
  stage: "2",
  schemaVersion: 1,
  routes: [
    { id: "login", path: "/login", label: "Login Screen" },
    { id: "dashboard", path: "/dashboard", label: "Dashboard" },
  ],
});

/** A valid tokens.json with stage:'5a' (Phase 3 fully promoted) */
const VALID_TOKENS_JSON_STAGE_5A = `---
artifact: tokens
stage: 5a
evidence: proto
schemaVersion: 1
generated: 2026-05-25T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "DTCG v2025.10 design tokens — Stage 5a, evidence:proto",
  "primitive": {
    "color": {
      "primary": { "$type": "color", "$value": "oklch(60% 0.2 270)" }
    }
  },
  "component": {
    "button": {
      "background": { "$type": "color", "$value": "oklch(60% 0.2 270)" }
    }
  }
}`;

/** A tokens.json with stage:'5a-lite' (outdated marker — should trigger warning) */
const TOKENS_JSON_STAGE_5A_LITE = `---
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

/** A valid CHOICE.md file content */
const CHOICE_MD_CONTENT = `---
artifact: wireframe-choice
stage: 3
generated: 2026-05-25T00:00:00.000Z
---

# Wireframe Choice: Login Screen

**Selected:** v3

## Rationale

v3 has the clearest visual hierarchy with the form centered in the viewport.
`;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a "full valid" fixture directory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a fixture directory with all 4 checklist conditions satisfied:
 * 1. interactions/login.spec.md matches sitemap route 'login'
 * 2. wireframes/login/CHOICE.md exists
 * 3. tokens.json with valid DTCG structure
 * 4. tokens.json frontmatter: stage:'5a', evidence:'proto'
 */
async function buildFullValidFixture(tmpDir: string): Promise<void> {
  // interactions/ — one .spec.md matching 'login' route
  await mkdir(join(tmpDir, "interactions"), { recursive: true });
  await writeFile(join(tmpDir, "interactions", "login.spec.md"), SPEC_MD_CONTENT);

  // ia/sitemap.json — one route: 'login'
  await mkdir(join(tmpDir, "ia"), { recursive: true });
  await writeFile(join(tmpDir, "ia", "sitemap.json"), SITEMAP_JSON_ONE_ROUTE);

  // tokens.json — stage:'5a', evidence:'proto'
  await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_JSON_STAGE_5A);

  // wireframes/login/CHOICE.md — at least one screen has a choice
  await mkdir(join(tmpDir, "wireframes", "login"), { recursive: true });
  await writeFile(join(tmpDir, "wireframes", "login", "CHOICE.md"), CHOICE_MD_CONTENT);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite — D-60 full-gate checklist
// ─────────────────────────────────────────────────────────────────────────────

describe("runStage5aGate — full-gate checklist (D-60)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "stage-5a-full-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── Test A: Full valid fixture → pass or pass_with_warnings ────────────────

  it("Test A: full valid fixture (all 4 conditions met) returns pass or pass_with_warnings", async () => {
    await buildFullValidFixture(tmpDir);
    const result = await runStage5aGate(tmpDir);

    // D-60: when all conditions pass, gate returns 'pass' or 'pass_with_warnings'
    // NEVER 'not_runnable' when interactions/ has real .spec.md files
    expect(result.kind).not.toBe("not_runnable");
    expect(result.kind === "pass" || result.kind === "pass_with_warnings").toBe(true);

    // GATE-07/GATE-08 guard: not_runnable is only for absent/empty interactions/
    // Full valid fixture must not return not_runnable
    if (result.kind === "pass") {
      expect(result.evidence).toBeDefined();
      expect(result.findings).toBeDefined();
    } else if (result.kind === "pass_with_warnings") {
      expect(result.evidence).toBeDefined();
      expect(result.findings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });

  // ── Test B: Missing tokens.json → finding referencing tokens.json ──────────

  it("Test B: missing tokens.json produces a finding referencing tokens.json", async () => {
    // Only set up interactions/ and sitemap + CHOICE.md — NO tokens.json
    await mkdir(join(tmpDir, "interactions"), { recursive: true });
    await writeFile(join(tmpDir, "interactions", "login.spec.md"), SPEC_MD_CONTENT);
    await mkdir(join(tmpDir, "ia"), { recursive: true });
    await writeFile(join(tmpDir, "ia", "sitemap.json"), SITEMAP_JSON_ONE_ROUTE);
    await mkdir(join(tmpDir, "wireframes", "login"), { recursive: true });
    await writeFile(join(tmpDir, "wireframes", "login", "CHOICE.md"), CHOICE_MD_CONTENT);

    const result = await runStage5aGate(tmpDir);

    // Must enter full-gate mode (interactions/ has a .spec.md)
    expect(result.kind).not.toBe("not_runnable");

    // Must have at least one finding referencing tokens.json
    const allFindings = result.findings ?? [];
    const tokensFinding = allFindings.find(
      (f: any) => f.evidence && f.evidence.toLowerCase().includes("tokens.json")
    );
    expect(tokensFinding).toBeDefined();
    expect(tokensFinding.status).toBe("fail");
    expect(typeof tokensFinding.checkId).toBe("string");
  });

  // ── Test C: tokens.json with stage:'5a-lite' → finding about outdated stage ─

  it("Test C: tokens.json with stage:'5a-lite' produces finding about outdated stage marker", async () => {
    await mkdir(join(tmpDir, "interactions"), { recursive: true });
    await writeFile(join(tmpDir, "interactions", "login.spec.md"), SPEC_MD_CONTENT);
    await mkdir(join(tmpDir, "ia"), { recursive: true });
    await writeFile(join(tmpDir, "ia", "sitemap.json"), SITEMAP_JSON_ONE_ROUTE);
    // Write tokens.json with stage:'5a-lite' (Phase 2 marker — outdated in Phase 3)
    await writeFile(join(tmpDir, "tokens.json"), TOKENS_JSON_STAGE_5A_LITE);
    await mkdir(join(tmpDir, "wireframes", "login"), { recursive: true });
    await writeFile(join(tmpDir, "wireframes", "login", "CHOICE.md"), CHOICE_MD_CONTENT);

    const result = await runStage5aGate(tmpDir);

    // Must enter full-gate mode
    expect(result.kind).not.toBe("not_runnable");

    // Must have a finding about the outdated stage marker
    const allFindings = result.findings ?? [];
    const stageFinding = allFindings.find(
      (f: any) =>
        f.evidence &&
        (f.evidence.includes("5a-lite") ||
          f.evidence.toLowerCase().includes("stage") ||
          f.evidence.toLowerCase().includes("outdated"))
    );
    expect(stageFinding).toBeDefined();
    expect(stageFinding.status).toBe("fail");
  });

  // ── Test D: Zero CHOICE.md files → finding about missing CHOICE.md ─────────

  it("Test D: no wireframes CHOICE.md produces finding about missing CHOICE.md", async () => {
    await mkdir(join(tmpDir, "interactions"), { recursive: true });
    await writeFile(join(tmpDir, "interactions", "login.spec.md"), SPEC_MD_CONTENT);
    await mkdir(join(tmpDir, "ia"), { recursive: true });
    await writeFile(join(tmpDir, "ia", "sitemap.json"), SITEMAP_JSON_ONE_ROUTE);
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_JSON_STAGE_5A);
    // wireframes/ exists but has NO CHOICE.md files
    await mkdir(join(tmpDir, "wireframes", "login"), { recursive: true });
    // Intentionally: no CHOICE.md written

    const result = await runStage5aGate(tmpDir);

    // Must enter full-gate mode
    expect(result.kind).not.toBe("not_runnable");

    // Must have a finding about missing CHOICE.md
    const allFindings = result.findings ?? [];
    const choiceFinding = allFindings.find(
      (f: any) => f.evidence && f.evidence.toUpperCase().includes("CHOICE")
    );
    expect(choiceFinding).toBeDefined();
    expect(choiceFinding.status).toBe("fail");
  });

  // ── Test E: sitemap route without matching .spec.md → coverage gap finding ──

  it("Test E: sitemap has route with no matching .spec.md produces coverage-gap finding", async () => {
    // 2 sitemap routes, but only 1 .spec.md (login) — dashboard has no spec
    await mkdir(join(tmpDir, "interactions"), { recursive: true });
    await writeFile(join(tmpDir, "interactions", "login.spec.md"), SPEC_MD_CONTENT);
    await mkdir(join(tmpDir, "ia"), { recursive: true });
    await writeFile(join(tmpDir, "ia", "sitemap.json"), SITEMAP_JSON_TWO_ROUTES);
    await writeFile(join(tmpDir, "tokens.json"), VALID_TOKENS_JSON_STAGE_5A);
    await mkdir(join(tmpDir, "wireframes", "login"), { recursive: true });
    await writeFile(join(tmpDir, "wireframes", "login", "CHOICE.md"), CHOICE_MD_CONTENT);

    const result = await runStage5aGate(tmpDir);

    // Must enter full-gate mode
    expect(result.kind).not.toBe("not_runnable");

    // Must have a finding about the coverage gap (dashboard route has no spec)
    const allFindings = result.findings ?? [];
    const coverageFinding = allFindings.find(
      (f: any) =>
        f.evidence &&
        (f.evidence.toLowerCase().includes("dashboard") ||
          f.evidence.toLowerCase().includes("coverage") ||
          f.evidence.toLowerCase().includes("route") ||
          f.evidence.toLowerCase().includes("spec"))
    );
    expect(coverageFinding).toBeDefined();
    expect(coverageFinding.status).toBe("fail");
  });
});
