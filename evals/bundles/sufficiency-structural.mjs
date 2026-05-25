// evals/bundles/sufficiency-structural.mjs
// Bundle-sufficiency eval harness — structural-equivalence baseline.
//
// Source: CONTEXT.md D-08 (structural-equivalence per Open Q2), PLAN.md Task 3
// Implements: HAND-04
//
// Structural-equivalence checks per fixture:
//   1. Every file path in upstream/ appears in bundle frontmatter.artifactsInventory (by relative path)
//   2. bundle.provenanceWorstCase matches actual worst provenance in upstream artifact frontmatter
//   3. bundle.sourceHash matches recomputed hash of upstream/ directory
//
// Divergences (artifact missing from inventory, provenance mismatch, sourceHash drift)
// are recorded explicitly per D-08 ("divergences explicitly tagged").
// Aggregate pass = all 5 fixtures structurally equivalent OR all divergences explicitly tagged.

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURES_DIR = resolve(__dirname, "fixtures");
const LAST_RUN_PATH = resolve(__dirname, "last-run.json");

// Provenance ordering: worst (index 0) to best (index 3)
const PROVENANCE_ORDER = ["missing", "generated", "inferred", "validated"];

/**
 * Recursively sort object keys alphabetically for deterministic canonical JSON.
 * Mirrors canonicalize() in emit.mjs and manifest-lock-append.mjs.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalize(value[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Recursively collect all files in a directory in sorted order.
 * Skips hidden files and directories.
 *
 * @param {string} dir
 * @param {string} [base]
 * @returns {Promise<string[]>}
 */
async function collectFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath, base);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Compute a deterministic SHA-256 hash of a directory's contents.
 * Same algorithm as hashDirectory() in handoff-bundle-build.mjs and gates/base.mjs.
 *
 * @param {string} dir
 * @returns {Promise<string>} sha256: + 64 hex chars
 */
async function hashDirectory(dir) {
  const files = await collectFiles(dir, dir);
  const hasher = createHash("sha256");

  for (const filePath of files) {
    const relPath = relative(dir, filePath);
    const contents = await readFile(filePath);
    hasher.update(relPath + ":");
    hasher.update(contents);
  }

  return "sha256:" + hasher.digest("hex");
}

/**
 * Find the worst provenance across all upstream artifacts.
 * Scans for YAML frontmatter `provenance:` fields via gray-matter.
 * Defaults to "validated" if no frontmatter provenance found.
 *
 * @param {string} upstreamDir
 * @returns {Promise<string>}
 */
async function getUpstreamWorstProvenance(upstreamDir) {
  const files = await collectFiles(upstreamDir, upstreamDir);
  let worst = "validated";

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, "utf8");
      const { data } = matter(content);
      if (data.provenance && PROVENANCE_ORDER.includes(data.provenance)) {
        const worstIdx = PROVENANCE_ORDER.indexOf(worst);
        const thisIdx = PROVENANCE_ORDER.indexOf(data.provenance);
        if (thisIdx < worstIdx) {
          worst = data.provenance;
        }
      }
    } catch {
      // Skip non-text files
    }
  }

  return worst;
}

/**
 * Run structural-equivalence checks for a single fixture.
 *
 * @param {string} fixtureDir - Path to the fixture directory (contains upstream/ and bundle.md)
 * @returns {Promise<{fixture: string, structurallyEquivalent: boolean, divergences: Array<{kind: string, detail: string}>}>}
 */
