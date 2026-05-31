#!/usr/bin/env node
// evals/coexistence/aggregate-eval.mjs
// Aggregate coexistence eval harness for design-os + 5 peer packages.
//
// Algorithm (D-15, D-16):
//   1. Install 6-package corpus into .test-skills/ (description-only stubs in Phase 1).
//   2. For each prompt in design-os' shouldFire corpus:
//      dispatch to host → record if design-os skill fired (RECALL).
//   3. For each prompt in the 5 peer packages' shouldFire corpora:
//      dispatch to host → record if design-os skill fired (FALSE-FIRE).
//   4. recall = design-os hits / total design-os shouldFire prompts.
//   5. falseFireRate = design-os fires on peer prompts / total peer prompts.
//   6. pass = recall >= 0.80 && falseFireRate <= 0.15.
//   7. Emit evals/coexistence/last-run.json (sorted keys for determinism).
//
// Phase 1 may report pass: false (Open Q3 — threshold calibrated empirically).
// The harness still runs end-to-end and surfaces the actual number.
// v2.0 GA enables blocking once threshold is calibrated.
//
// Source: CONTEXT.md D-15, D-16; RESEARCH.md "Aggregate Coexistence Eval Methodology"
// Implements: D-15, D-16, TRIG-04 scaffolding

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { tmpdir } from "node:os";
import { prepareCorpus } from "./install-corpus.mjs";
import { dispatchToHost } from "../runners/dispatch-host.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

/** Recall threshold for aggregate coexistence eval (D-16). */
const RECALL_THRESHOLD = 0.80;

/** False-fire threshold (design-os should not fire on peer prompts). */
const FALSE_FIRE_THRESHOLD = 0.15;

/** Coexistence triggers directory. */
const TRIGGERS_DIR = join(ROOT, "evals/coexistence/triggers");

/** Output path for last-run.json. */
const LAST_RUN_PATH = join(ROOT, "evals/coexistence/last-run.json");

/** Peer package names (all except design-os). */
const PEER_PACKAGES = ["gsd", "superpowers", "frontend-design", "shadcn", "notion-mcp"];

