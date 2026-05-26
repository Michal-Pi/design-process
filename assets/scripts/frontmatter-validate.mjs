// assets/scripts/frontmatter-validate.mjs
// Validates YAML frontmatter of design/ artifacts against their versioned JSON Schemas.
// Phase 2 extension: --check-worst-provenance mode (D-38, OF-02).
//
// Source: CONTEXT.md D-28 (strict for design/, lenient for .design-os/private/)
//         CONTEXT.md D-38 (worstProvenance propagation enforcement)
// Implements: D-28, D-38, PERSIST-01, OF-02

import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { computeWorstProvenance } from "./gates/stage-1.mjs";
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
 * Read the provenance field from a persona file via gray-matter.
 * Falls back to 'missing' if no frontmatter or unrecognized value.
 *
 * @param {string} absolutePersonaPath - Absolute path to the persona file
 * @returns {Promise<string>} provenance value
 */
async function readPersonaProvenance(absolutePersonaPath) {
  try {
    const raw = await readFile(absolutePersonaPath, "utf8");
    const parsed = matter(raw);
    const provenance = parsed.data?.provenance;
    const valid = ["generated", "validated", "inferred", "missing"];
    return valid.includes(provenance) ? provenance : "missing";
  } catch {
    return "missing";
  }
}

/**
 * Check worstProvenance propagation for an artifact that cites persona files.
 *
 * Per D-38 and OF-02:
 * - Parse the artifact's frontmatter
 * - Find the `cites:` array field listing persona paths (relative to basedir)
 * - Read each cited persona's provenance
 * - Compute the worst provenance across all cited personas
 * - Verify the artifact frontmatter has `worstProvenance:` field
 * - Verify the declared worstProvenance is at least as conservative as computed
 *
 * @param {string} artifactPath - Absolute path to the artifact file (Markdown)
 * @param {string} [basedir] - Base directory for resolving relative persona paths.
 *   Defaults to the directory containing the artifact file.
 * @returns {Promise<{ valid: boolean, error?: string, computedWorstProvenance?: string }>}
 */
export async function checkWorstProvenance(artifactPath, basedir) {
  const raw = await readFile(artifactPath, "utf8");
  const parsed = matter(raw);
  const frontmatter = parsed.data;

  // If no cites field, nothing to check
  const cites = frontmatter["cites"];
  if (!cites || !Array.isArray(cites) || cites.length === 0) {
    return { valid: true };
  }

  // Only check files that cite persona files
  const personaCites = cites.filter(
    (c) => typeof c === "string" && c.endsWith(".persona.json")
  );
  if (personaCites.length === 0) {
    return { valid: true };
  }

  // Resolve base directory for persona paths
  const resolvedBase = basedir
    ? resolve(basedir)
    : dirname(resolve(artifactPath));

  // Read provenance of each cited persona
  const provenances = await Promise.all(
    personaCites.map((citedPath) =>
      readPersonaProvenance(join(resolvedBase, citedPath))
    )
  );

  const computedWorstProvenance = computeWorstProvenance(provenances);

  // Check artifact frontmatter for worstProvenance field
  const declaredWorstProvenance = frontmatter["worstProvenance"];

  if (!declaredWorstProvenance) {
    return {
      valid: false,
      error:
        `Missing worstProvenance field (required when citing generated personas per D-38). ` +
        `Computed worstProvenance from cited personas: '${computedWorstProvenance}'.`,
      computedWorstProvenance,
    };
  }

  // Verify declared worstProvenance is at least as conservative as computed
  const PROVENANCE_ORDER = ["missing", "generated", "inferred", "validated"];
  const computedIdx = PROVENANCE_ORDER.indexOf(computedWorstProvenance);
  const declaredIdx = PROVENANCE_ORDER.indexOf(declaredWorstProvenance);

  // Lower index = more conservative. Declared must be ≤ computed index (at least as conservative)
  if (declaredIdx > computedIdx) {
    return {
      valid: false,
      error:
        `worstProvenance mismatch: declared '${declaredWorstProvenance}' is less conservative ` +
        `than computed '${computedWorstProvenance}' from cited persona provenances (D-38).`,
      computedWorstProvenance,
    };
  }

  return { valid: true, computedWorstProvenance };
}

/**
 * Check Phase 3 INFERRED enforcement rules (D-64) for a file.
 *
 * Rule A: file in design/inferred/ with provenance:'inferred' MUST have the
 *   INFERRED banner in the body. Missing banner → 'inferred-disclaimer-missing' error.
 *
 * Rule B: file in design/ (OUTSIDE design/inferred/) with provenance:'inferred' →
 *   'inferred-bleed-detected' error (Pitfall D bleed prevention).
 *
 * Both rules run in strict mode (return errors; caller decides whether to exit 1).
 *
 * @param {string} filePath - Absolute or relative path to the file
 * @param {import('gray-matter').GrayMatterFile<string>} parsed - Parsed gray-matter result
 * @returns {{ errors: object[] }} Array of errors (empty if rules pass)
 */