async function checkFixture(fixtureDir) {
  const fixtureName = fixtureDir.split("/").pop() ?? fixtureDir;
  const upstreamDir = join(fixtureDir, "upstream");
  const bundlePath = join(fixtureDir, "bundle.md");

  const divergences = [];

  // Guard: fixture must have upstream/ and bundle.md
  if (!existsSync(upstreamDir)) {
    divergences.push({
      kind: "missing-upstream-dir",
      detail: `upstream/ directory not found in ${fixtureDir}`,
      tagged: true,
    });
    return { fixture: fixtureName, structurallyEquivalent: false, divergences };
  }

  if (!existsSync(bundlePath)) {
    divergences.push({
      kind: "missing-bundle",
      detail: `bundle.md not found in ${fixtureDir}`,
      tagged: true,
    });
    return { fixture: fixtureName, structurallyEquivalent: false, divergences };
  }

  // Parse bundle frontmatter
  const bundleContent = await readFile(bundlePath, "utf8");
  const { data: frontmatter } = matter(bundleContent);

  // Collect upstream file paths (relative to upstreamDir)
  const upstreamFiles = await collectFiles(upstreamDir, upstreamDir);
  const upstreamRelPaths = upstreamFiles.map((f) => relative(upstreamDir, f));

  // Check 1: Every upstream file path appears in artifactsInventory
  const inventoryPaths = (frontmatter.artifactsInventory ?? []).map(
    (/** @type {{path: string}} */ item) => item.path
  );

  for (const upstreamPath of upstreamRelPaths) {
    // artifactsInventory paths are stored relative to upstream/ root,
    // prefixed with "upstream/" in the bundle (e.g. "upstream/PRD.md")
    const expectedPath = `upstream/${upstreamPath}`;
    const found = inventoryPaths.some(
      (p) => p === expectedPath || p === upstreamPath
    );
    if (!found) {
      divergences.push({
        kind: "artifact-missing-from-inventory",
        detail: `${upstreamPath} (${expectedPath}) not found in artifactsInventory`,
        tagged: true,
      });
    }
  }

  // Check 2: provenanceWorstCase matches actual worst provenance in upstream
  const actualWorst = await getUpstreamWorstProvenance(upstreamDir);
  const bundleWorst = frontmatter.provenanceWorstCase;

  if (bundleWorst !== actualWorst) {
    divergences.push({
      kind: "provenance-mismatch",
      detail: `bundle.provenanceWorstCase is "${bundleWorst}" but upstream worst is "${actualWorst}"`,
      tagged: true,
    });
  }

  // Check 3: sourceHash matches recomputed hash of upstream/
  const recomputedHash = await hashDirectory(upstreamDir);
  const bundleHash = frontmatter.sourceHash;

  if (bundleHash !== recomputedHash) {
    divergences.push({
      kind: "source-hash-drift",
      detail: `bundle.sourceHash="${bundleHash}" but recomputed="${recomputedHash}"`,
      tagged: true,
    });
  }

  const structurallyEquivalent = divergences.length === 0;
  return { fixture: fixtureName, structurallyEquivalent, divergences };
}

/**
 * Run the structural-sufficiency eval across all fixtures.
 *
 * @param {{ fixturesDir?: string }} [options]
 * @returns {Promise<{runs: Array<{fixture: string, structurallyEquivalent: boolean, divergences: Array<{kind: string, detail: string}>}>, pass: boolean}>}
 */
export async function runStructuralSufficiencyEval(options = {}) {
  const fixturesDir = options.fixturesDir ?? DEFAULT_FIXTURES_DIR;

  // Discover fixture directories (walk top-level subdirectories in sorted order)
  let fixtureDirs = [];
  if (existsSync(fixturesDir)) {
    const entries = await readdir(fixturesDir, { withFileTypes: true });
    fixtureDirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e) => join(fixturesDir, e.name));
  }

  // Run structural-equivalence per fixture
  const runs = [];
  for (const fixtureDir of fixtureDirs) {
    const result = await checkFixture(fixtureDir);
    runs.push(result);
  }

  // Aggregate pass: all fixtures structurally equivalent.
  // Per D-08, divergences are recorded explicitly ("explicitly tagged") in the report,
  // meaning the harness surfaces every issue. "pass" means all checks are satisfied.
  const allEquivalent = runs.every((r) => r.structurallyEquivalent);
  const pass = allEquivalent;

  const report = {
    runs: runs.map((r) => ({
      fixture: r.fixture,
      structurallyEquivalent: r.structurallyEquivalent,
      divergences: r.divergences.map((d) => ({ kind: d.kind, detail: d.detail })),
    })),
    pass,
  };

  // Emit deterministic JSON report (use canonicalize for key-sorted output)
  const reportJson = JSON.stringify(canonicalize(report), null, 2);
  await mkdir(dirname(LAST_RUN_PATH), { recursive: true });
  await writeFile(LAST_RUN_PATH, reportJson + "\n", "utf8");

  return report;
}

// CLI entry point (when run directly)
const isMain =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const report = await runStructuralSufficiencyEval();
  process.stdout.write(
    JSON.stringify({ pass: report.pass, reportPath: LAST_RUN_PATH }, null, 2) + "\n"
  );
  if (!report.pass) {
    process.exit(1);
  }
}
