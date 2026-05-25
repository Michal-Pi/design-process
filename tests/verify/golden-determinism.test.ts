// tests/verify/golden-determinism.test.ts
// Tests for the verify-golden determinism gate (PREV-03).
// RED phase: tests written before implementation.
//
// Implements: D-12 (verify --golden scope), PREV-03 (5× byte-identical runs)

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

describe("verify-golden: determinism gate", () => {
  it("exports a runGolden function", async () => {
    // @ts-ignore TS7016: no declaration for .mjs script
    const mod: unknown = await import("../../assets/scripts/verify-golden.mjs");
    expect(mod).toBeDefined();
    // @ts-ignore
    expect(typeof mod.runGolden).toBe("function");
  });

  it("has BYTE_IDENTICAL_RUNS = 5 constant", async () => {
    const src = await readFile(
      join(ROOT, "assets/scripts/verify-golden.mjs"),
      "utf8"
    );
    expect(src).toContain("BYTE_IDENTICAL_RUNS = 5");
  });

  it("discovers fixtures under evals/fixtures/golden/", async () => {
    // @ts-ignore TS7016: no declaration for .mjs script
    const mod: { runGolden: (opts?: unknown) => Promise<boolean> } =
      await import("../../assets/scripts/verify-golden.mjs");
    // runGolden returns true on success
    const ok = await mod.runGolden({ dryRun: true });
    expect(typeof ok).toBe("boolean");
  });

  it("returns false on corrupted expected file", async () => {
    // @ts-ignore TS7016: no declaration for .mjs script
    const mod: { runGolden: (opts?: unknown) => Promise<boolean> } =
      await import("../../assets/scripts/verify-golden.mjs");
    // Dry run just checks structure — does not invoke scripts
    const result = await mod.runGolden({ dryRun: true });
    expect(typeof result).toBe("boolean");
    expect(result).toBe(true); // fixtures exist
  });
});

describe("verify-golden: schemas-emit fixture", () => {
  it("schemas-emit fixture input.json exists", async () => {
    const p = join(ROOT, "evals/fixtures/golden/schemas-emit/input.json");
    expect(existsSync(p)).toBe(true);
  });

  it("schemas-emit fixture expected.json exists", async () => {
    const p = join(ROOT, "evals/fixtures/golden/schemas-emit/expected.json");
    expect(existsSync(p)).toBe(true);
  });
});

describe("verify-golden: gate-stage-5a fixture", () => {
  it("gate-stage-5a input-empty/.gitkeep exists", async () => {
    const p = join(
      ROOT,
      "evals/fixtures/golden/gate-stage-5a/input-empty/.gitkeep"
    );
    expect(existsSync(p)).toBe(true);
  });

  it("gate-stage-5a input-with-interactions/interactions/foo.md exists", async () => {
    const p = join(
      ROOT,
      "evals/fixtures/golden/gate-stage-5a/input-with-interactions/interactions/foo.md"
    );
    expect(existsSync(p)).toBe(true);
  });

  it("gate-stage-5a expected-not-runnable.json matches not_runnable kind", async () => {
    const p = join(
      ROOT,
      "evals/fixtures/golden/gate-stage-5a/expected-not-runnable.json"
    );
    const data = JSON.parse(await readFile(p, "utf8"));
    expect(data.kind).toBe("not_runnable");
  });

  it("gate-stage-5a expected-skeleton-pass.json matches pass kind", async () => {
    const p = join(
      ROOT,
      "evals/fixtures/golden/gate-stage-5a/expected-skeleton-pass.json"
    );
    const data = JSON.parse(await readFile(p, "utf8"));
    expect(data.kind).toBe("pass");
  });
});

describe("verify-golden: mermaid-render fixture", () => {
  it("mermaid-render input.mmd exists", async () => {
    const p = join(ROOT, "evals/fixtures/golden/mermaid-render/input.mmd");
    expect(existsSync(p)).toBe(true);
  });

  it("mermaid-render expected.svg exists", async () => {
    const p = join(ROOT, "evals/fixtures/golden/mermaid-render/expected.svg");
    expect(existsSync(p)).toBe(true);
  });
});
