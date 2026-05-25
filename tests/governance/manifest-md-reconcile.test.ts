// tests/governance/manifest-md-reconcile.test.ts
// Tests for MANIFEST.md auto-reconciler: sorted, deterministic, dependents back-populated.
// RED phase — fails until Task 2 implementation exists.
// Implements: ART-07, PERSIST-01

import { describe, it, expect, afterAll } from "vitest";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURE_DIR = join(ROOT, "tests/fixtures/governance/design-dir-with-overrides");

// @ts-ignore TS7016: no declaration file for .mjs script
const { reconcileManifest } = await import("../../assets/scripts/manifest-md-reconcile.mjs");

describe("manifest-md-reconcile: reconcile fixture dir", () => {
  afterAll(async () => {
    // Clean up generated MANIFEST.md after tests
    const manifestPath = join(FIXTURE_DIR, "MANIFEST.md");
    if (existsSync(manifestPath)) {
      // Don't delete — we need it for determinism test
    }
  });

  it("creates MANIFEST.md in the design dir", async () => {
    await reconcileManifest({ designDir: FIXTURE_DIR });
    expect(existsSync(join(FIXTURE_DIR, "MANIFEST.md"))).toBe(true);
  });

  it("MANIFEST.md contains a table with artifact entries sorted by [stage, path]", async () => {
    await reconcileManifest({ designDir: FIXTURE_DIR });
    const content = await readFile(join(FIXTURE_DIR, "MANIFEST.md"), "utf8");
    // Should contain a Markdown table
    expect(content).toContain("| Stage |");
    // persona (stage 1) should appear before sitemap (stage 2)
    const personaIdx = content.indexOf("persona");
    const sitemapIdx = content.indexOf("sitemap");
    expect(personaIdx).toBeLessThan(sitemapIdx);
  });

  it("is deterministic: two consecutive runs produce byte-identical output", async () => {
    await reconcileManifest({ designDir: FIXTURE_DIR });
    const content1 = await readFile(join(FIXTURE_DIR, "MANIFEST.md"), "utf8");
    const hash1 = createHash("sha256").update(content1).digest("hex");

    await reconcileManifest({ designDir: FIXTURE_DIR });
    const content2 = await readFile(join(FIXTURE_DIR, "MANIFEST.md"), "utf8");
    const hash2 = createHash("sha256").update(content2).digest("hex");

    expect(hash1).toBe(hash2);
  });

  it("lists both persona (stage 1) and sitemap (stage 2) entries", async () => {
    await reconcileManifest({ designDir: FIXTURE_DIR });
    const content = await readFile(join(FIXTURE_DIR, "MANIFEST.md"), "utf8");
    expect(content).toContain("persona");
    expect(content).toContain("sitemap");
  });
});
