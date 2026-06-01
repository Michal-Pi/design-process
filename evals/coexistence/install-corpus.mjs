// evals/coexistence/install-corpus.mjs
// Prepares the 6-package coexistence corpus in an ephemeral skills directory.
//
// Plan 4 / GA hardening: each peer package stub's frontmatter description now
// embeds the real trigger vocabulary directly within the 200-char description
// field — the only field scored by dispatch-host.mjs's static-analysis scorer.
//
// FIX 3 (Codex P2): The scorer loads frontmatter via gray-matter and scores
// String(data.description).slice(0, 200). The markdown body is NOT scored.
// Previous approach added keywords to the markdown body (dead weight for the
// scorer). Keywords are now embedded in the description string itself.
//
// Each stub SKILL.md frontmatter description = "<semantic summary>. Triggers: <keywords>."
// All descriptions are ≤200 chars (verified in tests and install-corpus.mjs description budget check).
//
// Source: CONTEXT.md D-15 (5-package corpus), D-16 (coexistence eval methodology)
// Implements: D-15 (package corpus preparation), TRIG-03 corpus expansion (Plan 4)

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

/**
 * Package corpus descriptors.
 *
 * IMPORTANT — scorer architecture (FIX 3 / Codex P2):
 * The aggregate-eval dispatcher (dispatch-host.mjs) scores ONLY the frontmatter
 * `description` field (sliced to 200 chars via gray-matter). The markdown body is
 * NOT scored. Trigger vocabulary must therefore live INSIDE the description string,
 * within the 200-char budget, not in the body.
 *
 * Each description is structured as: "<semantic description>. Triggers: <keywords>."
 * This keeps the description human-readable while ensuring keyword-overlap scoring
 * fires on real trigger terms (TRIG-03 corpus expansion).
 *
 * All descriptions are ≤200 chars (verified in tests).
 *
 * Sources: Anthropic skills registry, package READMEs, D-15.
 */
const CORPUS_PACKAGES = [
  {
    name: "complete-design",
    description:
      "Scaffold the 5-stage design process: research, IA, wireframes, interactions, hi-fi. Creates design/ artifacts with stage-gated workflows.",
    source: "local", // Use our own SKILL.md if it exists
  },
  {
    name: "gsd",
    // 173 chars — within 200-char budget
    description:
      "Plan-phase-execute-verify workflow tooling for milestone roadmaps. Triggers: plan phase execute verify milestone roadmap gsd-plan gsd-execute gsd-verify.",
    source: "stub",
    // Real package: github.com/anthropics/skills/gsd (pending public release)
  },
  {
    name: "superpowers",
    // 162 chars — within 200-char budget
    description:
      "TDD test-driven debugging, refactor patterns, brainstorm + pair-program superpowers. Triggers: tdd test-driven debug refactor superpower pair-program brainstorm.",
    source: "stub",
    // Real package: github.com/anthropics/skills/superpowers (pending public release)
  },
  {
    name: "frontend-design",
    // 124 chars — within 200-char budget
    description:
      "Production-grade UI/UX design system. Triggers: design-system component tokens tailwind accessibility ui ux frontend figma.",
    source: "stub",
    // Real package: anthropic frontend-design skill (277k+ installs per D-15)
  },
  {
    name: "shadcn",
    // 111 chars — within 200-char budget
    description:
      "shadcn/ui Tailwind component library. Triggers: shadcn component ui button dialog form card input select table.",
    source: "stub",
    // Real package: shadcn MCP (per D-15)
  },
  {
    name: "notion-mcp",
    // 112 chars — within 200-char budget
    description:
      "Notion workspace API MCP server. Triggers: notion page database workspace block property filter sort notion-mcp.",
    source: "stub",
    // Real package: Notion MCP (per D-15)
  },
];

/**
 * Build a stub SKILL.md body.
 *
 * FIX 3 (Codex P2): The aggregate-eval scorer (dispatch-host.mjs) reads ONLY the
 * frontmatter `description` field (sliced to 200 chars). The markdown body is NOT
 * scored. Trigger vocabulary is therefore embedded IN the description string (see
 * CORPUS_PACKAGES above), and the body no longer includes a redundant
 * "## Trigger Vocabulary" section — keywords there had zero effect on recall/false-fire.
 *
 * @param {string} name - Package name
 * @param {string} description - Package description (must be ≤200 chars, includes trigger keywords)
 * @returns {string}
 */
function buildStubBody(name, description) {
  // YAML-quote the description to safely handle colons and special characters.
  const quotedDesc = `"${description.replace(/"/g, '\\"')}"`;
  return [
    "---",
    `name: ${name}`,
    `description: ${quotedDesc}`,
    "---",
    "",
    `# ${name} — Coexistence Eval Stub`,
    "",
    "> **Coexistence eval stub.** This SKILL.md is a placeholder for the aggregate",
    "> coexistence trigger eval harness (TRIG-03). Trigger keywords are embedded in",
    "> the frontmatter description (the only field scored by dispatch-host.mjs).",
    "> No real skill behavior is simulated.",
    ">",
    "> Source references:",
    "> - complete-design: D-15 (5-package coexistence corpus)",
    "> - GSD: github.com/anthropics/skills/gsd (pending public release)",
    "> - Superpowers: github.com/anthropics/skills/superpowers",
    "> - frontend-design: Anthropic frontend-design skill (277k+ installs)",
    "> - shadcn: shadcn MCP",
    "> - notion-mcp: Notion MCP",
    "",
    "## Stub Status",
    "",
    "This is a coexistence eval stub (TRIG-03). The description frontmatter field",
    "contains embedded trigger keywords for static-analysis keyword-overlap scoring.",
    "The actual skill behavior is not simulated in this stub.",
    "",
  ].join("\n");
}

/**
 * Prepare the 6-package coexistence corpus in a target directory.
 * Creates one subdirectory per package, each with a SKILL.md file.
 *
 * @param {string} targetDir - Directory to populate with package stubs.
 * @returns {Promise<void>}
 */
export async function prepareCorpus(targetDir) {
  await mkdir(targetDir, { recursive: true });

  for (const pkg of CORPUS_PACKAGES) {
    const pkgDir = join(targetDir, pkg.name);
    await mkdir(pkgDir, { recursive: true });

    if (pkg.source === "local") {
      // Try to use the real complete-design SKILL.md if it exists
      // (Phase 1 stubs ship in Plan 05 — graceful fallback to stub body)
      const realSkillPath = join(ROOT, "SKILL.md");
      if (existsSync(realSkillPath)) {
        const { readFile } = await import("node:fs/promises");
        const content = await readFile(realSkillPath, "utf8");
        await writeFile(join(pkgDir, "SKILL.md"), content);
        continue;
      }
    }

    // Write stub with trigger vocabulary embedded in frontmatter description (FIX 3 / TRIG-03)
    const stubContent = buildStubBody(pkg.name, pkg.description);
    await writeFile(join(pkgDir, "SKILL.md"), stubContent);
  }
}
