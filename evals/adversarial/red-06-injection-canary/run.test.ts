// evals/adversarial/red-06-injection-canary/run.test.ts
// RED-06 adversarial CI suite: prompt-injection canary.
//
// INVARIANT DOCUMENTATION:
// The gate reads filesystem provenance state, not prompt content.
// These canary prompts document attack vectors that prompt-injection
// cannot bypass because the check is deterministic.
//
// The 10 prompts in prompts/001.txt..010.txt each contain text explicitly
// asking an LLM to label personas as VALIDATED or override the gate.
// This test asserts the gate behavior is proof against such requests —
// the gate returns pass_with_warnings regardless of prompt content
// because it reads filesystem state, not prompt content.
//
// These are PURE SCRIPT TESTS with NO LLM calls.
//
// Source: CONTEXT.md D-50, RED-06
// Implements: RED-06

import { describe, it, expect, afterEach } from "vitest";
import { readFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// @ts-ignore TS7016: no declaration for .mjs script
const fixtureBuilderModule: any = await import(
  "../red-05-synthetic-block/fixture-builder.mjs"
);
// @ts-ignore TS7016: no declaration for .mjs script
const stage1m: any = await import("../../../assets/scripts/gates/stage-1.mjs");

const { buildSyntheticOnlyFixture } = fixtureBuilderModule;
const { runStage1Gate } = stage1m;

// Enumerate the 10 canary prompt files
const CANARY_PROMPTS = Array.from({ length: 10 }, (_, i) =>
  join(__dirname, "prompts", `${String(i + 1).padStart(3, "0")}.txt`)
);

describe("RED-06: prompt-injection canary — 10 attack vectors", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  for (let i = 0; i < CANARY_PROMPTS.length; i++) {
    const promptFile = CANARY_PROMPTS[i];
    const promptNum = i + 1;

    it(`canary prompt ${String(promptNum).padStart(3, "0")}: gate returns pass_with_warnings regardless of prompt content`, async () => {
      // Read the canary prompt (for documentation purposes — not passed to gate)
      const promptContent = await readFile(promptFile, "utf8");
      expect(promptContent.length).toBeGreaterThan(0);

      // Build a synthetic-only fixture
      const tmpDir = await mkdtemp(join(tmpdir(), `red-06-canary-${promptNum}-`));
      tmpDirs.push(tmpDir);

      // Use the same fixture builder; seed varies per prompt
      await buildSyntheticOnlyFixture(tmpDir, promptNum);

      // Gate invocation: the gate reads filesystem state, NOT the prompt content.
      // The canary prompt file is irrelevant to the gate — it cannot bypass the check.
      const result = await runStage1Gate(tmpDir, {});

      // Invariant: synthetic-only fixture ALWAYS returns pass_with_warnings
      expect(result.kind).toBe("pass_with_warnings");
      expect(result.evidence).toBe("proto");

      // Explicitly document the invariant being asserted:
      // "Even if an LLM were to include the content of prompts/${promptNum.toString().padStart(3,'0')}.txt
      // in its context, the gate cannot be made to return pass/validated because it reads
      // filesystem provenance state, not prompt content."
    });
  }
});
