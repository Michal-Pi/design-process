// tests/governance/override-banner-propagate.test.ts
// Tests for override-banner propagation: writes overrideBanner into matching-stage artifacts.
// RED phase — fails until Task 3 implementation exists.
// Implements: D-11 (downstream overrideBanner propagation)

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, copyFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURE_DIR = join(ROOT, "tests/fixtures/governance/design-dir-with-overrides");

// @ts-ignore TS7016: no declaration file for .mjs script
const { propagateOverrideBanners } = await import(
  "../../assets/scripts/override-banner-propagate.mjs"
);

describe("propagateOverrideBanners", () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create a temp copy of the fixture dir to avoid mutating the committed fixture
    tmpDir = await mkdtemp(join(os.tmpdir(), "design-os-override-test-"));

    // Copy manifest.lock
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(tmpDir, ".design-os"), { recursive: true });
    await copyFile(
      join(FIXTURE_DIR, ".design-os/manifest.lock"),
      join(tmpDir, ".design-os/manifest.lock")
    );

    // Copy persona (no overrideBanner yet)
    await mkdir(join(tmpDir, "personas"), { recursive: true });
    await copyFile(
      join(FIXTURE_DIR, "personas/p1.json"),
      join(tmpDir, "personas/p1.json")
    );
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("adds overrideBanner field to stage-1 artifact when manifest.lock has user_overridden for stage-1", async () => {
    await propagateOverrideBanners({ designDir: tmpDir });

    const content = await readFile(join(tmpDir, "personas/p1.json"), "utf8");
    const data = JSON.parse(content);
    expect(data).toHaveProperty("overrideBanner");
    expect(typeof data.overrideBanner).toBe("string");
    expect(data.overrideBanner.length).toBeGreaterThan(0);
  });

  it("overrideBanner contains the banner string from the manifest.lock entry", async () => {
    await propagateOverrideBanners({ designDir: tmpDir });

    const content = await readFile(join(tmpDir, "personas/p1.json"), "utf8");
    const data = JSON.parse(content);
    expect(data.overrideBanner).toContain("[OVERRIDE]");
  });

  it("is idempotent: running propagate twice does not change the file", async () => {
    await propagateOverrideBanners({ designDir: tmpDir });
    const content1 = await readFile(join(tmpDir, "personas/p1.json"), "utf8");

    await propagateOverrideBanners({ designDir: tmpDir });
    const content2 = await readFile(join(tmpDir, "personas/p1.json"), "utf8");

    expect(content1).toBe(content2);
  });

  it("returns modified and skipped arrays", async () => {
    const result = await propagateOverrideBanners({ designDir: tmpDir });
    expect(result).toHaveProperty("modified");
    expect(result).toHaveProperty("skipped");
    expect(Array.isArray(result.modified)).toBe(true);
    expect(Array.isArray(result.skipped)).toBe(true);
  });

  it("includes the persona file in modified list", async () => {
    const result = await propagateOverrideBanners({ designDir: tmpDir });
    expect(result.modified.length).toBeGreaterThan(0);
  });
});
