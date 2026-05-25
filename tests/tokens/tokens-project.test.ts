// tests/tokens/tokens-project.test.ts
// Unit + golden tests for tokens-project.mjs — DTCG v2025.10 emit + three adapter paths.
//
// DTCG validation: using structural ajv check (dtcg-lint.mjs not in Phase 1 deliverables
// per 01-01-SUMMARY — F-11). Validates every token has $type and $value, and $type is
// a known DTCG v2025.10 allowed type.
//
// Implements: D-41, D-42, D-48, D-49, ADAPT-01, ADAPT-03, MVPA-04, COST-05
// T-02-03-A (TDD RED phase)

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURE_DIR = join(ROOT, "evals/fixtures/golden/tokens-project");

// @ts-ignore TS7016: no declaration for .mjs script
const tokensModule: any = await import("../../assets/scripts/tokens-project.mjs");
const { emitTokens } = tokensModule;

// DTCG v2025.10 allowed $type values (from spec)
const DTCG_ALLOWED_TYPES = [
  "color", "dimension", "fontFamily", "fontStyle", "fontWeight",
  "number", "duration", "cubicBezier", "strokeStyle", "border",
  "transition", "shadow", "gradient", "typography",
];

/** Recursively collect all token objects (leaf nodes with $type) from DTCG JSON */
function collectTokens(obj: Record<string, unknown>, path = ""): Array<{ path: string; token: Record<string, unknown> }> {
  const results: Array<{ path: string; token: Record<string, unknown> }> = [];
  if (typeof obj !== "object" || obj === null) return results;
  if (obj.$type !== undefined) {
    // This IS a token node
    results.push({ path, token: obj });
    return results;
  }
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue; // skip $schema, $groups, $metadata
    if (typeof val === "object" && val !== null) {
      results.push(...collectTokens(val as Record<string, unknown>, path ? `${path}.${key}` : key));
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// emitTokens function existence
// ─────────────────────────────────────────────────────────────────────────────

describe("tokens-project: module exports", () => {
  it("exports emitTokens as a function", () => {
    expect(typeof emitTokens).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Shadcn adapter
// ─────────────────────────────────────────────────────────────────────────────

describe("tokens-project: shadcn adapter", () => {
  let tmpDir: string;
  let result: any;

  beforeAll(async () => {
    tmpDir = join(tmpdir(), `design-os-tokens-shadcn-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    result = await emitTokens({
      adapter: "shadcn",
      colorPrimary: "oklch(60% 0.2 270)",
      colorBackground: "oklch(98% 0.0 0)",
      colorForeground: "oklch(15% 0.0 0)",
      borderRadius: "0.5rem",
      fontFamilyBase: "Inter, system-ui",
      spacingBase: 4,
      designDir: tmpDir,
      projectRoot: tmpDir,
      generatedAt: "2026-05-25T00:00:00.000Z",
    });
  });

  afterAll(async () => {
    if (existsSync(tmpDir)) await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns tokensPath, projectionPath, adapterUsed", () => {
    expect(result).toBeDefined();
    expect(typeof result.tokensPath).toBe("string");
    expect(typeof result.projectionPath).toBe("string");
    expect(result.adapterUsed).toBe("shadcn");
  });

  it("writes design/tokens.json at tokensPath", () => {
    expect(existsSync(result.tokensPath)).toBe(true);
  });

  it("tokens.json frontmatter contains stage:5a-lite", async () => {
    const content = await readFile(result.tokensPath, "utf8");
    expect(content).toContain("stage: 5a-lite");
  });

  it("tokens.json frontmatter contains evidence:INFERRED", async () => {
    const content = await readFile(result.tokensPath, "utf8");
    expect(content).toContain("evidence: INFERRED");
  });

  it("tokens.json DTCG body is valid JSON with $type fields", async () => {
    const content = await readFile(result.tokensPath, "utf8");
    // Strip YAML frontmatter (between --- markers)
    const bodyMatch = content.match(/^---[\s\S]*?---\n([\s\S]*)$/m);
    const jsonBody = bodyMatch ? bodyMatch[1].trim() : content.trim();
    const parsed = JSON.parse(jsonBody);
    const tokens = collectTokens(parsed);
    expect(tokens.length).toBeGreaterThan(0);
    for (const { path: tokenPath, token } of tokens) {
      expect(token.$type, `Token at ${tokenPath} missing $type`).toBeDefined();
      expect(token.$value, `Token at ${tokenPath} missing $value`).toBeDefined();
    }
  });

  it("all token $type values are valid DTCG v2025.10 types", async () => {
    const content = await readFile(result.tokensPath, "utf8");
    const bodyMatch = content.match(/^---[\s\S]*?---\n([\s\S]*)$/m);
    const jsonBody = bodyMatch ? bodyMatch[1].trim() : content.trim();
    const parsed = JSON.parse(jsonBody);
    const tokens = collectTokens(parsed);
    for (const { path: tokenPath, token } of tokens) {
      expect(
        DTCG_ALLOWED_TYPES,
        `Token at ${tokenPath} has invalid $type: ${token.$type}`
      ).toContain(token.$type);
    }
  });

  it("shadcn adapter projection file exists (CSS wrapper)", () => {
    expect(existsSync(result.projectionPath)).toBe(true);
  });

  it("shadcn projection does NOT contain components/ui/ path", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).not.toContain("components/ui/");
  });

  it("shadcn projection contains CSS custom property --primary", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).toContain("--primary");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind v4 adapter
// ─────────────────────────────────────────────────────────────────────────────

describe("tokens-project: tailwind-v4 adapter", () => {
  let tmpDir: string;
  let result: any;

  beforeAll(async () => {
    tmpDir = join(tmpdir(), `design-os-tokens-tw4-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    result = await emitTokens({
      adapter: "tailwind-v4",
      colorPrimary: "oklch(60% 0.2 270)",
      colorBackground: "oklch(98% 0.0 0)",
      colorForeground: "oklch(15% 0.0 0)",
      borderRadius: "0.5rem",
      fontFamilyBase: "Inter, system-ui",
      spacingBase: 4,
      designDir: tmpDir,
      projectRoot: tmpDir,
      generatedAt: "2026-05-25T00:00:00.000Z",
    });
  });

  afterAll(async () => {
    if (existsSync(tmpDir)) await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns adapterUsed: tailwind-v4", () => {
    expect(result.adapterUsed).toBe("tailwind-v4");
  });

  it("projection file is a CSS file", () => {
    expect(result.projectionPath).toMatch(/\.css$/);
    expect(existsSync(result.projectionPath)).toBe(true);
  });

  it("projection CSS contains @theme block", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).toContain("@theme");
  });

  it("projection CSS contains --color-primary", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).toContain("--color-primary");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind v4 adapter: merge into existing globals.css with @theme block
// ─────────────────────────────────────────────────────────────────────────────

describe("tokens-project: tailwind-v4 adapter @theme merge", () => {
  let tmpDir: string;
  let result: any;
  const existingGlobals = `@import "tailwindcss";\n\n@theme {\n  --color-existing: oklch(50% 0.1 200);\n}\n`;

  beforeAll(async () => {
    tmpDir = join(tmpdir(), `design-os-tokens-tw4-merge-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    // Write an existing globals.css with an @theme block
    const { writeFile } = await import("node:fs/promises");
    await mkdir(join(tmpDir, "app"), { recursive: true });
    await writeFile(join(tmpDir, "app/globals.css"), existingGlobals, "utf8");

    result = await emitTokens({
      adapter: "tailwind-v4",
      colorPrimary: "oklch(60% 0.2 270)",
      colorBackground: "oklch(98% 0.0 0)",
      colorForeground: "oklch(15% 0.0 0)",
      borderRadius: "0.5rem",
      fontFamilyBase: "Inter, system-ui",
      spacingBase: 4,
      designDir: tmpDir,
      projectRoot: tmpDir,
      generatedAt: "2026-05-25T00:00:00.000Z",
    });
  });

  afterAll(async () => {
    if (existsSync(tmpDir)) await rm(tmpDir, { recursive: true, force: true });
  });

  it("merged projection contains existing --color-existing token (additive only)", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).toContain("--color-existing");
  });

  it("merged projection also contains new --color-primary token", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).toContain("--color-primary");
  });

  it("merged projection has only ONE @theme block (not two)", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    const matches = content.match(/@theme\s*\{/g);
    expect(matches).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plain CSS adapter
// ─────────────────────────────────────────────────────────────────────────────

describe("tokens-project: plain-css adapter", () => {
  let tmpDir: string;
  let result: any;

  beforeAll(async () => {
    tmpDir = join(tmpdir(), `design-os-tokens-plain-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    result = await emitTokens({
      adapter: "plain-css",
      colorPrimary: "oklch(60% 0.2 270)",
      colorBackground: "oklch(98% 0.0 0)",
      colorForeground: "oklch(15% 0.0 0)",
      borderRadius: "0.5rem",
      fontFamilyBase: "Inter, system-ui",
      spacingBase: 4,
      designDir: tmpDir,
      projectRoot: tmpDir,
      generatedAt: "2026-05-25T00:00:00.000Z",
    });
  });

  afterAll(async () => {
    if (existsSync(tmpDir)) await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns adapterUsed: plain-css", () => {
    expect(result.adapterUsed).toBe("plain-css");
  });

  it("projection CSS contains :root block", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).toContain(":root");
  });

  it("projection CSS uses oklch() values (CSS Color 4)", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).toContain("oklch(");
  });

  it("projection CSS does NOT contain @theme block", async () => {
    const content = await readFile(result.projectionPath, "utf8");
    expect(content).not.toContain("@theme");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism: 5× byte-identical output
// ─────────────────────────────────────────────────────────────────────────────

describe("tokens-project: determinism (5x byte-identical)", () => {
  it("produces byte-identical tokens.json across 5 runs with same generatedAt", async () => {
    const hashes: string[] = [];
    const { createHash } = await import("node:crypto");

    for (let i = 0; i < 5; i++) {
      const tmpDir = join(tmpdir(), `design-os-determ-${Date.now()}-${i}`);
      await mkdir(tmpDir, { recursive: true });

      const res = await emitTokens({
        adapter: "shadcn",
        colorPrimary: "oklch(60% 0.2 270)",
        colorBackground: "oklch(98% 0.0 0)",
        colorForeground: "oklch(15% 0.0 0)",
        borderRadius: "0.5rem",
        fontFamilyBase: "Inter, system-ui",
        spacingBase: 4,
        designDir: tmpDir,
        projectRoot: tmpDir,
        generatedAt: "2026-05-25T00:00:00.000Z",
      });

      const content = await readFile(res.tokensPath, "utf8");
      hashes.push(createHash("sha256").update(content).digest("hex"));
      await rm(tmpDir, { recursive: true, force: true });
    }

    // All 5 hashes must be identical
    expect(hashes.every((h) => h === hashes[0])).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Golden fixture test: output matches expected fixtures byte-for-byte
// ─────────────────────────────────────────────────────────────────────────────

describe("tokens-project: golden fixtures", () => {
  it("shadcn adapter output matches expected-shadcn.json", async () => {
    const inputPath = join(FIXTURE_DIR, "input.json");
    const expectedPath = join(FIXTURE_DIR, "expected-shadcn.json");

    // Skip if fixtures not yet generated
    if (!existsSync(inputPath) || !existsSync(expectedPath)) {
      console.warn("Golden fixtures not yet generated — skipping golden comparison");
      return;
    }

    const input = JSON.parse(await readFile(inputPath, "utf8"));
    const expected = await readFile(expectedPath, "utf8");
    const { createHash } = await import("node:crypto");
    const expectedHash = createHash("sha256").update(expected).digest("hex");

    const tmpDir = join(tmpdir(), `golden-shadcn-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    const res = await emitTokens({ ...input, designDir: tmpDir, projectRoot: tmpDir });
    const content = await readFile(res.tokensPath, "utf8");
    const outputHash = createHash("sha256").update(content).digest("hex");

    await rm(tmpDir, { recursive: true, force: true });

    expect(outputHash).toBe(expectedHash);
  });

  it("tailwind-v4 adapter output matches expected-tailwind-v4.json", async () => {
    const inputPath = join(FIXTURE_DIR, "input.json");
    const expectedTwPath = join(FIXTURE_DIR, "expected-tailwind-v4.json");

    if (!existsSync(inputPath) || !existsSync(expectedTwPath)) {
      console.warn("Golden fixtures not yet generated — skipping golden comparison");
      return;
    }

    const input = JSON.parse(await readFile(inputPath, "utf8"));
    const expected = await readFile(expectedTwPath, "utf8");
    const { createHash } = await import("node:crypto");
    const expectedHash = createHash("sha256").update(expected).digest("hex");

    const tmpDir = join(tmpdir(), `golden-tw4-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    const res = await emitTokens({
      ...input,
      adapter: "tailwind-v4",
      designDir: tmpDir,
      projectRoot: tmpDir,
    });
    const content = await readFile(res.projectionPath, "utf8");
    const outputHash = createHash("sha256").update(content).digest("hex");

    await rm(tmpDir, { recursive: true, force: true });

    expect(outputHash).toBe(expectedHash);
  });

  it("plain-css adapter output matches expected-plain-css.json", async () => {
    const inputPath = join(FIXTURE_DIR, "input.json");
    const expectedPlainPath = join(FIXTURE_DIR, "expected-plain-css.json");

    if (!existsSync(inputPath) || !existsSync(expectedPlainPath)) {
      console.warn("Golden fixtures not yet generated — skipping golden comparison");
      return;
    }

    const input = JSON.parse(await readFile(inputPath, "utf8"));
    const expected = await readFile(expectedPlainPath, "utf8");
    const { createHash } = await import("node:crypto");
    const expectedHash = createHash("sha256").update(expected).digest("hex");

    const tmpDir = join(tmpdir(), `golden-plain-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    const res = await emitTokens({
      ...input,
      adapter: "plain-css",
      designDir: tmpDir,
      projectRoot: tmpDir,
    });
    const content = await readFile(res.projectionPath, "utf8");
    const outputHash = createHash("sha256").update(content).digest("hex");

    await rm(tmpDir, { recursive: true, force: true });

    expect(outputHash).toBe(expectedHash);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DTCG three-tier structure
// ─────────────────────────────────────────────────────────────────────────────

describe("tokens-project: DTCG three-tier structure", () => {
  let tmpDir: string;
  let dtcgBody: Record<string, unknown>;

  beforeAll(async () => {
    tmpDir = join(tmpdir(), `design-os-dtcg-tiers-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    const res = await emitTokens({
      adapter: "shadcn",
      colorPrimary: "oklch(60% 0.2 270)",
      colorBackground: "oklch(98% 0.0 0)",
      colorForeground: "oklch(15% 0.0 0)",
      borderRadius: "0.5rem",
      fontFamilyBase: "Inter, system-ui",
      spacingBase: 4,
      designDir: tmpDir,
      projectRoot: tmpDir,
      generatedAt: "2026-05-25T00:00:00.000Z",
    });

    const content = await readFile(res.tokensPath, "utf8");
    const bodyMatch = content.match(/^---[\s\S]*?---\n([\s\S]*)$/m);
    const jsonBody = bodyMatch ? bodyMatch[1].trim() : content.trim();
    dtcgBody = JSON.parse(jsonBody);
  });

  afterAll(async () => {
    if (existsSync(tmpDir)) await rm(tmpDir, { recursive: true, force: true });
  });

  it("DTCG body has primitive tier", () => {
    expect(dtcgBody).toHaveProperty("primitive");
  });

  it("DTCG body has semantic tier", () => {
    expect(dtcgBody).toHaveProperty("semantic");
  });

  it("DTCG body has component tier", () => {
    expect(dtcgBody).toHaveProperty("component");
  });

  it("primitive tier contains color tokens", () => {
    const primitive = dtcgBody.primitive as Record<string, unknown>;
    expect(primitive).toBeDefined();
    const tokens = collectTokens(primitive);
    const colorTokens = tokens.filter((t) => t.token.$type === "color");
    expect(colorTokens.length).toBeGreaterThan(0);
  });

  it("primitive tier contains dimension tokens", () => {
    const primitive = dtcgBody.primitive as Record<string, unknown>;
    const tokens = collectTokens(primitive);
    const dimTokens = tokens.filter((t) => t.token.$type === "dimension");
    expect(dimTokens.length).toBeGreaterThan(0);
  });

  it("semantic tier contains color-background alias", () => {
    const semantic = dtcgBody.semantic as Record<string, unknown>;
    const tokens = collectTokens(semantic);
    const bg = tokens.find((t) => t.path.includes("background"));
    expect(bg).toBeDefined();
  });

  it("component tier contains button tokens", () => {
    const component = dtcgBody.component as Record<string, unknown>;
    expect(component).toHaveProperty("button");
  });
});
