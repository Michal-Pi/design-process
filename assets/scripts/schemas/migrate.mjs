// assets/scripts/schemas/migrate.mjs
// complete-design migrate command implementation.
// Discovers migration scripts, chains them, validates output.
// Source: CONTEXT.md D-27; PLAN.md Task 3 action.
// Implements: PERSIST-03, D-27

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, dirname, join, basename, extname } from "node:path";
import { globby } from "globby";
import { validate } from "./validate.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const MIGRATIONS_DIR = join(ROOT, "schemas/migrations");

/**
 * Discover available migration scripts for a given artifact.
 * Scans schemas/migrations/<artifact>-v*-to-v*.mjs.
 *
 * @param {string} artifact - artifact type name (e.g. 'persona')
 * @returns {Promise<Array<{ from: number, to: number, file: string }>>}
 */
async function discoverMigrations(artifact) {
  const pattern = `${artifact}-v*-to-v*.mjs`;
  const files = await globby([pattern], { cwd: MIGRATIONS_DIR, absolute: true });

  const migrations = [];
  for (const file of files) {
    const base = basename(file, extname(file));
    // Pattern: <artifact>-v<from>-to-v<to>
    const match = base.match(/^.+-v(\d+)-to-v(\d+)$/);
    if (!match) continue;
    const [, fromStr, toStr] = match;
    migrations.push({
      from: parseInt(fromStr, 10),
      to: parseInt(toStr, 10),
      file,
    });
  }

  return migrations;
}

/**
 * Build a topological chain of migration scripts from `fromVersion` to `toVersion`.
 * Currently only single-step chains are supported; Plan 01 ships v0→v1.
 *
 * @param {string} artifact
 * @param {number} fromVersion
 * @param {number} toVersion
 * @returns {Promise<Array<{ from: number, to: number, file: string }>>}
 */
async function buildMigrationChain(artifact, fromVersion, toVersion) {
  const available = await discoverMigrations(artifact);

  if (available.length === 0) {
    throw new Error(
      `no migration script found for artifact '${artifact}' v${fromVersion} → v${toVersion}`
    );
  }

  // Build adjacency map.
  const byFrom = new Map(available.map((m) => [m.from, m]));

  const chain = [];
  let current = fromVersion;

  while (current < toVersion) {
    const step = byFrom.get(current);
    if (!step) {
      throw new Error(
        `no migration script found for artifact '${artifact}' v${current} → v${current + 1} (chain incomplete: ${fromVersion} → ${toVersion})`
      );
    }
    chain.push(step);
    current = step.to;
  }

  if (current !== toVersion) {
    throw new Error(
      `no migration script found for artifact '${artifact}' v${fromVersion} → v${toVersion}`
    );
  }

  return chain;
}

/**
 * Migrate an artifact from `fromVersion` to `toVersion`.
 *
 * Steps:
 *   1. Read the source file (JSON)
 *   2. Discover + chain migration scripts
 *   3. Apply each script sequentially
 *   4. Validate final output against destination schema via ajv
 *   5. Write output to <path>.v<toVersion>.json or overwrite in place
 *
 * Exits 1 with a diagnostic if any step fails (T-01-06: spoofed artifact
 * types fail validation and never persist).
 *
 * @param {{ artifact?: string, fromVersion: number, toVersion: number, path: string, inPlace?: boolean }} opts
 */
export async function migrateArtifact({ artifact, fromVersion, toVersion, path, inPlace = false }) {
  const absolutePath = resolve(path);

  if (!existsSync(absolutePath)) {
    process.stderr.write(`[migrate] ERROR: file not found: ${absolutePath}\n`);
    process.exit(1);
  }

  // Parse the source file.
  let data;
  try {
    const raw = await readFile(absolutePath, "utf8");
    data = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[migrate] ERROR: failed to parse ${absolutePath}: ${err.message}\n`
    );
    process.exit(1);
  }

  // Infer artifact type from frontmatter if not provided.
  const artifactName = artifact ?? data.artifact;
  if (!artifactName) {
    process.stderr.write(
      `[migrate] ERROR: cannot determine artifact type from file (no 'artifact' field)\n`
    );
    process.exit(1);
  }

  // Build and apply the migration chain.
  let chain;
  try {
    chain = await buildMigrationChain(artifactName, fromVersion, toVersion);
  } catch (err) {
    process.stderr.write(`[migrate] ERROR: ${err.message}\n`);
    process.exit(1);
  }

  let current = data;
  for (const step of chain) {
    const migrationModule = await import(pathToFileURL(step.file).href);
    if (typeof migrationModule.migrate !== "function") {
      process.stderr.write(
        `[migrate] ERROR: migration script ${step.file} does not export a 'migrate' function\n`
      );
      process.exit(1);
    }
    try {
      current = await migrationModule.migrate(current);
    } catch (err) {
      process.stderr.write(
        `[migrate] ERROR: migration step v${step.from} → v${step.to} failed: ${err.message}\n`
      );
      process.exit(1);
    }
  }

  // Validate the migrated output against the destination schema.
  // T-01-06: spoofed artifact types fail here and never persist.
  const result = await validate(artifactName, current);
  if (!result.valid) {
    process.stderr.write(
      `[migrate] ERROR: migrated artifact failed validation against ${artifactName}.v${toVersion}.json:\n`
    );
    for (const err of result.errors) {
      process.stderr.write(
        `  schemaPath: ${err.schemaPath}, instancePath: ${err.instancePath}, keyword: ${err.keyword}, message: ${err.message}\n`
      );
    }
    process.exit(1);
  }

  // Write output.
  let outputPath;
  if (inPlace) {
    outputPath = absolutePath;
  } else {
    // Strip any existing .v<N>.json suffix and add the new version.
    const withoutExt = absolutePath.replace(/\.json$/, "");
    outputPath = `${withoutExt}.v${toVersion}.json`;
  }

  await writeFile(outputPath, JSON.stringify(current, null, 2) + "\n");
  process.stdout.write(
    `[migrate] OK — ${artifactName} migrated v${fromVersion} → v${toVersion} → ${outputPath}\n`
  );
}
