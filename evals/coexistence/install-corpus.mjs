// evals/coexistence/install-corpus.mjs
// Prepares the 6-package coexistence corpus in an ephemeral skills directory.
//
// Plan 4 / GA hardening: each peer package stub now includes real trigger
// vocabulary drawn from each package's documented trigger keywords. This
// expands the static-analysis keyword-overlap scoring surface beyond the
// Phase 1 description-only stubs, improving aggregate recall measurement.
//
// Each stub SKILL.md mirrors the real package's frontmatter description AND
// embeds the real trigger vocabulary in the stub body so the keyword-overlap
// dispatch path (A2 assumption: static-analysis fallback) scores correctly.
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
 * Each entry mirrors the real package's frontmatter description (≤200 chars).
 * Sources: Anthropic skills registry, package READMEs, D-15.
 */
const CORPUS_PACKAGES = [
  {
    name: "design-os",
    description:
      "Scaffold the 5-stage design process: research, IA, wireframes, interactions, hi-fi. Creates design/ artifacts with stage-gated workflows.",
    source: "local", // Use our own SKILL.md if it exists
    triggerVocabulary: [], // design-os uses its own real SKILL.md
  },
  {
    name: "gsd",
    description:
      "Get-Shit-Done: orchestrates multi-phase software projects with plan, execute, and review workflows. Manages roadmaps, milestones, and phases.",
    source: "stub",
    // Real package: github.com/anthropics/skills/gsd (pending public release)
    // Trigger vocabulary sourced from GSD skill documentation (Plan 4 GA hardening, TRIG-03)
    triggerVocabulary: [
      "plan", "phase", "execute", "verify", "milestone", "roadmap",
      "gsd-plan", "gsd-execute", "gsd-verify",
    ],
  },
  {
    name: "superpowers",
    description:
      "Engineering discipline for TDD, debugging, code review, and verification. Test-driven development with red-green-refactor cycles.",
    source: "stub",
    // Real package: github.com/anthropics/skills/superpowers (pending public release)
    // Trigger vocabulary sourced from Superpowers skill documentation (Plan 4 GA hardening, TRIG-03)
    triggerVocabulary: [
      "tdd", "test-driven", "debug", "refactor", "superpower",
      "pair-program", "brainstorm",
    ],
  },
  {
    name: "frontend-design",
    description:
      "Frontend design quality review: design tokens, component architecture, CSS patterns, color contrast, typography, spacing systems, and visual polish.",
    source: "stub",
    // Real package: anthropic frontend-design skill (277k+ installs per D-15)
    // Trigger vocabulary sourced from frontend-design skill documentation (Plan 4 GA hardening, TRIG-03)
    triggerVocabulary: [
      "design-system", "component", "tokens", "tailwind", "accessibility",
      "ui", "ux", "frontend", "figma",
    ],
  },
  {
    name: "shadcn",
    description:
      "shadcn/ui component management: install, add, and configure shadcn components. Manages components/ui/ directory and Tailwind integration.",
    source: "stub",
    // Real package: shadcn MCP (per D-15)
    // Trigger vocabulary sourced from shadcn/ui documentation (Plan 4 GA hardening, TRIG-03)
    triggerVocabulary: [
      "shadcn", "component", "ui", "button", "dialog", "form",
      "card", "input", "select", "table",
    ],
  },
  {
    name: "notion-mcp",
    description:
      "Notion MCP: query, create, and update Notion pages and databases. Manages Notion workspace content, databases, and properties.",
    source: "stub",
    // Real package: Notion MCP (per D-15)
    // Trigger vocabulary sourced from Notion MCP documentation (Plan 4 GA hardening, TRIG-03)
    triggerVocabulary: [
      "notion", "page", "database", "workspace", "block",
      "property", "filter", "sort", "notion-mcp",
    ],
  },
];

/**
 * Build a stub SKILL.md body with description + expanded trigger vocabulary.
 * The trigger vocabulary improves keyword-overlap scoring in the static-analysis
 * dispatch fallback (A2 assumption in dispatch-host.mjs), which is the primary
 * mechanism for measuring aggregate coexistence recall (TRIG-03).
 *
 * Plan 4 / GA hardening: stubs now include real trigger keywords so that the
 * static-analysis path can correctly distinguish each skill from design-os
 * (false-fire measurement) and from each other (coverage integrity).
 *
 * @param {string} name - Package name
 * @param {string} description - Package description
 * @param {string[]} triggerVocabulary - Real trigger keywords for this package
 * @returns {string}
 */
const STUB_BODY_TEMPLATE = (name, description, triggerVocabulary = []) => {
  // YAML-quote the description to safely handle colons and special characters.
  const quotedDesc = `"${description.replace(/"/g, '\\"')}"`;
  const triggerSection = triggerVocabulary.length > 0
    ? `\n## Trigger Vocabulary\n\nThis skill is triggered by user requests involving:\n${triggerVocabulary.map(k => `- ${k}`).join('\n')}\n`
    : '';
  return `---
name: ${name}
description: ${quotedDesc}
---

# ${name} — Coexistence Eval Stub

> **Coexistence eval stub.** This SKILL.md is a keyword-expanded placeholder for
> the aggregate coexistence trigger eval harness (TRIG-03).
>
> The stub body contains the package's real trigger vocabulary so the
> static-analysis keyword-overlap dispatch path can accurately measure
> recall and false-fire rate. No real skill behavior is simulated.
>
> Source references:
> - design-os: D-15 (5-package coexistence corpus)
> - GSD: github.com/anthropics/skills/gsd (pending public release)
> - Superpowers: github.com/anthropics/skills/superpowers
> - frontend-design: Anthropic frontend-design skill (277k+ installs)
> - shadcn: shadcn MCP
> - notion-mcp: Notion MCP

## Description

${description}
${triggerSection}
## Stub Status

This is a **keyword-expanded stub** for the coexistence trigger eval (TRIG-03).
The trigger vocabulary above improves static-analysis keyword-overlap accuracy.
The actual skill behavior is not simulated in this stub.
`;
};

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
      // Try to use the real design-os SKILL.md if it exists
      // (Phase 1 stubs ship in Plan 05 — graceful fallback to stub body)
      const realSkillPath = join(ROOT, "SKILL.md");
      if (existsSync(realSkillPath)) {
        const { readFile } = await import("node:fs/promises");
        const content = await readFile(realSkillPath, "utf8");
        await writeFile(join(pkgDir, "SKILL.md"), content);
        continue;
      }
    }

    // Write keyword-expanded stub with real trigger vocabulary (Plan 4 / TRIG-03)
    const stubContent = STUB_BODY_TEMPLATE(pkg.name, pkg.description, pkg.triggerVocabulary);
    await writeFile(join(pkgDir, "SKILL.md"), stubContent);
  }
}
