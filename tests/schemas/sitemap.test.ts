// tests/schemas/sitemap.test.ts
// Tests for SitemapV1 Zod schema.

import { describe, it, expect } from "vitest";
import { SitemapV1 } from "../../schemas/src/sitemap.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../fixtures/sitemap");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

describe("SitemapV1", () => {
  it("parses a valid v1-minimal fixture with LATCH variants", () => {
    const data = loadFixture("v1-minimal.json");
    expect(() => SitemapV1.parse(data)).not.toThrow();
    const parsed = SitemapV1.parse(data);
    expect(parsed.artifact).toBe("sitemap");
    expect(parsed.stage).toBe("2");
    expect(parsed.variants.length).toBeGreaterThan(0);
  });

  it("accepts a variant with a valid LATCH scheme", () => {
    const data = loadFixture("v1-minimal.json");
    const parsed = SitemapV1.parse(data);
    const schemes = parsed.variants.map((v) => v.scheme);
    expect(schemes).toContain("category");
    expect(schemes).toContain("hierarchy");
  });

  it("accepts an optional mermaidFlow field on a variant", () => {
    const data = loadFixture("v1-minimal.json");
    const parsed = SitemapV1.parse(data);
    const withMermaid = parsed.variants.find((v) => v.mermaidFlow !== undefined);
    expect(withMermaid).toBeDefined();
    const withoutMermaid = parsed.variants.find(
      (v) => v.mermaidFlow === undefined
    );
    expect(withoutMermaid).toBeDefined();
  });

  it("rejects a fixture with an invalid LATCH scheme", () => {
    const data = loadFixture("v1-minimal.json") as Record<string, unknown>;
    const variants = [...((data["variants"] as unknown[]) ?? [])];
    const invalid = {
      ...data,
      variants: [
        {
          ...(variants[0] as Record<string, unknown>),
          scheme: "invalid-scheme",
        },
      ],
    };
    const result = SitemapV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects a fixture with an empty variants array", () => {
    const data = loadFixture("v1-minimal.json") as Record<string, unknown>;
    const invalid = { ...data, variants: [] };
    const result = SitemapV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
