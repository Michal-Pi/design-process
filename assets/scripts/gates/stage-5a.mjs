// assets/scripts/gates/stage-5a.mjs
// Stage 5a (Hi-Fi / Interaction-complete) gate.
// GATE-07 + GATE-08: hardcoded not_runnable when design/interactions/ is
// empty or missing. This is the codex §16 BLOCKER fix — must work from day one.
//
// D-60 Phase 3: when interactions/ has ≥1 .spec.md file, run the full
// 4-condition checklist (runFullStage5aChecklist). The not_runnable path
// is preserved for empty/missing interactions/ (backward compat with v2.0a).
//
// Source: CONTEXT.md D-09, D-10, D-25, D-26, D-60; PLAN.md Task 1 action
// Source: complete-design-mrd-v2.md §16 (codex §16 BLOCKER fix)
// Implements: GATE-07 (not_runnable required from day one), GATE-08, D-60 (Phase 3 full gate)

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { parseChecklist } from "./_parse-checklist.mjs";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { globby } from "globby";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const CHECKLIST_PATH = join(ROOT, "references/gates/stage-5a.md");

// ─────────────────────────────────────────────────────────────────────────────
// Full Stage 5a checklist (D-60) — 4 conditions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the full Stage 5a checklist when interactions/ is non-empty.
 * Returns pass or pass_with_warnings depending on which conditions fail.
 *
 * Conditions (D-60):
 * 1. Every sitemap route has a corresponding .spec.md in interactions/
 * 2. design/wireframes/STAR/CHOICE.md exists for at least one screen
 * 3. design/tokens.json exists and has valid DTCG structure
 * 4. tokens.json frontmatter: stage must be '5a' (not '5a-lite'); evidence must be 'proto' or 'validated'
 *
 * T-03-03-01: Validate designDir exists before readdir. Use join() for sub-paths.
 *
 * @param {string} designDir - Path to the design directory (validated by caller)
 * @param {string[]} specFiles - Non-empty array of .spec.md file names in interactions/
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
async function runFullStage5aChecklist(designDir, specFiles) {
  /** @type {Array<{checkId: string, status: string, evidence?: string}>} */
  const findings = [];

  // ── Condition 1: Every sitemap route has a corresponding .spec.md ──────────
  const sitemapPath = join(designDir, "ia", "sitemap.json");
  if (existsSync(sitemapPath)) {
    let sitemap;
    try {
      const raw = await readFile(sitemapPath, "utf8");
      sitemap = JSON.parse(raw);
    } catch (err) {
      findings.push({
        checkId: "5a-sitemap-parse-001",
        status: "fail",
        evidence: `design/ia/sitemap.json parse error: ${err.message}. Ensure sitemap.json is valid JSON.`,
      });
      sitemap = null;
    }

    if (sitemap && Array.isArray(sitemap.routes)) {
      // Build set of spec file stems (e.g., 'login' from 'login.spec.md')
      const specStems = new Set(
        specFiles.map((f) => f.replace(/\.spec\.md$/, ""))
      );

      for (const route of sitemap.routes) {
        const routeId = route.id ?? route.path?.replace(/\//g, "-").replace(/^-/, "") ?? "";
        if (routeId && !specStems.has(routeId)) {
          // Also check for path-based match (e.g., '/login' → 'login')
          const pathStem = route.path?.replace(/^\//, "").replace(/\//g, "-") ?? "";
          if (!specStems.has(pathStem)) {
            findings.push({
              checkId: "5a-coverage-001",
              status: "fail",
              evidence: `Sitemap route '${routeId}' (path: ${route.path ?? "?"}) has no matching .spec.md in design/interactions/. ` +
                `Add design/interactions/${routeId}.spec.md to achieve full Stage 5a coverage.`,
            });
          }
        }
      }
    }
  }
  // If no sitemap exists, skip coverage check (vacuously satisfied — no routes to cover)

  // ── Condition 2: wireframes/*/CHOICE.md exists for ≥1 screen ─────────────
  const wireframesDir = join(designDir, "wireframes");
  const choiceFiles = existsSync(wireframesDir)
    ? await globby(["wireframes/*/CHOICE.md"], {
        cwd: designDir,
        absolute: false,
      })
    : [];

  if (choiceFiles.length === 0) {
    findings.push({
      checkId: "5a-choice-001",
      status: "fail",
      evidence:
        "No design/wireframes/*/CHOICE.md files found. " +
        "Stage 5a requires at least one screen to have a wireframe choice recorded. " +
        "Run the lowfi/converge atom to generate CHOICE.md for each screen.",
    });
  }

  // ── Condition 3+4: tokens.json exists, DTCG-valid, stage:'5a', evidence:'proto'|'validated' ──
  const tokensPath = join(designDir, "tokens.json");
  if (!existsSync(tokensPath)) {
    findings.push({
      checkId: "5a-tokens-001",
      status: "fail",
      evidence:
        "design/tokens.json not found. " +
        "Stage 5a requires a DTCG-valid tokens.json with stage:'5a' and evidence:'proto' or 'validated'. " +
        "Run the style workflow (Stage 5a) to generate tokens.json.",
    });
  } else {
    let tokensContent;
    try {
      tokensContent = await readFile(tokensPath, "utf8");
    } catch (err) {
      findings.push({
        checkId: "5a-tokens-read-001",
        status: "fail",
        evidence: `Failed to read design/tokens.json: ${err.message}`,
      });
      tokensContent = null;
    }

    if (tokensContent !== null) {
      let tokensFrontmatter = {};
      let tokensBody = null;
      try {
        const parsed = matter(tokensContent);
        tokensFrontmatter = parsed.data ?? {};
        const bodyContent = parsed.content?.trim();
        if (bodyContent) {
          tokensBody = JSON.parse(bodyContent);
        }
      } catch (err) {
        findings.push({
          checkId: "5a-tokens-parse-001",
          status: "fail",
          evidence: `design/tokens.json parse error: ${err.message}. ` +
            "Ensure tokens.json has valid YAML frontmatter and JSON body.",
        });
      }

      // Condition 4a: stage must be '5a' (not '5a-lite')
      const stage = tokensFrontmatter.stage;
      if (stage && stage !== "5a") {
        findings.push({
          checkId: "5a-stage-marker-001",
          status: "fail",
          evidence:
            `design/tokens.json frontmatter has stage:'${stage}'. ` +
            "Stage 5a full gate requires stage:'5a' (not '5a-lite' or other values). " +
            "Update the tokens.json frontmatter to stage:'5a' after completing the full style workflow.",
        });
      }

      // Condition 4b: evidence must be 'proto' or 'validated' (D-60).
      // INFERRED is the lite-mode trust level (D-51 Stage 5b systematize output).
      // The full gate MUST NOT accept INFERRED as evidence — it is insufficient for
      // Stage 5a promotion. Only 'proto' (LLM-generated, unreviewed) or 'validated'
      // (human-reviewed) are acceptable at the full gate.
      // 5a-evidence-trust-001: canonical check for evidence trust level enforcement.
      const evidence = tokensFrontmatter.evidence;
      if (evidence === "INFERRED") {
        // Full-gate rejection: INFERRED is the lite-mode trust level; not acceptable here.
        findings.push({
          checkId: "5a-evidence-trust-001",
          status: "fail",
          evidence:
            `design/tokens.json frontmatter has evidence:'INFERRED'. ` +
            "The Stage 5a full gate requires evidence:'proto' or 'validated' (D-60). " +
            "INFERRED is the lite-mode trust level (Stage 5b systematize) and must not pass " +
            "the full Stage 5a gate. Update tokens.json evidence to 'proto' after running the " +
            "full style workflow, or to 'validated' after human review.",
        });
      } else if (evidence && evidence !== "proto" && evidence !== "validated") {
        findings.push({
          checkId: "5a-evidence-001",
          status: "fail",
          evidence:
            `design/tokens.json frontmatter has evidence:'${evidence}'. ` +
            "Stage 5a full gate expects evidence:'proto' or 'validated'. " +
            "Update after human validation of the token set.",
        });
      }

      // Basic DTCG structure check — must have at least one token group
      if (tokensBody !== null && typeof tokensBody === "object") {
        const topLevelKeys = Object.keys(tokensBody).filter((k) => !k.startsWith("$"));
        if (topLevelKeys.length === 0) {
          findings.push({
            checkId: "5a-tokens-empty-001",
            status: "fail",
            evidence:
              "design/tokens.json body has no token groups. " +
              "A valid DTCG tokens.json must have at least one non-metadata group (e.g., 'primitive', 'semantic', 'component').",
          });
        }
      }
    }
  }

  // ── Build result ──────────────────────────────────────────────────────────
  const failFindings = findings.filter((f) => f.status === "fail");

  if (failFindings.length === 0) {
    return {
      kind: "pass",
      evidence: "proto",
      findings,
    };
  }

  return {
    kind: "pass_with_warnings",
    evidence: "proto",
    findings,
    warnings: failFindings.map(
      (f) => `[${f.checkId}] ${f.evidence ?? "check failed"}`
    ),
  };
}

/**
 * Run the Stage 5a gate against a design directory.
 *
 * GATE-07 + GATE-08: If design/interactions/ does not exist OR is empty,
 * return not_runnable with reason 'stage-4-artifacts-absent'.
 * This is the codex §16 BLOCKER fix — stage 5a cannot run before stage 4
 * has produced interaction specifications.
 *
 * D-60 Phase 3: When interactions/ has ≥1 .spec.md file, run the full
 * Stage 5a checklist (4 conditions). Returns pass or pass_with_warnings.
 *
 * @param {string} designDir - Path to the design directory (parent of interactions/)
 * @returns {Promise<import("../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage5aGate(designDir) {
  const interactionsDir = join(designDir, "interactions");

  // GATE-07 + GATE-08: Refuse to run if stage 4 artifacts are absent.
  // This is a day-one terminal state, NOT a failure — it means prerequisites
  // are absent. Per Pitfall F: not_runnable is distinct from failed_after_repair.
  if (!existsSync(interactionsDir)) {
    return {
      kind: "not_runnable",
      reason: "stage-4-artifacts-absent",
    };
  }

  const entries = await readdir(interactionsDir);
  // Filter out hidden files like .gitkeep — real artifacts only
  const realFiles = entries.filter((f) => !f.startsWith("."));

  if (realFiles.length === 0) {
    return {
      kind: "not_runnable",
      reason: "stage-4-artifacts-absent",
    };
  }

  // Filter to only .spec.md files (D-60: only spec files count as stage 4 artifacts)
  const specFiles = realFiles.filter((f) => f.endsWith(".spec.md"));

  if (specFiles.length === 0) {
    return {
      kind: "not_runnable",
      reason: "stage-4-artifacts-absent",
    };
  }

  // D-60: run full checklist when interactions/ is non-empty (Phase 3)
  return runFullStage5aChecklist(designDir, specFiles);
}
