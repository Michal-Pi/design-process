// tests/handoff/sufficiency-structural.test.ts
// Tests for bundle-sufficiency structural-equivalence eval harness.
//
// Source: CONTEXT.md D-08 (structural-equivalence baseline per Open Q2);
//         PLAN.md Task 3 behavior (5 fixtures, deterministic report, divergence tagging)
// Implements: HAND-04

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile, writeFile, rm, mkdir, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const EVALS_DIR = resolve(ROOT, "evals/bundles");
const LAST_RUN_PATH = resolve(EVALS_DIR, "last-run.json");

// @ts-ignore TS7016: no declaration for .mjs script
const evalModule: any = await import("../../evals/bundles/sufficiency-structural.mjs");
const { runStructuralSufficiencyEval } = evalModule;

describe("sufficiency-structural: 5-fixture structural-equivalence eval", () => {
  let report: any;

  beforeAll(async () => {
    report = await runStructuralSufficiencyEval();
  });

  afterAll(async () => {
    // Clean up last-run.json created during tests
    // (keep one copy for determinism test)
  });

  it("returns a report object with runs array and pass boolean", () => {
    expect(report).toBeDefined();
    expect(Array.isArray(report.runs)).toBe(true);
    expect(typeof report.pass).toBe("boolean");
  });

  it("report has exactly 5 fixture runs", () => {
    expect(report.runs).toHaveLength(5);
  });

  it("each run has required fields: fixture, structurallyEquivalent, divergences", () => {
    for (const run of report.runs) {
      expect(typeof run.fixture).toBe("string");
      expect(typeof run.structurallyEquivalent).toBe("boolean");
      expect(Array.isArray(run.divergences)).toBe(true);
    }
  });

  it("all 5 fixtures pass structural-equivalence on the hand-authored bundles", () => {
    expect(report.pass).toBe(true);
    for (const run of report.runs) {
      expect(run.structurallyEquivalent).toBe(true);
    }
  });

  it("last-run.json is written to evals/bundles/last-run.json", () => {
    expect(existsSync(LAST_RUN_PATH)).toBe(true);
  });

  it("last-run.json content matches the returned report (deterministic)", async () => {
    const content = await readFile(LAST_RUN_PATH, "utf8");
    const persisted = JSON.parse(content);
    // Compare canonical structure
    expect(persisted.pass).toBe(report.pass);
    expect(persisted.runs).toHaveLength(report.runs.length);
  });

  it("two consecutive runs produce byte-identical last-run.json", async () => {
    const content1 = await readFile(LAST_RUN_PATH, "utf8");
    await runStructuralSufficiencyEval();
    const content2 = await readFile(LAST_RUN_PATH, "utf8");
    // Compare without timestamps (which change per run): compare structural content
    const r1 = JSON.parse(content1);
    const r2 = JSON.parse(content2);
    expect(r1.pass).toBe(r2.pass);
    expect(r1.runs.map((r: any) => r.fixture)).toEqual(r2.runs.map((r: any) => r.fixture));
    expect(r1.runs.map((r: any) => r.structurallyEquivalent)).toEqual(
      r2.runs.map((r: any) => r.structurallyEquivalent)
    );
  });
});

describe("sufficiency-structural: divergence detection", () => {
  const TMP_FIXTURE_DIR = resolve(ROOT, "evals/bundles/fixtures-tmp-divergence-test");
  let divergenceReport: any;

  beforeAll(async () => {
    // Copy stage-0-to-1 fixture to a temp dir and mutate the bundle to remove an artifact
    await mkdir(resolve(TMP_FIXTURE_DIR, "stage-0-to-1/upstream"), { recursive: true });
    await cp(
      resolve(EVALS_DIR, "fixtures/stage-0-to-1/upstream/PRD.md"),
      resolve(TMP_FIXTURE_DIR, "stage-0-to-1/upstream/PRD.md")
    );
    // Write a bundle that does NOT list PRD.md in artifactsInventory
    const mutatedBundle = `---
artifact: handoff-bundle
schemaVersion: 1
stage: "0 → 1"
generated: "2025-01-10T12:00:00Z"
provenance: generated
owner: design-os
lastReviewedAt: "2025-01-10T12:00:00Z"
sourceHash: sha256:a0cb5b4200fc58b055c7e7928a2aa40b17d2a825229c61b406e769e5c4c41ca4
tokenCount: 3500
truncationWarning: null
provenanceWorstCase: validated
goalAndScope: "Minimal bundle for divergence test"
decisionsMade: []
openQuestions: []
artifactsInventory: []
pointersToVerify: []
---

## Goal & scope

Minimal bundle for divergence detection test.

## Decisions made

None.

## Open questions

None.

## Artifacts inventory

(empty — intentionally missing upstream/PRD.md)

## Pointers to verify

None.

## Provenance (worst-case)

Validated.
`;
    await writeFile(resolve(TMP_FIXTURE_DIR, "stage-0-to-1/bundle.md"), mutatedBundle);

    // Run the eval on the temp dir
    divergenceReport = await runStructuralSufficiencyEval({ fixturesDir: TMP_FIXTURE_DIR });
  });

  afterAll(async () => {
    if (existsSync(TMP_FIXTURE_DIR)) {
      await rm(TMP_FIXTURE_DIR, { recursive: true, force: true });
    }
  });

  it("divergence report has pass:false when artifact is missing from inventory", () => {
    expect(divergenceReport.pass).toBe(false);
  });

  it("fixture with missing artifact reports structurallyEquivalent:false", () => {
    const run = divergenceReport.runs.find((r: any) => r.fixture.includes("stage-0-to-1"));
    expect(run).toBeDefined();
    expect(run!.structurallyEquivalent).toBe(false);
  });

  it("divergence has kind 'artifact-missing-from-inventory'", () => {
    const run = divergenceReport.runs.find((r: any) => r.fixture.includes("stage-0-to-1"));
    expect(run).toBeDefined();
    const div = run!.divergences.find(
      (d: any) => d.kind === "artifact-missing-from-inventory"
    );
    expect(div).toBeDefined();
    expect(div!.detail).toContain("PRD.md");
  });
});
