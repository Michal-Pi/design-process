// schemas/migrations/persona-v2.0a-to-v2.0b.mjs
// Persona v2.0a → v2.0b migration (D-65b).
//
// Delta field added: interactionNeeds:[] on the persona object.
// Sets schemaVersion:'2.0b'.
// Idempotent: returns { skipped:true } if already at '2.0b'.
//
// Dry-run mode (dryRun:true): returns { dryRun:true, diff:string } without modifying.
// Apply mode (default): returns { data: migratedObject }.
//
// Source: PLAN.md T-03-04-B action block; CONTEXT.md D-65b
// Implements: D-65b, PERSIST-03

export const fromVersion = "2.0a";
export const toVersion = "2.0b";
export const artifact = "persona";

/**
 * Generate a human-readable diff for persona migration.
 *
 * @param {Record<string, unknown>} input - v2.0a persona input
 * @returns {string} Diff text
 */
function generateDiff(input) {
  return [
    `--- persona (v2.0a)`,
    `+++ persona (v2.0b)`,
    ``,
    `@@ schemaVersion @@`,
    `-  "schemaVersion": "${input.schemaVersion}"`,
    `+  "schemaVersion": "2.0b"`,
    ``,
    `@@ interactionNeeds (new field) @@`,
    `+  "interactionNeeds": [] → added (Stage 4 IxD preferences, initially empty)`,
  ].join("\n");
}

/**
 * Migrate a persona from v2.0a to v2.0b.
 *
 * @param {Record<string, unknown>} input - Parsed persona JSON object
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

  // Apply migration: add interactionNeeds if not present
  const migrated = { ...input };
  migrated.schemaVersion = "2.0b";

  if (!Object.prototype.hasOwnProperty.call(migrated, "interactionNeeds")) {
    migrated.interactionNeeds = [];
  }

  return { data: migrated };
}

/**
 * Write the migrated persona to disk and record in manifest.lock.
 *
 * @param {object} opts
 * @param {string} opts.filePath - Path to the persona.json file to migrate in place
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
    return;
  }

  await writeFile(filePath, JSON.stringify(result.data, null, 2) + "\n", "utf8");

  await appendManifestLockEntry(designOsDir, {
    stage: "migrate-persona-2.0a-to-2.0b",
    gate: "migration",
    result: {
      kind: "pass",
      evidence: `persona migrated from v2.0a to v2.0b`,
      findings: [],
    },
    sourceHash:
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
  });
}
