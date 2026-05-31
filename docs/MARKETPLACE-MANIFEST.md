# MARKETPLACE-MANIFEST.md — design-os v2.0 GA

Structured submission data for all 8 marketplaces (DIST-07).
Owner: copy-paste per-marketplace fields into each submission form.
Estimated time: ~90 minutes for all 8 (manual cross-post; ref OQ-10).

**Status legend:** `[ ]` = not yet submitted | `[x]` = submitted

---

## Common fields (shared across all marketplaces)

**Package name:** `design-os`
**Version:** `2.0.0`
**License:** Apache-2.0
**GitHub URL:** https://github.com/Michal-Pi/design-process
**Install (GA — no tag needed):** `npm install -g design-os`
**Short description (≤200 chars):**
> Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

**Keywords / tags:** `claude-code`, `agentskills`, `skill-md`, `design-system`, `5-stage-design`, `garrett-spine`, `design-tokens`, `dtcg`, `stage-gated`, `design-os`

---

## 1. skills.sh

- **Status:** `[ ]` submitted
- **Submission URL:** https://skills.sh (submit form)
- **Format:** SKILL.md package listing

### Title
design-os — 5-stage design process for AI coding agents

### Short description (use verbatim)
Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

### Long description
design-os scaffolds the full Garrett 5-plane design spine (Strategy → Scope → Structure → Skeleton → Surface) inside the coding agent you already use. Unlike tools that jump straight to hi-fi generation, design-os walks each stage with validation gates in between — so AI-assisted prototypes don't collapse at production scale.

**Intellectual heritage (cited, not endorsed):** Garrett 5-plane spine, Torres Opportunity Solution Tree, Klement JTBD, Indi Young thinking-styles, Rosenfeld IA vocabulary, W3C DTCG v2025.10 design token spec, Google DESIGN.md April 2026 spec.

**What it generates:**
- Stage 1: Research personas (JTBD + OST), PROTO-grade with provenance tracking
- Stage 2: Sitemap JSON + Mermaid user-flow diagrams
- Stage 3: Excalidraw wireframe JSON (low-fi, not hi-fi)
- Stage 4: Mermaid stateDiagram-v2 + XState v5 machines (async + ≥3-state flows)
- Stage 5: DTCG v2025.10 tokens.json + Google DESIGN.md contract

**Quality gates between every stage.** Each gate returns a `(terminal-state, evidence-grade)` tuple. If a gate fails, design-os stops and explains why — it does not silently proceed.

**Host-first Claude Code + sequential-fallback Codex CLI + Cursor.**
Sampled parity verified: trigger recall delta ≤0.10 across all three hosts.

**OSS Apache-2.0.** 1,395 tests. 15-fixture acceptance corpus.

### Category
Design tools / Workflow automation / AI assistant skills

### Install instructions
```bash
# Via skill installer (recommended — installs into .claude/skills/)
design-os

# Or npm global
npm install -g design-os
```

### Demo / screenshot
[GTM-02 video link — to be added after recording]

---

## 2. claudemarketplaces.com

- **Status:** `[ ]` submitted
- **Submission URL:** https://claudemarketplaces.com (submit form)
- **Format:** Claude skill listing

### Title
design-os — AI-assisted design process with stage gates

### Short description (use verbatim)
Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

### Long description
design-os brings structured design discipline to your Claude Code workflow. The `audit` command reviews existing prototypes and surfaces slop-tells — the tells that signal an AI jumped straight to hi-fi without running a proper discovery and IA phase.

**7 routes for every design scenario:**
- `new-product` — full 5-stage design from a PRD
- `new-feature` — feature-scoped design starting from Stage 1
- `design-bug` — Stage 5a token/visual regression touch-up
- `brand-refresh` — token and surface refresh
- `PR-audit` — audit a PR for Stage 5a/5b design regressions
- `mature-app-refactor` — fill IA + IxD gaps in an existing product
- `DS-extraction` — Lovable/v0/Bolt refugee path: reverse-engineer stage artifacts from a prototype

**Evidence-graded provenance.** Every artifact carries `VALIDATED / PROTO / INFERRED / MISSING` status. No silent synthetic-persona substitution.

**Deterministic CI gates.** `design-os verify --golden` catches output drift in CI. LLM "picks"; scripts emit.

**Accessibility checks built in.** `axe-runner.mjs` gate reports measured WCAG 2.2 AA contrast values on generated token examples. Does not claim WCAG conformance — reports measured values only.

### Install
```bash
npm install -g design-os
```

---

## 3. mcpmarket.com

