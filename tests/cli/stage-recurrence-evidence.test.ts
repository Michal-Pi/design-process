// tests/cli/stage-recurrence-evidence.test.ts
// Tests for the stage-recurrence-evidence CLI helper (Codex review Finding 1 — P1).
//
// Problem: gate-stage-5b.mjs calls countComponentRecurrences(designDir) which globs
// wireframes/**/*.excalidraw and interactions/*.spec.md under designDir. When the gate
// runs against the STAGED preview path (.complete-design/preview/<run-id>/), only tokens.json
// and DESIGN.md are staged — wireframes/ and interactions/ do NOT exist there.
// countComponentRecurrences() returns 0 for every component, causing a false-positive
// frost-recurrence-not-met BLOCKER even when the source design/ has ample upstream evidence.
//
// Fix: stageRecurrenceEvidence() copies wireframes/**/*.excalidraw and
// interactions/*.spec.md from the source design dir into the staged preview dir
// before the gate invocation (systematize workflow step 9.5).
//
// Tests:
//   1. End-to-end: source dir with tokens.json + DESIGN.md + wireframes/ + interactions/
//      (≥3 references to "button") → staged → gate → NO 5b-frost-002 BLOCKER.
//   2. Inverse adversarial: same setup but only 2 total "button" references →
//      staged → gate → 5b-frost-002 BLOCKER present.
//   3. stageRecurrenceEvidence copies .excalidraw files correctly.
//   4. stageRecurrenceEvidence copies .spec.md files correctly.
//   5. stageRecurrenceEvidence skips missing directories (no error).
//   6. CLI command exports { name, describe, builder, handler } (Lesson 2).
//
// Implements: Codex review Finding 1 (P1), INVARIANT-01, D-61, D-70

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// @ts-ignore TS7016: no declaration for .mjs scripts
const stageModule: any = await import("../../assets/scripts/cli/stage-recurrence-evidence.mjs");
const { stageRecurrenceEvidence, command } = stageModule;

// @ts-ignore TS7016
const gate5b: any = await import("../../assets/scripts/gates/stage-5b.mjs");
const { runStage5bGate } = gate5b;

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal tokens.json with 'button' in component-tier + evidence:INFERRED */
const TOKENS_WITH_BUTTON = `---
artifact: tokens
stage: 5a
evidence: INFERRED
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "component": {
    "button": {
      "background": { "$type": "color", "$value": "oklch(60% 0.2 270)" }
    }
  }
}`;

/** Valid DESIGN.md with evidence:INFERRED */
const VALID_DESIGN_MD = `---
name: "Test Product"
tokens: 5000
version: "2026.04"
$extensions:
  complete-design:
    evidence: "INFERRED"
    stage: "5b-lite"
    generatedBy: "complete-design/systematize"
    componentCount: 1
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

/** Build an .excalidraw file JSON with 'Button' element label */
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
        label,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
      },
    ],
    appState: { gridSize: null, viewBackgroundColor: "#ffffff" },
    files: {},
  });
}

/** Build a .spec.md that mentions componentName N times in body */
function makeSpecMd(componentName: string, count: number): string {
  const mentions = Array(count)
    .fill(`Uses the ${componentName} component.`)
    .join("\n");
  return `---
artifact: interaction-spec
stage: 4
generated: 2026-05-26T00:00:00.000Z
schemaVersion: 1
---

# Interaction Spec

