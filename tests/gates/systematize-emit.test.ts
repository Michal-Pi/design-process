// tests/gates/systematize-emit.test.ts
// Tests for the systematize workflow DESIGN.md emit behavior (Plan 02-04 T-02-04-B).
//
// F-04: The DESIGN.md emit logic is embedded in the SKILL.md procedure body (steps 5-6
// of skills/workflows/systematize.md) rather than extracted to a standalone export.
// This is the correct v2.0a architecture per CONTEXT.md D-32 and RESEARCH.md §3 Stage 5b-lite
// note: "No additional atoms: Stage 5b-lite is implemented directly in the workflow body."
//
// Full e2e DESIGN.md emit validation (fixture + schema validation + evidence assertion)
// is deferred to T-02-05-B (02-05 plan) which runs the complete e2e fixture suite.
//
// Tests present in this file cover what CAN be unit-tested:
//   1. systematize.md SKILL.md frontmatter validity
//   2. Description ≤200 chars (Codex 2% cap per CLAUDE.md)
//   3. Required sections present in procedure body
//   4. TRUST-05 intake documented (2 questions for standard/full depth)
//   5. Host fallback section present
//   6. Evidence:INFERRED and frostNote documented in procedure
//   7. Stage 5b gate invocation command uses correct CLI form (lesson 2 from codex review)
//   8. gate-stage-5b.mjs validates DESIGN.md evidence:INFERRED at schema level (integration test)
//
// Implements: D-32, D-44, D-51, D-52, D-53, D-49, WF-07, MVPA-04, TRUST-05, COST-06