- **Status:** `[ ]` submitted
- **Submission URL:** https://mcpmarket.com (submit form)
- **Format:** Tool / agent skill listing

> **Note to reviewer:** design-os is a **SKILL.md package** (agentskills.io v1 spec), not an MCP server.
> It does not implement the Model Context Protocol. It runs inside Claude Code, Codex CLI, or Cursor
> as a skill — not as a separate server process. If mcpmarket.com lists agent skills alongside MCP
> tools, submit under "agent skills" or "workflow skills" category.

### Title
design-os — 5-stage design process skill for Claude Code / Codex / Cursor

### Short description (use verbatim)
Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

### Long description
design-os is a SKILL.md agent skill (not an MCP server) that brings the full Garrett design process to AI coding agents. Installed once via `npm install -g design-os`, it becomes available as the `design` skill in Claude Code, Codex CLI, or Cursor.

**Deterministic CI gates + 15-fixture acceptance corpus.** 1,395 unit tests. Schema migration guard (protects against breaking artifact format changes). Golden test harness (`design-os verify --golden`) for byte-identical output verification.

**What distinguishes this from hi-fi AI tools:** design-os enforces the stage sequence. Stage 3 wireframes must pass a gate before Stage 4 interaction design begins. Stage 5 tokens must resolve OKLCH contrast before DESIGN.md emits. No shortcuts.

### Category
Agent skills / Design tools / Workflow

### Install
```bash
npm install -g design-os
```

---

## 4. smithery.ai

- **Status:** `[ ]` submitted
- **Submission URL:** https://smithery.ai (CLI or web form)
- **Format:** Agent skill / tool listing

### Title
design-os

### Short description (use verbatim)
Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

### Long description
design-os operationalizes the Garrett 5-plane design spine as a stage-gated AI workflow. Evidence-graded provenance (`VALIDATED / PROTO / INFERRED / MISSING`) means every artifact carries its epistemic status — AI-generated personas are marked `PROTO`, not promoted to `VALIDATED` without real user research data.

**Why this matters for AI-assisted product teams:**
1. AI tools skip Stage 1-3 and produce hi-fi screens from a brief. This works until the product ships and users don't use it.
2. design-os forces the discovery → IA → wireframe → interaction → token sequence with gates between each stage.
3. The `audit` command reverse-engineers stage artifacts from an existing prototype (the "Lovable refugee" path for teams who built first and want to design retroactively).

**Technical provenance:**
- W3C DTCG v2025.10 token format
- Google DESIGN.md April 2026 spec (Apache-2.0)
- `$extensions.design-os` namespace carries structured provenance metadata

### Install
```bash
npm install -g design-os
```

---

## 5. lobehub

- **Status:** `[ ]` submitted
- **Submission URL:** https://lobehub.com (plugin/skill marketplace, web form)
- **Format:** Plugin / skill listing

### Title
design-os — Garrett 5-stage design process, AI-assisted

### Short description (use verbatim)
Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

### Long description
design-os makes AI-assisted design rigorous. Instead of jumping straight to components and mockups (the Claude Design / Stitch / Lovable approach), design-os runs the full Garrett spine:

1. **Discover** — personas (JTBD + Torres OST), thinking-styles analysis
2. **Structure** — sitemap JSON + Mermaid user flows
3. **Sketch** — Excalidraw wireframe JSON (low-fi)
4. **Interact** — Mermaid stateDiagram-v2 + XState machines
5. **Style + Systematize** — DTCG v2025.10 tokens + Google DESIGN.md contract

**Interoperability with Claude Design / Stitch:** Run design-os for Stages 1-4; use Claude Design for Stage 5a hi-fi visual polish; bring the DESIGN.md token contract back into your Tailwind v4 `@theme` block.

**Compatible with:** Claude Code (host-first), Codex CLI, Cursor (sequential-fallback). Apache-2.0.

### Install
```bash
npm install -g design-os
```

---

## 6. fastmcp.me

- **Status:** `[ ]` submitted
- **Submission URL:** https://fastmcp.me (web form)
- **Format:** Agent skill / tool listing

> **Note to reviewer:** design-os is a **SKILL.md package** (agentskills.io v1 spec), not an MCP server.
> It does not use the Model Context Protocol. It runs natively inside Claude Code, Codex CLI, and Cursor
> as an agent skill. If fastmcp.me lists non-MCP agent skills, submit under "agent skills" category.

### Title
design-os — Host-agnostic design process skill (Claude Code + Codex + Cursor)

### Short description (use verbatim)
Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

