// assets/scripts/gates/stage-2.mjs
// Stage 2 (Information Architecture / Sitemap) gate — real business logic.
// Phase 2: fills in the Phase 1 skeleton with JTBD coverage, FID-02 enforcement,
// orphan-node check, and Mermaid syntax validation.
//
// Source: CONTEXT.md D-39, D-40; PLAN.md T-02-02-A
// Implements: GATE-08, FID-02, D-39, D-40

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import { globby } from "globby";
import { renderMermaidFile } from "../mermaid-render.mjs";

/**
 * Styling fields that are forbidden in sitemap nodes (FID-02).
 * Any node carrying these fields triggers a BLOCKER-level gate failure.
 */
const STYLING_FIELDS_COLOR = ["color", "backgroundColor", "fill", "stroke", "style"];
const STYLING_FIELDS_FONT = ["font", "fontFamily", "fontSize", "fontWeight"];

/**
 * Detect FID-02 violations — styling fields on sitemap nodes.
 * Returns an array of finding objects (one per field category).
 *
 * @param {Array<{id: string, scheme: string, nodes: Array<Record<string, unknown>>}>} variants
 * @returns {Array<{checkId: string, status: string, evidence: string, citation: string}>}
 */
function checkFidelityCap(variants) {
  const colorViolations = new Set();
  const fontViolations = new Set();

  for (const variant of variants) {
    for (const node of variant.nodes ?? []) {
      for (const field of STYLING_FIELDS_COLOR) {
        if (Object.prototype.hasOwnProperty.call(node, field)) {
          colorViolations.add(field);
        }
      }
      for (const field of STYLING_FIELDS_FONT) {
        if (Object.prototype.hasOwnProperty.call(node, field)) {
          fontViolations.add(field);
        }
      }
    }
  }

  const findings = [];

  if (colorViolations.size > 0) {
    findings.push({
      checkId: "2-fidelity-001",
      status: "fail",
      evidence:
        `FID-02 violation: sitemap node contains color/visual styling field(s): ` +
        `${[...colorViolations].join(", ")}. ` +
        `Stage 2 IA artifacts must be text-structure only — no colors or visual styling.`,
      citation: "FID-02",
    });
  }

  if (fontViolations.size > 0) {
    findings.push({
      checkId: "2-fidelity-002",
      status: "fail",
      evidence:
        `FID-02 violation: sitemap node contains font/typography field(s): ` +
        `${[...fontViolations].join(", ")}. ` +
        `Stage 2 IA artifacts must be text-structure only — no typography styling.`,
      citation: "FID-02",
    });
  }

  return findings;
}

/**
 * Extract JTBD slugs from the stage-1 handoff bundle.
 * Reads artifactsInventory to find paths matching research/jobs/*.jtbd.md.
 *
 * @param {string} designDir
 * @returns {Promise<string[]>} Array of JTBD slugs (lowercase, from filename)
 */
async function extractJtbdSlugs(designDir) {
  const bundlePath = join(designDir, ".handoff", "stage-1-bundle.md");
  if (!existsSync(bundlePath)) return [];

  try {
    const raw = await readFile(bundlePath, "utf8");
    const { data } = matter(raw);
    const inventory = data.artifactsInventory ?? [];

    const slugs = [];
    for (const item of inventory) {
      const p = item.path ?? "";
      // Match: research/jobs/<slug>.jtbd.md
      if (p.includes("jobs/") && p.endsWith(".jtbd.md")) {
        const fname = basename(p, ".jtbd.md");
        slugs.push(fname.toLowerCase());
      }
    }
    return slugs;
  } catch {
    return [];
  }
}

/**
 * Check that every JTBD slug is represented by at least one node label
 * (case-insensitive substring match) across all sitemap variants.
 *
 * @param {string[]} jtbdSlugs
 * @param {Array<{nodes: Array<{label: string}>}>} variants
 * @returns {string[]} Array of uncovered JTBD slugs
 */
function findUncoveredJtbds(jtbdSlugs, variants) {
  const allLabels = variants
    .flatMap((v) => v.nodes ?? [])
    .map((n) => (n.label ?? "").toLowerCase());

  return jtbdSlugs.filter((slug) => {
    // A JTBD is "covered" if any node label contains the slug
    return !allLabels.some((label) => label.includes(slug));
  });
}

/**
 * Find orphan nodes: nodes that are not the root,
 * have no parent field, and have no children pointing to them.
 *
 * Algorithm:
 * - nodesWithParent: set of node IDs that DO have a parent field
 * - nodesPointedAt: set of node IDs that appear as parent in other nodes
 * - rootId: the single node that is NOT in nodesWithParent but IS in nodesPointedAt,
 *   OR (fallback) the first node without a parent if no node is pointed at
 * - Orphans: nodes not in nodesWithParent, not the root, and not in nodesPointedAt
 *
 * @param {Array<{id: string, label?: string, parent?: string}>} nodes
 * @returns {string[]} Array of orphan node ids
 */
function findOrphanNodes(nodes) {
  if (nodes.length === 0) return [];

  const nodesWithParent = new Set(
    nodes.filter((n) => n.parent != null).map((n) => n.id)
  );
  const nodesPointedAt = new Set(
    nodes.filter((n) => n.parent != null).map((n) => n.parent)
  );

  // Natural root: no parent, but is pointed at
  const rootCandidates = nodes.filter(
    (n) => !nodesWithParent.has(n.id) && nodesPointedAt.has(n.id)
  );
  const naturalRoot =
    rootCandidates.length > 0
      ? rootCandidates[0]
      : nodes.find((n) => !nodesWithParent.has(n.id));

  const rootId = naturalRoot?.id;

  return nodes
    .filter(
      (n) =>
        n.id !== rootId &&
        !nodesWithParent.has(n.id) &&
        !nodesPointedAt.has(n.id)
    )
    .map((n) => n.id);
}

