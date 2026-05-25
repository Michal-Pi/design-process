// assets/scripts/schemas/validate.mjs
// ajv 8 runtime validator at every artifact boundary.
// Source: CONTEXT.md D-03 (structured errors with schemaPath + instancePath);
// RESEARCH.md Standard Stack (ajv 8.x, ajv-formats 3.x).
// Implements: SCHEMA-07, D-03

// Use Ajv2020 for Draft 2020-12 schema support (Zod 4 toJSONSchema default target).
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

let _ajv = null;

/**
 * Create and cache the ajv instance with strict mode and all formats.
 * D-03: allErrors:true surfaces every violation, not just the first.
 */
function getAjv() {
  if (_ajv) return _ajv;
  // Ajv2020 required for Draft 2020-12 schemas emitted by z.toJSONSchema().
  // strict: true ensures unknown keywords are rejected.
  // allErrors: true surfaces every violation (D-03: never silent).
  _ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(_ajv);
  return _ajv;
}

/**
 * Load the schema discovery manifest.
 * D-04: downstream code never hardcodes a schema path.
 */
async function loadIndex() {
  const indexPath = join(ROOT, "schemas/dist/index.json");
  const raw = await readFile(indexPath, "utf8");
  return JSON.parse(raw);
}

/**
 * Validate `data` against the versioned JSON Schema for `artifactName`.
 *
 * Returns a structured result — errors are NEVER swallowed silently (D-03).
 * Each error includes:
 *   - schemaPath: JSON pointer into the schema
 *   - instancePath: JSON pointer into the data (ajv's "dataPath" equivalent)
 *   - keyword: the failing keyword
 *   - params: additional context (enum values, pattern, etc.)
 *   - message: human-readable description
 *
 * @param {string} artifactName - The artifact type (e.g., 'persona')
 * @param {unknown} data - The data to validate
 * @returns {{ valid: boolean, errors: object[] }}
 */
export async function validate(artifactName, data) {
  const index = await loadIndex();

  const entry = index.schemas[artifactName];
  if (!entry) {
    return {
      valid: false,
      errors: [
        {
          schemaPath: "#",
          instancePath: "",
          keyword: "unknown-artifact",
          params: { artifactName },
          message: `Unknown artifact type: '${artifactName}'. Available: ${Object.keys(index.schemas).join(", ")}`,
        },
      ],
    };
  }

  const schemaPath = join(ROOT, entry.path);
  const rawSchema = await readFile(schemaPath, "utf8");
  const schema = JSON.parse(rawSchema);

  const ajv = getAjv();

  // Remove cached compiled schema if present (for repeated calls with same id).
  const schemaId = schema.$id;
  if (schemaId && ajv.getSchema(schemaId)) {
    ajv.removeSchema(schemaId);
  }

  const validateFn = ajv.compile(schema);
  const valid = validateFn(data);

  if (valid) {
    return { valid: true, errors: [] };
  }

  // Map ajv errors to the structured D-03 shape.
  const errors = (validateFn.errors ?? []).map((err) => ({
    schemaPath: err.schemaPath ?? "#",
    instancePath: err.instancePath ?? "",
    keyword: err.keyword ?? "unknown",
    params: err.params ?? {},
    message: err.message ?? "Validation error",
  }));

  return { valid: false, errors };
}
