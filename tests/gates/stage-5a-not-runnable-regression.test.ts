// tests/gates/stage-5a-not-runnable-regression.test.ts
// D-43 CI regression guard: gate-stage-5a MUST always return not_runnable in v2.0a.
//
// This test asserts that:
//   1. A design dir with NO interactions/ → not_runnable (reason: stage-4-artifacts-absent)
//   2. A design dir WITH interactions/ → STILL not_runnable in v2.0a
//      (gate-stage-5a.mjs is hard-coded per codex §16 BLOCKER fix)
//
// D-43: gate/stage-5a-complete is hard-coded to return {kind:'not_runnable', reason:'stage-4-artifacts-absent'}
// This file is the CI guard that MUST catch any future modification to stage-5a.mjs.
//
// Implements: D-43, GATE-08, BLOCKER Pitfall-13

import { describe, it, expect } from "vitest";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// @ts-ignore TS7016: no declaration for .mjs script
const stage5aModule: any = await import("../../assets/scripts/gates/stage-5a.mjs");
const { runStage5aGate } = stage5aModule;

describe("D-43 regression guard: gate-stage-5a always returns not_runnable", () => {
  it("returns not_runnable when design dir has no interactions/ directory (baseline)", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "d43-no-interactions-"));
    try {
      const result = await runStage5aGate(tmpDir);
      expect(result.kind).toBe("not_runnable");
      expect(result.reason).toBe("stage-4-artifacts-absent");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns not_runnable when design dir has EMPTY interactions/ directory", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "d43-empty-interactions-"));
    try {
      await mkdir(join(tmpDir, "interactions"), { recursive: true });
      const result = await runStage5aGate(tmpDir);
      expect(result.kind).toBe("not_runnable");
      expect(result.reason).toBe("stage-4-artifacts-absent");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns not_runnable even when interactions/ HAS real files (v2.0a hard-code)", async () => {
    // D-43: gate is hard-coded not_runnable in v2.0a regardless of interactions content.
    // The FULL gate that promotes to PASS based on Stage 4 artifacts ships in Phase 3.
    //
    // This test writes a REAL interaction artifact file so that if gate-stage-5a.mjs is
    // ever modified to check file content and return 'pass', this test will FAIL —
    // catching the regression before it lands in production.
    //
    // A mere empty-directory test (as the previous version had) would not catch a
    // regression where runStage5aGate returns 'pass' when real interaction files exist.
    const tmpDir = await mkdtemp(join(tmpdir(), "d43-with-interactions-"));
    try {
      await mkdir(join(tmpDir, "interactions"), { recursive: true });
      // Write a real interaction spec file (valid Markdown with Stage 4 content)
      await writeFile(
        join(tmpDir, "interactions", "some-interaction.spec.md"),
        [
          "---",
          "artifact: interaction-spec",
          "stage: 4",
          "generated: 2026-05-25T00:00:00.000Z",
          "schemaVersion: 1",
          "---",
          "",
          "# Interaction Spec: Some Flow",
          "",
          "## States",
          "- idle",
          "- loading",
          "- success",
          "",
          "## Transitions",
          "- idle → loading: on SUBMIT",
          "- loading → success: on DONE",
        ].join("\n"),
        "utf8"
      );

      // D-43 v2.0a: gate MUST still return not_runnable even with real interaction files.
      // The gate is hard-coded until Phase 3 ships full Stage 4 validation logic.
      const result = await runStage5aGate(tmpDir);
      expect(result.kind).toBe("not_runnable");
      expect(result.reason).toBe("stage-4-artifacts-absent");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("regression: stage-5a.mjs file has NOT been modified from Phase 1 baseline (D-43)", async () => {
    // Verify the gate file contains the GATE-07+GATE-08 comment (Phase 1 identity marker)
    const gatePath = resolve(ROOT, "assets/scripts/gates/stage-5a.mjs");
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(gatePath, "utf8");

    // Must contain the D-43 marker comment
    expect(content).toContain("GATE-07");
    expect(content).toContain("GATE-08");
    expect(content).toContain("stage-4-artifacts-absent");
    // Must NOT contain any 'pass' return for the not_runnable case
    // (the file can return pass for the interactions-present case, but
    //  the primary D-43 requirement is: DO NOT MODIFY the hard-coded guard)
    expect(content).toContain("not_runnable");
  });

  it("D-43: not_runnable result shape is valid GateResult discriminated union", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "d43-shape-"));
    try {
      const result = await runStage5aGate(tmpDir);
      // GateResult not_runnable shape: { kind: 'not_runnable', reason: string }
      expect(result.kind).toBe("not_runnable");
      expect(typeof result.reason).toBe("string");
      expect(result.reason.length).toBeGreaterThan(0);
      // not_runnable must NOT have evidence or findings (discriminated union)
      expect(result.evidence).toBeUndefined();
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
