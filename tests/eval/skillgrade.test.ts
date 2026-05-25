// tests/eval/skillgrade.test.ts
// Tests for the per-skill skillgrade harness (TRIG-01, TRIG-02, D-17).
// RED phase: tests written before implementation.
//
// Implements: D-17 (≥10 should-fire + ≥10 should-not-fire × 3 trials; recall ≥0.85; false-fire ≤0.15)

import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

describe("skillgrade: script structure", () => {
  it("skillgrade.mjs exists", () => {
    expect(existsSync(join(ROOT, "evals/runners/skillgrade.mjs"))).toBe(true);
  });

  it("dispatch-host.mjs exists", () => {
    expect(existsSync(join(ROOT, "evals/runners/dispatch-host.mjs"))).toBe(
      true
    );
  });

  it("skillgrade.mjs contains TRIALS = 3", async () => {
    const src = await readFile(
      join(ROOT, "evals/runners/skillgrade.mjs"),
      "utf8"
    );
    expect(src).toContain("TRIALS = 3");
  });

  it("dispatch-host.mjs contains A2 assumption note", async () => {
    const src = await readFile(
      join(ROOT, "evals/runners/dispatch-host.mjs"),
      "utf8"
    );
    expect(src).toMatch(/A2|baseline|fallback/i);
  });
});

describe("skillgrade: design triggers.yaml", () => {
  const designTriggersPath = join(
    ROOT,
    "evals/triggers/design/triggers.yaml"
  );

  it("design/triggers.yaml exists", () => {
    expect(existsSync(designTriggersPath)).toBe(true);
  });

  it("has ≥10 shouldFire prompts", async () => {
    const content = await readFile(designTriggersPath, "utf8");
    const parsed = parseYaml(content) as {
      shouldFire: Array<{ prompt: string }>;
    };
    expect(Array.isArray(parsed.shouldFire)).toBe(true);
    expect(parsed.shouldFire.length).toBeGreaterThanOrEqual(10);
  });

  it("has ≥10 shouldNotFire prompts", async () => {
    const content = await readFile(designTriggersPath, "utf8");
    const parsed = parseYaml(content) as {
      shouldNotFire: Array<{ prompt: string }>;
    };
    expect(Array.isArray(parsed.shouldNotFire)).toBe(true);
    expect(parsed.shouldNotFire.length).toBeGreaterThanOrEqual(10);
  });
});

describe("skillgrade: audit triggers.yaml", () => {
  const auditTriggersPath = join(ROOT, "evals/triggers/audit/triggers.yaml");

  it("audit/triggers.yaml exists", () => {
    expect(existsSync(auditTriggersPath)).toBe(true);
  });

  it("has ≥10 shouldFire prompts", async () => {
    const content = await readFile(auditTriggersPath, "utf8");
    const parsed = parseYaml(content) as {
      shouldFire: Array<{ prompt: string }>;
    };
    expect(parsed.shouldFire.length).toBeGreaterThanOrEqual(10);
  });

  it("has ≥10 shouldNotFire prompts", async () => {
    const content = await readFile(auditTriggersPath, "utf8");
    const parsed = parseYaml(content) as {
      shouldNotFire: Array<{ prompt: string }>;
    };
    expect(parsed.shouldNotFire.length).toBeGreaterThanOrEqual(10);
  });
});

describe("skillgrade: handoff triggers.yaml", () => {
  const handoffTriggersPath = join(
    ROOT,
    "evals/triggers/handoff/triggers.yaml"
  );

  it("handoff/triggers.yaml exists", () => {
    expect(existsSync(handoffTriggersPath)).toBe(true);
  });

  it("has ≥10 shouldFire prompts", async () => {
    const content = await readFile(handoffTriggersPath, "utf8");
    const parsed = parseYaml(content) as {
      shouldFire: Array<{ prompt: string }>;
    };
    expect(parsed.shouldFire.length).toBeGreaterThanOrEqual(10);
  });

  it("has ≥10 shouldNotFire prompts", async () => {
    const content = await readFile(handoffTriggersPath, "utf8");
    const parsed = parseYaml(content) as {
      shouldNotFire: Array<{ prompt: string }>;
    };
    expect(parsed.shouldNotFire.length).toBeGreaterThanOrEqual(10);
  });
});

describe("skillgrade: harness with synthetic design skill", () => {
  it("exports a runSkillgrade function", async () => {
    // @ts-ignore TS7016
    const mod: unknown = await import("../../evals/runners/skillgrade.mjs");
    expect(mod).toBeDefined();
    // @ts-ignore
    expect(typeof mod.runSkillgrade).toBe("function");
  });

  it("produces { recall, falseFireRate, pass } with high-quality triggers", async () => {
    // @ts-ignore TS7016
    const mod: {
      runSkillgrade: (opts: {
        skill: string;
        triggersPath: string;
        skillsDir?: string;
      }) => Promise<{
        skill: string;
        recall: number;
        falseFireRate: number;
        pass: boolean;
      }>;
    } = await import("../../evals/runners/skillgrade.mjs");

    // Run against the real design triggers — with the static-analysis fallback,
    // recall should be high for relevant prompts
    const result = await mod.runSkillgrade({
      skill: "design",
      triggersPath: join(ROOT, "evals/triggers/design/triggers.yaml"),
    });

    expect(typeof result.recall).toBe("number");
    expect(typeof result.falseFireRate).toBe("number");
    expect(typeof result.pass).toBe("boolean");
    expect(result.recall).toBeGreaterThanOrEqual(0);
    expect(result.recall).toBeLessThanOrEqual(1);
    expect(result.falseFireRate).toBeGreaterThanOrEqual(0);
    expect(result.falseFireRate).toBeLessThanOrEqual(1);
  }, 30000);
});
