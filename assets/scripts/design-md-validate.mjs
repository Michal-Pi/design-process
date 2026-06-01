// assets/scripts/design-md-validate.mjs
// Validates a DESIGN.md file against the pinned Google DESIGN.md schema.
// Source: CONTEXT.md D-29; RESEARCH.md Open Q5; FORMAT-07 schema-version pinning.
// Implements: FORMAT-07
//
// Pinned version: 2026.04 (Google DESIGN.md April 2026 OSS release, Apache-2.0)
// Reference: https://github.com/google-labs-code/design.md
//
// The --design-md-version flag is provided for forward-compatibility only.
// Currently only 2026.04 is supported; any other version exits 1 with a clear error.

import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

/**
 * The one and only currently-supported DESIGN.md schema version.
 * FORMAT-07 requires pinning to survive Google spec drift.
 */
const PINNED_VERSION = "2026.04";

/**
 * Minimal JSON Schema representation of the Google DESIGN.md April 2026 spec.
 *
 * The real DESIGN.md spec uses: Markdown body + YAML frontmatter.
 * Required frontmatter fields (per April 2026 release):
 *   - name: string (product/feature name)
 *   - tokens: number (token budget)
 *   - version: string (DESIGN.md schema version)
 *
 * Optional frontmatter:
 *   - $extensions.complete-design: object (complete-design structured metadata per MRD §15)
 *
 * Body: free Markdown (not validated structurally in v1.5).
 *
 * Source: google-labs-code/design.md (Apache-2.0); Google Stitch DESIGN.md blog.
 */
const DESIGN_MD_SCHEMA_2026_04 = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://complete-design.dev/schemas/design-md.2026.04.json",
  title: "Google DESIGN.md (April 2026)",
  description:
    "DESIGN.md frontmatter schema — pinned to Google DESIGN.md April 2026 OSS release",
  type: "object",
  required: ["name", "tokens", "version"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
      description: "Product or feature name",
    },
    tokens: {
      type: "number",
      description: "Token budget for this design document",
    },
    version: {
      type: "string",
      description: "DESIGN.md schema version",
    },
    $extensions: {
      type: "object",
      description: "Optional extensions namespace",
      properties: {
        "complete-design": {
          type: "object",
          description: "complete-design structured metadata (MRD §15)",
        },
      },
    },
  },
  additionalProperties: true,
};

/**
 * Write the pinned schema to schemas/dist/ so it is available for tooling.
 * This is a lazy-init — called when validateDesignMd first runs.
 */
let _schemaWritten = false;
async function ensureSchemaDist() {
  if (_schemaWritten) return;
  const { writeFile, mkdir } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const distPath = join(__dirname, "../../schemas/dist/design-md.2026.04.json");
  await mkdir(join(__dirname, "../../schemas/dist"), { recursive: true });
  await writeFile(
    distPath,
    JSON.stringify(DESIGN_MD_SCHEMA_2026_04, null, 2) + "\n"
  );
  _schemaWritten = true;
}

let _ajv = null;
let _validateFn = null;

function getValidateFn() {
  if (_validateFn) return _validateFn;
  _ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(_ajv);
  _validateFn = _ajv.compile(DESIGN_MD_SCHEMA_2026_04);
  return _validateFn;
}

/**
 * Validate a DESIGN.md file against the pinned schema.
 *
 * FORMAT-07: schema version pinning contract.
 * - Only version '2026.04' is implemented in v1.5.
 * - The --design-md-version flag is scaffolded for forward-compat;
 *   any value other than '2026.04' exits 1 with a clear error.
 *
 * @param {string} filePath - Path to the DESIGN.md file
 * @param {{ version?: string }} [options]
 * @returns {Promise<{ valid: boolean, errors: object[] }>}
 */
export async function validateDesignMd(filePath, options = {}) {
  const version = options.version ?? PINNED_VERSION;

  if (version !== PINNED_VERSION) {
    process.stderr.write(
      `[design-md-validate] ERROR: unsupported design-md schema version: ${version}. ` +
        `Only ${PINNED_VERSION} is currently supported.\n`
    );
    process.exit(1);
  }

  await ensureSchemaDist();

  let rawContent;
  try {
    rawContent = await readFile(filePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[design-md-validate] ERROR: failed to read ${filePath}: ${err.message}\n`
    );
    process.exit(1);
  }

  // Parse YAML frontmatter.
  const parsed = matter(rawContent);
  const frontmatter = parsed.data;

  const validateFn = getValidateFn();
  const valid = validateFn(frontmatter);

  if (valid) {
    process.stdout.write(
      `[design-md-validate] OK — ${filePath} is valid (DESIGN.md ${PINNED_VERSION}).\n`
    );
    return { valid: true, errors: [] };
  }

  const errors = (validateFn.errors ?? []).map((err) => ({
    schemaPath: err.schemaPath ?? "#",
    instancePath: err.instancePath ?? "",
    keyword: err.keyword ?? "unknown",
    params: err.params ?? {},
    message: err.message ?? "Validation error",
  }));

  process.stderr.write(
    `[design-md-validate] INVALID — ${filePath} has ${errors.length} error(s) (DESIGN.md ${PINNED_VERSION}):\n`
  );
  for (const err of errors) {
    process.stderr.write(
      `  schemaPath: ${err.schemaPath}, instancePath: ${err.instancePath}, keyword: ${err.keyword}, message: ${err.message}\n`
    );
  }
  process.exit(1);
}

// Run when invoked directly.
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("design-md-validate.mjs") ||
    process.argv[1].includes("design-md-validate"));

if (isMain) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: tsx assets/scripts/design-md-validate.mjs <path>");
    process.exit(1);
  }
  validateDesignMd(filePath).catch((err) => {
    console.error("design-md-validate failed:", err.message);
    process.exit(1);
  });
}
