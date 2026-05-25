// tests/verify/lint-determinism.test.ts
// Tests for the lint-determinism architecture gate (PREV-04).
// RED phase: tests written before implementation.
//
// Implements: D-13 (architecture lint rejecting LLM-client imports in assets/scripts/)

import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

describe("lint-determinism: script structure", () => {
  it("lint-determinism.mjs exists", () => {
    const p = join(ROOT, "assets/scripts/lint-determinism.mjs");
    expect(existsSync(p)).toBe(true);
  });

  it("contains the required LLM import regex", async () => {
    const src = await readFile(
      join(ROOT, "assets/scripts/lint-determinism.mjs"),
      "utf8"
    );
    expect(src).toMatch(/anthropic|openai|langchain|llamaindex/);
  });

  it("supports --scope flag", async () => {
    const src = await readFile(
      join(ROOT, "assets/scripts/lint-determinism.mjs"),
      "utf8"
    );
    expect(src).toContain("scope");
  });
});

describe("lint-determinism: LLM import detection", () => {
  it("llm-import-violation.mjs exists", () => {
    const p = join(
      ROOT,
      "tests/fixtures/lint-determinism/scripts/llm-import-violation.mjs"
    );
    expect(existsSync(p)).toBe(true);
  });

  it("clean-script.mjs exists", () => {
    const p = join(
      ROOT,
      "tests/fixtures/lint-determinism/scripts/clean-script.mjs"
    );
    expect(existsSync(p)).toBe(true);
  });

  it("exits 1 with violations when scoped to fixture dir with llm import", () => {
    const result = spawnSync(
      "node",
      [
        "--import",
        "tsx/esm",
        join(ROOT, "assets/scripts/lint-determinism.mjs"),
        "--scope",
        join(ROOT, "tests/fixtures/lint-determinism/scripts"),
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    // Exit code 1 when violations found
    expect(result.status).toBe(1);
    // Reports the violation file
    expect(result.stdout + result.stderr).toMatch(
      /llm-import-violation|@anthropic-ai/
    );
  });

  it("exits 0 when scoped to clean-only directory", async () => {
    // Create a temp dir with only the clean script
    const { mkdtemp, writeFile: wf, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const tempDir = await mkdtemp(join(tmpdir(), "lint-det-clean-"));
    try {
      await wf(
        join(tempDir, "clean-only.mjs"),
        `import { readFile } from 'node:fs/promises';\n`
      );
      const result = spawnSync(
        "node",
        [
          "--import",
          "tsx/esm",
          join(ROOT, "assets/scripts/lint-determinism.mjs"),
          "--scope",
          tempDir,
        ],
        { cwd: ROOT, encoding: "utf8" }
      );
      expect(result.status).toBe(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("does NOT flag comment-only mentions of LLM vendors", async () => {
    // Create a temp dir with a file that mentions anthropic only in comments
    const { mkdtemp, writeFile: wf, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const tempDir = await mkdtemp(join(tmpdir(), "lint-det-comment-"));
    try {
      await wf(
        join(tempDir, "comment-only.mjs"),
        `// This script is NOT using anthropic or openai imports\nimport { readFile } from 'node:fs/promises';\n`
      );
      const result = spawnSync(
        "node",
        [
          "--import",
          "tsx/esm",
          join(ROOT, "assets/scripts/lint-determinism.mjs"),
          "--scope",
          tempDir,
        ],
        { cwd: ROOT, encoding: "utf8" }
      );
      expect(result.status).toBe(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
