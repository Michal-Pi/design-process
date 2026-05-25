// assets/scripts/gates/stage-5b.mjs
// Stage 5b (Systematize-Lite / DESIGN.md) gate — Phase 2 real business logic.
//
// Gate logic (Plan 02-04 T-02-04-A, D-44, D-51):
// 1. tokens.json absent → not_runnable (reason: 'no-tokens-found')
// 2. tokens.json present: parse YAML frontmatter; if evidence !== 'INFERRED' → BLOCKER (5b-evidence-001)
// 3. Parse tokens.json body JSON. Count component-tier keys.
//    - count === 0 → finding 5b-component-001 (WARNING)
//    - count ≥ 1  → finding 5b-frost-001 (INFO: Frost ≥3× deferred per D-44)
// 4. DESIGN.md absent → finding 5b-missing-001 (ERROR — workflow will generate it)
//    DESIGN.md present → validate schema (name, tokens, version required).
//    - schema invalid → BLOCKER 5b-schema-001 (failed_after_repair)
//    - $extensions.design-os.evidence present but ≠ 'INFERRED' → BLOCKER 5b-evidence-002
// 5. Any BLOCKER → failed_after_repair (reason: 'schema-violation')
//    Otherwise → pass_with_warnings (evidence: 'proto', D-44 note in warnings)
//
// NO LLM imports — must pass lint-determinism.mjs (PREV-04, D-13).
//
// Source: CONTEXT.md D-44, D-51; PLAN.md T-02-04-A
// Implements: GATE-01, WF-07, MVPA-04, D-44, D-51

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN.md schema (minimal, matches design-md-validate.mjs inline schema)
// Required fields: name (string), tokens (number), version (string == "2026.04")
// ─────────────────────────────────────────────────────────────────────────────

const DESIGN_MD_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["name", "tokens", "version"],
  properties: {
    name: { type: "string", minLength: 1 },
    tokens: { type: "number" },
    version: { type: "string" },
    $extensions: {
      type: "object",
      properties: {
        "design-os": { type: "object" },
      },
    },
  },
  additionalProperties: true,
};

/** Lazy-initialised AJV instance for DESIGN.md schema validation. */
let _ajv = null;
function getAjv() {
  if (_ajv) return _ajv;
  _ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(_ajv);
  return _ajv;
}

