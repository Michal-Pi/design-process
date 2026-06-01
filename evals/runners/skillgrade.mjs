#!/usr/bin/env node
// evals/runners/skillgrade.mjs
// Per-skill trigger eval harness — "skillgrade"-style.
//
// A2 ASSUMPTION NOTE:
//   Anthropic introduced the skillgrade pattern in skill-creator (2026) but there
//   is no standalone npm 'skillgrade' package as of May 2026. This is an in-tree
//   implementation designed to migrate to Anthropic's eval framework when it ships
//   externally. See STACK.md under "skillgrade-style trigger harness".
//
// Algorithm (D-17):
//   For each shouldFire prompt: dispatch 3 trials. Mark as HIT if ANY trial fires
//   the target skill. recall = hits / total.shouldFire.
//   For each shouldNotFire prompt: dispatch 3 trials. Mark as FALSE-FIRE if ANY
//   trial fires the target skill. falseFireRate = falseFires / total.shouldNotFire.
//   pass = recall >= 0.85 && falseFireRate <= 0.15.
//
// Usage:
//   tsx evals/runners/skillgrade.mjs --skill design --triggers evals/triggers/design/triggers.yaml
//   tsx evals/runners/skillgrade.mjs --skill design --triggers ... --skills-dir .test-skills/
//
// Source: CONTEXT.md D-17; RESEARCH.md "Skillgrade-Style Harness Skeleton (D-17)"
// Implements: TRIG-01 (per-skill trigger eval), TRIG-02 (CI gates: recall ≥0.85, false-fire ≤0.15)

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { dispatchToHost } from "./dispatch-host.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

/** Number of trials per prompt (D-17). */
const TRIALS = 3;

/** Minimum recall to pass (D-17). */
const RECALL_THRESHOLD = 0.85;

/** Maximum false-fire rate to pass (D-17). */
const FALSE_FIRE_THRESHOLD = 0.15;

/**
 * Run the skillgrade harness for a single skill.
 *
 * @param {object} opts
 * @param {string} opts.skill - Skill name (e.g., 'design').
 * @param {string} opts.triggersPath - Path to triggers.yaml for this skill.
 * @param {string} [opts.skillsDir] - Directory containing SKILL.md files to dispatch against.
 *   Defaults to a temp dir with a stub SKILL.md for the target skill.
 * @returns {Promise<{ skill: string, recall: number, falseFireRate: number, pass: boolean, trials: number }>}
 */
export async function runSkillgrade({ skill, triggersPath, skillsDir }) {
  // Load triggers
  const rawYaml = await readFile(triggersPath, "utf8");
  const triggers = parseYaml(rawYaml);

  const shouldFire = triggers.shouldFire ?? [];
  const shouldNotFire = triggers.shouldNotFire ?? [];

  // Resolve skills directory (or create a stub for this skill)
  let ephemeralSkillsDir = skillsDir;
  let needsCleanup = false;

  if (!ephemeralSkillsDir) {
    // Create a minimal ephemeral skills dir with a stub SKILL.md for the target skill
    ephemeralSkillsDir = join(ROOT, `.test-skills-${skill}-${Date.now()}`);
    await mkdir(ephemeralSkillsDir, { recursive: true });
    needsCleanup = true;

    // Write a stub SKILL.md for the target skill.
    // Description must be YAML-quoted to handle colons and special chars.
    const skillDescription = getSkillDescription(skill);
    const quotedDesc = `"${skillDescription.replace(/"/g, '\\"')}"`;
    await writeFile(
      join(ephemeralSkillsDir, "SKILL.md"),
      `---\nname: ${skill}\ndescription: ${quotedDesc}\n---\n\n# ${skill} skill stub\n`
    );
  }

  try {
    // === RECALL: shouldFire prompts ===
    let hits = 0;

    for (const { prompt } of shouldFire) {
      let fired = false;

      for (let t = 0; t < TRIALS; t++) {
        const { firedSkill } = await dispatchToHost({
          prompt,
          ephemeralSkillsDir,
        });
        if (firedSkill === skill) {
          fired = true;
          break; // Any 1-of-3 fire counts as hit (D-17)
        }
      }

      if (fired) hits++;
    }

    // === FALSE-FIRE RATE: shouldNotFire prompts ===
    let falseFires = 0;

    for (const { prompt } of shouldNotFire) {
      let fired = false;

      for (let t = 0; t < TRIALS; t++) {
        const { firedSkill } = await dispatchToHost({
          prompt,
          ephemeralSkillsDir,
        });
        if (firedSkill === skill) {
          fired = true;
          break; // Any 1-of-3 fire counts as false-fire (D-17)
        }
      }

      if (fired) falseFires++;
    }

    const recall = shouldFire.length > 0 ? hits / shouldFire.length : 0;
    const falseFireRate =
      shouldNotFire.length > 0 ? falseFires / shouldNotFire.length : 0;
    const pass =
      recall >= RECALL_THRESHOLD && falseFireRate <= FALSE_FIRE_THRESHOLD;

    return {
      skill,
      recall,
      falseFireRate,
      pass,
      trials: TRIALS,
    };
  } finally {
    if (needsCleanup) {
      const { rm } = await import("node:fs/promises");
      await rm(ephemeralSkillsDir, { recursive: true, force: true });
    }
  }
}

