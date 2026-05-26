// schemas/migrations/run-v2.0a-to-v2.0b.mjs
// Orchestrator for the v2.0a → v2.0b migration.
// Discovers and migrates sitemap.json, all persona.json files, and MANIFEST.md
// from a design directory.
//
// Used by the design-os CLI migrate subcommand when --from 2.0a --to 2.0b is specified.
//
// Dry-run by default (prints diffs without writing).
// --apply writes migrated artifacts in place and calls appendManifestLockEntry().
//
// Source: PLAN.md T-03-04-B action block; CONTEXT.md D-65
// Implements: D-65, design-os migrate --from 2.0a --to 2.0b

import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { globby } from "globby";
import { readFile, writeFile } from "node:fs/promises";
import { migrate as migrateSitemap, runMigrationApply as applySitemap } from "./sitemap-v2.0a-to-v2.0b.mjs";
import { migrate as migratePersona, runMigrationApply as applyPersona } from "./persona-v2.0a-to-v2.0b.mjs";
import { migrate as migrateManifest, runMigrationApply as applyManifest } from "./manifest-v2.0a-to-v2.0b.mjs";

/**
 * Run the full v2.0a → v2.0b migration for a design directory.
 *
 * Artifacts migrated:
 *   - design/ia/sitemap.json (adds wireframeRefs per route)
 *   - design/research/personas/*.persona.json (adds interactionNeeds)
 *   - design/MANIFEST.md (adds stage3artifacts, stage4artifacts to frontmatter)
 *
 * @param {object} opts
 * @param {string} [opts.designDir='design/'] - Design directory to migrate
 * @param {boolean} [opts.apply=false] - Write changes (default: dry-run)
 * @param {boolean} [opts.verbose=true] - Print migration log
 * @returns {Promise<{ migrated: string[], skipped: string[], diffs: Record<string, string> }>}
 */
export async function runV20aMigration({ designDir = "design/", apply = false, verbose = true } = {}) {
  const absDesignDir = resolve(designDir);
  const designOsDir = join(absDesignDir, "..", ".design-os");

  if (!existsSync(absDesignDir)) {
    throw new Error(`Design directory not found: ${absDesignDir}`);
  }

  const migrated = [];
  const skipped = [];
  const diffs = {};

  // ── Sitemap migration ─────────────────────────────────────────────────────
  const sitemapPath = join(absDesignDir, "ia", "sitemap.json");
  if (existsSync(sitemapPath)) {
    const raw = await readFile(sitemapPath, "utf8");
    const input = JSON.parse(raw);
    const result = await migrateSitemap(input, { dryRun: !apply });

    if (result.skipped) {
      skipped.push(sitemapPath);
      if (verbose) console.log(`[migrate] SKIP sitemap.json (already at v2.0b)`);
    } else if (result.dryRun) {
      diffs[sitemapPath] = result.diff;
      if (verbose) {
        console.log(`[migrate] DRY-RUN sitemap.json:`);
        console.log(result.diff);
        console.log("  Dry run: use --apply to write changes");
      }
    } else {
      migrated.push(sitemapPath);
      if (apply) {
        await applySitemap({ filePath: sitemapPath, designOsDir });
        if (verbose) console.log(`[migrate] APPLIED sitemap.json → v2.0b`);
      }
    }
  }

  // ── Persona migrations ────────────────────────────────────────────────────
  const personaFiles = await globby(["research/personas/*.persona.json"], {
    cwd: absDesignDir,
    absolute: true,
  });

  for (const personaPath of personaFiles) {
    const raw = await readFile(personaPath, "utf8");
    const input = JSON.parse(raw);
    const result = await migratePersona(input, { dryRun: !apply });

    if (result.skipped) {
      skipped.push(personaPath);
      if (verbose) console.log(`[migrate] SKIP ${personaPath} (already at v2.0b)`);
    } else if (result.dryRun) {
      diffs[personaPath] = result.diff;
      if (verbose) {
        console.log(`[migrate] DRY-RUN ${personaPath}:`);
        console.log(result.diff);
        console.log("  Dry run: use --apply to write changes");
      }
    } else {
      migrated.push(personaPath);
      if (apply) {
        await applyPersona({ filePath: personaPath, designOsDir });
        if (verbose) console.log(`[migrate] APPLIED ${personaPath} → v2.0b`);
      }
    }
  }

  // ── MANIFEST.md migration ─────────────────────────────────────────────────
  const manifestPath = join(absDesignDir, "MANIFEST.md");
  if (existsSync(manifestPath)) {
    const raw = await readFile(manifestPath, "utf8");
    const result = await migrateManifest(raw, { dryRun: !apply });

    if (result.skipped) {
      skipped.push(manifestPath);
      if (verbose) console.log(`[migrate] SKIP MANIFEST.md (already at v2.0b)`);
    } else if (result.dryRun) {
      diffs[manifestPath] = result.diff;
      if (verbose) {
        console.log(`[migrate] DRY-RUN MANIFEST.md:`);
        console.log(result.diff);
        console.log("  Dry run: use --apply to write changes");
      }
    } else {
      migrated.push(manifestPath);
      if (apply) {
        await applyManifest({ filePath: manifestPath, designOsDir });
        if (verbose) console.log(`[migrate] APPLIED MANIFEST.md → v2.0b`);
      }
    }
  }

  if (!apply && verbose) {
    console.log("\n  Dry run: use --apply to write changes");
  }

  return { migrated, skipped, diffs };
}