/**
 * Validate a Mermaid .mmd file by attempting to render it.
 * Uses a temp output path; treats any render error as invalid.
 *
 * @param {string} mmdPath - Absolute path to the .flow.mmd file
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateMermaidFile(mmdPath) {
  const tempOut = join(
    tmpdir(),
    `stage2-gate-${createHash("sha256").update(mmdPath).digest("hex").slice(0, 8)}.svg`
  );
  try {
    await renderMermaidFile(mmdPath, tempOut);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Run the Stage 2 gate against a design directory.
 *
 * Gate checks (D-40):
 * 1. design/ia/sitemap.json must exist → not_runnable if absent
 * 2. FID-02: no styling fields (color, font, etc.) on any sitemap node
 *    → failed_after_repair (BLOCKER) if any found
 * 3. JTBD coverage: every JTBD from stage-1 bundle appears in sitemap node labels
 *    → pass_with_warnings with finding '2-coverage-001' if missing
 * 4. Orphan node: no nodes that are not root, have no parent, and have no children
 *    → pass_with_warnings with finding '2-orphan-001' if found
 * 5. Mermaid validity: all design/ia/flows/*.flow.mmd files render without errors
 *    → failed_after_repair with finding '2-mermaid-001' if any fail
 * 6. Evidence: always evidence:'proto' in v2.0a (no tree-test data)
 *
 * @param {string} designDir - Path to the design directory (containing ia/sitemap.json)
 * @param {object} [config] - Optional configuration (currently unused)
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage2Gate(designDir, config = {}) {
  // ── Step 1: Check sitemap.json exists ──────────────────────────────────────
  const sitemapPath = join(designDir, "ia", "sitemap.json");
  if (!existsSync(sitemapPath)) {
    return {
      kind: "not_runnable",
      reason: "no-sitemap-found",
    };
  }

  // ── Step 2: Parse sitemap JSON ─────────────────────────────────────────────
  let sitemap;
  try {
    const raw = await readFile(sitemapPath, "utf8");
    sitemap = JSON.parse(raw);
  } catch {
    return {
      kind: "not_runnable",
      reason: "sitemap-parse-error",
    };
  }

  const variants = sitemap.variants ?? [];

  // ── Step 3: FID-02 check ───────────────────────────────────────────────────
  // This is a BLOCKER — any styling field immediately returns failed_after_repair
  const fidelityFindings = checkFidelityCap(variants);
  if (fidelityFindings.length > 0) {
    return {
      kind: "failed_after_repair",
      reason: "fidelity-cap-violation",
      findings: fidelityFindings,
    };
  }

  // Accumulate non-blocking findings for later
  /** @type {Array<{checkId: string, status: string, evidence?: string, citation?: string}>} */
  const findings = [];

  // ── Step 4: JTBD coverage check ───────────────────────────────────────────
  const jtbdSlugs = await extractJtbdSlugs(designDir);
  if (jtbdSlugs.length > 0) {
    const uncovered = findUncoveredJtbds(jtbdSlugs, variants);
    if (uncovered.length > 0) {
      findings.push({
        checkId: "2-coverage-001",
        status: "fail",
        evidence:
          `JTBD coverage gap: ${uncovered.length} job(s) not represented in sitemap nodes. ` +
          `Missing: ${uncovered.join(", ")}. ` +
          `Each JTBD should map to at least one navigable section.`,
        citation: "D-39",
      });
    }
  }

  // ── Step 5: Orphan node check ─────────────────────────────────────────────
  for (const variant of variants) {
    const orphans = findOrphanNodes(variant.nodes ?? []);
    if (orphans.length > 0) {
      findings.push({
        checkId: "2-orphan-001",
        status: "fail",
        evidence:
          `Orphan node(s) detected in variant '${variant.id}': ${orphans.join(", ")}. ` +
          `Nodes must either be the root, have a parent, or have at least one child.`,
        citation: "D-40",
      });
      break; // one finding per gate run, not per variant
    }
  }

  // ── Step 6: Mermaid validity check ────────────────────────────────────────
  const flowFiles = await globby("ia/flows/*.flow.mmd", {
    cwd: designDir,
    absolute: true,
  });

  for (const flowFile of flowFiles) {
    const { valid, error } = await validateMermaidFile(flowFile);
    if (!valid) {
      // Any invalid Mermaid → failed_after_repair
      // (retry cycles are the workflow's responsibility, not the gate's)
      return {
        kind: "failed_after_repair",
        reason: "mermaid-syntax-error",
        findings: [
          ...findings,
          {
            checkId: "2-mermaid-001",
            status: "fail",
            evidence:
              `Mermaid syntax error in ${basename(flowFile)}: ${error ?? "render failed"}. ` +
              `Fix the flowchart syntax and re-run the gate. ` +
              `The structure workflow allows 2 LLM repair cycles before halting.`,
            citation: "D-40",
          },
        ],
      };
    }
  }

  // ── Step 7: pass_with_warnings (evidence: proto) ──────────────────────────
  // v2.0a never returns evidence:'validated' — that requires tree-test data (v2.1)
  return {
    kind: "pass_with_warnings",
    evidence: "proto",
    findings,
    warnings: [
      "No tree-test data — VALIDATED grade requires ia/tree-test-design atom (v2.1). " +
        "Current evidence grade: proto.",
    ],
  };
}
