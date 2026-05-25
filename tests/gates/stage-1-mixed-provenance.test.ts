// tests/gates/stage-1-mixed-provenance.test.ts
// Tests for RED-03 enforcement in mixed-provenance directories.
//
// Bug: RED-03 previously only fired inside the allSynthetic branch.
// A design dir with 1 generated + 1 validated persona + non-empty interviews/
// but no ASSUMPTIONS.md would return pass/validated — bypassing RED-03.
//
// Implements: RED-03, Finding 2 (codex-review 02-01)

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GateResult } from "../../schemas/src/gate-result.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// @ts-ignore TS7016: no declaration for .mjs script
const stage1m: any = await import("../../assets/scripts/gates/stage-1.mjs");

const { runStage1Gate } = stage1m;

describe("RED-03: ASSUMPTIONS.md required for any generated persona", () => {
  /**
   * Fixture: mixed-provenance-no-assumptions
   * - 1 generated persona (synth-1.persona.json)
   * - 1 validated persona (validated-1.persona.json)
   * - non-empty interviews/ directory (interview-1.md)
   * - NO ASSUMPTIONS.md
   *
   * Pre-fix behavior: gate returned pass/validated (RED-03 bypassed).
   * Post-fix behavior: gate returns pass_with_warnings/proto.
   */
  const MIXED_FIXTURE = resolve(
    ROOT,
    "tests/fixtures/stage1-gate/mixed-provenance-no-assumptions"
  );

  it("returns pass_with_warnings (not pass) when 1 generated + 1 validated persona, populated interviews/, ASSUMPTIONS.md absent", async () => {
    const result = await runStage1Gate(MIXED_FIXTURE, {});
    expect(result.kind).toBe("pass_with_warnings");
    expect(result.kind).not.toBe("pass");
  });

  it("returns evidence:proto (not validated) when generated persona present without ASSUMPTIONS.md", async () => {
    const result = await runStage1Gate(MIXED_FIXTURE, {});
    expect(result.evidence).toBe("proto");
    expect(result.evidence).not.toBe("validated");
  });

  it("includes RED-03 finding when generated persona present and ASSUMPTIONS.md absent", async () => {
    const result = await runStage1Gate(MIXED_FIXTURE, {});
    expect(Array.isArray(result.findings)).toBe(true);
    const red03 = result.findings.find((f: any) => f.checkId === "RED-03");
    expect(red03).toBeDefined();
    expect(red03.status).toBe("fail");
  });

  it("pass_with_warnings result satisfies GateResult schema (warnings array present)", async () => {
    const result = await runStage1Gate(MIXED_FIXTURE, {});
    const parsed = GateResult.safeParse(result);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.kind === "pass_with_warnings") {
      expect(Array.isArray(parsed.data.warnings)).toBe(true);
    }
  });
});
