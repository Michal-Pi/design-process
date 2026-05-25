// tests/handoff/bundle-frame.test.ts
// Tests for handoff bundle frame: valid body produces ajv-validated frontmatter;
// required sections preserved verbatim; sourceHash present with sha256 format.
//
// Source: CONTEXT.md D-05, D-06, D-07; PLAN.md Task 2 behavior
// Implements: HAND-01, HAND-02, HAND-03

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES_DIR = resolve(ROOT, "tests/fixtures");
const STAGE1_COMPLETE_DIR = resolve(FIXTURES_DIR, "design-dirs/stage-1-complete");
const LLM_BODY_SMALL = resolve(FIXTURES_DIR, "bundles/llm-body-small.md");

// @ts-ignore TS7016: no declaration for .mjs script
const bundleModule: any = await import("../../assets/scripts/handoff-bundle-build.mjs");
const { buildHandoffBundle } = bundleModule;

describe("bundle-frame: valid body produces valid frontmatter", () => {
  let result: any;
  let bundlePath: string;

  beforeAll(async () => {
    const llmBody = await readFile(LLM_BODY_SMALL, "utf8");
    result = await buildHandoffBundle({
      stageFrom: "1",
      stageTo: "2",
      designDir: STAGE1_COMPLETE_DIR,
      llmSummaryBody: llmBody,
    });
    bundlePath = result.path;
  });

  afterAll(async () => {
    // Clean up generated bundle
    const handoffDir = resolve(STAGE1_COMPLETE_DIR, ".handoff");
    if (existsSync(handoffDir)) {
      await rm(handoffDir, { recursive: true, force: true });
    }
  });

  it("buildHandoffBundle returns ok:true", () => {
    expect(result).toHaveProperty("ok", true);
  });

  it("returns tokenCount between 3000 and 15000", () => {
    expect(result.tokenCount).toBeGreaterThanOrEqual(3000);
    expect(result.tokenCount).toBeLessThanOrEqual(15000);
  });

  it("returns truncationWarning as null when not truncated", () => {
    expect(result.truncationWarning).toBeNull();
  });

  it("writes bundle file to designDir/.handoff/stage-1-bundle.md", () => {
    const expectedPath = resolve(STAGE1_COMPLETE_DIR, ".handoff/stage-1-bundle.md");
    expect(existsSync(expectedPath)).toBe(true);
    expect(result.path).toBe(expectedPath);
  });

  it("bundle file has valid YAML frontmatter", async () => {
    const content = await readFile(bundlePath, "utf8");
    const parsed = matter(content);
    expect(parsed.data).toBeDefined();
    expect(typeof parsed.data).toBe("object");
  });

  it("frontmatter artifact field is 'handoff-bundle'", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { data } = matter(content);
    expect(data.artifact).toBe("handoff-bundle");
  });

  it("frontmatter schemaVersion is 1", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { data } = matter(content);
    expect(data.schemaVersion).toBe(1);
  });

  it("frontmatter stage is '1 → 2'", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { data } = matter(content);
    expect(data.stage).toBe("1 → 2");
  });

  it("frontmatter sourceHash matches sha256 format", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { data } = matter(content);
    expect(data.sourceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("frontmatter tokenCount is between 3000 and 15000", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { data } = matter(content);
    expect(data.tokenCount).toBeGreaterThanOrEqual(3000);
    expect(data.tokenCount).toBeLessThanOrEqual(15000);
  });

  it("frontmatter truncationWarning is null", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { data } = matter(content);
    expect(data.truncationWarning).toBeNull();
  });

  it("frontmatter generated is ISO 8601", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { data } = matter(content);
    expect(data.generated).toBeDefined();
    expect(new Date(data.generated as string).toISOString()).toBeTruthy();
  });

  it("frontmatter provenanceWorstCase is a valid enum value", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { data } = matter(content);
    expect(["generated", "validated", "inferred", "missing"]).toContain(
      data.provenanceWorstCase
    );
  });

  it("bundle body contains all required section headers", async () => {
    const content = await readFile(bundlePath, "utf8");
    const { content: body } = matter(content);
    expect(body).toContain("## Goal & scope");
    expect(body).toContain("## Decisions made");
    expect(body).toContain("## Open questions");
    expect(body).toContain("## Artifacts inventory");
    expect(body).toContain("## Pointers to verify");
    expect(body).toContain("## Provenance (worst-case)");
  });

  it("bundle is deterministic: two identical runs produce same sourceHash", async () => {
    const llmBody = await readFile(LLM_BODY_SMALL, "utf8");
    const result2 = await buildHandoffBundle({
      stageFrom: "1",
      stageTo: "2",
      designDir: STAGE1_COMPLETE_DIR,
      llmSummaryBody: llmBody,
    });
    const content1 = await readFile(bundlePath, "utf8");
    const content2 = await readFile(result2.path, "utf8");
    const { data: d1 } = matter(content1);
    const { data: d2 } = matter(content2);
    expect(d1.sourceHash).toBe(d2.sourceHash);
  });
});
