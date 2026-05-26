// assets/scripts/gates/stage-5b.mjs
// Stage 5b (Systematize-Lite / DESIGN.md) gate — Phase 3 upgraded.
//
// Gate logic (Plan 02-04 T-02-04-A + Plan 03-03 T-03-03-B, D-61, D-70):
// 1. tokens.json absent → not_runnable (reason: 'no-tokens-found')
// 2. tokens.json present: parse YAML frontmatter; if evidence !== 'INFERRED' → BLOCKER (5b-evidence-001)
// 3. Parse tokens.json body JSON. Count component-tier keys.
//    - count === 0 → finding 5b-component-001 (WARNING)
//    - count ≥ 1  → run Frost recurrence check (D-61, D-70, Phase 3):
//                    scan .excalidraw labels + .spec.md body for each component name
//                    if any component count < 3 → BLOCKER 5b-frost-002 (failed_after_repair, reason:'frost-recurrence-not-met')
// 4. DESIGN.md absent → finding 5b-missing-001 (ERROR — workflow will generate it)
//    DESIGN.md present → validate schema (name, tokens, version required).
//    - schema invalid → BLOCKER 5b-schema-001 (failed_after_repair)
//    - $extensions.design-os.evidence present but ≠ 'INFERRED' → BLOCKER 5b-evidence-002
// 5. Any BLOCKER → failed_after_repair (reason: 'schema-violation' unless frost, then 'frost-recurrence-not-met')
//    Otherwise → pass_with_warnings (evidence: 'proto')
//
// D-61: Frost recurrence counted per-gate-run from filesystem state — NOT persisted.
// D-70: Frost ≥3× is now a HARD BLOCKER (failed_after_repair) — NOT informational (D-44 was Phase 2).
// T-03-03-03: Use literal case-insensitive includes() for component name search — not regex.
//
// NO LLM imports — must pass lint-determinism.mjs (PREV-04, D-13).
//
// Source: CONTEXT.md D-44, D-51, D-61, D-70; PLAN.md T-02-04-A, T-03-03-B
// Implements: GATE-01, WF-07, MVPA-04, D-44, D-51, D-61, D-70, FID-06

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { globby } from "globby";

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
 * Parse tokens.json content (YAML frontmatter + JSON body) and extract component info.
 * Returns { componentCount, componentNames, frontmatter, bodyParseError? }
 *
 * @param {string} content - Raw tokens.json content
 * @returns {{ componentCount: number, componentNames: string[], frontmatter: object, bodyParseError?: string }}
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
      return { componentCount: 0, componentNames: [], frontmatter, bodyParseError: "empty body" };
    }
    jsonBody = JSON.parse(bodyContent);
  } catch (err) {
    return {
      componentCount: 0,
      componentNames: [],
      frontmatter,
      bodyParseError: `parse error: ${err.message}`,
    };
  }

  // Count component-tier keys: top-level 'component' group keys
  const componentGroup = jsonBody["component"];
  if (!componentGroup || typeof componentGroup !== "object") {
    return { componentCount: 0, componentNames: [], frontmatter };
  }

  // Filter out DTCG metadata keys ($schema, $description, $type, $value, $extensions)
  const componentNames = Object.keys(componentGroup).filter(
    (k) => !k.startsWith("$")
  );

  return { componentCount: componentNames.length, componentNames, frontmatter };
}

// ─────────────────────────────────────────────────────────────────────────────
// Frost recurrence counter (D-61)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count occurrences of each component name across:
 * - .excalidraw files in designDir/wireframes/ subtree (element label field, case-insensitive)
 * - .spec.md files in designDir/interactions/ (body text, case-insensitive literal match)
 *
 * T-03-03-03: Uses literal String.prototype.toLowerCase().includes() (NOT regex)
 * for case-insensitive matching. Prevents regex special-char issues with component names.
 *
 * @param {string} designDir - Path to the design directory
 * @param {string[]} componentNames - Component names to count
 * @returns {Promise<object>} Map of componentName to total occurrence count
 */