### Long description
design-os is a SKILL.md agent skill that runs inside Claude Code (host-first), Codex CLI, and Cursor (sequential-fallback) with sampled parity verified: trigger recall delta ≤0.10 across all three hosts.

**The skill installs once and works everywhere:**
```bash
npm install -g design-os
# Then in any supported agent: "design --route new-product"
```

**7 named routes.** ROUTE-08 compliance: no `--route` flag → design-os asks before running (never silently runs all 5 stages).

**Stage budgets (p50):** new-product ≤150k tokens total, per-stage ceilings independent (stages do not donate unused budget).

Apache-2.0. 1,395 tests. No MCP server required.

### Install
```bash
npm install -g design-os
```

---

## 7. playbooks.com

- **Status:** `[ ]` submitted
- **Submission URL:** https://playbooks.com (web form)
- **Format:** Workflow / playbook listing

### Title
design-os — Complete 5-stage design playbook for AI coding agents

### Short description (use verbatim)
Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

### Long description
design-os is the operational playbook for running design-before-build discipline inside an AI coding agent. Each "stage" is a validated step with explicit criteria for when to move forward.

**The full walkthrough:**

**Stage 1 — Discover (≤30k tokens):** Personas from JTBD + Torres OST, not synthetic invention. `provenance: PROTO` if no user data; gate blocks VALIDATED grade.

**Stage 2 — Structure (≤25k tokens):** Sitemap JSON + Mermaid user-flow diagrams. Gate checks: every page has a `type`, every critical path is mapped.

**Stage 3 — Sketch (≤25k tokens):** Excalidraw wireframe JSON. Gate checks: no hi-fi visual styling (color, shadows, gradients blocked at low-fi stage).

**Stage 4 — Interact (≤30k tokens):** Mermaid stateDiagram-v2 machines for every screen with ≥2 states. XState v5 for async flows. Gate checks: every terminal state named, every error path handled.

**Stage 5 — Style + Systematize (≤35k tokens):** DTCG v2025.10 tokens.json (primitive → semantic → component tiers) + Google DESIGN.md April 2026 contract. Contrast measurement reported (not claimed compliant).

**PR-audit route:** Add `design-os audit --pr` to any CI pipeline to gate on Stage 5a/5b design regressions in code review.

### Install
```bash
npm install -g design-os
```

---

## 8. Tessl Registry

- **Status:** `[ ]` submitted
- **Submission URL:** https://registry.tessl.io (web form or CLI — verify current URL)
- **Format:** Agent skill / package listing

### Title
design-os

### Short description (use verbatim)
Run the 5-stage design process: research personas, structure IA, sketch wireframes, design interactions, tokenize. Use for new-product, new-feature, design-audit, brand-refresh, design-bug.

### Long description
design-os packages the canonical 5-stage design process as an agent skill for Claude Code, Codex CLI, and Cursor. The package enforces the Garrett spine — discovery and IA before low-fi, low-fi before interaction design, interaction design before token emission and DESIGN.md.

**Technical highlights for engineering-focused reviewers:**
- Zod 4 schemas for all artifact boundaries (persona JSON, sitemap JSON, DESIGN.md, DTCG tokens)
- Golden test harness: `design-os verify --golden` — deterministic script output is byte-identical across runs
- Schema migration guard: breaking artifact format changes are detected in CI (`schema-migration-guard.mjs`)
- `PR-audit` route: `design-os audit --pr` for CI integration — gate on design regressions in code review
- 1,395 unit tests (vitest); 15-fixture acceptance corpus; 300 adversarial fixtures

**DESIGN.md interop:** design-os emits `$extensions.design-os` namespace in every DESIGN.md output — structured provenance metadata that tracks which stage produced which artifact.

**License:** Apache-2.0. Repo: https://github.com/Michal-Pi/design-process

### Install
```bash
npm install -g design-os
```

---

## Submission checklist

Before submitting to each marketplace, verify:

- [ ] Version shown is `2.0.0` (Wave B Step 0 npm @latest flip confirmed)
- [ ] Install command is `npm install -g design-os` (no `@beta` tag — GA is now @latest)
- [ ] GitHub repo is public (Wave B Step 0 prerequisite)
- [ ] GTM-02 demo video recorded and URL available (add to "Demo / screenshot" fields)
- [ ] No WCAG conformance claims in any submission copy (use "reports measured WCAG 2.2 AA contrast values")
- [ ] mcpmarket.com and fastmcp.me: note SKILL.md vs MCP distinction in submission

---

*Generated: 2026-05-31 | Source: DIST-07 + OQ-10 decision (manual cross-post ~90 min)*
