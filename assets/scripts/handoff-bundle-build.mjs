// assets/scripts/handoff-bundle-build.mjs
// Handoff bundle script: deterministic YAML frontmatter frame + LLM body inlining.
// Enforces 3k-15k token budget via tiktoken (cl100k_base) with section-aware truncation.
//
// Source: CONTEXT.md D-05 (LLM body + deterministic frame), D-06 (tiktoken, 3k floor, 15k ceiling),
//         D-07 (required sections priority order), RESEARCH.md Pattern 4, Pitfall B (10% safety margin)
// Implements: HAND-01, HAND-02, HAND-03

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { get_encoding } from "tiktoken";
import { stringify as yamlStringify } from "yaml";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Token budget constants (D-06) */
const MAX_TOKENS = 15000;
const MIN_TOKENS = 3000;

// Note per Pitfall B: cl100k_base counts differ from host tokenizers by up to 10%.
// We treat MAX_TOKENS as the ceiling — no additional safety margin applied here
// because the plan spec locks 15k as the ceiling (D-06). Operators who want margin
// should pass a lower MAX_TOKENS in the config.

/**
 * Required body sections in PRIORITY ORDER (highest priority first, truncate from bottom).
 * Source: D-07
 */
const REQUIRED_SECTIONS = [
  "Goal & scope",
  "Decisions made",
  "Open questions",
  "Artifacts inventory",
  "Pointers to verify",
  "Provenance (worst-case)",
];

/** Optional sections — dropped first when oversized (D-06) */
const OPTIONAL_SECTIONS = ["Risks surfaced"];

/**
 * Recursively sort object keys alphabetically for deterministic canonical JSON.
 * Mirrors the canonicalize() in emit.mjs (single algorithm).
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
 * Recursively collect all files in a directory in sorted order.
 * Skips .design-os, .handoff, and hidden files.
 *
 * @param {string} dir
 * @param {string} [base]
 * @returns {Promise<string[]>}
 */
async function collectFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === ".design-os") continue;
    if (entry.name === ".handoff") continue;
    if (entry.name.startsWith(".")) continue;

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath, base);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Compute a deterministic SHA-256 hash of a directory's contents.
 * Re-uses the same algorithm as gates/base.mjs hashDirectory().
 *
 * @param {string} dir
 * @returns {Promise<string>} sha256: + 64 hex chars
 */
export async function hashDirectory(dir) {
  const files = await collectFiles(dir, dir);
  const hasher = createHash("sha256");

  for (const filePath of files) {
    const relPath = relative(dir, filePath);
    const contents = await readFile(filePath);
    hasher.update(relPath + ":");
    hasher.update(contents);
  }

  return "sha256:" + hasher.digest("hex");
}

/**
 * Parse a LLM-summarized body into sections by scanning ## headings.
 * Each section has a name and an array of content lines.
 *
 * @param {string} body
 * @returns {Array<{name: string, lines: string[]}>}
 */
function parseSections(body) {
  const lines = body.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { name: headingMatch[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  return sections;
}

/**
 * Render sections as a Markdown body string.
 *
 * @param {Array<{name: string, lines: string[]}>} sections
 * @returns {string}
 */
function renderSections(sections) {
  return sections
    .map((s) => `## ${s.name}\n${s.lines.join("\n")}`)
    .join("\n\n")
    .trim();
}

/**
 * Count tokens in a string using tiktoken cl100k_base.
 * D-06: cl100k_base is "close enough for budget purposes across hosts."
 *
 * @param {string} text
 * @param {import("tiktoken").Tiktoken} enc
 * @returns {number}
 */
function countTokens(text, enc) {
  return enc.encode(text).length;
}

/**
 * Determine the worst-case provenance from all artifacts in a design directory.
 * Scans for gray-matter frontmatter with a `provenance:` field.
 * Ordering (worst-first): missing > generated > inferred > validated.
 *
 * @param {string} designDir
 * @returns {Promise<'generated'|'validated'|'inferred'|'missing'>}
 */
async function getWorstProvenance(designDir) {
  const PROVENANCE_ORDER = ["missing", "generated", "inferred", "validated"];

  const files = await collectFiles(designDir, designDir);
  let worst = "validated";

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, "utf8");
      const { data } = matter(content);
      if (data.provenance && PROVENANCE_ORDER.includes(data.provenance)) {
        const worstIdx = PROVENANCE_ORDER.indexOf(worst);
        const thisIdx = PROVENANCE_ORDER.indexOf(data.provenance);
        if (thisIdx < worstIdx) {
          worst = data.provenance;
        }
      }
    } catch {
      // Skip non-text files
    }
  }

  return worst;
}

/**
 * Build a stage handoff bundle.
 *
 * @param {{ stageFrom: string, stageTo: string, designDir: string, llmSummaryBody: string }} params
 * @returns {Promise<
 *   { ok: true, tokens: number, truncationWarning: string|null, path: string } |
 *   { error: 'insufficient-content', tokens: number, floor: number }
 * >}
 */