async function countComponentRecurrences(designDir, componentNames) {
  // Map<string, number>: componentName -> total occurrence count
  const counts = new Map(componentNames.map((n) => [n, 0]));

  if (componentNames.length === 0) {
    return counts;
  }

  // ── Scan .excalidraw files in wireframes/**/ ────────────────────────────────
  const wireframesDir = join(designDir, "wireframes");
  if (existsSync(wireframesDir)) {
    const excalidrawFiles = await globby(["wireframes/**/*.excalidraw"], {
      cwd: designDir,
      absolute: true,
    });

    for (const filePath of excalidrawFiles) {
      let raw;
      try {
        raw = await readFile(filePath, "utf8");
      } catch {
        continue; // Skip unreadable files
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue; // Skip malformed JSON
      }

      const elements = Array.isArray(parsed.elements) ? parsed.elements : [];
      for (const element of elements) {
        const label = (element.label ?? "").toLowerCase();
        for (const name of componentNames) {
          // T-03-03-03: literal case-insensitive includes check (not regex)
          if (label === name.toLowerCase() || label.includes(name.toLowerCase())) {
            counts.set(name, (counts.get(name) ?? 0) + 1);
          }
        }
      }
    }
  }

  // ── Scan .spec.md files in interactions/ ────────────────────────────────────
  const interactionsDir = join(designDir, "interactions");
  if (existsSync(interactionsDir)) {
    const specFiles = await globby(["interactions/*.spec.md"], {
      cwd: designDir,
      absolute: true,
    });

    for (const filePath of specFiles) {
      let raw;
      try {
        raw = await readFile(filePath, "utf8");
      } catch {
        continue;
      }

      // Parse out the body (skip YAML frontmatter)
      let bodyText;
      try {
        const parsed = matter(raw);
        bodyText = (parsed.content ?? "").toLowerCase();
      } catch {
        bodyText = raw.toLowerCase();
      }

      for (const name of componentNames) {
        // T-03-03-03: literal case-insensitive includes check (not regex)
        const nameLower = name.toLowerCase();
        // Count occurrences in body text by finding each occurrence
        let pos = 0;
        while (true) {
          const idx = bodyText.indexOf(nameLower, pos);
          if (idx === -1) break;
          counts.set(name, (counts.get(name) ?? 0) + 1);
          pos = idx + nameLower.length;
        }
      }
    }
  }

  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main gate function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the Stage 5b gate against a design directory.
 *
 * Returns GateResult:
 * - not_runnable         → tokens.json absent
 * - failed_after_repair  → any BLOCKER finding (evidence mismatch, schema invalid,
 *                           or Frost recurrence < 3× per D-70)
 * - pass_with_warnings   → otherwise
 *
 * D-61: Frost ≥3× recurrence is now a HARD BLOCKER in Phase 3 (D-70).
 *       Returns failed_after_repair with reason:'frost-recurrence-not-met'.
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
  let frostBlockers = [];

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
    return buildResult(hasBlocker, findings, frostBlockers);
  }

  const { componentCount, componentNames, frontmatter: tokensFrontmatter, bodyParseError } =
    parseTokensJson(tokensContent);

  // Body parse error is a BLOCKER (malformed JSON must not crash gate, but must fail)
  if (bodyParseError) {
    findings.push({
      checkId: "5b-tokens-parse-001",
      status: "fail",
      evidence: `tokens.json body parse error: ${bodyParseError}`,
    });
    hasBlocker = true;
    return buildResult(hasBlocker, findings, frostBlockers);
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

  // ── Step 3: Component-tier token count + Frost recurrence check (D-61, D-70) ──
  if (componentCount === 0) {
    // WARNING: no components found (vacuously satisfies Frost check — nothing to promote)
    // T-03-03-02: if no component-tier tokens exist, Frost check is vacuously satisfied.
    findings.push({
      checkId: "5b-component-001",
      status: "fail",
      evidence:
        "No component-tier tokens found in design/tokens.json. " +
        "Add tokens under the 'component' group to register promoted components.",
    });
  } else {
    // D-61/D-70: Frost recurrence hard BLOCKER check (Phase 3)
    // Count occurrences of each promoted component across wireframes/ + interactions/
    const recurrenceCounts = await countComponentRecurrences(designDir, componentNames);

    for (const [name, count] of recurrenceCounts) {
      if (count < 3) {
        // BLOCKER: component appears fewer than 3× — FID-06 threshold not met
        const frostFinding = {
          checkId: "5b-frost-002",
          status: "fail",
          evidence:
            `Component '${name}' appears ${count}× across wireframes and interaction specs — ` +
            `requires ≥3 per Frost atomic design discipline (FID-06). ` +
            `Ensure '${name}' appears in at least 3 wireframes or interaction specs before promotion.`,
          citation: "FID-06",
        };
        frostBlockers.push(frostFinding);
        findings.push(frostFinding);
      }
    }

    // If all components meet threshold, record pass finding
    if (frostBlockers.length === 0) {
      findings.push({
        checkId: "5b-frost-pass-001",
        status: "pass",
        evidence:
          `All ${componentCount} promoted component(s) appear ≥3× across wireframes and interaction specs. ` +
          `Frost recurrence requirement (FID-06, D-61) satisfied.`,
        citation: "D-61",
      });
    }
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
      return buildResult(hasBlocker, findings, frostBlockers);
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

  return buildResult(hasBlocker, findings, frostBlockers);
}

// ─────────────────────────────────────────────────────────────────────────────
// Result builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the final GateResult from accumulated findings.
 *
 * Priority (schema violations take precedence over Frost):
 * 1. Any non-Frost BLOCKER → failed_after_repair (reason: 'schema-violation')
 * 2. Frost-only BLOCKER → failed_after_repair (reason: 'frost-recurrence-not-met')
 * 3. Otherwise → pass_with_warnings (evidence:'proto')
 *
 * D-70: When Frost is the SOLE blocker (no schema/evidence violations),
 * the reason is 'frost-recurrence-not-met'. When schema violations also exist,
 * they take priority with reason 'schema-violation' (both findings still present).
 *
 * @param {boolean} hasBlocker - true if any non-Frost blocker was found
 * @param {Array<{checkId: string, status: string, evidence?: string, citation?: string}>} findings
 * @param {Array<{checkId: string, status: string, evidence?: string, citation?: string}>} frostBlockers
 * @returns {import("../../schemas/src/gate-result.js").GateResultType}
 */
function buildResult(hasBlocker, findings, frostBlockers) {
  // Schema violations take priority over Frost (findings include both)
  if (hasBlocker) {
    return {
      kind: "failed_after_repair",
      reason: "schema-violation",
      findings,
    };
  }

  // D-70: Frost-only BLOCKER → specific reason 'frost-recurrence-not-met'
  if (frostBlockers.length > 0) {
    return {
      kind: "failed_after_repair",
      reason: "frost-recurrence-not-met",
      findings,
    };
  }

  return {
    kind: "pass_with_warnings",
    evidence: "proto",
    findings,
    warnings: [
      "Stage 5b gate: all checks passed. Full VALIDATED grade requires designer review " +
        "and explicit evidence upgrade from 'proto' to 'validated'.",
    ],
  };
}
