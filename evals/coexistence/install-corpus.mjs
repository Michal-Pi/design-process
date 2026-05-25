// evals/coexistence/install-corpus.mjs
// Prepares the 6-package coexistence corpus in an ephemeral skills directory.
//
// Phase 1: description-only stubs for all 5 coexisting packages + design-os.
// Real-package installation is a Plan 4 / GA hardening step.
//
// Each stub SKILL.md mirrors the real package's frontmatter description and
// contains a Phase-1 stub body explaining that real behavior is not simulated.
//
// Source: CONTEXT.md D-15 (5-package corpus), D-16 (coexistence eval methodology)
// Implements: D-15 (package corpus preparation)

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
  },
  {
    name: "gsd",
    description:
      "Get-Shit-Done: orchestrates multi-phase software projects with plan, execute, and review workflows. Manages roadmaps, milestones, and phases.",
    source: "stub",
    // Real package: github.com/anthropics/skills/gsd (pending public release)
  },
  {
    name: "superpowers",
    description:
      "Engineering discipline for TDD, debugging, code review, and verification. Test-driven development with red-green-refactor cycles.",
    source: "stub",
    // Real package: github.com/anthropics/skills/superpowers (pending public release)
  },
  {
    name: "frontend-design",
    description:
      "Frontend design quality review: design tokens, component architecture, CSS patterns, color contrast, typography, spacing systems, and visual polish.",
    source: "stub",
    // Real package: anthropic frontend-design skill (277k+ installs per D-15)
  },
  {
    name: "shadcn",
    description:
      "shadcn/ui component management: install, add, and configure shadcn components. Manages components/ui/ directory and Tailwind integration.",
    source: "stub",
    // Real package: shadcn MCP (per D-15)
  },
  {
    name: "notion-mcp",
    description:
      "Notion MCP: query, create, and update Notion pages and databases. Manages Notion workspace content, databases, and properties.",
    source: "stub",
    // Real package: Notion MCP (per D-15)
  },
];

const STUB_BODY_TEMPLATE = (name, description) => {
  // YAML-quote the description to safely handle colons and special characters.
  const quotedDesc = `"${description.replace(/"/g, '\\"')}"`;
  return `---
name: ${name}
description: ${quotedDesc}
---

# ${name} — Phase 1 Stub

> **Phase 1 stub.** This SKILL.md is a description-only placeholder for
> the coexistence trigger eval harness.
>
> **Real-package installation is a Plan 4 / GA hardening step.**
> Phase 1 evaluates trigger recall using the package description's keyword
> overlap (static-analysis fallback per A2 assumption in dispatch-host.mjs).
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

## Phase 1 Status

This is a **description-only stub** for the Phase 1 coexistence eval.
The actual skill behavior is not simulated. The trigger-recall measurement
in Phase 1 uses keyword-overlap scoring against the description above.

Real-package stubs will be replaced with actual SKILL.md content in Plan 4
(GA hardening) once the public eval interface for Claude Code is finalized.
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

    // Write description-only stub
    const stubContent = STUB_BODY_TEMPLATE(pkg.name, pkg.description);
    await writeFile(join(pkgDir, "SKILL.md"), stubContent);
  }
}