/**
 * Get a skill-appropriate description for stub SKILL.md generation.
 * Used when no skillsDir is provided to runSkillgrade.
 *
 * Phase 2 descriptions added (Plan 02-05 SC-5): each description is trigger-phrase
 * front-loaded per D-32 to achieve ≥0.85 recall in the static-analysis fallback.
 *
 * @param {string} skill
 * @returns {string}
 */
function getSkillDescription(skill) {
  const descriptions = {
    // Phase 1 skills
    design:
      "Scaffold the 5-stage design process: research, IA, wireframes, interactions, hi-fi. Creates design/ artifacts with stage-gated workflows.",
    audit:
      "Audit existing design artifacts or UI for design slop, fidelity violations, accessibility issues, and missing design system compliance.",
    handoff:
      "Build a handoff bundle compressing stage output into a context-efficient format for downstream stage consumption.",
    // Phase 2 skills (Plan 02-05 SC-5 — trigger-phrase front-loaded per D-32)
    "complete-design/ingest":
      "Ingest PRD or launch Lenny 1-pager interview; emit design/PRD.md with frontmatter and stage-0 handoff bundle.",
    "complete-design/discover":
      "Design research: generate user personas, synthesize job stories, build OST from PRD, understand target users for Stage 1.",
    "complete-design/structure":
      "Structure IA: create sitemap variants, generate user flows from JTBD, validate Stage 2 structural gate.",
    "complete-design/style":
      "Style Stage 5a: DTCG token generation, palette selection, shadcn/Tailwind v4 adapter projection, variant preview.",
    "complete-design/systematize":
      "Systematize Stage 5b: promote recurring components to design system, emit DESIGN.md contract.",
    "complete-design/audit":
      "Audit review design artifacts: slop-tells linter, PR diff check, rainbow gradient detection, design token review; emits AUDIT-REPORT.md.",
  };
  return descriptions[skill] ?? `${skill} skill`;
}

// Run when invoked directly.
const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("skillgrade.mjs"));

if (isMain) {
  const skillIdx = process.argv.indexOf("--skill");
  const triggersIdx = process.argv.indexOf("--triggers");
  const skillsDirIdx = process.argv.indexOf("--skills-dir");

  if (skillIdx === -1 || triggersIdx === -1) {
    console.error(
      "Usage: tsx skillgrade.mjs --skill <name> --triggers <path> [--skills-dir <path>]"
    );
    process.exit(1);
  }

  const skill = process.argv[skillIdx + 1];
  const triggersPath = process.argv[triggersIdx + 1];
  const skillsDir =
    skillsDirIdx !== -1 ? process.argv[skillsDirIdx + 1] : undefined;

  const result = await runSkillgrade({ skill, triggersPath, skillsDir });

  console.log(JSON.stringify(result, null, 2));

  if (!result.pass) {
    console.error(
      `\nskillgrade: FAIL — ${skill}: recall=${result.recall.toFixed(3)}, falseFireRate=${result.falseFireRate.toFixed(3)}`
    );
    process.exit(1);
  } else {
    console.log(
      `\nskillgrade: PASS — ${skill}: recall=${result.recall.toFixed(3)}, falseFireRate=${result.falseFireRate.toFixed(3)}`
    );
    process.exit(0);
  }
}
