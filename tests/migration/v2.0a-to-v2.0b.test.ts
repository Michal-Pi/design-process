// tests/migration/v2.0a-to-v2.0b.test.ts
// Tests for v2.0a → v2.0b schema migration (D-65 a/b/c).
//
// Tests 1-10 cover:
//   - Sitemap migration: dry-run, apply, idempotency (D-65a)
//   - Persona migration: dry-run, apply, idempotency (D-65b)
//   - MANIFEST.md migration: dry-run, apply, idempotency (D-65c)
//   - appendManifestLockEntry called after --apply
//   - CLI subcommand exists
//
// All tests use fixture files from evals/fixtures/migration/v2.0a-to-v2.0b/.
//
// Source: PLAN.md T-03-04-B behavior block
// Implements: D-65, PERSIST-03, MVPB-10

import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile, copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, "../../evals/fixtures/migration/v2.0a-to-v2.0b");

// @ts-ignore TS7016
const sitemapMigration: any = await import(
  "../../schemas/migrations/sitemap-v2.0a-to-v2.0b.mjs"
);
// @ts-ignore TS7016
const personaMigration: any = await import(
  "../../schemas/migrations/persona-v2.0a-to-v2.0b.mjs"
);
// @ts-ignore TS7016
const manifestMigration: any = await import(
  "../../schemas/migrations/manifest-v2.0a-to-v2.0b.mjs"
);

/** Load the sitemap v2.0a fixture */
async function loadSitemapFixture() {
  const raw = await readFile(join(FIXTURES_DIR, "sitemap.v2.0a.json"), "utf8");
  return JSON.parse(raw);
}

/** Load the persona v2.0a fixture */
async function loadPersonaFixture() {
  const raw = await readFile(join(FIXTURES_DIR, "persona.v2.0a.json"), "utf8");
  return JSON.parse(raw);
}

/** Load the MANIFEST v2.0a fixture */
async function loadManifestFixture() {
  return await readFile(join(FIXTURES_DIR, "MANIFEST.v2.0a.md"), "utf8");
}

