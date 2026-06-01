// tests/governance/init.test.ts
// Tests for complete-design init: writes templates, creates design/ + .complete-design/ dirs,
// and is idempotent (guarded block not duplicated on second run).
// RED phase — fails until Task 1 implementation exists.
// Implements: D-29, ART-04, TRUST-02

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// @ts-ignore TS7016: no declaration file for .mjs script
const { runInit } = await import("../../assets/scripts/init.mjs");

describe("init: --apply mode", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), "complete-design-init-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("writes .gitignore with complete-design guarded block", async () => {
    await runInit({ target: tmpDir, apply: true });
    const content = await readFile(join(tmpDir, ".gitignore"), "utf8");
    expect(content).toContain("# >>> complete-design defaults");
    expect(content).toContain(".complete-design/private/");
    expect(content).toContain("# <<< complete-design defaults");
  });

  it("writes .gitattributes with complete-design guarded block", async () => {
    await runInit({ target: tmpDir, apply: true });
    const content = await readFile(join(tmpDir, ".gitattributes"), "utf8");
    expect(content).toContain("# >>> complete-design defaults");
    expect(content).toContain("design/*.json merge=ours");
    expect(content).toContain("# <<< complete-design defaults");
  });

  it("creates design/ directory", async () => {
    await runInit({ target: tmpDir, apply: true });
    expect(existsSync(join(tmpDir, "design"))).toBe(true);
  });

  it("creates .complete-design/ directory", async () => {
    await runInit({ target: tmpDir, apply: true });
    expect(existsSync(join(tmpDir, ".complete-design"))).toBe(true);
  });

  it("creates design/MANIFEST.md", async () => {
    await runInit({ target: tmpDir, apply: true });
    expect(existsSync(join(tmpDir, "design", "MANIFEST.md"))).toBe(true);
  });

  it("is idempotent: running twice yields exactly one guarded block in .gitignore", async () => {
    await runInit({ target: tmpDir, apply: true });
    await runInit({ target: tmpDir, apply: true });
    const content = await readFile(join(tmpDir, ".gitignore"), "utf8");
    const count = (content.match(/# >>> complete-design defaults/g) ?? []).length;
    expect(count).toBe(1);
  });

  it("is idempotent: running twice yields exactly one guarded block in .gitattributes", async () => {
    await runInit({ target: tmpDir, apply: true });
    await runInit({ target: tmpDir, apply: true });
    const content = await readFile(join(tmpDir, ".gitattributes"), "utf8");
    const count = (content.match(/# >>> complete-design defaults/g) ?? []).length;
    expect(count).toBe(1);
  });

  it("appends to existing .gitignore without destroying user content", async () => {
    // Pre-existing .gitignore
    await writeFile(join(tmpDir, ".gitignore"), "# existing content\nnode_modules/\n", "utf8");
    await runInit({ target: tmpDir, apply: true });
    const content = await readFile(join(tmpDir, ".gitignore"), "utf8");
    expect(content).toContain("# existing content");
    expect(content).toContain("# >>> complete-design defaults");
  });
});

describe("init: dry-run mode (no --apply)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), "complete-design-init-dry-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("does NOT write .gitignore when apply is false", async () => {
    await runInit({ target: tmpDir, apply: false });
    expect(existsSync(join(tmpDir, ".gitignore"))).toBe(false);
  });

  it("does NOT create design/ when apply is false", async () => {
    await runInit({ target: tmpDir, apply: false });
    expect(existsSync(join(tmpDir, "design"))).toBe(false);
  });
});
