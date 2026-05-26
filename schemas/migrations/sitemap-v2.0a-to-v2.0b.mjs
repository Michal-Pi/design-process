// schemas/migrations/sitemap-v2.0a-to-v2.0b.mjs
// Sitemap v2.0a → v2.0b migration (D-65a).
//
// Delta field added: wireframeRefs:[] on each route node (recursively).
// Sets schemaVersion:'2.0b'.
// Idempotent: skips routes that already have wireframeRefs; returns { skipped:true }
// if the artifact is already at '2.0b'.
//
// Dry-run mode (dryRun:true): returns { dryRun:true, diff:string } without modifying.
// Apply mode (default): returns { data: migratedObject }.
//
// Caller must call runMigrationApply() to write the migrated JSON to disk and
// call appendManifestLockEntry() to update the hash chain.
//
// Source: PLAN.md T-03-04-B action block; CONTEXT.md D-65a
// Implements: D-65a, PERSIST-03, MVPB-10

export const fromVersion = "2.0a";
export const toVersion = "2.0b";
export const artifact = "sitemap";

/**
 * Recursively add wireframeRefs:[] to every route node if absent.
 * Does NOT mutate the input object — creates a new structure.
 *
 * @param {Record<string, unknown>} route - A route node from sitemap.routes[]
 * @returns {Record<string, unknown>} New route node with wireframeRefs
 */
function addWireframeRefsToRoute(route) {
  const updated = { ...route };

  // Add wireframeRefs if not present (idempotent)
  if (!Object.prototype.hasOwnProperty.call(updated, "wireframeRefs")) {
    updated.wireframeRefs = [];
  }

  // Recurse into children
  if (Array.isArray(updated.children)) {
    updated.children = updated.children.map(addWireframeRefsToRoute);
  }

  return updated;
}

/**
 * Generate a human-readable diff showing what wireframeRefs additions would be made.
 *
 * @param {Record<string, unknown>} input - v2.0a sitemap input
 * @returns {string} Diff text
 */
function generateDiff(input) {
  const lines = [
    `--- sitemap (v2.0a)`,
    `+++ sitemap (v2.0b)`,
    ``,
    `@@ schemaVersion @@`,
    `-  "schemaVersion": "${input.schemaVersion}"`,
    `+  "schemaVersion": "2.0b"`,
    ``,
    `@@ routes (wireframeRefs added per route node) @@`,
  ];

  /** @param {Record<string, unknown>} route - Route to describe */
  function describeRoute(route, indent = "") {
    if (!Object.prototype.hasOwnProperty.call(route, "wireframeRefs")) {
      lines.push(`+  ${indent}"wireframeRefs": [] → added to route "${route.path ?? route.label}"`);
    }
    if (Array.isArray(route.children)) {
      for (const child of route.children) {
        describeRoute(child, indent + "  ");
      }
    }
  }

  if (Array.isArray(input.routes)) {
    for (const route of input.routes) {
      describeRoute(route);
    }
  }

  return lines.join("\n");
}

/**
 * Migrate a sitemap from v2.0a to v2.0b.
 *
 * @param {Record<string, unknown>} input - Parsed sitemap JSON object
 * @param {{ dryRun?: boolean }} [opts] - Migration options
 * @returns {{ skipped?: boolean, reason?: string, data?: object, dryRun?: boolean, diff?: string }}
 */
export async function migrate(input, opts = {}) {
  const { dryRun = false } = opts;

  // Idempotency check
  if (input.schemaVersion === "2.0b") {
    return { skipped: true, reason: "already-migrated", data: input };
  }

  if (dryRun) {
    const diff = generateDiff(input);
    return { dryRun: true, diff };
  }

  // Apply migration: add wireframeRefs to all route nodes
  const migrated = { ...input };
  migrated.schemaVersion = "2.0b";

  if (Array.isArray(migrated.routes)) {
    migrated.routes = migrated.routes.map(addWireframeRefsToRoute);
  }

  return { data: migrated };
}

/**
 * Write the migrated sitemap to disk and record in manifest.lock.
 * Called after migrate() when --apply mode is requested.
 *
 * @param {object} opts
 * @param {string} opts.filePath - Path to the sitemap.json file to migrate in place
 * @param {string} opts.designOsDir - Path to .design-os directory for manifest.lock
 * @returns {Promise<void>}
 */
export async function runMigrationApply({ filePath, designOsDir }) {
  const { readFile, writeFile } = await import("node:fs/promises");
  const { appendManifestLockEntry } = await import(
    "../../assets/scripts/manifest-lock-append.mjs"
  );

  const raw = await readFile(filePath, "utf8");
  const input = JSON.parse(raw);

  const result = await migrate(input);
  if (result.skipped) {
    return; // Already migrated
  }

  await writeFile(filePath, JSON.stringify(result.data, null, 2) + "\n", "utf8");

  await appendManifestLockEntry(designOsDir, {
    stage: "migrate-sitemap-2.0a-to-2.0b",
    gate: "migration",
    result: {
      kind: "pass",
      evidence: `sitemap migrated from v2.0a to v2.0b`,
      findings: [],
    },
    sourceHash:
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
  });
}