/**
 * Recursively sort object keys for deterministic JSON output.
 * @param {unknown} value
 * @returns {unknown}
 */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalize((value)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Load shouldFire prompts from a triggers YAML file.
 * @param {string} pkg - Package name (e.g., 'design-os').
 * @returns {Promise<string[]>}
 */
async function loadShouldFirePrompts(pkg) {
  const trigPath = join(TRIGGERS_DIR, `${pkg}.yaml`);
  if (!existsSync(trigPath)) return [];
  const raw = await readFile(trigPath, "utf8");
  const parsed = parseYaml(raw);
  return (parsed.shouldFire ?? []).map((item) => item.prompt);
}

/**
 * Run the aggregate coexistence eval.
 *
 * @returns {Promise<{
 *   recall: number,
 *   falseFireRate: number,
 *   pass: boolean,
 *   calibrationNote?: string,
 *   designOsHits: number,
 *   designOsTotal: number,
 *   designOsFalseFires: number,
 *   peerTotal: number,
 *   perSkillRecall: Record<string, number>
 * }>}
 */
export async function runAggregateCoexistenceEval() {
  // Prepare corpus in ephemeral directory
  const corpusDir = join(ROOT, ".test-skills");
  await prepareCorpus(corpusDir);

  try {
    // Load design-os shouldFire prompts
    const designOsPrompts = await loadShouldFirePrompts("design-os");

    // Measure RECALL: how often does design-os fire on its own shouldFire prompts?
    // Track per-skill recall (Lesson 5 identity — both count AND identity required).
    let designOsHits = 0;

    for (const prompt of designOsPrompts) {
      const { firedSkill } = await dispatchToHost({
        prompt,
        ephemeralSkillsDir: corpusDir,
      });
      if (firedSkill === "design-os") {
        designOsHits++;
      }
    }

    const recall =
      designOsPrompts.length > 0 ? designOsHits / designOsPrompts.length : 0;

    // Measure FALSE-FIRE RATE: how often does design-os fire on peer package prompts?
    // Also measure per-skill false-fire rate for Lesson 5 identity tracking.
    let peerTotal = 0;
    let designOsFalseFires = 0;

    // perSkillRecall: for each peer package, track how often design-os fires on
    // its prompts (this is the per-skill false-fire identity per Lesson 5).
    // Also track design-os's own recall as 'design-os' key.
    /** @type {Record<string, number>} */
    const perSkillRecall = {
      "design-os": recall,
    };

    for (const pkg of PEER_PACKAGES) {
      const peerPrompts = await loadShouldFirePrompts(pkg);
      peerTotal += peerPrompts.length;

      let pkgFalseFires = 0;
      for (const prompt of peerPrompts) {
        const { firedSkill } = await dispatchToHost({
          prompt,
          ephemeralSkillsDir: corpusDir,
        });
        if (firedSkill === "design-os") {
          designOsFalseFires++;
          pkgFalseFires++;
        }
      }

      // Per-skill false-fire rate: what fraction of this peer's prompts
      // incorrectly fire design-os? (Lower is better; ≤0.15 globally.)
      perSkillRecall[pkg] = peerPrompts.length > 0
        ? pkgFalseFires / peerPrompts.length
        : 0;
    }

    const falseFireRate = peerTotal > 0 ? designOsFalseFires / peerTotal : 0;
    const pass =
      recall >= RECALL_THRESHOLD && falseFireRate <= FALSE_FIRE_THRESHOLD;

    // Build result — includes perSkillRecall for Lesson 5 identity tracking.
    // TRIG-03 status: recall=0.516 at Plan 4 GA flip. Corpus expansion improves
    // this somewhat; full calibration requires live-LLM trigger eval (deferred post-GA).
    const result = {
      calibrationNote: pass
        ? undefined
        : "TRIG-03 gate FAILED: recall below ≥0.80 threshold. " +
          "Plan 4 corpus expansion (real trigger vocabulary) has been applied. " +
          "Current recall reflects static-analysis fallback accuracy. " +
          "Full calibration with live-LLM trigger eval is deferred to post-GA. " +
          "This gate is now blocking (continue-on-error: false) — CI will fail on next push.",
      designOsFalseFires,
      designOsHits,
      designOsTotal: designOsPrompts.length,
      falseFireRate,
      pass,
      peerTotal,
      perSkillRecall,
      recall,
    };

    // Emit last-run.json (sorted keys for determinism)
    const canonical = canonicalize(result);
    await writeFile(LAST_RUN_PATH, JSON.stringify(canonical, null, 2) + "\n");

    return result;
  } finally {
    // Cleanup the ephemeral corpus directory
    await rm(corpusDir, { recursive: true, force: true });
  }
}

// Run when invoked directly.
const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("aggregate-eval.mjs"));

if (isMain) {
  const result = await runAggregateCoexistenceEval();

  console.log("\nAggregate Coexistence Eval Results:");
  console.log(`  design-os recall: ${result.recall.toFixed(3)} (${result.designOsHits}/${result.designOsTotal})`);
  console.log(`  design-os false-fire rate: ${result.falseFireRate.toFixed(3)} (${result.designOsFalseFires}/${result.peerTotal})`);
  console.log(`  pass: ${result.pass}`);

  if (result.calibrationNote) {
    console.log(`\n  Note: ${result.calibrationNote}`);
  }

  console.log(`\nResults written to: ${LAST_RUN_PATH}`);

  // TRIG-03 GA gate: exit 1 when recall < 0.80 (blocking enabled in Plan 4).
  // The aggregate-coexistence.yml workflow now uses continue-on-error: false.
  // Current recall (Plan 4 corpus expansion baseline) = 0.516 — gate WILL fail.
  // This is the correct trust-posture call: honest signal > false confidence.
  process.exit(result.pass ? 0 : 1);
}
