// evals/runners/dispatch-host.mjs
// Host dispatch adapter for skillgrade and coexistence eval harnesses.
//
// A2 ASSUMPTION NOTE (from RESEARCH.md):
//   There is no public eval/headless mode API for Claude Code, Codex CLI, or
//   Cursor as of May 2026. This module ships a TEST-MODE adapter with a static-
//   analysis fallback that matches prompts against each skill's frontmatter
//   `description` trigger words.
//
//   When CLAUDE_CODE_BIN environment variable is set, the adapter attempts to
//   use Claude Code's headless eval mode (best-effort). The exact CLI args for
//   headless eval mode are documented here but may not yet be finalized by
//   Anthropic — a clear TODO is left for when the public eval interface ships.
//
//   The static-analysis fallback is documented as a BASELINE measurement, not
//   a production eval. Replace with real host dispatch when a public eval mode
//   becomes available.
//
// Interface:
//   dispatchToHost({ prompt, ephemeralSkillsDir }) → { firedSkill: string|null, trace: [{skill, score}] }
//
// Source: CONTEXT.md host_dispatch_contract; PLAN.md Task 2 action
// Implements: D-22 (host-matrix dispatch), A2 assumption documentation

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { globby } from "globby";
import matter from "gray-matter";
import { execSync } from "node:child_process";

// Word stem cache (simple prefix-based stemming for performance)
const stemCache = new Map();

/**
 * Simple word stemmer: lowercase + remove trailing s/es/ing/ed.
 * Not linguistically perfect but good enough for trigger-word matching.
 * @param {string} word
 * @returns {string}
 */
function stem(word) {
  const lower = word.toLowerCase();
  if (stemCache.has(lower)) return stemCache.get(lower);

  let stemmed = lower;
  if (stemmed.endsWith("ing")) stemmed = stemmed.slice(0, -3);
  else if (stemmed.endsWith("ed")) stemmed = stemmed.slice(0, -2);
  else if (stemmed.endsWith("es")) stemmed = stemmed.slice(0, -2);
  else if (stemmed.endsWith("s")) stemmed = stemmed.slice(0, -1);

  stemCache.set(lower, stemmed);
  return stemmed;
}

/**
 * Tokenize text into stemmed lowercase words.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(stem);
}

/**
 * Score a prompt against a skill description using trigger-keyword overlap.
 * Implements the DIST-03 weighting: first 100 chars of description weighted 2×.
 * @param {string} prompt
 * @param {string} description - Skill frontmatter description (≤200 chars).
 * @returns {number} Overlap score (higher = better match)
 */
function scoreMatch(prompt, description) {
  const promptTokens = new Set(tokenize(prompt));

  // DIST-03: first 100 chars weighted 2×
  const highPriority = tokenize(description.slice(0, 100));
  const rest = tokenize(description.slice(100));

  let score = 0;
  for (const token of highPriority) {
    if (promptTokens.has(token)) score += 2;
  }
  for (const token of rest) {
    if (promptTokens.has(token)) score += 1;
  }

  return score;
}

/**
 * Load all SKILL.md files in an ephemeral skills directory.
 * @param {string} ephemeralSkillsDir
 * @returns {Promise<Array<{name: string, description: string, filePath: string}>>}
 */
async function loadSkills(ephemeralSkillsDir) {
  const skillFiles = await globby(["**/SKILL.md", "**/*.skill.md"], {
    cwd: ephemeralSkillsDir,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const skills = [];
  for (const filePath of skillFiles) {
    try {
      const content = await readFile(filePath, "utf8");
      const { data } = matter(content);
      if (data.name && data.description) {
        skills.push({
          name: String(data.name),
          description: String(data.description).slice(0, 200),
          filePath,
        });
      }
    } catch {
      // Skip malformed SKILL.md files
    }
  }

  return skills;
}

/**
 * Static-analysis fallback dispatch.
 * Loads SKILL.md files from ephemeralSkillsDir, scores each against the prompt,
 * and returns the highest-scoring skill (or null if no skills found).
 *
 * @param {string} prompt
 * @param {string} ephemeralSkillsDir
 * @returns {Promise<{ firedSkill: string | null, trace: Array<{skill: string, score: number}> }>}
 */
async function staticAnalysisFallback(prompt, ephemeralSkillsDir) {
  const skills = await loadSkills(ephemeralSkillsDir);

  if (skills.length === 0) {
    return { firedSkill: null, trace: [] };
  }

  const trace = skills.map(({ name, description }) => ({
    skill: name,
    score: scoreMatch(prompt, description),
  }));

  // Sort by score descending
  trace.sort((a, b) => b.score - a.score);

  const best = trace[0];
  // Only fire if the best match has a non-zero score
  const firedSkill = best && best.score > 0 ? best.skill : null;

  return { firedSkill, trace };
}

/**
 * Dispatch a prompt to the host and return which skill fired.
 *
 * @param {{ prompt: string, ephemeralSkillsDir: string }} params
 * @returns {Promise<{ firedSkill: string | null, trace?: Array<{skill: string, score: number}> }>}
 */
export async function dispatchToHost({ prompt, ephemeralSkillsDir }) {
  const claudeCodeBin = process.env.CLAUDE_CODE_BIN;

  if (claudeCodeBin && existsSync(claudeCodeBin)) {
    // TODO: Replace with real Claude Code eval/headless mode when the public API ships.
    // As of May 2026, there is no public headless eval API for Claude Code (A2 assumption).
    // The intended call shape (when available) would be:
    //
    //   claude-code eval --headless --skills-dir <ephemeralSkillsDir> \
    //     --prompt <prompt> --output json
    //
    // For now, fall through to the static-analysis fallback with a warning.
    console.warn(
      "[dispatch-host] CLAUDE_CODE_BIN set but headless eval API not yet finalized (A2 assumption). Using static-analysis fallback."
    );
  }

  // Static-analysis fallback — baseline per A2 assumption
  return staticAnalysisFallback(prompt, ephemeralSkillsDir);
}
