// tests/handoff/bundle-truncation.test.ts
// Tests for handoff bundle truncation: oversized body → Risks surfaced dropped first;
// final tokenCount ≤ 15000; truncationWarning recorded.
//
// Source: CONTEXT.md D-06 (15k token ceiling + truncation priority); PLAN.md Task 2 behavior
// Implements: HAND-02 (section-aware truncation)

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES_DIR = resolve(ROOT, "tests/fixtures");
// Use a separate fixture directory for truncation tests to avoid parallel-test interference
const TRUNCATION_TEST_DIR = resolve(FIXTURES_DIR, "design-dirs/stage-1-truncation-test");
const LLM_BODY_OVERSIZED = resolve(FIXTURES_DIR, "bundles/llm-body-oversized.md");

// @ts-ignore TS7016: no declaration for .mjs script
const bundleModule: any = await import("../../assets/scripts/handoff-bundle-build.mjs");
const { buildHandoffBundle } = bundleModule;

describe("bundle-truncation: oversized body truncates correctly", () => {
  let result: any;

  beforeAll(async () => {
    const llmBody = await readFile(LLM_BODY_OVERSIZED, "utf8");
    result = await buildHandoffBundle({
      stageFrom: "1",
      stageTo: "2",
      designDir: TRUNCATION_TEST_DIR,
      llmSummaryBody: llmBody,
    });
  });

  afterAll(async () => {
    const handoffDir = resolve(TRUNCATION_TEST_DIR, ".handoff");
    if (existsSync(handoffDir)) {
      await rm(handoffDir, { recursive: true, force: true });
    }
  });

  it("buildHandoffBundle returns ok:true even for oversized body", () => {
    expect(result.ok).toBe(true);
  });

  it("final tokenCount is ≤ 15000", () => {
    expect(result.tokenCount).toBeLessThanOrEqual(15000);
  });

  it("truncationWarning is not null when truncation occurred", () => {
    expect(result.truncationWarning).not.toBeNull();
    expect(typeof result.truncationWarning).toBe("string");
    expect((result.truncationWarning as string).length).toBeGreaterThan(0);
  });

  it("frontmatter tokenCount matches result.tokenCount", async () => {
    const content = await readFile(result.path, "utf8");
    const { data } = matter(content);
    expect(data.tokenCount).toBe(result.tokenCount);
  });

  it("frontmatter truncationWarning is set (non-null)", async () => {
    const content = await readFile(result.path, "utf8");
    const { data } = matter(content);
    expect(data.truncationWarning).not.toBeNull();
    expect(data.truncationWarning).toBeTruthy();
  });

  it("required sections are preserved after truncation", async () => {
    const content = await readFile(result.path, "utf8");
    const { content: body } = matter(content);
    expect(body).toContain("## Goal & scope");
    expect(body).toContain("## Decisions made");
    expect(body).toContain("## Open questions");
    expect(body).toContain("## Artifacts inventory");
  });
});