function checkInferredEnforcementRules(filePath, parsed) {
  const errors = [];
  const normalized = resolve(filePath).replace(/\\/g, "/");
  const frontmatter = parsed.data;
  const body = parsed.content || "";

  const isInInferredDir = normalized.includes("/design/inferred/") ||
    normalized.replace(/\\/g, "/").includes("design/inferred/");

  const isInDesignDir = (normalized.includes("/design/") || normalized.includes("design/")) &&
    !normalized.includes("/design/inferred/") &&
    !normalized.replace(/\\/g, "/").includes("design/inferred/");

  const provenance = frontmatter["provenance"];

  // Rule A: design/inferred/ file with provenance:inferred MUST have INFERRED banner
  if (isInInferredDir && provenance === "inferred") {
    const hasInferredBanner = />\s*\*\*INFERRED\*\*/i.test(body);
    if (!hasInferredBanner) {
      errors.push({
        schemaPath: "#/inferred-disclaimer-missing",
        instancePath: "/body",
        keyword: "inferred-disclaimer-missing",
        params: { rule: "A", provenance: "inferred" },
        message:
          "File in design/inferred/ with provenance:inferred must have the INFERRED banner " +
          "('> **INFERRED** — ...') as the first paragraph of the body (D-64 Rule A).",
      });
    }
  }

  // Rule B: design/ file (outside design/inferred/) with provenance:inferred → bleed error
  if (isInDesignDir && provenance === "inferred") {
    errors.push({
      schemaPath: "#/inferred-bleed-detected",
      instancePath: "/provenance",
      keyword: "inferred-bleed-detected",
      params: { rule: "B", provenance: "inferred" },
      message:
        "File in design/ (outside design/inferred/) has provenance:inferred. " +
        "Inferred artifacts must live in design/inferred/ only (D-64 Rule B — Pitfall D bleed prevention). " +
        "Use 'design-os promote-inferred' to move this file after removing the INFERRED markers.",
    });
  }

  return { errors };
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
 * Phase 3 extension (D-64 — do NOT remove):
 *   Rule A: design/inferred/ + provenance:inferred → MUST have INFERRED banner in body
 *   Rule B: design/ (outside inferred/) + provenance:inferred → error (bleed prevention)
 *
 * @param {string} filePath - Path to the .md file to validate
 * @param {{ lenient?: boolean, skipSchemaValidation?: boolean }} [options] - Override mode
 * @returns {Promise<{ valid: boolean, errors: object[], mode: string }>}
 */
export async function validateFrontmatter(filePath, options = {}) {
  const rawContent = await readFile(filePath, "utf8");
  const parsed = matter(rawContent);
  const frontmatter = parsed.data;

  const lenient = options.lenient ?? isLenientPath(filePath);
  const mode = lenient ? "lenient" : "strict";
  const skipSchemaValidation = options.skipSchemaValidation ?? false;

  /** @type {object[]} */
  const allErrors = [];

  // ── Phase 3 D-64 INFERRED enforcement (Rules A and B) ────────────────────
  // Run BEFORE schema validation so they are always checked regardless of artifact type.
  const inferredCheck = checkInferredEnforcementRules(filePath, parsed);
  allErrors.push(...inferredCheck.errors);

  // ── Schema validation (existing logic) ────────────────────────────────────
  if (!skipSchemaValidation) {
    const artifact = frontmatter["artifact"];
    if (!artifact) {
      const err = {
        schemaPath: "#/properties/artifact",
        instancePath: "/artifact",
        keyword: "required",
        params: { missingProperty: "artifact" },
        message: "Missing required field: artifact",
      };
      allErrors.push(err);
    } else {
      const result = await validate(artifact, frontmatter);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }
  }

  // ── Report errors ─────────────────────────────────────────────────────────
  if (allErrors.length > 0) {
    const errorLines = allErrors.map(
      (e) =>
        `  [${e.keyword}] instancePath: ${e.instancePath || "/"}, schemaPath: ${e.schemaPath} — ${e.message}`
    );

    if (lenient) {
      console.warn(
        `[frontmatter-validate WARN] ${filePath} has ${allErrors.length} frontmatter issue(s) (lenient mode — exit 0):`
      );
      for (const line of errorLines) {
        console.warn(line);
      }
      return { valid: false, errors: allErrors, mode };
    } else {
      console.error(
        `[frontmatter-validate ERROR] ${filePath} has ${allErrors.length} frontmatter issue(s) (strict mode — exit 1):`
      );
      for (const line of errorLines) {
        console.error(line);
      }
      process.exit(1);
    }
  }

  return { valid: true, errors: [], mode };
}

// Run when invoked directly.
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("frontmatter-validate.mjs") ||
    process.argv[1].includes("frontmatter-validate"));

if (isMain) {
  const checkWorstProvenanceFlag = process.argv.includes(
    "--check-worst-provenance"
  );
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const filePath = args[0];

  if (!filePath) {
    console.error(
      "Usage: tsx assets/scripts/frontmatter-validate.mjs [--check-worst-provenance] <path>"
    );
    process.exit(1);
  }

  if (checkWorstProvenanceFlag) {
    // --check-worst-provenance mode: validate worstProvenance field propagation
    const basedir = args[1]; // optional base directory for resolving persona paths
    checkWorstProvenance(filePath, basedir).then((result) => {
      if (!result.valid) {
        console.error(
          `[frontmatter-validate ERROR] --check-worst-provenance: ${result.error}`
        );
        process.exit(1);
      } else {
        console.log(
          `[frontmatter-validate OK] --check-worst-provenance: worstProvenance propagation valid`
        );
        process.exit(0);
      }
    });
  } else {
    validateFrontmatter(filePath).catch((err) => {
      console.error("frontmatter-validate failed:", err.message);
      process.exit(1);
    });
  }
}
