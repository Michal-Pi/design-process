// tests/eval/coexistence-shape.test.ts
// Tests for the aggregate coexistence eval harness (D-15, D-16, TRIG-04).
// RED phase: tests written before implementation.
//
// Implements: D-15 (5-package corpus), D-16 (recall ≥0.80 aggregate threshold),
//             D-17 (skillgrade analog), Open Q3 (Phase 1 reports number)

import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

describe("coexistence: harness files exist", () => {
  it("evals/coexistence/aggregate-eval.mjs exists", () => {
    expect(
      existsSync(join(ROOT, "evals/coexistence/aggregate-eval.mjs"))
    ).toBe(true);
  });

  it("evals/coexistence/install-corpus.mjs exists", () => {
    expect(
      existsSync(join(ROOT, "evals/coexistence/install-corpus.mjs"))
    ).toBe(true);
  });
});

describe("coexistence: trigger YAMLs", () => {
  const packages = [
    "complete-design",
    "gsd",
    "superpowers",
    "frontend-design",
    "shadcn",
    "notion-mcp",
  ];

  for (const pkg of packages) {
    it(`evals/coexistence/triggers/${pkg}.yaml exists`, () => {
      expect(
        existsSync(
          join(ROOT, `evals/coexistence/triggers/${pkg}.yaml`)
        )
      ).toBe(true);
    });
  }

  for (const pkg of packages) {
    it(`${pkg}.yaml has ≥30 shouldFire prompts`, async () => {
      const content = await readFile(
        join(ROOT, `evals/coexistence/triggers/${pkg}.yaml`),
        "utf8"
      );
      const parsed = parseYaml(content) as {
        shouldFire: Array<{ prompt: string }>;
      };
      expect(Array.isArray(parsed.shouldFire)).toBe(true);
      expect(parsed.shouldFire.length).toBeGreaterThanOrEqual(30);
    });
  }
});

describe("coexistence: aggregate eval output shape", () => {
  it("exports a runAggregateCoexistenceEval function", async () => {
    // @ts-ignore TS7016
    const mod: unknown = await import(
      "../../evals/coexistence/aggregate-eval.mjs"
    );
    expect(mod).toBeDefined();
    // @ts-ignore
    expect(typeof mod.runAggregateCoexistenceEval).toBe("function");
  });

  it("produces output with recall, falseFireRate, pass, calibrationNote fields", async () => {
    // @ts-ignore TS7016
    const mod: {
      runAggregateCoexistenceEval: () => Promise<{
        recall: number;
        falseFireRate: number;
        pass: boolean;
        calibrationNote?: string;
      }>;
    } = await import("../../evals/coexistence/aggregate-eval.mjs");

    const result = await mod.runAggregateCoexistenceEval();

    expect(typeof result.recall).toBe("number");
    expect(typeof result.falseFireRate).toBe("number");
    expect(typeof result.pass).toBe("boolean");
    expect(result.recall).toBeGreaterThanOrEqual(0);
    expect(result.recall).toBeLessThanOrEqual(1);
  }, 60000);

  it("emits last-run.json with deterministic shape after running", async () => {
    const lastRunPath = join(ROOT, "evals/coexistence/last-run.json");
    if (!existsSync(lastRunPath)) {
      // Run the eval to generate it
      // @ts-ignore TS7016
      const mod = await import("../../evals/coexistence/aggregate-eval.mjs");
      // @ts-ignore
      await mod.runAggregateCoexistenceEval();
    }
    expect(existsSync(lastRunPath)).toBe(true);
    const content = JSON.parse(await readFile(lastRunPath, "utf8"));
    expect(typeof content.recall).toBe("number");
    expect(typeof content.falseFireRate).toBe("number");
    expect(typeof content.pass).toBe("boolean");
  }, 60000);
});

describe("coexistence: install-corpus description budget (FIX 3)", () => {
  // The scorer reads String(data.description).slice(0, 200) — descriptions that
  // exceed 200 chars will have keywords silently truncated.
  const PEER_PACKAGE_KEYWORDS: Record<string, string[]> = {
    gsd: ["plan", "gsd-plan"],
    superpowers: ["tdd", "brainstorm"],
    "frontend-design": ["design-system", "figma"],
    shadcn: ["shadcn", "shadcn"],
    "notion-mcp": ["notion", "notion-mcp"],
  };

  it("all peer package descriptions are ≤200 chars", async () => {
    const mod = await import("../../evals/coexistence/install-corpus.mjs") as { prepareCorpus: (dir: string) => Promise<void> };
    expect(typeof mod.prepareCorpus).toBe("function");

    // Read the source directly to check description lengths without running prepareCorpus
    const src = await readFile(
      join(ROOT, "evals/coexistence/install-corpus.mjs"),
      "utf8"
    );
    // Extract description strings from the source
    const descMatches = [...src.matchAll(/description:\s*\n?\s*"([^"\\]*(\\.[^"\\]*)*)"/g)];
    expect(descMatches.length).toBeGreaterThanOrEqual(5); // at least 5 peer packages
    for (const m of descMatches) {
      const raw: string = m[1] ?? "";
      const desc = raw.replace(/\\"/g, '"');
      expect(desc.length).toBeLessThanOrEqual(200);
    }
  });

  for (const [pkg, keywords] of Object.entries(PEER_PACKAGE_KEYWORDS)) {
    it(`${pkg} description contains expected keywords`, async () => {
      const src = await readFile(
        join(ROOT, "evals/coexistence/install-corpus.mjs"),
        "utf8"
      );
      // Find the CORPUS_PACKAGES entry for this pkg and extract its description
      // Pattern: look for name: "pkg" followed by description
      const pkgBlockMatch = src.match(
        new RegExp(`name:\\s*"${pkg}",[\\s\\S]*?description:\\s*\\n?\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`)
      );
      expect(pkgBlockMatch).not.toBeNull();
      const desc = (pkgBlockMatch?.[1] ?? "").replace(/\\"/g, '"').toLowerCase();
      for (const kw of keywords) {
        expect(desc).toContain(kw.toLowerCase());
      }
    });
  }
});

describe("coexistence: contingency document", () => {
  it("docs/CONTINGENCY-TRIG-04.md exists", () => {
    expect(existsSync(join(ROOT, "docs/CONTINGENCY-TRIG-04.md"))).toBe(true);
  });

  it("contains split lever documentation", async () => {
    const content = await readFile(
      join(ROOT, "docs/CONTINGENCY-TRIG-04.md"),
      "utf8"
    );
    expect(content).toMatch(/complete-design-core|complete-design-atoms|split/i);
  });
});
