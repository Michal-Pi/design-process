// assets/scripts/override-banner-propagate.mjs
// Override-banner propagation helper.
// When manifest.lock contains user_overridden entries, adds overrideBanner: field
// to all artifacts whose frontmatter stage: matches the overridden stage.
// Uses yaml@^2 round-trip writer to preserve comments.
//
// Source: CONTEXT.md D-11; PLAN.md Task 3
// Implements: D-11 (USER_OVERRIDDEN downstream artifact propagation)

import { globby } from "globby";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { parse, stringify } from "yaml";

/**
 * Propagate override banners from manifest.lock into matching-stage artifact frontmatter.
 *
 * Reads .complete-design/manifest.lock, finds user_overridden entries, and for each
 * artifact whose stage: matches, adds overrideBanner: if not already present.
 *
 * Uses JSON for .json artifacts, yaml round-trip for .md artifacts.
 *
 * @param {{ designDir: string }} opts
 * @returns {Promise<{ modified: string[], skipped: string[] }>}
 */
export async function propagateOverrideBanners({ designDir }) {
  const absDir = resolve(designDir);
  const lockPath = join(absDir, ".complete-design", "manifest.lock");

  if (!existsSync(lockPath)) {
    return { modified: [], skipped: [] };
  }

  // Parse manifest.lock JSONL
  const lockContent = await readFile(lockPath, "utf8");
  const lines = lockContent
    .trim()
    .split("\n")
    .filter((l) => l.trim().length > 0);

  // Build stage → overrideBanner map from user_overridden entries
  /** @type {Map<string, string>} */
  const stageToBanner = new Map();

  for (const line of lines) {
    const entry = JSON.parse(line);
    if (entry.result?.kind === "user_overridden") {
      const stage = entry.stage;
      const banner =
        entry.result.overrideBanner ??
        `[OVERRIDE] stage-${stage} gate bypassed: ${entry.result.reason ?? "no reason given"}`;
      stageToBanner.set(stage, banner);
    }
  }

  if (stageToBanner.size === 0) {
    return { modified: [], skipped: [] };
  }

  // Discover all .md and .json files
  const files = await globby(["**/*.{md,json}"], {
    cwd: absDir,
    absolute: true,
    ignore: [".complete-design/**", ".handoff/**", "node_modules/**", "MANIFEST.md"],
  });

  const modified = [];
  const skipped = [];

  for (const file of files) {
    let raw;
    try {
      raw = await readFile(file, "utf8");
    } catch {
      continue;
    }

    if (file.endsWith(".json")) {
      // Handle JSON artifacts
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        continue;
      }

      if (typeof data.stage !== "string") continue;
      const banner = stageToBanner.get(data.stage);
      if (!banner) {
        skipped.push(relative(absDir, file));
        continue;
      }

      if (data.overrideBanner) {
        // Already has banner — skip (idempotent)
        skipped.push(relative(absDir, file));
        continue;
      }

      data.overrideBanner = banner;
      await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
      modified.push(relative(absDir, file));
    } else {
      // Handle Markdown artifacts (frontmatter via gray-matter)
      // We use yaml@^2 for round-trip to preserve comments
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;

      let frontmatter;
      try {
        frontmatter = parse(fmMatch[1]);
      } catch {
        continue;
      }

      if (typeof frontmatter?.stage !== "string") continue;
      const banner = stageToBanner.get(frontmatter.stage);
      if (!banner) {
        skipped.push(relative(absDir, file));
        continue;
      }

      if (frontmatter.overrideBanner) {
        // Already has banner — skip (idempotent)
        skipped.push(relative(absDir, file));
        continue;
      }

      frontmatter.overrideBanner = banner;
      const newYaml = stringify(frontmatter, { lineWidth: 120 });
      const newContent =
        "---\n" + newYaml + "---" + raw.slice(fmMatch[0].length);
      await writeFile(file, newContent, "utf8");
      modified.push(relative(absDir, file));
    }
  }

  return { modified, skipped };
}