let _designMdValidateFn = null;
function getDesignMdValidateFn() {
  if (_designMdValidateFn) return _designMdValidateFn;
  const ajv = getAjv();
  _designMdValidateFn = ajv.compile(DESIGN_MD_SCHEMA);
  return _designMdValidateFn;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: validate DESIGN.md frontmatter inline (no process.exit — safe for gate)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate DESIGN.md content against the pinned schema.
 * Returns { valid, errors, frontmatter } — does NOT call process.exit.
 *
 * @param {string} content - Raw DESIGN.md file content
 * @returns {{ valid: boolean, errors: string[], frontmatter: object }}
 */
function validateDesignMdContent(content) {
  let frontmatter;
  try {
    const parsed = matter(content);
    frontmatter = parsed.data;
  } catch (parseErr) {
    return {
      valid: false,
      errors: [`YAML parse error: ${parseErr.message}`],
      frontmatter: {},
    };
  }

  const validateFn = getDesignMdValidateFn();
  const valid = validateFn(frontmatter);
  const errors = valid
    ? []
    : (validateFn.errors ?? []).map(
        (e) =>
          `${e.instancePath || "/"} ${e.keyword}: ${e.message}`
      );

  return { valid, errors, frontmatter };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: count component-tier keys in DTCG JSON body
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse tokens.json content (YAML frontmatter + JSON body) and count component-tier keys.
 * Returns { componentCount, frontmatter, bodyParseError? }
 *
 * @param {string} content - Raw tokens.json content
 * @returns {{ componentCount: number, frontmatter: object, bodyParseError?: string }}
 */
function parseTokensJson(content) {
  let frontmatter = {};
  let jsonBody;

  try {
    const parsed = matter(content);
    frontmatter = parsed.data ?? {};

    // The body after YAML frontmatter is the raw JSON string
    const bodyContent = parsed.content?.trim();
    if (!bodyContent) {
      return { componentCount: 0, frontmatter, bodyParseError: "empty body" };
    }
    jsonBody = JSON.parse(bodyContent);
  } catch (err) {
    return {
      componentCount: 0,
      frontmatter,
      bodyParseError: `parse error: ${err.message}`,
    };
  }

  // Count component-tier keys: top-level 'component' group keys
  const componentGroup = jsonBody["component"];
  if (!componentGroup || typeof componentGroup !== "object") {
    return { componentCount: 0, frontmatter };
  }

  // Filter out DTCG metadata keys ($schema, $description, $type, $value, $extensions)
  const componentNames = Object.keys(componentGroup).filter(
    (k) => !k.startsWith("$")
  );

  return { componentCount: componentNames.length, frontmatter };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main gate function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the Stage 5b gate against a design directory.
 *
 * Returns GateResult:
 * - not_runnable     → tokens.json absent
 * - failed_after_repair → any BLOCKER finding (evidence mismatch, schema invalid)
 * - pass_with_warnings  → otherwise (D-44: v2.0a always warns about Frost ≥3× deferral)
 *
 * D-44: Frost ≥3× recurrence is NOT enforced as a gate blocker in v2.0a.
 * D-51: evidence:INFERRED is the only valid value for Stage 5a/5b artifacts.
 *
 * @param {string} designDir - Path to the design directory (containing tokens.json and DESIGN.md)
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage5bGate(designDir) {
  const tokensPath = join(designDir, "tokens.json");
  const designMdPath = join(designDir, "DESIGN.md");

  // ── Step 1: tokens.json must exist ────────────────────────────────────────
  if (!existsSync(tokensPath)) {
    return {
      kind: "not_runnable",
      reason: "no-tokens-found",
    };
  }

  /** @type {Array<{checkId: string, status: string, evidence?: string, citation?: string}>} */
  const findings = [];
  let hasBlocker = false;

  // ── Step 2: Parse tokens.json YAML frontmatter + JSON body ────────────────
  let tokensContent;
  try {
    tokensContent = await readFile(tokensPath, "utf8");
  } catch (err) {
    findings.push({
      checkId: "5b-tokens-read-001",
      status: "fail",
      evidence: `Failed to read tokens.json: ${err.message}`,
    });
    hasBlocker = true;
    return buildResult(hasBlocker, findings);
  }

  const { componentCount, frontmatter: tokensFrontmatter, bodyParseError } =
    parseTokensJson(tokensContent);

  // Body parse error is a BLOCKER (malformed JSON must not crash gate, but must fail)
  if (bodyParseError) {
    findings.push({
      checkId: "5b-tokens-parse-001",
      status: "fail",
      evidence: `tokens.json body parse error: ${bodyParseError}`,
    });
    hasBlocker = true;
    return buildResult(hasBlocker, findings);
  }

  // ── Step 2a: Enforce evidence:INFERRED on tokens.json (D-51) ─────────────
  const tokensEvidence = tokensFrontmatter.evidence;
  if (tokensEvidence !== undefined && tokensEvidence !== "INFERRED") {
    findings.push({
      checkId: "5b-evidence-001",
      status: "fail",
      evidence: `tokens.json evidence must be 'INFERRED' in v2.0a (D-51). Found: '${tokensEvidence}'.`,
      citation: "D-51",
    });
    hasBlocker = true;
  }

  // ── Step 3: Component-tier token count ────────────────────────────────────
  if (componentCount === 0) {
    // WARNING: no components found (not a BLOCKER in v2.0a)
    findings.push({
      checkId: "5b-component-001",
      status: "fail",
      evidence:
        "No component-tier tokens found in design/tokens.json. " +
        "Add tokens under the 'component' group to register promoted components.",
    });
  } else {
    // INFO: Frost ≥3× recurrence deferred to Phase 3 (D-44)
    findings.push({
      checkId: "5b-frost-001",
      status: "na",
      evidence:
        `Frost ≥3× recurrence not yet verified (requires Phase 3 Stage 4 artifacts) — D-44. ` +
        `Component-tier token count: ${componentCount}. ` +
        `In v2.0a-lite, ≥1 component appearance is sufficient (threshold deferred to Phase 3).`,
      citation: "D-44",
    });
  }

  // ── Step 4: DESIGN.md check ───────────────────────────────────────────────
  if (!existsSync(designMdPath)) {
    // DESIGN.md not yet emitted — this is expected before the workflow runs.
    // It's an ERROR (workflow must generate it) but not a hard gate BLOCKER
    // — the systematic workflow produces it as part of its execution.
    findings.push({
      checkId: "5b-missing-001",
      status: "fail",
      evidence:
        "design/DESIGN.md not yet emitted. Run the systematize workflow to generate it. " +
        "This is expected before the first systematize run.",
    });
    // Not a BLOCKER — gate returns pass_with_warnings to indicate workflow should proceed
  } else {
    // DESIGN.md exists — validate schema and evidence field
    let designMdContent;
    try {
      designMdContent = await readFile(designMdPath, "utf8");
    } catch (err) {
      findings.push({
        checkId: "5b-design-md-read-001",
        status: "fail",
        evidence: `Failed to read DESIGN.md: ${err.message}`,
      });
      hasBlocker = true;
      return buildResult(hasBlocker, findings);
    }

    const { valid, errors, frontmatter: designMdFrontmatter } =
      validateDesignMdContent(designMdContent);

    if (!valid) {
      // BLOCKER: DESIGN.md does not conform to the 2026.04 schema
      findings.push({
        checkId: "5b-schema-001",
        status: "fail",
        evidence: `DESIGN.md schema error (DESIGN.md 2026.04): ${errors.join("; ")}`,
        citation: "FORMAT-07",
      });
      hasBlocker = true;
    }

    // Check $extensions.design-os.evidence — must be 'INFERRED' on every Stage 5b DESIGN.md (D-51)
    // D-51 requires evidence:INFERRED unconditionally. Missing block or missing field is also a BLOCKER.
    const designOsExt = designMdFrontmatter?.["$extensions"]?.["design-os"];
    if (
      designOsExt === undefined ||
      designOsExt === null ||
      typeof designOsExt !== "object"
    ) {
      // BLOCKER: $extensions.design-os block entirely absent — required by D-51
      findings.push({
        checkId: "5b-evidence-002",
        status: "fail",
        evidence:
          `DESIGN.md is missing the $extensions.design-os block required by D-51. ` +
          `The systematize workflow must emit $extensions.design-os.evidence:'INFERRED'.`,
        citation: "D-51",
      });
      hasBlocker = true;
    } else {
      const designMdEvidence = designOsExt["evidence"];
      if (designMdEvidence !== "INFERRED") {
        // BLOCKER: evidence field absent or has wrong value
        const foundDesc =
          designMdEvidence === undefined
            ? "field absent"
            : `'${designMdEvidence}'`;
        findings.push({
          checkId: "5b-evidence-002",
          status: "fail",
          evidence:
            `DESIGN.md $extensions.design-os.evidence must be 'INFERRED' in v2.0a (D-51). ` +
            `Found: ${foundDesc}. ` +
            `The systematize workflow emits evidence:INFERRED per D-51.`,
          citation: "D-51",
        });
        hasBlocker = true;
      }
    }
  }

  return buildResult(hasBlocker, findings);
}

// ─────────────────────────────────────────────────────────────────────────────
// Result builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the final GateResult from accumulated findings.
 * Any BLOCKER → failed_after_repair.
 * Otherwise → pass_with_warnings (evidence:'proto', D-44 note).
 *
 * @param {boolean} hasBlocker
 * @param {Array<{checkId: string, status: string, evidence?: string, citation?: string}>} findings
 * @returns {import("../../schemas/src/gate-result.js").GateResultType}
 */
function buildResult(hasBlocker, findings) {
  if (hasBlocker) {
    return {
      kind: "failed_after_repair",
      reason: "schema-violation",
      findings,
    };
  }

  return {
    kind: "pass_with_warnings",
    evidence: "proto",
    findings,
    warnings: [
      "Full Stage 5b pass requires Phase 3 — Frost ≥3× recurrence verification and complete Stage 4 artifacts. " +
        "v2.0a lite-mode: pass_with_warnings evidence:proto is the correct terminal state (D-44).",
    ],
  };
}
