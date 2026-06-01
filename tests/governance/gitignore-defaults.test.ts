// tests/governance/gitignore-defaults.test.ts
// Tests for gitignore/gitattributes templates and complete-design init.
// RED phase — these tests fail until Task 1 implementation exists.
// Implements: D-29, ART-04, SPINE-01..04, DIST-01

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFile, rm, mkdtemp } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const GITIGNORE_TEMPLATE = join(ROOT, "assets/templates/gitignore-complete-design.txt");
const GITATTRIBUTES_TEMPLATE = join(ROOT, "assets/templates/gitattributes-complete-design.txt");

// ── Template existence + required lines ───────────────────────────────────────

describe("gitignore template", () => {
  it("exists at assets/templates/gitignore-complete-design.txt", () => {
    expect(existsSync(GITIGNORE_TEMPLATE)).toBe(true);
  });

  it("contains .complete-design/private/ line", () => {
    const content = readFileSync(GITIGNORE_TEMPLATE, "utf8");
    expect(content).toContain(".complete-design/private/");
  });

  it("contains design/sketch/rejected/ line", () => {
    const content = readFileSync(GITIGNORE_TEMPLATE, "utf8");
    expect(content).toContain("design/sketch/rejected/");
  });

  it("contains design/research/interviews/raw/ line", () => {
    const content = readFileSync(GITIGNORE_TEMPLATE, "utf8");
    expect(content).toContain("design/research/interviews/raw/");
  });

  it("contains design/research/transcripts/*.raw.md line", () => {
    const content = readFileSync(GITIGNORE_TEMPLATE, "utf8");
    expect(content).toContain("design/research/transcripts/*.raw.md");
  });

  it("contains guarded block markers", () => {
    const content = readFileSync(GITIGNORE_TEMPLATE, "utf8");
    expect(content).toContain("# >>> complete-design defaults");
    expect(content).toContain("# <<< complete-design defaults");
  });
});

describe("gitattributes template", () => {
  it("exists at assets/templates/gitattributes-complete-design.txt", () => {
    expect(existsSync(GITATTRIBUTES_TEMPLATE)).toBe(true);
  });

  it("contains design/*.json merge=ours line (ART-04)", () => {
    const content = readFileSync(GITATTRIBUTES_TEMPLATE, "utf8");
    expect(content).toContain("design/*.json merge=ours");
  });

  it("contains *.md text eol=lf line", () => {
    const content = readFileSync(GITATTRIBUTES_TEMPLATE, "utf8");
    expect(content).toContain("*.md text eol=lf");
  });

  it("contains *.json text eol=lf line", () => {
    const content = readFileSync(GITATTRIBUTES_TEMPLATE, "utf8");
    expect(content).toContain("*.json text eol=lf");
  });

  it("contains guarded block markers", () => {
    const content = readFileSync(GITATTRIBUTES_TEMPLATE, "utf8");
    expect(content).toContain("# >>> complete-design defaults");
    expect(content).toContain("# <<< complete-design defaults");
  });
});
