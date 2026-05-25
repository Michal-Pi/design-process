// tests/handoff/bundle-floor.test.ts
// Tests for handoff bundle floor check: body <3k tokens → returns error,
// writes no file.
//
// Source: CONTEXT.md D-06 (3k floor); PLAN.md Task 2 behavior
// Implements: HAND-03 (insufficient-content error path)

import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES_DIR = resolve(ROOT, "tests/fixtures");
const STAGE1_COMPLETE_DIR = resolve(FIXTURES_DIR, "design-dirs/stage-1-complete");
const LLM_BODY_TOO_SMALL = resolve(FIXTURES_DIR, "bundles/llm-body-too-small.md");

// @ts-ignore TS7016: no declaration for .mjs script
const bundleModule: any = await import("../../assets/scripts/handoff-bundle-build.mjs");
const { buildHandoffBundle } = bundleModule;

describe("bundle-floor: body below 3k tokens returns error", () => {
  it("returns { error: 'insufficient-content' } for a too-small body", async () => {
    const llmBody = await readFile(LLM_BODY_TOO_SMALL, "utf8");
    const result = await buildHandoffBundle({
      stageFrom: "1",
      stageTo: "2",
      designDir: STAGE1_COMPLETE_DIR,
      llmSummaryBody: llmBody,
    });
    expect(result.error).toBe("insufficient-content");
  });

  it("returns tokens count in the error result", async () => {
    const llmBody = await readFile(LLM_BODY_TOO_SMALL, "utf8");
    const result = await buildHandoffBundle({
      stageFrom: "1",
      stageTo: "2",
      designDir: STAGE1_COMPLETE_DIR,
      llmSummaryBody: llmBody,
    });
    expect(typeof result.tokens).toBe("number");
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.tokens).toBeLessThan(3000);
  });

  it("returns floor: 3000 in the error result", async () => {
    const llmBody = await readFile(LLM_BODY_TOO_SMALL, "utf8");
    const result = await buildHandoffBundle({
      stageFrom: "1",
      stageTo: "2",
      designDir: STAGE1_COMPLETE_DIR,
      llmSummaryBody: llmBody,
    });
    expect(result.floor).toBe(3000);
  });

  it("does not write a file when body is below floor", async () => {
    const llmBody = await readFile(LLM_BODY_TOO_SMALL, "utf8");
    // Use a unique subfolder to avoid test interference
    const testDir = resolve(FIXTURES_DIR, "design-dirs/floor-test-tmp");
    await buildHandoffBundle({
      stageFrom: "1",
      stageTo: "2",
      designDir: testDir,
      llmSummaryBody: llmBody,
    });
    const expectedPath = resolve(testDir, ".handoff/stage-1-bundle.md");
    expect(existsSync(expectedPath)).toBe(false);
  });
});
