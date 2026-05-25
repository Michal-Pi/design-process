#!/usr/bin/env node
// assets/scripts/schemas/emit.mjs
// Zod 4 z.toJSONSchema() emitter for all artifact types.
// Plan 01 ships 6 artifact types; Plan 02 extends with finding + manifest-lock-entry.
//
// Replaces deprecated zod-to-json-schema package (EOL November 2025):
//   npm page: "This package is no longer actively maintained" (Nov 2025)
//   D-01's intent (Zod-first single source emitting versioned JSON Schemas)
//   is preserved. Zod 4 ships z.toJSONSchema() natively targeting Draft 2020-12
//   by default — zero additional dependency. See Open Q1 in 01-RESEARCH.md.
//
// Source: CONTEXT.md D-01, D-02, D-04; RESEARCH.md Pattern 2
// Implements: SCHEMA-01..07, ART-03 (Plan 01); GATE-01..07, HAND-01..04 (Plan 02)

import { z } from "zod";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

// Resolve schema source paths relative to the project root.
// tsx's loader handles .ts imports at runtime when invoked via `tsx`.
const schemasDir = join(ROOT, "schemas");
const distDir = join(schemasDir, "dist");

/**
 * Recursively sort object keys alphabetically for deterministic JSON output.
 * Required for T-01-01 mitigation (deterministic emit verified by golden test).
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
 * Import all Zod schema sources.
 * Plan 01: 6 artifact schemas.
 * Plan 02 (this extension): adds finding + manifest-lock-entry.
 * Using dynamic import so tsx can transpile .ts files at runtime.
 */
async function loadSchemas() {
  const [
    { PersonaV1 },
    { SitemapV1 },
    { ManifestV1 },
    { InteractionSpecV1 },
    { AuditReportV1 },
    { HandoffBundleV1 },
    // Plan 02 additions:
    { Finding },
    { ManifestLockEntry },
  ] = await Promise.all([
    import("../../../schemas/src/persona.ts"),
    import("../../../schemas/src/sitemap.ts"),
    import("../../../schemas/src/manifest.ts"),
    import("../../../schemas/src/interaction-spec.ts"),
    import("../../../schemas/src/audit-report.ts"),
    import("../../../schemas/src/handoff-bundle.ts"),
    import("../../../schemas/src/finding.ts"),
    import("../../../schemas/src/manifest-lock-entry.ts"),
  ]);

  return {
    persona: { schema: PersonaV1, version: 1 },
    sitemap: { schema: SitemapV1, version: 1 },
    manifest: { schema: ManifestV1, version: 1 },
    "interaction-spec": { schema: InteractionSpecV1, version: 1 },
    "audit-report": { schema: AuditReportV1, version: 1 },
    "handoff-bundle": { schema: HandoffBundleV1, version: 1 },
    // Plan 02 additions:
    finding: { schema: Finding, version: 1 },
    "manifest-lock-entry": { schema: ManifestLockEntry, version: 1 },
  };
}

/**
 * Emit all 6 versioned JSON Schemas + discovery manifest.
 * Called by `npm run schemas:emit` and the schemas-emit CLI subcommand.
 */
export async function emitSchemas() {
  await mkdir(distDir, { recursive: true });

  const SCHEMAS = await loadSchemas();

  const index = { schemas: {} };

  for (const [name, { schema, version }] of Object.entries(SCHEMAS)) {
    // z.toJSONSchema() targets Draft 2020-12 by default (Zod 4.4+).
    // D-01 substitution: using built-in z.toJSONSchema() instead of deprecated
    // zod-to-json-schema package (EOL November 2025).
    const raw = z.toJSONSchema(schema, { target: "draft-2020-12" });

    // Canonicalize key order for deterministic output (T-01-01).
    const canonical = canonicalize(raw);

    const filename = `${name}.v${version}.json`;
    const filePath = join(distDir, filename);
    const distRelPath = `schemas/dist/${filename}`;

    await writeFile(filePath, JSON.stringify(canonical, null, 2) + "\n");

    index.schemas[name] = { version, path: distRelPath };
  }

  // Write the discovery manifest (D-04).
  const indexPath = join(distDir, "index.json");
  const canonicalIndex = canonicalize(index);
  await writeFile(indexPath, JSON.stringify(canonicalIndex, null, 2) + "\n");

  console.log(`Emitted ${Object.keys(SCHEMAS).length} schemas to ${distDir}`);
  console.log(`Discovery manifest written to ${indexPath}`);

  return index;
}

// Run when invoked directly.
// Check if this module is the entry point.
const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("emit.mjs"));

if (isMain) {
  emitSchemas().catch((err) => {
    console.error("Emit failed:", err);
    process.exit(1);
  });
}
