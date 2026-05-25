// assets/scripts/manifest-md-reconcile.mjs
// MANIFEST.md auto-reconciler: walks design dir, parses canonical artifact
// frontmatter, builds ManifestV1 entries, validates via ajv, writes deterministic
// MANIFEST.md with a sorted Markdown table.
//
// Source: CONTEXT.md ART-07, D-04; PLAN.md Task 2
// Implements: ART-07 (MANIFEST.md auto-maintained), PERSIST-01

import { globby } from "globby";
import matter from "gray-matter";
import { stringify } from "yaml";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative, dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIST = resolve(__dirname, "../../schemas/dist");

// ── Ajv setup ─────────────────────────────────────────────────────────────────

let _ajvInstance = null;
let _manifestSchema = null;

async function getValidator() {
  if (_ajvInstance && _manifestSchema) {
    return { ajv: _ajvInstance, schema: _manifestSchema };
  }
  // @ts-ignore CJS/ESM interop pattern (Plan 01 established)
  const AjvClass =
    typeof Ajv.default === "function" ? Ajv.default : Ajv;
  const ajv = new AjvClass({ strict: false, allErrors: true });

  // @ts-ignore CJS/ESM interop
  const addFormatsFn =
    typeof addFormats.default === "function" ? addFormats.default : addFormats;
  addFormatsFn(ajv);

  const schemaPath = join(SCHEMAS_DIST, "manifest.v1.json");
  const schemaRaw = await readFile(schemaPath, "utf8");
  _manifestSchema = JSON.parse(schemaRaw);
  _ajvInstance = ajv;
  return { ajv, schema: _manifestSchema };
}

// ── Determinism helpers ───────────────────────────────────────────────────────

/**
 * Recursively sort object keys for deterministic YAML/JSON emit.
 * Matches the canonicalize() helper from emit.mjs (Plan 01).
 */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
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
 * Compute a deterministic sha256 hash of a JavaScript object.
 * @param {object} obj
 * @returns {string} sha256: + 64 hex chars
 */
function hashObject(obj) {
  return (
    "sha256:" +
    createHash("sha256")
      .update(JSON.stringify(canonicalize(obj)), "utf8")
      .digest("hex")
  );
}

// ── Reconcile ─────────────────────────────────────────────────────────────────

/**
 * Reconcile MANIFEST.md in a design directory.
 *
 * Walks all .md and .json files, parses frontmatter, collects entries
 * with an `artifact:` field, back-populates `dependents:` via reverse
 * walk of `dependsOn:`, sorts by [stage, path], validates the manifest
 * against ManifestV1 schema, and writes a deterministic MANIFEST.md.
 *
 * @param {{ designDir: string }} opts
 * @returns {Promise<void>}
 */
export async function reconcileManifest({ designDir }) {
  const absDir = resolve(designDir);

  // Discover all .md and .json files (exclude .design-os/, .handoff/, node_modules/)
  const files = await globby(["**/*.{md,json}"], {
    cwd: absDir,
    absolute: true,
    ignore: [
      ".design-os/**",
      ".handoff/**",
      "node_modules/**",
      "MANIFEST.md",
    ],
  });

  // First pass: collect artifact metadata
  /** @type {Map<string, { path: string, artifact: string, stage: string, generated: string, dependents: string[], dependsOn: string[] }>} */
  const entriesMap = new Map();

  for (const file of files) {
    let raw;
    try {
      raw = await readFile(file, "utf8");
    } catch {
      continue;
    }

    // Parse frontmatter (gray-matter handles both .md and .json with YAML front-matter)
    let data;
    if (file.endsWith(".json")) {
      try {
        data = JSON.parse(raw);
      } catch {
        continue;
      }
    } else {
      const parsed = matter(raw);
      data = parsed.data;
    }

    // Only process canonical artifacts that have all required fields
    if (
      typeof data.artifact !== "string" ||
      typeof data.stage !== "string" ||
      typeof data.generated !== "string"
    ) {
      continue;
    }

    const relPath = relative(absDir, file);
    const dependsOn = Array.isArray(data.dependsOn)
      ? data.dependsOn.filter((d) => typeof d === "string")
      : [];

    entriesMap.set(relPath, {
      path: relPath,
      artifact: data.artifact,
      stage: data.stage,
      generated: data.generated,
      dependents: [],
      dependsOn,
    });
  }

  // Second pass: back-populate dependents via reverse walk of dependsOn
  for (const [relPath, entry] of entriesMap.entries()) {
    for (const dep of entry.dependsOn) {
      const depEntry = entriesMap.get(dep);
      if (depEntry && !depEntry.dependents.includes(relPath)) {
        depEntry.dependents.push(relPath);
      }
    }
  }

  // Sort entries by [stage, path] ascending (deterministic order)
  const STAGE_ORDER = ["0", "1", "2", "3", "4", "5a", "5b", "cross-stage"];
  const sortedEntries = Array.from(entriesMap.values()).sort((a, b) => {
    const stageA = STAGE_ORDER.indexOf(a.stage);
    const stageB = STAGE_ORDER.indexOf(b.stage);
    const stageDiff =
      (stageA === -1 ? 999 : stageA) - (stageB === -1 ? 999 : stageB);
    if (stageDiff !== 0) return stageDiff;
    return a.path.localeCompare(b.path);
  });

  // Build ManifestV1 entries (no dependsOn in the output — that's per-artifact frontmatter)
  const manifestEntries = sortedEntries.map((e) => ({
    path: e.path,
    artifact: e.artifact,
    stage: e.stage,
    generated: e.generated,
    dependents: [...e.dependents].sort(),
  }));

  // Compute a deterministic sourceHash from the entries list
  const sourceHash = hashObject(manifestEntries);

  // Build ManifestV1 frontmatter object
  // Use a fixed generated timestamp for determinism (same principle as golden tests)
  const RECONCILE_TIMESTAMP = "2026-05-25T00:00:00.000Z";
  const frontmatter = {
    artifact: "manifest",
    stage: "cross-stage",
    schemaVersion: 1,
    sourceHash,
    generated: RECONCILE_TIMESTAMP,
    provenance: "validated",
    owner: "design-os-reconciler",
    lastReviewedAt: RECONCILE_TIMESTAMP,
    entries: manifestEntries,
  };

  // Validate against ManifestV1 schema
  const { ajv, schema } = await getValidator();
  const validate = ajv.compile(schema);
  const valid = validate(frontmatter);
  if (!valid) {
    const errors = validate.errors
      ?.map((e) => `${e.instancePath} ${e.message}`)
      .join("; ");
    throw new Error(`ManifestV1 validation failed: ${errors}`);
  }

  // Render MANIFEST.md with deterministic YAML frontmatter + Markdown table
  // Use canonical key sort for YAML output determinism
  const canonicalFrontmatter = canonicalize(frontmatter);
  const yamlStr = stringify(canonicalFrontmatter, { lineWidth: 120 });

  const tableHeader =
    "| Stage | Artifact | Path | Dependents |\n" +
    "|-------|----------|------|------------|\n";

  const tableRows = manifestEntries
    .map((e) => {
      const deps = e.dependents.length > 0 ? e.dependents.join(", ") : "—";
      return `| ${e.stage} | ${e.artifact} | ${e.path} | ${deps} |`;
    })
    .join("\n");

  const content =
    "---\n" +
    yamlStr +
    "---\n\n" +
    "# MANIFEST\n\n" +
    tableHeader +
    tableRows +
    "\n";

  // Write MANIFEST.md
  const manifestPath = join(absDir, "MANIFEST.md");
  await writeFile(manifestPath, content, "utf8");
}