import { describe, it, expect, beforeAll } from "vitest";
import { readFile, writeFile, rm, mkdtemp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const SYSTEMATIZE_MD = join(ROOT, "skills/workflows/systematize.md");

// ─────────────────────────────────────────────────────────────────────────────
// 1. SKILL.md frontmatter validity
// ─────────────────────────────────────────────────────────────────────────────

describe("systematize.md SKILL.md frontmatter (agentskills.io v1 spec)", () => {
  let parsed: matter.GrayMatterFile<string>;
  let raw: string;

  beforeAll(async () => {
    raw = await readFile(SYSTEMATIZE_MD, "utf8");
    parsed = matter(raw);
  });

  it("exists at skills/workflows/systematize.md", () => {
    expect(existsSync(SYSTEMATIZE_MD)).toBe(true);
  });

  it("has required 'name' field", () => {
    expect(parsed.data.name).toBeDefined();
    expect(typeof parsed.data.name).toBe("string");
    expect(parsed.data.name.length).toBeGreaterThan(0);
  });

  it("name is 'design-os/systematize'", () => {
    expect(parsed.data.name).toBe("design-os/systematize");
  });

  it("has required 'description' field", () => {
    expect(parsed.data.description).toBeDefined();
  });

  it("description is ≤200 chars (Codex 2% trigger metadata cap)", () => {
    const descLen = parsed.data.description?.length ?? 0;
    expect(descLen).toBeGreaterThan(0);
    expect(descLen).toBeLessThanOrEqual(200);
  });

  it("description mentions 'evidence:INFERRED' or INFERRED provenance (D-51)", () => {
    expect(parsed.data.description).toMatch(/INFERRED|inferred/i);
  });

  it("description mentions Frost ≥3× deferral (D-44)", () => {
    expect(parsed.data.description).toMatch(/Frost.*3|v2\.0b|deferred/i);
  });

  it("has stage: '5b'", () => {
    expect(parsed.data.stage).toBe("5b");
  });

  it("has gate: 'gate/stage-5b-complete'", () => {
    expect(parsed.data.gate).toBe("gate/stage-5b-complete");
  });

  it("has mvp: true", () => {
    expect(parsed.data.mvp).toBe(true);
  });

  it("has compatibility array including claude-code", () => {
    expect(Array.isArray(parsed.data.compatibility)).toBe(true);
    expect(parsed.data.compatibility).toContain("claude-code");
  });

  it("has allows-tools: [Read, Write, Bash]", () => {
    const tools = parsed.data["allows-tools"] as string[];
    expect(Array.isArray(tools)).toBe(true);
    expect(tools).toContain("Read");
    expect(tools).toContain("Write");
    expect(tools).toContain("Bash");
  });

  it("has artifacts.reads including stage-5a-bundle and tokens.json", () => {
    const reads = parsed.data.artifacts?.reads as string[];
    expect(Array.isArray(reads)).toBe(true);
    const hasBundle = reads.some((r) => r.includes("stage-5a-bundle"));
    const hasTokens = reads.some((r) => r.includes("tokens.json"));
    expect(hasBundle).toBe(true);
    expect(hasTokens).toBe(true);
  });

  it("has artifacts.writes including DESIGN.md and stage-5b-bundle", () => {
    const writes = parsed.data.artifacts?.writes as string[];
    expect(Array.isArray(writes)).toBe(true);
    const hasDesignMd = writes.some((w) => w.includes("DESIGN.md"));
    const hasBundle = writes.some((w) => w.includes("stage-5b-bundle"));
    expect(hasDesignMd).toBe(true);
    expect(hasBundle).toBe(true);
  });

  it("composition.atoms is an empty array (Stage 5b-lite has no separate atoms per RESEARCH.md §3)", () => {
    expect(Array.isArray(parsed.data.composition?.atoms)).toBe(true);
    expect(parsed.data.composition.atoms.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Procedure body content
// ─────────────────────────────────────────────────────────────────────────────

describe("systematize.md procedure body content", () => {
  let body: string;

  beforeAll(async () => {
    const raw = await readFile(SYSTEMATIZE_MD, "utf8");
    body = matter(raw).content;
  });

  it("has component scan step referencing 'component' group in tokens.json", () => {
    expect(body).toMatch(/component.*group|component.*tier|"component"/i);
  });

  it("has DESIGN.md emit step with evidence:INFERRED (D-51)", () => {
    expect(body).toMatch(/evidence.*INFERRED|INFERRED.*evidence/i);
  });

  it("has frostNote in emitted DESIGN.md frontmatter (D-44)", () => {
    expect(body).toMatch(/frostNote|Frost.*3.*not.*verified|Frost.*deferred/i);
  });

  it("has $extensions.design-os block in emitted DESIGN.md (MRD §15)", () => {
    expect(body).toMatch(/\$extensions.*design-os|design-os.*\$extensions/is);
  });

  it("has stage: '5b-lite' in emitted DESIGN.md frontmatter", () => {
    expect(body).toMatch(/stage.*5b-lite|5b-lite.*stage/i);
  });

  it("has generatedBy: 'design-os/systematize' in emitted DESIGN.md", () => {
    expect(body).toMatch(/generatedBy.*design-os\/systematize/i);
  });

  it("documents TRUST-05 intake with 2 questions (standard/full depth)", () => {
    // Two TRUST-05 questions: component names + tone
    expect(body).toMatch(/existing.*component.*names|component.*names.*preserve/i);
    expect(body).toMatch(/tone.*rationale|intended.*tone|formal.*conversational/i);
  });

  it("has --depth lightweight/standard/full dispatch (F-07)", () => {
    expect(body).toMatch(/--depth.*lightweight|depth.*lightweight/i);
    expect(body).toMatch(/--depth.*full|depth.*full/i);
    expect(body).toMatch(/--depth.*standard|depth.*standard/i);
  });

  it("has gate invocation using correct CLI form: node bin/design-os.mjs gate --stage 5b", () => {
    // Lesson 2 from codex review: must use node bin/design-os.mjs, not cli/*.mjs directly
    expect(body).toMatch(/node bin\/design-os\.mjs gate.*--stage 5b/i);
  });

  it("has budget-check invocation using correct CLI form (pre and post)", () => {
    expect(body).toMatch(/node bin\/design-os\.mjs budget-check.*--stage systematize.*--check pre/i);
    expect(body).toMatch(/node bin\/design-os\.mjs budget-check.*--stage systematize.*--check post/i);
  });

  it("has handoff-bundle invocation using correct CLI form (--from, --to, --design-dir, --body-file)", () => {
    // Lesson from 02-03 codex review finding 4: must use --from, --to, --design-dir, --body-file
    // These options may appear on separate lines in the multi-line bash block.
    expect(body).toMatch(/node bin\/design-os\.mjs handoff-bundle/i);
    expect(body).toMatch(/--from/i);
    expect(body).toMatch(/--to/i);
    expect(body).toMatch(/--design-dir/i);
    expect(body).toMatch(/--body-file/i);
  });

  it("has design-md-validate invocation using correct CLI form", () => {
    // Correct form: node bin/design-os.mjs design-md-validate --file <path>
    expect(body).toMatch(/node bin\/design-os\.mjs design-md-validate.*--file/i);
  });

  it("has honest lite-mode messaging about pass_with_warnings expected result", () => {
    expect(body).toMatch(/pass_with_warnings.*evidence.*proto|pass_with_warnings.*correct.*v2\.0a/i);
  });

  it("does NOT import or invoke Excalidraw, XState, or stateDiagram artifacts (out of scope for 5b-lite)", () => {
    // Constraint from PLAN.md: Stage 5b-lite operates entirely on Stage 5a tokens output.
    // The workflow may mention these technologies in disclaimers (e.g., "No Stage 3 artifacts required"),
    // but must NOT invoke or import them. We check for invocations/imports specifically.
    expect(body).not.toMatch(/import.*excalidraw|require.*excalidraw|@excalidraw/i);
    expect(body).not.toMatch(/import.*xstate|require.*xstate|from.*xstate/i);
    // No stateDiagram-v2 code blocks (mermaid invocations)
    expect(body).not.toMatch(/stateDiagram-v2\s*\n/i);
  });

  it("has diff-by-default messaging with --apply required (D-52)", () => {
    expect(body).toMatch(/--apply/i);
  });

  it("has ## Host fallback section (D-53)", () => {
    expect(body).toMatch(/##\s+Host fallback/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. gate-stage-5b.mjs integration: validates evidence:INFERRED (D-51 schema gate)
// ─────────────────────────────────────────────────────────────────────────────

// @ts-ignore TS7016: no declaration for .mjs scripts
const gate5b: any = await import("../../assets/scripts/gates/stage-5b.mjs");

describe("gate-stage-5b.mjs integration — DESIGN.md evidence enforcement (D-51)", () => {
  it("rejects DESIGN.md with evidence:proto in $extensions.design-os (must be INFERRED)", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "systematize-emit-test-"));
    try {
      const tokensJson = `---
artifact: tokens
stage: 5a-lite
evidence: INFERRED
schemaVersion: 1
generated: 2026-05-25T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "component": { "button": { "bg": { "$type": "color", "$value": "oklch(60% 0.2 270)" } } }
}`;

      const designMdWithProto = `---
name: "Test"
tokens: 5000
version: "2026.04"
$extensions:
  design-os:
    evidence: "proto"
    stage: "5b-lite"
---

## Typography rationale

Test.
`;

      await writeFile(join(tmpDir, "tokens.json"), tokensJson);
      await writeFile(join(tmpDir, "DESIGN.md"), designMdWithProto);

      const result = await gate5b.runStage5bGate(tmpDir);

      expect(result.kind).toBe("failed_after_repair");
      const finding = result.findings?.find((f: any) => f.checkId === "5b-evidence-002");
      expect(finding).toBeDefined();
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("accepts DESIGN.md with evidence:INFERRED — the value emitted by systematize workflow (D-51)", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "systematize-emit-accept-"));
    try {
      const tokensJson = `---
artifact: tokens
stage: 5a-lite
evidence: INFERRED
schemaVersion: 1
generated: 2026-05-25T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "component": { "button": { "bg": { "$type": "color", "$value": "oklch(60% 0.2 270)" } } }
}`;

      const designMdInferred = `---
name: "Test Product"
tokens: 5000
version: "2026.04"
$extensions:
  design-os:
    evidence: "INFERRED"
    stage: "5b-lite"
    generatedBy: "design-os/systematize"
    componentCount: 1
---

## Typography rationale

Inter, system-ui fallback.

## Color system rationale

Primary oklch(60% 0.2 270). Contrast 4.7:1 (reported, not claimed).

## Spacing rationale

8px base unit, 1:2 scale.

## Component decisions

- **button**: Promoted from component tier (button appears in multiple screens).
`;

      await writeFile(join(tmpDir, "tokens.json"), tokensJson);
      await writeFile(join(tmpDir, "DESIGN.md"), designMdInferred);

      // Phase 3 (D-70): Add ≥3 interaction spec files referencing 'button'
      // so the Frost recurrence check passes (button appears ≥3× in specs)
      const { mkdir: mkdirFn } = await import("node:fs/promises");
      await mkdirFn(join(tmpDir, "interactions"), { recursive: true });
      for (let i = 0; i < 3; i++) {
        await writeFile(
          join(tmpDir, "interactions", `screen-${i}.spec.md`),
          `---\nartifact: interaction-spec\nstage: 4\n---\n\nUses the button component in this screen.\n`
        );
      }

      const result = await gate5b.runStage5bGate(tmpDir);

      expect(result.kind).toBe("pass_with_warnings");
      expect(result.evidence).toBe("proto");

      // Confirm no evidence-related BLOCKER findings
      const evidenceBlockers = result.findings?.filter(
        (f: any) => f.checkId === "5b-evidence-001" || f.checkId === "5b-evidence-002"
      );
      expect(evidenceBlockers?.length ?? 0).toBe(0);

      // Confirm no Frost BLOCKER (button appears 3× in interactions)
      const frostBlocker = result.findings?.find(
        (f: any) => f.checkId === "5b-frost-002"
      );
      expect(frostBlocker).toBeUndefined();
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