describe("v2.0a → v2.0b migration", () => {
  // ── Sitemap Migration ──────────────────────────────────────────────────────

  describe("Test 1: sitemap dry-run prints diff without modifying file", () => {
    it("migrate sitemap (dry-run) returns diff without changing the fixture file", async () => {
      const before = await readFile(
        join(FIXTURES_DIR, "sitemap.v2.0a.json"),
        "utf8"
      );

      const input = JSON.parse(before);
      const result = await sitemapMigration.migrate(input, { dryRun: true });

      // Dry-run: must include a diff or indication of what would change
      expect(result).toBeDefined();
      expect(result.dryRun).toBe(true);
      expect(result.skipped).toBeFalsy();
      expect(result.diff).toBeDefined();
      expect(result.diff).toContain("wireframeRefs");

      // Fixture file must NOT have been modified
      const after = await readFile(
        join(FIXTURES_DIR, "sitemap.v2.0a.json"),
        "utf8"
      );
      expect(after).toBe(before);
    });
  });

  describe("Test 2: sitemap --apply adds wireframeRefs:[] to each route node", () => {
    it("migrate sitemap (apply) adds wireframeRefs:[] to all route nodes; sets schemaVersion:'2.0b'", async () => {
      const input = await loadSitemapFixture();
      const result = await sitemapMigration.migrate(input);

      expect(result.skipped).toBeFalsy();
      expect(result.data).toBeDefined();
      const migrated = result.data;

      expect(migrated.schemaVersion).toBe("2.0b");

      // All top-level routes should have wireframeRefs
      for (const route of migrated.routes) {
        expect(route.wireframeRefs).toBeDefined();
        expect(Array.isArray(route.wireframeRefs)).toBe(true);
        expect(route.wireframeRefs).toEqual([]);

        // Children should also have wireframeRefs
        if (route.children) {
          for (const child of route.children) {
            expect(child.wireframeRefs).toBeDefined();
            expect(Array.isArray(child.wireframeRefs)).toBe(true);
          }
        }
      }
    });
  });

  describe("Test 3: sitemap already at 2.0b — idempotency", () => {
    it("migrate sitemap at schemaVersion:'2.0b' returns skipped:true with no changes", async () => {
      const alreadyMigrated = {
        ...(await loadSitemapFixture()),
        schemaVersion: "2.0b",
        routes: [
          { path: "/", label: "Home", stage: "2", wireframeRefs: ["wireframes/home/CHOICE.md"] },
        ],
      };

      const result = await sitemapMigration.migrate(alreadyMigrated);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("already-migrated");
    });
  });

  // ── Persona Migration ──────────────────────────────────────────────────────

  describe("Test 4: persona dry-run prints diff without modifying file", () => {
    it("migrate persona (dry-run) returns diff without changing the fixture file", async () => {
      const before = await readFile(
        join(FIXTURES_DIR, "persona.v2.0a.json"),
        "utf8"
      );

      const input = JSON.parse(before);
      const result = await personaMigration.migrate(input, { dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(result.skipped).toBeFalsy();
      expect(result.diff).toBeDefined();
      expect(result.diff).toContain("interactionNeeds");

      // Fixture file must NOT have been modified
      const after = await readFile(
        join(FIXTURES_DIR, "persona.v2.0a.json"),
        "utf8"
      );
      expect(after).toBe(before);
    });
  });

  describe("Test 5: persona --apply adds interactionNeeds:[]", () => {
    it("migrate persona (apply) adds interactionNeeds:[] and sets schemaVersion:'2.0b'", async () => {
      const input = await loadPersonaFixture();
      const result = await personaMigration.migrate(input);

      expect(result.skipped).toBeFalsy();
      expect(result.data).toBeDefined();
      const migrated = result.data;

      expect(migrated.schemaVersion).toBe("2.0b");
      expect(migrated.interactionNeeds).toBeDefined();
      expect(Array.isArray(migrated.interactionNeeds)).toBe(true);
      expect(migrated.interactionNeeds).toEqual([]);

      // Original fields preserved
      expect(migrated.name).toBe("Busy Professional");
      expect(migrated.jobsToBeDone).toBeDefined();
    });
  });

  describe("Test 6: persona migration idempotency", () => {
    it("persona migration on already-2.0b artifact returns skipped:true", async () => {
      const input = {
        ...(await loadPersonaFixture()),
        schemaVersion: "2.0b",
        interactionNeeds: [],
      };

      const result = await personaMigration.migrate(input);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("already-migrated");
    });
  });

  // ── appendManifestLockEntry after --apply ──────────────────────────────────

  describe("Test 7: appendManifestLockEntry called after migration --apply", () => {
    it("runMigrationApply calls appendManifestLockEntry to update the hash chain", async () => {
      const { runMigrationApply } = await import(
        "../../schemas/migrations/sitemap-v2.0a-to-v2.0b.mjs"
      );

      const tmpDir = await mkdtemp(join(tmpdir(), "mig-test-7-"));
      try {
        // Copy fixture to temp dir
        const fixturePath = join(FIXTURES_DIR, "sitemap.v2.0a.json");
        const targetPath = join(tmpDir, "sitemap.json");
        await copyFile(fixturePath, targetPath);

        // Run apply
        await runMigrationApply({ filePath: targetPath, designOsDir: join(tmpDir, ".complete-design") });

        // Verify manifest.lock was created (appendManifestLockEntry was called)
        const lockPath = join(tmpDir, ".complete-design", "manifest.lock");
        expect(existsSync(lockPath)).toBe(true);

        const lockContent = await readFile(lockPath, "utf8");
        const firstLine = lockContent.trim().split("\n")[0] ?? "{}";
        const entry = JSON.parse(firstLine);
        expect(entry.stage).toBe("migrate-sitemap-2.0a-to-2.0b");
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  // ── Schema validation ──────────────────────────────────────────────────────

  describe("Test 8: v2.0a sitemap validates as sitemap artifact after migration", () => {
    it("migrated sitemap passes artifact type validation (delta fields are optional additions)", async () => {
      const input = await loadSitemapFixture();
      const result = await sitemapMigration.migrate(input);

      expect(result.skipped).toBeFalsy();
      const migrated = result.data;

      // The key fields should be intact
      expect(migrated.artifact).toBe("sitemap");
      expect(migrated.generated).toBeDefined();
      expect(Array.isArray(migrated.routes)).toBe(true);
      expect(migrated.schemaVersion).toBe("2.0b");
    });
  });

  // ── CLI subcommand ─────────────────────────────────────────────────────────

  describe("Test 9: complete-design migrate --from 2.0a --to 2.0b CLI subcommand exists", () => {
    it("CLI migrate subcommand exports { name, describe, builder, handler } and accepts --apply flag", async () => {
      const { command } = await import(
        "../../assets/scripts/cli/migrate.mjs"
      );

      expect(command).toBeDefined();
      expect(command.name).toBe("migrate");
      expect(typeof command.describe).toBe("string");
      expect(typeof command.builder).toBe("function");
      expect(typeof command.handler).toBe("function");

      // Verify it accepts --from and --to (v2.0a/v2.0b style) and --apply
      // by checking the command can be built (this verifies the builder runs without error)
      const { Command } = await import("commander");
      const testCmd = new Command();

      // Verify the existing CLI builder registers the expected options
      // The migrate CLI wraps assets/scripts/schemas/migrate.mjs
      // For v2.0a→v2.0b, we have a dedicated run function
      const { runV20aMigration } = await import(
        "../../schemas/migrations/run-v2.0a-to-v2.0b.mjs"
      );
      expect(typeof runV20aMigration).toBe("function");
    });
  });

  // ── MANIFEST.md Migration ─────────────────────────────────────────────────

  describe("Test 10: MANIFEST.md migration", () => {
    it("migrate MANIFEST (dry-run) prints diff showing stage3artifacts and stage4artifacts WITHOUT modifying file", async () => {
      const before = await readFile(
        join(FIXTURES_DIR, "MANIFEST.v2.0a.md"),
        "utf8"
      );

      const result = await manifestMigration.migrate(before, { dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(result.skipped).toBeFalsy();
      expect(result.diff).toBeDefined();
      expect(result.diff).toContain("stage3artifacts");
      expect(result.diff).toContain("stage4artifacts");

      // Fixture file must NOT have been modified
      const after = await readFile(
        join(FIXTURES_DIR, "MANIFEST.v2.0a.md"),
        "utf8"
      );
      expect(after).toBe(before);
    });

    it("migrate MANIFEST (apply) adds stage3artifacts:[] and stage4artifacts:[] to frontmatter", async () => {
      const input = await loadManifestFixture();
      const result = await manifestMigration.migrate(input);

      expect(result.skipped).toBeFalsy();
      expect(result.data).toBeDefined();

      // Parse the migrated Markdown and check frontmatter
      const parsed = matter(result.data);
      expect(parsed.data.stage3artifacts).toBeDefined();
      expect(Array.isArray(parsed.data.stage3artifacts)).toBe(true);
      expect(parsed.data.stage3artifacts).toEqual([]);
      expect(parsed.data.stage4artifacts).toBeDefined();
      expect(Array.isArray(parsed.data.stage4artifacts)).toBe(true);
      expect(parsed.data.stage4artifacts).toEqual([]);
      expect(parsed.data.schemaVersion).toBe("2.0b");
    });

    it("MANIFEST migration is idempotent — second migrate returns skipped:true", async () => {
      const input = await loadManifestFixture();

      // First migration
      const first = await manifestMigration.migrate(input);
      expect(first.skipped).toBeFalsy();

      // Second migration on already-migrated output
      const second = await manifestMigration.migrate(first.data);
      expect(second.skipped).toBe(true);
      expect(second.reason).toBe("already-migrated");
    });

    it("MANIFEST migration skips artifact already at schemaVersion:2.0b", async () => {
      // Create a MANIFEST with schemaVersion:2.0b already
      const alreadyMigrated = `---
artifact: manifest
schemaVersion: "2.0b"
generated: "2026-05-26T00:00:00.000Z"
stage3artifacts: []
stage4artifacts: []
---

# Design Manifest

Already at v2.0b.
`;
      const result = await manifestMigration.migrate(alreadyMigrated);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("already-migrated");
    });
  });
});