${mentions}
`;
}

/**
 * Build a "source" design dir with tokens.json + DESIGN.md
 * + wireframeCount .excalidraw files labeled 'Button'
 * + specCount .spec.md files each mentioning 'Button' once.
 */
async function buildSourceDesignDir(
  dir: string,
  wireframeCount: number,
  specCount: number
): Promise<void> {
  await writeFile(join(dir, "tokens.json"), TOKENS_WITH_BUTTON);
  await writeFile(join(dir, "DESIGN.md"), VALID_DESIGN_MD);

  if (wireframeCount > 0) {
    for (let i = 0; i < wireframeCount; i++) {
      await mkdir(join(dir, "wireframes", `screen-${i}`), { recursive: true });
      await writeFile(
        join(dir, "wireframes", `screen-${i}`, `v${i + 1}.excalidraw`),
        makeExcalidrawContent("Button")
      );
    }
  }

  if (specCount > 0) {
    await mkdir(join(dir, "interactions"), { recursive: true });
    for (let i = 0; i < specCount; i++) {
      await writeFile(
        join(dir, "interactions", `screen-${i}.spec.md`),
        makeSpecMd("Button", 1)
      );
    }
  }
}

/**
 * Build a "staged" dir that mimics what the systematize workflow emits:
 * only tokens.json + DESIGN.md (wireframes/ and interactions/ NOT present).
 */
async function buildStagedDir(dir: string): Promise<void> {
  await writeFile(join(dir, "tokens.json"), TOKENS_WITH_BUTTON);
  await writeFile(join(dir, "DESIGN.md"), VALID_DESIGN_MD);
}

// ─────────────────────────────────────────────────────────────────────────────
// End-to-end: stageRecurrenceEvidence + gate (Finding 1 fix)
// ─────────────────────────────────────────────────────────────────────────────

describe("stageRecurrenceEvidence + gate-stage-5b: end-to-end staged-path Frost fix", () => {
  let sourceDir: string;
  let stagedDir: string;

  beforeEach(async () => {
    sourceDir = await mkdtemp(join(tmpdir(), "frost-source-"));
    stagedDir = await mkdtemp(join(tmpdir(), "frost-staged-"));
  });

  afterEach(async () => {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(stagedDir, { recursive: true, force: true });
  });

  it(
    "Test 1: source with 3 wireframe refs → staged → gate → NO 5b-frost-002 BLOCKER",
    async () => {
      // Source: 3 wireframes each labeling 'Button' → 3× total (meets threshold)
      await buildSourceDesignDir(sourceDir, 3, 0);
      // Staged: only tokens.json + DESIGN.md (no wireframes/ yet)
      await buildStagedDir(stagedDir);

      // Before staging: gate would return frost BLOCKER (no evidence files in staged dir)
      const resultBefore = await runStage5bGate(stagedDir);
      expect(resultBefore.kind).toBe("failed_after_repair");
      expect(resultBefore.reason).toBe("frost-recurrence-not-met");

      // Stage the recurrence evidence
      const stageResult = await stageRecurrenceEvidence({
        sourceDesignDir: sourceDir,
        stagedDir,
      });
      expect(stageResult.copiedFiles.length).toBeGreaterThan(0);

      // After staging: gate should pass (3× ≥ threshold of 3)
      const resultAfter = await runStage5bGate(stagedDir);
      expect(resultAfter.kind).not.toBe("failed_after_repair");

      // No 5b-frost-002 finding
      const frostFinding = resultAfter.findings?.find(
        (f: any) => f.checkId === "5b-frost-002"
      );
      expect(frostFinding).toBeUndefined();
    }
  );

  it(
    "Test 2 (inverse adversarial): source with 2 refs → staged → gate → 5b-frost-002 BLOCKER",
    async () => {
      // Source: 1 wireframe + 1 spec = 2× (below threshold of 3)
      await buildSourceDesignDir(sourceDir, 1, 1);
      await buildStagedDir(stagedDir);

      // Stage the recurrence evidence
      await stageRecurrenceEvidence({
        sourceDesignDir: sourceDir,
        stagedDir,
      });

      // Gate must still return frost BLOCKER (2× < 3)
      const result = await runStage5bGate(stagedDir);
      expect(result.kind).toBe("failed_after_repair");
      expect(result.reason).toBe("frost-recurrence-not-met");

      const frostFinding = result.findings?.find(
        (f: any) => f.checkId === "5b-frost-002"
      );
      expect(frostFinding).toBeDefined();
      expect(frostFinding.status).toBe("fail");
    }
  );

  it(
    "Test 1b: source with 2 wireframes + 1 spec = 3× total → gate passes after staging",
    async () => {
      // 2 wireframe refs + 1 spec ref = 3× total (exactly meets threshold)
      await buildSourceDesignDir(sourceDir, 2, 1);
      await buildStagedDir(stagedDir);

      await stageRecurrenceEvidence({
        sourceDesignDir: sourceDir,
        stagedDir,
      });

      const result = await runStage5bGate(stagedDir);
      // 3× meets threshold
      const frostFinding = result.findings?.find(
        (f: any) => f.checkId === "5b-frost-002"
      );
      expect(frostFinding).toBeUndefined();
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// stageRecurrenceEvidence unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("stageRecurrenceEvidence: file copy behavior", () => {
  let sourceDir: string;
  let stagedDir: string;

  beforeEach(async () => {
    sourceDir = await mkdtemp(join(tmpdir(), "src-recur-"));
    stagedDir = await mkdtemp(join(tmpdir(), "dst-recur-"));
  });

  afterEach(async () => {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(stagedDir, { recursive: true, force: true });
  });

  it("Test 3: copies .excalidraw files from wireframes/ into staged dir", async () => {
    await mkdir(join(sourceDir, "wireframes", "login"), { recursive: true });
    await writeFile(
      join(sourceDir, "wireframes", "login", "v1.excalidraw"),
      makeExcalidrawContent("Button")
    );

    const result = await stageRecurrenceEvidence({
      sourceDesignDir: sourceDir,
      stagedDir,
    });

    expect(result.copiedFiles).toContain("wireframes/login/v1.excalidraw");
    expect(existsSync(join(stagedDir, "wireframes", "login", "v1.excalidraw"))).toBe(true);
  });

  it("Test 4: copies .spec.md files from interactions/ into staged dir", async () => {
    await mkdir(join(sourceDir, "interactions"), { recursive: true });
    await writeFile(
      join(sourceDir, "interactions", "login.spec.md"),
      makeSpecMd("Button", 2)
    );

    const result = await stageRecurrenceEvidence({
      sourceDesignDir: sourceDir,
      stagedDir,
    });

    expect(result.copiedFiles).toContain("interactions/login.spec.md");
    expect(existsSync(join(stagedDir, "interactions", "login.spec.md"))).toBe(true);
  });

  it("Test 5: does not error when wireframes/ and interactions/ are absent (skips)", async () => {
    // Source has neither wireframes/ nor interactions/
    const result = await stageRecurrenceEvidence({
      sourceDesignDir: sourceDir,
      stagedDir,
    });

    expect(result.copiedFiles.length).toBe(0);
    expect(result.skippedDirs).toContain("wireframes");
    expect(result.skippedDirs).toContain("interactions");
  });

  it("Test 5b: does not copy non-evidence files (only .excalidraw and .spec.md)", async () => {
    // Add a random file in wireframes/ that is NOT .excalidraw
    await mkdir(join(sourceDir, "wireframes", "login"), { recursive: true });
    await writeFile(join(sourceDir, "wireframes", "login", "notes.txt"), "some notes");
    await writeFile(
      join(sourceDir, "wireframes", "login", "v1.excalidraw"),
      makeExcalidrawContent("Card")
    );

    const result = await stageRecurrenceEvidence({
      sourceDesignDir: sourceDir,
      stagedDir,
    });

    // Only .excalidraw should be copied
    expect(result.copiedFiles).toContain("wireframes/login/v1.excalidraw");
    expect(result.copiedFiles).not.toContain("wireframes/login/notes.txt");
    // notes.txt must NOT appear in staged dir
    expect(existsSync(join(stagedDir, "wireframes", "login", "notes.txt"))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLI module contract (Lesson 2)
// ─────────────────────────────────────────────────────────────────────────────

describe("stage-recurrence-evidence CLI module contract (Lesson 2)", () => {
  it("Test 6: exports { name, describe, builder, handler } (Lesson 2)", () => {
    expect(typeof command.name).toBe("string");
    expect(command.name).toBe("stage-recurrence-evidence");
    expect(typeof command.describe).toBe("string");
    expect(command.describe.length).toBeGreaterThan(0);
    expect(typeof command.builder).toBe("function");
    expect(typeof command.handler).toBe("function");
  });

  it("command.name is 'stage-recurrence-evidence' (auto-discovery key)", () => {
    expect(command.name).toBe("stage-recurrence-evidence");
  });
});