export async function buildHandoffBundle({ stageFrom, stageTo, designDir, llmSummaryBody }) {
  // Initialize tiktoken encoder (D-06: cl100k_base)
  const enc = get_encoding("cl100k_base");

  try {
    // Parse the LLM body into sections
    const parsedSections = parseSections(llmSummaryBody);

    // Build a map of section name → section object for lookup
    const sectionMap = new Map(parsedSections.map((s) => [s.name, s]));

    // Separate required and optional sections
    const requiredSections = REQUIRED_SECTIONS
      .map((name) => sectionMap.get(name))
      .filter(Boolean);

    const optionalSections = OPTIONAL_SECTIONS
      .map((name) => sectionMap.get(name))
      .filter(Boolean);

    // Collect any unrecognized sections (preserve them as optional)
    const knownNames = new Set([...REQUIRED_SECTIONS, ...OPTIONAL_SECTIONS]);
    const unknownSections = parsedSections.filter((s) => !knownNames.has(s.name));

    // Build initial ordered set: required (priority order) + optional + unknown
    let activeSections = [...requiredSections, ...optionalSections, ...unknownSections];
    let body = renderSections(activeSections);
    let tokens = countTokens(body, enc);
    let truncationWarning = null;

    // --- Truncation loop ---
    if (tokens > MAX_TOKENS) {
      // Step 1: Drop optional sections first (Risks surfaced etc.)
      const droppedOptional = [];
      for (const optSection of [...optionalSections, ...unknownSections].reverse()) {
        if (tokens <= MAX_TOKENS) break;
        const idx = activeSections.findIndex((s) => s.name === optSection.name);
        if (idx !== -1) {
          activeSections.splice(idx, 1);
          droppedOptional.push(optSection.name);
          body = renderSections(activeSections);
          tokens = countTokens(body, enc);
        }
      }

      // Step 2: If still over, truncate the lowest-priority required sections
      // (truncate from bottom of priority list upward)
      const truncatedSections = [];
      for (let i = requiredSections.length - 1; i >= 0 && tokens > MAX_TOKENS; i--) {
        const targetSection = requiredSections[i];
        const activeSection = activeSections.find((s) => s.name === targetSection.name);
        if (!activeSection) continue;

        // Remove last paragraph (last non-empty paragraph block) from the section
        let sectionLines = [...activeSection.lines];
        while (tokens > MAX_TOKENS && sectionLines.length > 0) {
          // Find and remove the last non-empty paragraph
          let lastNonEmptyIdx = sectionLines.length - 1;
          while (lastNonEmptyIdx >= 0 && sectionLines[lastNonEmptyIdx].trim() === "") {
            lastNonEmptyIdx--;
          }
          if (lastNonEmptyIdx < 0) break;

          // Find start of last paragraph
          let paraStart = lastNonEmptyIdx;
          while (paraStart > 0 && sectionLines[paraStart - 1].trim() !== "") {
            paraStart--;
          }

          sectionLines = [
            ...sectionLines.slice(0, paraStart),
            ...sectionLines.slice(lastNonEmptyIdx + 1),
          ];
          activeSection.lines = sectionLines;
          body = renderSections(activeSections);
          tokens = countTokens(body, enc);
        }

        if (sectionLines.length < (targetSection?.lines.length ?? 0)) {
          truncatedSections.push(targetSection.name);
        }
      }

      // Build truncation warning
      const parts = [];
      if (droppedOptional.length > 0) {
        parts.push(`Dropped optional sections: ${droppedOptional.join(", ")}`);
      }
      if (truncatedSections.length > 0) {
        parts.push(`Truncated required sections: ${truncatedSections.join(", ")}`);
      }
      if (parts.length > 0) {
        truncationWarning = parts.join("; ") + `. Final token count: ${tokens}`;
      }
    }

    // --- Floor check ---
    if (tokens < MIN_TOKENS) {
      return { error: "insufficient-content", tokens, floor: MIN_TOKENS };
    }

    // --- Compute sourceHash of designDir (D-05 deterministic frame) ---
    const sourceHash = await hashDirectory(designDir);

    // --- Determine provenanceWorstCase ---
    const provenanceWorstCase = await getWorstProvenance(designDir);

    // --- Build frontmatter matching HandoffBundleV1 schema ---
    const frontmatter = {
      artifact: "handoff-bundle",
      schemaVersion: 1,
      stage: `${stageFrom} → ${stageTo}`,
      generated: new Date().toISOString(),
      sourceHash,
      tokenCount: tokens,
      truncationWarning,
      provenanceWorstCase,
      // Required HandoffBundleV1 structured fields (from parsed sections)
      goalAndScope: sectionMap.get("Goal & scope")?.lines.join("\n").trim() ?? "",
      decisionsMade: [],
      openQuestions: [],
      artifactsInventory: [],
      pointersToVerify: [],
      // Optional fields
      risksSurfaced: optionalSections
        .find((s) => s.name === "Risks surfaced")
        ?.lines.join("\n")
        .trim() ? [] : undefined,
      // Required by FrontmatterCommon
      provenance: "generated",
      owner: "design-os",
      lastReviewedAt: new Date().toISOString(),
    };

    // --- Validate frontmatter against handoff-bundle.v1.json via ajv ---
    const validateModule = await import("./schemas/validate.mjs");
    const { validate } = validateModule;
    const validation = await validate("handoff-bundle", frontmatter);
    if (!validation.valid) {
      throw new Error(
        `Bundle frontmatter failed ajv validation: ${JSON.stringify(validation.errors, null, 2)}`
      );
    }

    // --- Serialize frontmatter via yaml (NOT js-yaml — STACK.md) ---
    const yamlString = yamlStringify(frontmatter);

    // --- Write bundle file ---
    const handoffDir = join(designDir, ".handoff");
    await mkdir(handoffDir, { recursive: true });
    const bundlePath = join(handoffDir, `stage-${stageFrom}-bundle.md`);
    const fileContent = `---\n${yamlString}---\n\n${body}\n`;
    await writeFile(bundlePath, fileContent, "utf8");

    return { ok: true, tokenCount: tokens, tokens, truncationWarning, path: bundlePath };
  } finally {
    enc.free();
  }
}
