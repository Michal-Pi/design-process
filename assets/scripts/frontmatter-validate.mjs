// assets/scripts/frontmatter-validate.mjs
// Validates YAML frontmatter of design/ artifacts against their versioned JSON Schemas.
// Source: CONTEXT.md D-28 (strict for design/, lenient for .design-os/private/)
// Implements: D-28, PERSIST-01

import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validate } from "./schemas/validate.mjs";

/**
 * Determine whether the given file path is in "lenient" mode.
 * D-28: lenient for .design-os/private/, strict (default) for all others.
 *
 * @param {string} filePath - Absolute or relative path to the file
 * @returns {boolean} true = lenient mode (warn-only); false = strict mode (reject)
 */
function isLenientPath(filePath) {
  const normalized = resolve(filePath).replace(/\\/g, "/");
  return normalized.includes("/.design-os/private/");
}

/**
 * Validate the YAML frontmatter of a Markdown file.
 *
 * STRICT mode (default — files in design/):
 *   Exits 1 on any validation error; prints full error list to stderr.
 *
 * LENIENT mode (files in .design-os/private/):
 *   Prints warnings to stderr but exits 0 (non-blocking).
 *
 * @param {string} filePath - Path to the .md file to validate
 * @param {{ lenient?: boolean }} [options] - Override mode (lenient flag)
 * @returns {Promise<{ valid: boolean, errors: object[], mode: string }>}
 */
export async function validateFrontmatter(filePath, options = {}) {
  const rawContent = await readFile(filePath, "utf8");
  const parsed = matter(rawContent);
  const frontmatter = parsed.data;

  const artifact = frontmatter["artifact"];
  if (!artifact) {
    const err = {
      schemaPath: "#/properties/artifact",
      instancePath: "/artifact",
      keyword: "required",
      params: { missingProperty: "artifact" },
      message: "Missing required field: artifact",
    };
    const lenient = options.lenient ?? isLenientPath(filePath);
    if (lenient) {
      console.warn(`[frontmatter-validate WARN] ${filePath}: ${err.message}`);
      return { valid: false, errors: [err], mode: "lenient" };
    } else {
      console.error(`[frontmatter-validate ERROR] ${filePath}: ${err.message}`);
      process.exit(1);
    }
  }

  const result = await validate(artifact, frontmatter);

  const lenient = options.lenient ?? isLenientPath(filePath);
  const mode = lenient ? "lenient" : "strict";

  if (!result.valid) {
    const errorLines = result.errors.map(
      (e) =>
        `  [${e.keyword}] instancePath: ${e.instancePath || "/"}, schemaPath: ${e.schemaPath} — ${e.message}`
    );

    if (lenient) {
      console.warn(
        `[frontmatter-validate WARN] ${filePath} has ${result.errors.length} frontmatter issue(s) (lenient mode — exit 0):`
      );
      for (const line of errorLines) {
        console.warn(line);
      }
    } else {
      console.error(
        `[frontmatter-validate ERROR] ${filePath} has ${result.errors.length} frontmatter issue(s) (strict mode — exit 1):`
      );
      for (const line of errorLines) {
        console.error(line);
      }
      process.exit(1);
    }
  }

  return { ...result, mode };
}

// Run when invoked directly.
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("frontmatter-validate.mjs") ||
    process.argv[1].includes("frontmatter-validate"));

if (isMain) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: tsx assets/scripts/frontmatter-validate.mjs <path>");
    process.exit(1);
  }
  validateFrontmatter(filePath).catch((err) => {
    console.error("frontmatter-validate failed:", err.message);
    process.exit(1);
  });
}
