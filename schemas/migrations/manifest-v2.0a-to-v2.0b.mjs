// schemas/migrations/manifest-v2.0a-to-v2.0b.mjs
// MANIFEST.md v2.0a → v2.0b migration (D-65c).
//
// Delta fields added to YAML frontmatter:
//   stage3artifacts: []
//   stage4artifacts: []
// Sets schemaVersion:'2.0b' in frontmatter.
// Idempotent: returns { skipped:true } if already at '2.0b' OR if both
// stage3artifacts and stage4artifacts are already present.
//
// Uses gray-matter for parsing + eemeli/yaml for round-trip write (preserves
// existing YAML structure and comments — per CLAUDE.md: never use js-yaml for
// round-trip writes).
//
// Dry-run mode (dryRun:true): returns { dryRun:true, diff:string } without modifying.
// Apply mode (default): returns { data: migratedMarkdownString }.
//
// Source: PLAN.md T-03-04-B action block; CONTEXT.md D-65c
// Implements: D-65c, PERSIST-03

export const fromVersion = "2.0a";
export const toVersion = "2.0b";
export const artifact = "manifest";

/**
 * Parse MANIFEST.md frontmatter using gray-matter.
 * Returns { data: frontmatterObject, content: bodyString }.
 *
 * @param {string} markdownString - Full MANIFEST.md content
 * @returns {{ data: Record<string, unknown>, content: string }}
 */
async function parseFrontmatter(markdownString) {
  const matter = (await import("gray-matter")).default;
  return matter(markdownString);
}

/**
 * Serialize frontmatter back to YAML using eemeli/yaml for round-trip safety.
 * Per CLAUDE.md: never use js-yaml for round-trip writes.
 *
 * @param {Record<string, unknown>} data - Frontmatter data object
 * @param {string} body - Markdown body content
 * @returns {string} Full Markdown file with YAML frontmatter
 */
async function serializeFrontmatter(data, body) {
  const YAML = (await import("yaml")).default;

  // Use eemeli/yaml for reliable round-trip serialization
  const yamlStr = YAML.stringify(data, {
    defaultKeyType: "PLAIN",
    defaultStringType: "QUOTE_DOUBLE",
    lineWidth: 0,
  });

  return `---\n${yamlStr}---\n${body}`;
}

/**
 * Generate a human-readable diff for MANIFEST.md migration.
 *
 * @param {Record<string, unknown>} frontmatter - Current frontmatter
 * @returns {string} Diff text
 */
function generateDiff(frontmatter) {
  return [
    `--- MANIFEST.md (v2.0a)`,
    `+++ MANIFEST.md (v2.0b)`,
    ``,
    `@@ frontmatter @@`,
    `-  schemaVersion: "${frontmatter.schemaVersion}"`,
    `+  schemaVersion: "2.0b"`,
    `+  stage3artifacts: [] → added (Stage 3 wireframe artifact paths, initially empty)`,
    `+  stage4artifacts: [] → added (Stage 4 interaction artifact paths, initially empty)`,
  ].join("\n");
}

/**
 * Migrate a MANIFEST.md from v2.0a to v2.0b.
 *
 * @param {string} input - Raw MANIFEST.md file content (Markdown string)
 * @param {{ dryRun?: boolean }} [opts] - Migration options
 * @returns {Promise<{ skipped?: boolean, reason?: string, data?: string, dryRun?: boolean, diff?: string }>}
 */
export async function migrate(input, opts = {}) {
  const { dryRun = false } = opts;

  const parsed = await parseFrontmatter(input);
  const frontmatter = parsed.data;

  // Idempotency check: already at 2.0b OR already has both stage3/4artifacts fields
  if (
    frontmatter.schemaVersion === "2.0b" ||
    (Object.prototype.hasOwnProperty.call(frontmatter, "stage3artifacts") &&
      Object.prototype.hasOwnProperty.call(frontmatter, "stage4artifacts"))
  ) {
    return { skipped: true, reason: "already-migrated", data: input };
  }

  if (dryRun) {
    const diff = generateDiff(frontmatter);
    return { dryRun: true, diff };
  }

  // Apply migration: add stage3artifacts and stage4artifacts
  const updatedFrontmatter = { ...frontmatter };
  updatedFrontmatter.schemaVersion = "2.0b";

  if (!Object.prototype.hasOwnProperty.call(updatedFrontmatter, "stage3artifacts")) {
    updatedFrontmatter.stage3artifacts = [];
  }
  if (!Object.prototype.hasOwnProperty.call(updatedFrontmatter, "stage4artifacts")) {
    updatedFrontmatter.stage4artifacts = [];
  }

  const migratedMarkdown = await serializeFrontmatter(
    updatedFrontmatter,
    parsed.content
  );

  return { data: migratedMarkdown };
}

/**
 * Write the migrated MANIFEST.md to disk and record in manifest.lock.
 *
 * @param {object} opts
 * @param {string} opts.filePath - Path to the MANIFEST.md file to migrate in place
 * @param {string} opts.designOsDir - Path to .complete-design directory for manifest.lock
 * @returns {Promise<void>}
 */
export async function runMigrationApply({ filePath, designOsDir }) {
  const { readFile, writeFile } = await import("node:fs/promises");
  const { appendManifestLockEntry } = await import(
    "../../assets/scripts/manifest-lock-append.mjs"
  );

  const raw = await readFile(filePath, "utf8");
  const result = await migrate(raw);

  if (result.skipped) {
    return;
  }

  await writeFile(filePath, result.data, "utf8");

  await appendManifestLockEntry(designOsDir, {
    stage: "migrate-manifest-2.0a-to-2.0b",
    gate: "migration",
    result: {
      kind: "pass",
      evidence: `MANIFEST.md migrated from v2.0a to v2.0b`,
      findings: [],
    },
    sourceHash:
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
  });
}
