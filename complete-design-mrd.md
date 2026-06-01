# Design-OS — Market Requirements Document

**Version 0.2 — Research-grounded redesign**
**Date:** 2026-05-24
**Distribution unit:** an agentskills.io v1 SKILL.md package (≈80 skills + a thin set of orchestrators + a structured `references/` knowledge layer)
**Audience for this doc:** product, engineering, and design contributors to the package; partner platforms (skills.sh, Anthropic, Vercel, Tessl, Agensi); reviewers conducting Codex/cross-AI review.

> This MRD supersedes the v0.1 design specification in this folder. Where v0.1 sketched the architecture, v0.2 grounds every choice in (a) a competitive landscape audit of every shipped UI/design skill on the major registries, (b) a verified bibliography of the UI / typography / color / motion / accessibility / AI-UX canon, (c) a current snapshot of design systems and component-library standards, and (d) cross-source validation of the 2026 style landscape. Citations in §16 anchor every claim.

---

## 1. Executive Summary

**The opportunity.** SKILL.md is now a cross-host standard (≥32 agent harnesses read the same file). The most-installed design-adjacent skills on skills.sh — `frontend-design`, `web-design-guidelines`, `shadcn`, `extract-design-system`, `taste-skill`, `impeccable`, `theme-factory` — together cover ~1.3M+ installs but each fills **one** of the four primitives a designer actually executes: pick a **direction**, generate engineered **tokens**, **build** components on a real stack, and **critique** against deterministic and aesthetic gates. No package on any registry combines all four into one auditable flow. That is the structural white space.

**What we are building.** `complete-design`: a skill package that, from a single user request, can either (a) execute a **complete job-to-be-done** — full design system + initial pages + critique — by chaining specialist skills under subagent supervision, or (b) be **invoked atomically** — "generate just a palette," "audit just this component for WCAG 2.2," "convert these tokens to Tailwind v4 `@theme`." The same skills serve both modes because every workflow is a thin orchestrator over the atoms.

**The structural moats.**
1. **Sourced opinions, not vibes.** Every generator skill cites a canonical source (Bringhurst on measure, Radix on color scale roles, WAI-ARIA APG on keyboard maps, Wroblewski on form layout, Tidwell on collection patterns). The package can defend every output.
2. **Project-context awareness.** No competitor reads the user's repo first. `complete-design` scans existing tokens, existing components, stack signals, and brand assets before proposing anything — and reconciles, not overrides.
3. **Persisted direction.** A `DESIGN-DIRECTION.md` artifact written once and re-read on every subsequent invocation closes the dice-roll loop that `frontend-design` (anthropics) explicitly induces.
4. **DTCG-first, stack-pluggable output.** Generate in W3C DTCG JSON (stable v2025.10), project to Tailwind v4 `@theme`, shadcn `:root`/`.dark` OKLCH, Style Dictionary, plain CSS, SwiftUI (later) — not "shadcn-or-bust" like the dominant skill.
5. **Gated delivery.** Every workflow ends in a deterministic + LLM critique. axe-core / contrast math / DTCG-conformance / Tidwell-pattern-fit gates must pass before the agent reports done.

**The MVP wedge.** A working **design-system bootstrap workflow** that takes a brief and a repo, produces a directional spec, a DTCG token set, a `globals.css` + Tailwind v4 `@theme` + shadcn variables emit, a hero + nav + 3 component scaffolds, and a passing critique report — in one command. Around that workflow sit the same skills that can be invoked one-at-a-time for surgical tasks. Ship the bootstrap and 12 highest-leverage atoms first; expand from there.

---

## 2. Market Requirements

### 2.1 Market context

Three contemporary shifts make this MRD timely:

1. **The SKILL.md standard stabilized.** Anthropic published the agentskills.io spec on 2025-12-18; within 48 hours Codex CLI and VS Code Copilot shipped support; by March 2026 ≥32 harnesses read the same file. Skills are now the canonical way to add capability to *any* coding agent.
2. **LLM-generated UI is becoming the default new-UI surface.** v0, bolt, lovable, Cursor's inline composer, Claude artifacts, and ChatGPT Canvas all generate substantial UI volumes. The agent itself is increasingly the *first* author of UI, not a finisher. Design quality is now a model-and-skill problem, not a designer-only problem.
3. **The token interchange standard is finally stable.** The W3C Design Tokens Community Group published the first stable spec (v2025.10) on 2025-10-28. Style Dictionary, Tokens Studio, Penpot, Figma, Specify, Knapsack, Supernova have implemented it. For the first time, a skill can emit one JSON file and have it consumed across the whole ecosystem.

Against that backdrop the dominant skill in the category, `frontend-design` (anthropics, ~422k installs), is a single 80-line prose SKILL.md that tells the model to "be bold." It cannot read the user's repo, cannot generate tokens, cannot run a critique, cannot enforce its own taste. That is the gap.

### 2.2 Market trends

**Trend 1 — Platform language is reasserting itself.** Apple's Liquid Glass is now the default for system controls in iOS 26 / iPadOS 26 / macOS Tahoe / visionOS / Xcode 26; the opt-out is being removed. Google shipped Material 3 Expressive across Android 16 QPR1 (Gmail, Docs, Chrome, Keep). For the first time since Material 1, "use the platform language" is the strong default — and a credible skill must know both languages.

**Trend 2 — Two-culture divergence.** The same companies ship a "loud" marketing surface (brutalism, big-type editorial, Frutiger Aero revival) and a "quiet" product surface (Linear / Vercel / Geist precision minimalism). The package should treat marketing and app design as two style decisions, not one.

**Trend 3 — The "Geist" aesthetic is the dev-tool default.** Linear, Vercel, Raycast, Resend, Cal.com, Supabase, Modal, Anthropic Console, Cursor: monospace-influenced sans + near-monochrome + dot/grid backgrounds + ruthless spacing has become the dominant aesthetic of B2B tooling. It deserves a first-class style entry.

**Trend 4 — Open-source component canon has consolidated.** shadcn/ui + Radix Primitives + Radix Colors + Tailwind v4 has become the lingua franca of LLM-generated UI. Adobe React Aria is the most rigorous accessibility primitive layer, now powering Spectrum 2 (GA Dec 2025). Plate.js owns rich-text. These four bodies of work define the "production-correct" output the package must emit.

**Trend 5 — AI-UX patterns are now a distinct pattern family.** Streaming text, tool-call cards, citation chips, suggestion rails, generative canvases, agent traces, model-thinking disclosure, file-context chips, slash-menu / Cmd-K affordances, ambient-vs-deliberate AI — these are now patterns with shipped exemplars in ChatGPT, Claude, Cursor, Vercel v0, Linear, Notion, Perplexity. They cannot be left to model priors; they must be encoded.

**Trend 6 — Anti-slop backlash is loud and consistent.** Across NN/g, UX Collective, Smashing, Webflow, and practitioner discourse, the loudest 2026 critique of LLM-generated UI is "AI slop": purple gradients, identical Stripe-ish landing pages, Inter+Roboto, generic shadcn cards, centered-everything. A credible package must encode the slop tells *and* the counters.

**Trend 7 — Skills under-trigger by default.** Vercel's hardened Next.js eval found agents fail to invoke a relevant skill in 56% of cases. Trigger description quality is itself a design problem; skills with vague descriptions are invisible.

### 2.3 Customer segments

| Segment | JTBD | Pain | Buying trigger | Adoption blocker | Success criteria |
|---|---|---|---|---|---|
| Solo developer building a SaaS | Ship a marketing page and an app shell that doesn't look AI-generated | Choice paralysis, "everything I make looks the same," weak taste signal | Repeated user feedback that the product looks generic | Doesn't want to learn design theory | A one-command bootstrap that picks a defensible direction and emits production tokens |
| Frontend engineer on a team without a designer | Maintain a coherent design system without a Figma file | Tokens drift, ad-hoc colors creep in, can't audit | New brand refresh, design-system audit failure | Doesn't want to context-switch into a separate tool | Atomic skills they can invoke surgically inside their editor |
| Designer working with a coding agent | Translate Figma intent into faithful code; iterate without leaving the agent loop | Agent-generated code ignores their tokens; rounds-trip through Figma is slow | Working on a project with no design-eng partner | Friction in Figma → DTCG → code | Reads Figma tokens, emits matching code tokens, generates components that respect them |
| Design-system maintainer | Sustain a system across teams, surfaces, and stacks | Component drift, token rot, undocumented usage | Quarterly system audit | Existing tooling investment (Style Dictionary, Knapsack) | Plugs into existing pipeline, doesn't replace it |
| AI-builder / agentic UI platform (v0, Lovable, Subframe-likes) | Constrain generative output to known-good patterns | Their own model produces slop without scaffolding | Quality complaints from end-users | Concern about over-constraining brand voice | Embed `complete-design` as a downstream skill bundle invoked during generation |
| Indie agency / studio | Bid faster on greenfield work | Each new client starts from zero | New client onboarding | Bespoke aesthetics are the deliverable | Direction + tokens + a critique pass that defends choices to the client |
| PM / operator at a startup | Author a credible landing page or dashboard without a designer | "I don't know what to ask the agent for" | Founder-led launch, no design budget | Doesn't know vocabulary | Decision-guide skills that ask the right questions and route to the right generator |
| Platform / enterprise design system team | Govern AI-generated UI inside their company | Devs use shadcn defaults, ignore the system | First serious AI-coding rollout | Compliance and audit | Read internal tokens, refuse to generate non-conformant output, produce findings |

### 2.4 Customer problems

Problems are operational, not conceptual. The eight that recur in every research stream:

1. **"AI slop" is the default output.** Without active suppression, agents converge on purple-gradient + Inter + glass cards + centered hero. `frontend-design` warns against this in prose; no skill actually *prevents* it via deterministic gates.
2. **No direction memory across calls.** Every new prompt re-rolls the aesthetic. Within a single project the user usually wants the opposite: lock direction once, apply consistently.
3. **No tokenization.** Existing skills generate components but not the tokens behind them. Ad-hoc hex values inside JSX cannot be audited, themed, or refactored.
4. **No critique loop.** Two skills (`impeccable`, `swiftui-design-skill`) have a critique step; neither bundles automated tooling (axe-core, contrast math, DTCG conformance) into the gate.
5. **Stack lock-in.** Every winner is locked to one stack. `shadcn-skill` = Radix/Tailwind/React; `swiftui-design-skill` = SwiftUI; `sleek` = mobile. Multi-stack teams can't standardize on one package.
6. **No repo awareness.** Nothing reads existing tokens or components before generating. Generated output collides with what's already there.
7. **Style fragmentation.** `taste-skill` solves "what direction?" by *fragmenting* into 6+ named-style skills the user must pre-pick. No package offers a single direction-selector that routes to per-style playbooks inside one bundle.
8. **Trigger invisibility.** Skills with vague descriptions don't fire (Vercel's 56% miss rate). Many design skills' descriptions are aesthetic generalities; the agent can't tell when to invoke them.

### 2.5 Competitive landscape

Verified inventory (skills.sh and major registry directories, May 2026):

| Skill | Publisher | Installs | What it does | Gap |
|---|---|---|---|---|
| `frontend-design` | anthropics | ~422k | Single SKILL.md preaching anti-slop direction in prose. | No tokens, no critique, no context, no per-style playbook. |
| `web-design-guidelines` | vercel-labs | ~318k | Audit existing UI against ~100 rules; outputs `file:line` findings via remote fetch. | Review-only; no generation; remote-fetch dependency. |
| `shadcn` | shadcn-ui | ~147k | Teaches the agent to use the shadcn CLI / registry correctly. | shadcn-locked; assumes the design problem is component picking. |
| `sleek-design-mobile-apps` | sleekdotdesign | ~142k | Wrapper around Sleek SaaS API. | Vendor lock-in; mobile only. |
| `extract-design-system` | arvindrk | ~99k | Playwright-driven scrape of a URL → DTCG tokens. | Extraction only, no construction; SPA-fragile. |
| `taste-skill` (suite incl. design-taste-frontend, gpt-taste, minimalist-ui, industrial-brutalist-ui) | leonxlnx | ~56k+ | One skill per style flavor; prose. | User must pre-pick; no critique gate; vibe-driven. |
| `impeccable / frontend-design` | pbakaus | ~54k | 27 anti-pattern rules + 12-rule LLM critique + 7 references + slash commands. | Web-only; vocabulary-focused; weak greenfield aesthetic direction. |
| `canvas-design` | anthropics | ~56k | PNG/PDF visual-art generation. | Not UI/web — tangential. |
| `swiftui-design-skill` | wholiver | n/a | 5-dimension review gate, ≥7/10 to ship. | SwiftUI only. |
| `theme-factory` | anthropics | n/a | 10 pre-set themes with palette + font pairs; slide-deck-oriented. | No dark/light pairing logic, no a11y, vibey not engineered. |
| `brand-guidelines` | anthropics | n/a | Hard-codes Anthropic's brand. | Single-brand. |
| `web-artifacts-builder` | anthropics | n/a | React + Tailwind + shadcn artifact scaffolder. | Defaults to shadcn aesthetic = the slop `frontend-design` warns against. |
| `anydesign` | uxKero | n/a | Image/URL/Figma → vision/CSS/Playwright extraction → spec + DTCG + a11y notes; confidence-marked. | Inbound/analysis only; doesn't build. |

**Adjacent tooling competing for the same JTBD:** v0 / bolt / lovable / Subframe / Builder Visual Copilot / Plasmic. These win on liveness and visual preview; they lose on portability across hosts and stacks, and they require a context switch out of the user's editor. A skill package's structural advantage is that it runs inside the agent loop the developer is already in, against the repo they already have open.

**Direct competitive map.** Of the four primitives a designer executes — Direction, Tokens, Build, Critique — no shipped package covers more than two:

| Skill | Direction | Tokens | Build | Critique |
|---|---|---|---|---|
| `frontend-design` (anthropics) | partial | — | — | — |
| `web-design-guidelines` | — | — | — | ✓ |
| `extract-design-system` / `anydesign` | — | ✓ (inbound) | — | partial |
| `taste-skill` | ✓ (fragmented) | — | partial | — |
| `impeccable` | partial | — | — | ✓ |
| `theme-factory` | partial | partial | — | — |
| `shadcn` | — | partial | ✓ (locked) | — |
| `swiftui-design-skill` | partial | — | ✓ (locked) | ✓ |
| **`complete-design` (proposed)** | **✓** | **✓** | **✓ (pluggable)** | **✓ (gated)** |

### 2.6 Market opportunity

The package solves a four-corner problem none of the dominant skills solves:

1. **Pick and persist** a defensible aesthetic direction from a controlled vocabulary (20 named styles, validated against 2026 trend reporting).
2. **Engineer the tokens** behind that direction in DTCG-format JSON, audited against WCAG 2.2 AA contrast and Radix-style 12-step scale semantics.
3. **Build** components and compositions on the user's actual stack (Tailwind v4 + shadcn first, plain CSS / Material Web / SwiftUI later) using a stack-adapter layer.
4. **Gate delivery** through a deterministic critique (axe-core, contrast math, DTCG conformance, token-usage lint) followed by an LLM critique against a sourced rubric.

Bundled with a curated, licensed, machine-readable knowledge layer (8 design-system essentials + WAI-ARIA APG patterns + the canonical typography / color / motion / AI-UX references), the package becomes the *only* one on any registry whose outputs are simultaneously (a) production-correct on shipped stacks, (b) defensible against canon, and (c) auditable by the package itself.

---

## 3. Product Requirements

### 3.1 Vision

> A single skill package that lets any LLM coding agent author production-grade UI — from a directional brief through engineered tokens, real components, and a gated critique — across every major stack, with every claim defensible against the canon.

### 3.2 Product principles

| # | Principle | Implication |
|---|---|---|
| P1 | **Direction precedes generation, with a standalone fallback.** | Every workflow asks for or recovers a direction before emitting tokens, components, or critiques. Every *atomic* skill, when invoked standalone, executes a minimum-viable bootstrap: read `.complete-design/DESIGN-DIRECTION.md` if present; if absent, infer from repo signals (existing tokens, brand assets, stack) or emit a neutral draft tagged `direction: unset` and ask the user one blocking question on next turn. The skill never silently picks "modern minimal" and never crashes for lack of direction. |
| P2 | **Persisted artifacts beat re-rolled prompts.** | Every workflow writes `DESIGN-DIRECTION.md` and `design-tokens.json` and reads them on every subsequent call. |
| P3 | **DTCG is the interchange.** | Tokens are authored in DTCG v2025.10 JSON; everything else (Tailwind, shadcn, Style Dictionary, CSS) is a projection. |
| P4 | **Sourced opinions, cited at rule granularity.** | Every prescriptive rule (not every sentence) in a skill body either cites a canonical reference (Bringhurst, Radix, APG, WCAG) or labels itself "house heuristic." References are *summaries* of canonical sources with source date, edition, license class, and quote-length limit — never verbatim chapters or excerpts from copyrighted books. See §11 for the licensing policy. |
| P5 | **Project context is non-optional.** | Before generating anything, scan the user's repo for existing tokens, existing components, brand assets, and stack signals. Reconcile, don't override. |
| P6 | **Critique is a gate, not a feature.** | Workflows do not return until the critique passes deterministic and LLM checks. The user can override but must do so explicitly. |
| P7 | **Atomic and composable.** | Every workflow is implementable as a chain of atoms. Every atom is invocable on its own. |
| P8 | **Stack-pluggable.** | Generators emit framework-agnostic intermediate forms; thin adapters project to each stack. |
| P9 | **Slop tells are encoded.** | The package ships a curated anti-pattern library and runs it as part of every critique. |
| P10 | **Trigger discipline.** | Every skill description follows the 4-part trigger template (§4.4) and is validated against a 60/40 should-fire / should-not-fire eval suite. |

### 3.3 Target personas (operationalized)

| Persona | Surface | Primary need |
|---|---|---|
| **Maya — Indie dev shipping a SaaS** | CLI agent in repo | One command from brief to working themed app shell |
| **Priya — Frontend lead, no designer** | Cursor / Claude Code | Atomic skills to fix tokens, audit a component, regenerate a palette without touching the rest |
| **Ren — Designer pairing with an agent** | Claude Code with Figma open | Read Figma DTCG export, emit code that respects it, audit drift |
| **Sam — DS maintainer at a Series-B startup** | CI + local agent | Token lint + component conformance check in PRs |
| **Jordan — AI-builder integrating `complete-design`** | Their own runtime | Programmatic invocation of atoms with structured I/O |
| **Lin — PM authoring a launch page** | Web Claude.ai with repo context | Direction selector + skeleton generator that doesn't require knowing CSS |

### 3.4 Jobs-To-Be-Done

The core JTBDs the package must execute, in order of expected frequency:

1. **"Give my product a coherent visual direction and the tokens to back it up."** — full bootstrap workflow.
2. **"Audit this UI for accessibility / contrast / density / consistency."** — critique workflows.
3. **"Generate this one thing"** — palette, type scale, hero, form, dashboard, empty state — atomic skill invocation.
4. **"Convert these tokens to my framework."** — projector workflow.
5. **"Extract a design system from this URL / image / Figma."** — inbound extraction workflow.
6. **"Redesign this page in this direction."** — direction-swap workflow.
7. **"Maintain consistency across new generations."** — directional persistence across sessions.
8. **"Tell me what's wrong with this design and why, with sources."** — critique-with-rationale workflow.

### 3.5 Architecture — workflows + atoms

`complete-design` ships **two coherent surfaces against the same skill set**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW LAYER  (orchestrators that chain skills + dispatch subagents)  │
│  bootstrap · audit · extract · redesign · maintain                       │
│  — each is a SKILL.md whose body is the chain procedure —                │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ invokes
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ATOMIC SKILL LAYER  (one decision unit each; ≤500 lines; ≤5k tokens)    │
│  Layer 0 Strategy  · Layer 1 Foundations · Layer 2 Components            │
│  Layer 3 Compositions · Layer 4 Style codifiers · Critics                │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ reads
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  KNOWLEDGE LAYER  ( references/  +  assets/  +  embedded scripts )       │
│  WCAG 2.2 · DTCG v2025.10 · APG · Radix · M3 · HIG · shadcn · …          │
└──────────────────────────────────────────────────────────────────────────┘
```

The same atom serves both layers: when invoked by a workflow it receives stitched context; when invoked atomically it receives the user's raw request. No code duplication.

### 3.6 Workflow inventory (the JTBD layer)

Each workflow is a SKILL.md that orchestrates a chain of atoms and dispatches subagents where the work is genuinely independent. Workflow bodies are written as numbered procedures the agent follows literally, with explicit `Read` and `Write` calls to the persistence artifacts.

#### W1 — `bootstrap-design-system` (the headline workflow)

The full JTBD. Brief → direction → tokens → adapter emit → seed components → critique.

```
Step  Action                                                Subagent?
─────────────────────────────────────────────────────────────────────
 1    Read repo context (package.json, existing             —
      globals.css, /tokens/, /design/, /brand/)
 2    Run product-tone-profiler (5 questions)               —
 3    Run brand-archetype-mapper                            —
 4    Run style-chooser → pick 1 of 20                      —
 5    Run ai-interface-pattern-chooser (if AI product)      —
 6    Write DESIGN-DIRECTION.md                             —
 7    DISPATCH 3 parallel subagents:                        YES (fan-out)
        a) color subagent (palette → contrast → dark-mode)
        b) typography subagent (font-pair → scale → rhythm)
        c) spacing/motion subagent (scale → grid → motion)
 8    Merge into design-tokens.json (DTCG v2025.10)         —
 9    Run token-emitter for declared stack(s):              —
        Tailwind v4 @theme + globals.css + shadcn :root/.dark
10    Seed components: button, input, card, nav-shell       —
      (calls components/* atoms)
11    Generate one composition: hero or dashboard           —
12    DISPATCH critique subagent:                           YES
        deterministic gates (axe, contrast, DTCG conformance)
        + LLM critique against Tidwell / canon rubric
13    If critique fails: route findings → repair atom       —
      → re-run critique. Max 2 repair cycles.
14    Determine terminal state and write CRITIQUE-REPORT.md  —
      with one of: PASS · PASS_WITH_WARNINGS ·
      FAILED_AFTER_REPAIR · USER_OVERRIDDEN.
      FAILED_AFTER_REPAIR returns findings + files-touched
      + per-finding fix recipes; does NOT report success.
      USER_OVERRIDDEN requires explicit user confirmation
      and is recorded with override rationale.
15    For UI changes touching visible surfaces: take         —
      before/after screenshots via Playwright (when host
      supports it) and attach to CRITIQUE-REPORT.md.
16    Emit a PR-ready diff (never a hard write to a dirty   —
      tree); summarize to user with diff path.
```

The subagent dispatches at steps 7 and 12 are genuine fan-outs: color / typography / spacing are independent within the bounded direction, and the critique runs against finished artifacts. Sequential phases stay in the main agent to preserve direction continuity.

#### W2 — `audit-ui` (the critique workflow, no generation)

```
1  Discover scope (file glob or URL)
2  DISPATCH 4 parallel critique subagents:
     a) accessibility-auditor (axe-core + APG conformance)
     b) contrast-auditor (WCAG 2.2 1.4.3/1.4.11 + APCA signal)
     c) density-auditor (against declared/inferred density strategy)
     d) ai-slop-detector + taste-auditor + style-purity-auditor
3  Merge findings, deduplicate, severity-rank
4  If a DESIGN-DIRECTION.md exists: cross-check for drift
5  Write AUDIT-REPORT.md; offer fix recipes per finding
```

#### W3 — `extract-design-system` (inbound)

```
1  Receive URL / image / Figma file
2  Choose extractor:
     - URL: Playwright + computed-style scrape
     - Image: vision model → palette + type + spacing inference
     - Figma: DTCG export via Tokens Studio bridge
3  Run color subagent (cluster palette → 12-step scales)
4  Infer type scale + measure
5  Emit design-tokens.json (DTCG) with confidence markers
6  Write EXTRACTION-REPORT.md noting low-confidence inferences
```

#### W4 — `redesign-in-direction` (direction swap)

```
1  Read existing globals.css / tokens.json / components
2  Read or prompt for new direction
3  DISPATCH 2 parallel subagents:
     a) token translator (old tokens → new tokens, preserve semantic roles)
     b) component patcher (apply new tokens, regenerate visually-loaded
        components like hero / pricing tile / empty state)
4  Run critique subagent against new direction
5  Emit a single PR-ready diff + REDESIGN-NOTES.md
```

#### W5 — `maintain-design-system` (consistency across sessions)

```
1  Read DESIGN-DIRECTION.md + design-tokens.json
2  Compare against current files (drift detection)
3  If drift exists: surface, propose corrections
4  If user is asking for new components: route to the right atom
   with stitched context, so the new component matches existing system
```

#### W6 — `landing-from-brief` and `dashboard-from-brief` (focused one-shots)

Trim of W1 that skips full foundation generation when an existing system is present. Reads tokens, calls only the compositional and component atoms needed.

### 3.7 Subagent architecture

`complete-design` uses subagents narrowly, only where parallelism is genuinely safe:

| Subagent | Scope | Why a subagent? |
|---|---|---|
| **Color subagent** | palette-strategy → palette-generator → dark-mode-mirror → contrast-audit → semantic-token-mapper | Bounded by direction + brand hue; tools are deterministic; output is one JSON file. Parallel-safe with typography and spacing. |
| **Typography subagent** | font-pair → type-scale → reading-rhythm → numerics-and-data | Same — bounded by direction; output is type tokens. |
| **Spacing/motion subagent** | spacing-scale → grid-system → motion-tokens | Bounded; output is spacing/motion tokens. |
| **Critique subagent** | run axe-core script → run contrast script → run DTCG-conformance lint → run LLM rubric critique → merge | Audits finished artifacts; reads, does not write. Parallelizable per finding-type. |
| **Component-patcher subagent** | Apply a token-swap to one component family at a time | Each component family is independent once tokens are agreed. |

Subagents never receive the full user request. They receive a **task brief** with stitched context (direction + relevant existing artifacts + stack target). This contains blast radius and keeps each subagent under its context budget.

### 3.8 Atomic skill inventory (the composable layer)

Naming convention: `<namespace>/<skill>`. Folder name === `name:` frontmatter. Composition declared per §3.9. **The canonical inventory is `manifest.json` at the package root** (§3.14); the counts in this section must match it. If they ever drift, `manifest.json` wins.

#### Layer 0 — Strategy (5 skills)
- `strategy/product-tone-profiler` — 5-axis tone profile from a brief
- `strategy/brand-archetype-mapper` — Aaker × archetype → permitted style families
- `strategy/style-chooser` — routes to 1 of 20 style codifiers using `references/decision-trees/style-matrix.csv`
- `strategy/density-strategy` — compact / comfortable / spacious + base unit
- `strategy/ai-interface-pattern-chooser` — picks AI-UX pattern (inline-suggestion, panel-copilot, chat, generative-canvas, agent-workspace, ambient, deliberate)

#### Layer 1 — Foundations (19 skills)

**Color (8):**
- `color/palette-strategy-chooser` — monochromatic / analogous / complementary / triadic / split-complement / from-image / from-archetype
- `color/palette-generator` — OKLCH 12-step scales (Radix model)
- `color/palette-from-image` — k-means in OKLab, harmony adjustment
- `color/palette-from-brand-archetype` — uses `references/archetype-map.yaml`
- `color/dark-mode-mirrorer` — Radix-pattern dark pairing
- `color/contrast-auditor` — WCAG 2.2 1.4.3/1.4.11 + APCA signal (with the conservative caveat per §16: APCA is informational, never presented as conformance)
- `color/semantic-token-mapper` — raw scale → semantic roles (`bg`, `bg-subtle`, `border`, `border-hover`, `text`, `text-muted`, `accent`, `accent-hover`, …) following Radix 12-step semantic roles
- `color/state-color-generator` — success/warning/danger/info ramps harmonized with primary

**Typography (6):**
- `typography/type-scale-builder` — modular scale (Tim Brown ratios) + `clamp()` fluid type
- `typography/font-pairer` — curated 100-pair library; selects + emits fallback stacks
- `typography/reading-rhythm` — measure (Bringhurst 45–75ch) + leading + paragraph spacing
- `typography/numerics-and-data` — OpenType `tnum`/`lnum` feature flags
- `typography/multilingual-coverage` — Unicode-block coverage audit
- `typography/vertical-rhythm-auditor` — 8/4-pt baseline-grid drift detector

**Spacing / Grid / Motion / Iconography / Depth (5):**
- `spacing/scale-builder` — 8-pt or t-shirt scale
- `spacing/grid-system` — Swiss / 12-col / bento; container-queries-aware
- `motion/motion-tokens` — duration + easing tokens (Val Head defaults + reduced-motion fallback)
- `iconography/icon-system` — Lucide / Phosphor / Material Symbols / SF Symbols chooser
- `depth/elevation-and-shadow` — elevation tokens with shadow recipes (M3 elevation, Liquid Glass depth, soft / pronounced / flat)

**Tokens (orchestrator-as-atom):**
- `tokens/token-emitter` — DTCG JSON in; Tailwind v4 `@theme`, shadcn `:root`/`.dark` (OKLCH), Style Dictionary, plain CSS out

#### Layer 2 — Components (12 skills)

`components/button-anatomy`, `components/input-anatomy`, `components/select-anatomy`, `components/card-anatomy`, `components/dialog-anatomy`, `components/table-anatomy`, `components/form-design`, `components/navigation-patterns`, `components/feedback-states`, `components/disclosure-patterns`, `components/data-display-charts` (chart-selection per Few / Munzner), `components/notifications-and-toasts`.

Each component-anatomy skill follows the same template: anatomy diagram (slot names) → states matrix → ARIA + keyboard map (cites APG + Pickering + Roselli) → token consumption map → sample DOM in `assets/components/<name>/`.

#### Layer 3 — Compositions (7 skills)

`comp/layout-pattern-chooser` (Tidwell pattern catalog), `comp/list-vs-card-vs-stream` (5-variable decision tree), `comp/hero-staging`, `comp/dashboard-composition` (Few + Munzner), `comp/landing-page-skeleton`, `comp/empty-state-design`, `comp/onboarding-pattern`.

#### Layer 4 — Style codifiers (20 skills — see §4 below)

#### Critics (6 skills, read-only)

`critic/accessibility-auditor` (WCAG 2.2 AA via axe + Soueidan's responsible-ARIA), `critic/contrast-auditor` (also called as Layer-1 atom), `critic/density-auditor`, `critic/taste-auditor` (general anti-slop), `critic/ai-slop-detector` (the curated tell catalog), `critic/style-purity-auditor` (uses each style skill's "violates this style" rules), `critic/copy-and-microcopy` (Polaris + Atlassian rules), `critic/deceptive-pattern-detector` (Brignull negative library).

#### References (10 reference-only skills, no generation)

`ref/wcag-2-2-essentials`, `ref/dtcg-v2025-10`, `ref/apg-patterns-index`, `ref/radix-step-roles`, `ref/material-3-essentials`, `ref/apple-hig-liquid-glass`, `ref/shadcn-tailwind-v4-conventions`, `ref/react-aria-essentials`, `ref/ai-ux-pattern-catalog`, `ref/tidwell-pattern-index`.

#### Workflow orchestrators (6 skills)

`bootstrap-design-system`, `audit-ui`, `extract-design-system`, `redesign-in-direction`, `maintain-design-system`, `landing-from-brief` / `dashboard-from-brief`.

**Total (unique skills, per `manifest.json`):** 5 Strategy + 20 Foundation (including `tokens/token-emitter`) + 12 Components + 7 Compositions + 20 Style codifiers + 8 Critics + 10 References + 7 Workflow orchestrators = **89 unique skills.** Note: `contrast-auditor` is co-listed as both `color/contrast-auditor` (Layer 1 atom) and `critic/contrast-auditor` (critic) — same skill, two namespace paths, counted once.

### 3.9 Composition contract

Every skill carries this metadata in addition to standard SKILL.md fields:

```yaml
composition:
  upstream:     # skills whose output this skill expects
  downstream:   # skills that typically consume this skill's output
  alternatives: # skills that solve the same job differently
  conflicts:    # skills that should not run in the same session
artifacts:
  reads:        # files this skill reads (DESIGN-DIRECTION.md, design-tokens.json, etc.)
  writes:       # files this skill writes
stack:
  targets:      # ["tailwind-v4", "shadcn", "css-vars", "style-dictionary"]
  emits:        # DTCG | CSS | JSON | TSX | …
knowledge-version: "v2025.10"  # version of the references/ corpus this skill assumes
```

Workflows read `composition` to assemble chains; the router uses it to suggest "you probably want X first."

### 3.10 Knowledge architecture

**Decision: hybrid, file-based, no vector DB and no knowledge graph in v1.** The SKILL.md spec already gives a four-tier hierarchy that fits the package's needs without additional infrastructure.

| Tier | Mechanism | Use for |
|---|---|---|
| A. Frontmatter | Loaded at session start | Trigger description, composition contract, version |
| B. SKILL.md body | Loaded on activation | The skill's procedure and opinions |
| C. `references/*.md` | Loaded on demand | Reference content the body cites |
| D. `assets/**` | Loaded on demand | Token templates, sample DOM, decision tables, scripts |

A vector store would add a pipeline for negligible lift: the total reference corpus is bounded (<10 MB), and each skill knows deterministically which references it needs.

**Mandatory `references/` corpus (the 8 must-encode systems):**
1. `references/shadcn-tailwind-v4/` — `components.json` schema, `globals.css` template, `@theme` + `@theme inline` semantics, OKLCH conversion rules, primitive list, `data-slot` pattern.
2. `references/radix/` — 12-step semantic scale doc (the canonical step-role mapping), primitive list with keyboard maps.
3. `references/react-aria/` — hook list + composition patterns + collection model.
4. `references/material-3/` — sys/ref/comp token taxonomy, color roles, motion tokens, Expressive shape system.
5. `references/apg/` — per-pattern keyboard maps (dialog, combobox, listbox, menu, tabs, tree, grid, etc.) sourced from WAI-ARIA APG, cross-checked against Pickering / Soueidan / Roselli.
6. `references/dtcg/` — v2025.10 JSON schema + type tables + aliasing rules.
7. `references/apple-hig-liquid-glass/` + `references/spectrum-2/` — depth/translucency principles + scale-aware token philosophy.
8. `references/ai-ux-patterns/` — distilled 12-pattern catalog (streaming, tool-card, citation chip, generative canvas, agent trace, thinking disclosure, file chip, slash/Cmd-K, suggestion rail, ambient vs deliberate, confidence display, planning visibility) from ChatGPT / Claude / Cursor / Perplexity / v0 / Linear / Notion AI / Smashing AI-UX writeups.

**Secondary `references/` (each compact summary):** Carbon, Fluent UI 2, Polaris, Primer (and its multi-mode dark scale), Ant Design v6 (Component Token model), SLDS 2 (styling hooks), Fiori (floorplans).

**Methodology `references/` (the canon):**
- `references/canon/wcag-2-2.md` — SC text + Soueidan's 5 ARIA rules + axe-core rule cross-ref
- `references/canon/typography.md` — Bringhurst (measure, leading, ratios), Butterick (lint rules), Brown (fluid type, modular scale)
- `references/canon/color.md` — Itten's 7 contrasts, Radix step roles, Leonardo/Huetone algorithm refs, OKLCH default + sRGB fallback, APCA caveat
- `references/canon/motion.md` — Val Head defaults, Material Motion, HIG Motion, reduced-motion lint
- `references/canon/forms.md` — Wroblewski form rules as lint
- `references/canon/charts.md` — Few + Munzner channel ranking + chart selection tree
- `references/canon/hax-18.md` — Microsoft HAX 18 guidelines as AI-UX checklist
- `references/canon/deceptive-patterns.md` — Brignull negative library
- `references/canon/pickering-components.md` — per-component a11y notes
- `references/canon/roselli-under-engineered.md` — minimal-viable accessible component recipes
- `references/canon/tidwell-patterns.md` — pattern catalog index
- `references/canon/microcopy.md` — Polaris + Atlassian + NN/g rules consolidated

**Decision matrices (the multi-factor decisions referenced in v0.1 §4.3):**
- `references/decision-trees/list-vs-card-vs-stream.md` — 5-variable explicit table
- `references/decision-trees/palette-strategy.md` — tone × archetype × accent-need
- `references/decision-trees/layout-pattern.md` — Tidwell pattern selector
- `references/decision-trees/chart-selection.md` — Few/Munzner
- `references/decision-trees/style-matrix.csv` — tone-axis → top-3 styles

**Anti-pattern corpus (curated, editable):**
- `references/ai-slop/heuristics.md` — purple gradients, Inter/Roboto-everywhere, centered-everything, glass-on-glass, generic shadcn cards, lorem-ipsum residue, identical-bento-grid pages, fake testimonials, rainbow stat cards, etc.
- `references/ai-slop/counters.md` — per-tell counter-pattern

**Sample artifacts (`assets/`):**
- `assets/token-templates/{dtcg.json, tailwind-v4.css, shadcn-globals.css, style-dictionary.config.json}`
- `assets/components/{button, input, card, dialog, table, …}/{html, jsx, vue, swiftui}`
- `assets/styles/<style-name>/{recipe.css, anatomy.md, anti-examples.md, palette.json, type-pair.json}`
- `assets/scripts/{contrast.mjs, oklch.mjs, dtcg-lint.mjs, axe-runner.mjs, slop-scan.mjs}`

### 3.11 Persisted project artifacts

The package's defining UX choice: **persistence beats re-rolling.** Every workflow reads-and-writes structured state under `.complete-design/` at the user's chosen project root (or `--cwd` override for monorepos). Files in stack-native locations (e.g. `globals.css`, `tailwind.config.ts`) are only touched as deliberate projections, never as primary state.

**Layout:**

```
.complete-design/
  DESIGN-DIRECTION.md   # the chosen direction record
  design-tokens.json    # DTCG v2025.10 source of truth
  CRITIQUE-REPORT.md    # last audit terminal state + findings
  EXTRACTION-REPORT.md  # extraction inputs + per-attribute confidence
  manifest.lock         # which skills last touched which files, with hashes
  manual-overrides.json # user edits the workflow must preserve
```

**Every persisted artifact carries this header:**

```yaml
schemaVersion: 1
projectId:     <stable id, e.g. repo origin URL or hash>
appPath:       <relative path the workflow operates under>
generatedBy:   @pm-musketeers/complete-design@<version>
knowledgeVersion: v2025.10
lastReviewedBy: <user | agent | unattended>
lastReviewedAt: <ISO8601>
sourceRefs:    [ ... ]  # citations supporting choices in this artifact
```

**Merge policy (the rule that lets users edit safely):**

1. **Diff-before-write.** Workflows produce a unified diff and surface it to the user; they never write a non-dot-file in the working tree without explicit confirmation. Dot-files under `.complete-design/` are written with hashes recorded in `manifest.lock`.
2. **Manual-override detection.** Before regenerating any persisted artifact, the workflow hashes the existing file against the last `manifest.lock` entry. If hashes mismatch, the file is treated as user-modified: the regeneration runs in 3-way-merge mode, and any user-divergent regions become entries in `manual-overrides.json`. Subsequent regenerations preserve those regions.
3. **No destructive overwrite.** A workflow that cannot reconcile a manual edit halts and asks; it does not "win."
4. **PR-first.** Default output mode is "diff/patch saved to a path, ready for review"; direct write requires `--apply` or an interactive confirmation per host.
5. **Monorepo-aware.** `.complete-design/` may exist at multiple paths (e.g. `apps/web/.complete-design/`, `apps/admin/.complete-design/`). Workflows resolve scope from the invocation's `cwd` upward.

These artifacts are the package's contract with future invocations, with the user's edits, and with the version-control history.

### 3.12 Host compatibility contract

`complete-design` is multi-host by design but **not equally capable everywhere**. The contract is published as a `compatibility-matrix.json` artifact shipped with the package and re-derived by CI evals on every release.

| Capability | Claude Code | Codex CLI | Cursor | Gemini CLI | JetBrains Junie | VS Code Copilot |
|---|---|---|---|---|---|---|
| Read SKILL.md frontmatter | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Load `references/*.md` on demand | ✓ | ✓ | ✓ | partial | ✓ | ✓ |
| Execute `assets/scripts/*.mjs` (Node) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Subagent dispatch (workflow fan-out) | ✓ native | emulated (sequential) | emulated (sequential) | unsupported | unsupported | unsupported |
| Skill-to-skill invocation by name | ✓ | ✓ | ✓ | partial | ✓ | ✓ |
| `allowed-tools` enforcement | ✓ | partial | partial | partial | ✓ | ✓ |
| Playwright screenshots in critique | ✓ | ✓ | ✓ | depends | depends | depends |
| Live preview (e.g. dev server invocation) | depends | depends | ✓ | depends | depends | partial |

**Fallback behavior.** When a host cannot dispatch subagents, the workflow body executes the same chain sequentially, in the same agent, with explicit context budget management. The MVP must work in the sequential-fallback mode on every host before claiming parallel support.

**Per-host smoke suite.** Each release ships a `host-smoke/<host>.yaml` eval that runs the bootstrap workflow end-to-end on each declared host and records pass / partial / fail with the specific capability gap that caused any partial.

*Assumption to verify before release:* the "≥32 harnesses" claim in §2.1 reflects total SKILL.md adoption, not full feature parity. The compatibility matrix is what users should actually consult.

### 3.13 Stack adapter interface

A stack adapter (Tailwind v4, shadcn, plain CSS, Material Web, SwiftUI, Vue, Svelte, …) is a SKILL.md that implements a uniform interface. This makes adapter coverage extensible without changing the rest of the package.

```yaml
adapter:
  id:               tailwind-v4
  detect:           # how to recognize this stack in a repo
    files:          ["tailwind.config.{js,ts}", "src/**/*.css"]
    package-deps:   ["tailwindcss@^4"]
    confidence:     0.0–1.0
  can-emit:
    - tokens
    - component
    - composition
  token-format:     css-vars-at-theme
  component-format: jsx-shadcn   # or vue-sfc, swiftui, lit, …
  outputs:
    tokens:         ["src/app/globals.css"]
    components:     ["src/components/ui/<name>.tsx"]
  verify:
    compile:        "npm run build"   # or stack-appropriate equivalent
    a11y:           "npx axe <route>"  # script run when feasible
    visual:         "npx playwright test --grep <name>"
  unsupported-reason: # human-readable string if a request can't be served
```

The workflow's stack-resolution step (W1 step 9, etc.) picks the highest-confidence adapter, falls back to `plain-css` if none detect, and surfaces `unsupported-reason` rather than silently emitting wrong-format output.

**MVP adapters:** `tailwind-v4`, `shadcn`, `plain-css`. **v0.5 adapters (in `complete-design-bridges`):** `material-web`, `vue-3-sfc`, `svelte-5`. **Later:** `swiftui`, `kotlin-compose`, `lit`.

### 3.14 Canonical inventory manifest

`manifest.json` at the package root is the single source of truth for what ships. Every count, eval entry, and roadmap milestone derives from it. Shape:

```json
{
  "version": "0.1.0",
  "skills": [
    {
      "id":              "color/palette-generator",
      "type":            "atom",
      "layer":           1,
      "category":        "color",
      "mvp":             true,
      "host-support":    ["claude-code", "codex-cli", "cursor"],
      "reads":           [".complete-design/DESIGN-DIRECTION.md"],
      "writes":          [".complete-design/design-tokens.json"],
      "knowledge":       ["wcag-2-2", "radix-step-roles", "dtcg"],
      "adapters":        ["tailwind-v4", "shadcn", "plain-css"],
      "composition": {
        "upstream":      ["color/palette-strategy-chooser"],
        "downstream":    ["color/dark-mode-mirrorer", "color/contrast-auditor", "tokens/token-emitter"]
      }
    }
    // ...
  ]
}
```

The package's CI generates a derivation report (counts per layer, MVP coverage, host-support coverage, adapter coverage) on every PR; mismatches between `manifest.json` and §3.8 prose block merge.

---

## 4. The Direction Model (multi-axis) and the Style Catalog (Layer 4)

### 4.0 Direction is multi-axis, not a single flat style

A "direction" is not one label. The package models it as **five orthogonal axes** the agent picks independently and the critic checks for conflict:

| Axis | Owns | Picked by | Example values |
|---|---|---|---|
| `visual_style` | The aesthetic personality | `strategy/style-chooser` → Layer 4 codifier | `neo-brutalism`, `geist-precision`, `expressive-editorial`, `swiss` |
| `platform_language` | The OS/ecosystem visual idiom (orthogonal to style) | `strategy/platform-language-chooser` | `liquid-glass`, `material-3-expressive`, `fluent-2`, `web-native` |
| `layout_pattern` | The page-level structural pattern (orthogonal to both) | `comp/layout-pattern-chooser` | `bento-grid`, `swiss-grid`, `two-panel`, `scrollytelling`, `single-column-editorial` |
| `interaction_pattern` | AI-UX and live behaviors | `strategy/ai-interface-pattern-chooser` | `chat-thread`, `inline-suggestion`, `generative-canvas`, `agent-workspace`, `ambient-assist`, `none` |
| `historical_reference` (optional) | An explicit citation to a movement | user-set | `frutiger-aero-historical`, `web-2`, `memphis` |

Style codifiers (Layer 4) own **only** `visual_style`. The previously-confused entries are reclassified:
- `bento-grid` is a **layout_pattern**, lives in `comp/layout-pattern-chooser`, not `style/`.
- `ai-native` is an **interaction_pattern**, lives in `strategy/ai-interface-pattern-chooser`, not `style/`.
- `liquid-glass` and `material-3-expressive` are **platform_language** values; they have `platform/` skills, not `style/` skills.
- `frutiger-aero` resolves to one entry: `historical_reference: frutiger-aero-historical`, with current-day usage notes captured as a `visual_style` companion (`style/glassy-optimistic`).

This eliminates the §4 mixed-taxonomy problem. The total Layer-4 style codifier count stays at 20; the catalog below is reclassified accordingly.

### 4.1 Style codifier ground rules

Each `style/<name>` is closed-form: knows one `visual_style` cold, refuses to mix unless explicitly orchestrated by `style-blender` (an opt-in atom with warnings).

Each style skill ships with:
- `style/<name>/SKILL.md` — defining characteristics, when-to-use, when-NOT-to-use, "violates this style" rules
- `assets/styles/<name>/recipe.css` — minimum signature treatments
- `assets/styles/<name>/anatomy.md` — page/component archetypes
- `assets/styles/<name>/palette.json` and `type-pair.json` — defaults harmonized with the style
- `assets/styles/<name>/anti-examples.md` — common mistakes the style purity auditor catches

### 4.2 Top 10 Current Styles (validated against 6+ trend sources, 2026)

| # | Style | Skill | Best for | Forbidden for |
|---|---|---|---|---|
| 1 | **AI-Native / Generative Interface** | `style/ai-native` | AI products, copilots, agentic tools, content workflows | Highly regulated transactional flows where determinism matters |
| 2 | **Liquid Glass / Glassmorphism 2.0** | `style/liquid-glass` | Apple-platform apps, premium consumer, media, navigation-heavy iOS | Accessibility-critical low-vision contexts, data-dense enterprise, cross-OS-identical render needs |
| 3 | **Material 3 Expressive** | `style/material-3-expressive` | Android-first consumer apps, communications, fitness, Android productivity | iOS-only products (platform clash), enterprise dashboards needing density |
| 4 | **Linear / Vercel Precision Minimalism (Geist)** | `style/geist-precision` | Developer tools, infra, B2B SaaS, dashboards, technical docs, AI dev platforms | Kids', consumer entertainment, healthcare-for-patients, fashion/luxury |
| 5 | **Bento Grid Layouts** | `style/bento` | Product marketing pages, feature pages, dashboards, portfolios | Long-form editorial, transactional checkout, scrolly narrative |
| 6 | **Cinematic Dark Mode** | `style/cinematic-dark` | Dev tools, design tools, creative software, AI products, entertainment | Banking/legal/government, healthcare for elderly, print-derived editorial, outdoor-use apps |
| 7 | **Big-Type / Expressive Editorial** | `style/expressive-editorial` | Publishing, agency, brand sites, blogs, conferences, fashion, premium B2C | Data-dense SaaS, settings/admin UIs |
| 8 | **Neo-Brutalism + Anti-Design** | `style/neo-brutalism` | Indie SaaS, creator tools, design conferences, dev community | Healthcare, government, finance, insurance, legal, primary-elderly personas |
| 9 | **Spatial / 3D / Scrollytelling** | `style/spatial-scrollytelling` | Hardware launches, agency portfolios, brand campaigns, immersive landings, museums | App-like product UI, dashboards, mobile-first perf-constrained, SEO-deep content |
| 10 | **Frutiger Aero Revival** | `style/frutiger-aero` | Consumer tech, lifestyle, wellness, kids', smart-home, sustainability brands, music | Enterprise B2B, legal/finance, dev tools |

### 4.3 Top 10 All-Time Styles (with rationale)

| # | Style | Skill | Why on the all-time list |
|---|---|---|---|
| 1 | **Bauhaus** | `style/bauhaus` | Pre-cursor to Swiss; primary colors + geometric forms still actively referenced in editorial/branding |
| 2 | **Swiss / International Typographic Style** | `style/swiss` | Foundational; direct lineage to flat, Material, Geist |
| 3 | **Memphis / Postmodernism** | `style/memphis` | Massive influence on current maximalism, Y2K revival, agency culture |
| 4 | **Rams-ian Industrial Minimalism** | `style/rams` | Distinct from Swiss (product-design lineage); influences Apple, Teenage Engineering, Braun-revival brands |
| 5 | **Digital Skeuomorphism (1984–2013)** | `style/digital-skeuomorphism` | Mac Classic → Forstall iOS; the antithesis Flat reacted against |
| 6 | **Web 2.0 / Glossy Gradients (2004–2010)** | `style/web-2` | Defining aesthetic of an entire web generation; ancestor of Frutiger Aero revival |
| 7 | **Frutiger Aero (2004–2013)** | `style/frutiger-aero-historical` | Wikipedia-recognized historical aesthetic with current cultural revival (its own slot here, distinct from #10 in §4.1) |
| 8 | **Flat Design (Metro / iOS 7)** | `style/flat` | Defining style of the 2010s; foundation for modern UI |
| 9 | **Material Lineage (1 → You → 3 Expressive)** | `style/material-lineage` | Tracks Material's evolution; reference for any product targeting Google ecosystems |
| 10 | **Web Brutalism (original + neo)** | `style/web-brutalism` | The recurring "raw HTML as statement" aesthetic across web history |

**Validated cuts vs v0.1:** Apple HIG Modernism (not distinct — it's Apple's evolving application of Swiss + skeu + flat + Liquid Glass); standalone Neumorphism (was a ~6-month Dribbble moment, not all-time significant — kept as a historical footnote inside the skeuomorphism family).

### 4.4 Supporting styles (worth knowing, not top-20)

Embedded in `references/styles-supporting/` but not promoted as default options: claymorphism (component-level only), neumorphism (with accessibility-failure documentation), organic/blob illustration, Notion-style hand-drawn illustration, digital grunge, vaporwave / cybernetic, retro pixel / 8-bit, Material You (within Material lineage), frosted acrylic / Mica (Microsoft Fluent).

### 4.5 Forbidden combinations (encoded as conflict rules)

The style purity auditor reads `references/forbidden-pairs.yaml`:
- Neo-brutalism + healthcare/finance/legal/government
- Liquid Glass + Android-primary
- Material 3 Expressive + iOS-primary
- Frutiger Aero + enterprise B2B
- Heavy 3D / scrollytelling + accessibility-critical or low-bandwidth
- Pure Cinematic Dark + elderly-primary personas
- Big editorial type + dense data tables / settings panels

---

## 5. Trigger description discipline

Every skill description is ≤1024 chars and follows the 4-part template (defense against Vercel's 56% under-trigger finding):

```
1. WHAT — one sentence on what the skill does.
2. WHEN to USE — explicit trigger phrases ("palette", "brand colors", "dark mode", "tokens", "tailwind theme", "shadcn variables", "globals.css", "OKLCH", "contrast", "WCAG", …)
3. WHEN NOT to USE — what this skill explicitly does NOT do, with a pointer.
4. UPSTREAM — what to run first if not already run (cites composition.upstream).
```

Every skill ships `evals/triggers.yaml` with ≥10 should-fire + ≥10 should-not-fire prompts; CI runs `skillgrade` and blocks merges on a regression.

---

## 6. MVP definition

The MVP proves one core promise: **a user can go from a brief and a repo to a working, themed, audited app shell in one command.**

### 6.1 In scope — split MVP

The MVP is **split into two releases** to keep each shippable:

#### v0.1 — Atoms + tokens (Wave 1 deliverable, ~5 weeks)

The smallest useful release: a user can generate a coherent token system standalone, without any workflow. Proves the atomic-composition substrate.

- **Layer 0 (3):** `product-tone-profiler`, `style-chooser`, `density-strategy`
- **Layer 1 — color (4):** `palette-strategy-chooser`, `palette-generator`, `dark-mode-mirrorer`, `contrast-auditor`
- **Layer 1 — typography (2):** `type-scale-builder`, `font-pairer`
- **Layer 1 — spacing (1):** `spacing/scale-builder`
- **Layer 1 — tokens (1):** `tokens/token-emitter`
- **Critics (2):** `contrast-auditor` (dual-listed), `style-purity-auditor` (stub form)
- **References:** `dtcg`, `radix`, `wcag-2-2`, `shadcn-tailwind-v4` only
- **Stack adapter:** `tailwind-v4` + `shadcn` only (plain-css fallback works but is not tested)
- **Host:** Claude Code is the host-first path; Codex CLI and Cursor are smoke-tested in sequential-fallback mode

#### v0.2 — Bootstrap workflow (Wave 2 deliverable, ~3 weeks after v0.1)

The headline JTBD. Adds the workflow layer over the v0.1 atom substrate.

- **Workflow:** `bootstrap-design-system` only
- **Layer 0 (+2):** `brand-archetype-mapper`, `ai-interface-pattern-chooser`
- **Layer 1 (+3):** `semantic-token-mapper`, `state-color-generator`, `reading-rhythm`, `spacing/grid-system`
- **Layer 2 (3):** `button`, `input`, `card`
- **Layer 3 (1):** `landing-page-skeleton` (hero-only minimum)
- **Layer 4 (2):** `style/geist-precision`, `style/expressive-editorial` — chosen because they are the most demonstrably different and the most clearly defensible against the "AI slop" baseline
- **Critics (+3):** `accessibility-auditor`, `taste-auditor`, `ai-slop-detector`
- **References (+4):** `apg`, `react-aria`, `material-3` (cite-only at this stage), `ai-ux-patterns`

`audit-ui` (W2) ships in **v0.3**, only after `bootstrap-design-system` passes its acceptance evals — it depends on the same critic suite being mature.

### 6.2 Out of scope for MVP

- Layer 3 compositions beyond `landing-from-brief` minimal
- Remaining 14 style codifiers
- SwiftUI / Vue / Svelte / Angular stack adapters
- Extraction workflow (W3)
- Redesign and maintain workflows (W4, W5)
- Component-patcher subagent
- AI-UX patterns as live skills (encoded as references only in MVP)
- `style-blender`
- Visual-recognition critic
- Curated 100-pair font library (ship with 25 in MVP)

### 6.3 MVP acceptance criteria

Each criterion is operationally measurable. Eval datasets, graders, trial counts, and false-positive ceilings are committed to `evals/`.

**v0.1 acceptance:**

1. **Atomic invocation works on the host-first path.** Each v0.1 skill, invoked standalone in Claude Code with no prior `.complete-design/` state, produces useful output for ≥9 of 10 hand-curated prompts per skill (3 trials each, semantic rubric). "Useful" = passes the skill's own structural validator and the rubric grader at ≥0.7.
2. **DTCG conformance.** 100% of token emits from v0.1 validate against DTCG v2025.10 schema in a `style-dictionary` test run.
3. **Contrast conformance.** 100% of generated palettes pass WCAG 2.2 1.4.3 / 1.4.11 contrast for all declared text/background pairs at AA, verified by the bundled `contrast.mjs` script.
4. **Trigger discipline.** Each v0.1 skill has ≥10 should-fire + ≥10 should-not-fire prompts; trigger recall ≥0.80, false-trigger rate ≤0.15.
5. **Sequential-fallback works on secondary hosts.** Same 10 prompts run on Codex CLI and Cursor; ≥0.75 pass.

**v0.2 acceptance (bootstrap workflow):**

6. **End-to-end bootstrap completes.** From a fixed test brief + a clean Next.js + Tailwind v4 + shadcn repo, `bootstrap-design-system` produces `.complete-design/DESIGN-DIRECTION.md`, `.complete-design/design-tokens.json`, projections to `globals.css` + Tailwind `@theme` + shadcn `:root`/`.dark`, 3 component files, 1 hero composition, and `CRITIQUE-REPORT.md` with terminal state ∈ {`PASS`, `PASS_WITH_WARNINGS`}. Tested across 5 brief variants, 3 trials each (15 runs total). ≥12 of 15 must reach PASS; ≤1 may reach FAILED_AFTER_REPAIR.
7. **Critic recall + precision.** On a curated corpus of 30 AI-slop UI samples + 30 hand-validated good samples, `ai-slop-detector` at medium strictness must reach ≥0.80 recall on the slop set, ≤0.10 false-positive rate on the good set.
8. **Visual regression captured.** Each bootstrap run produces a Playwright screenshot of the seed hero; the screenshot is attached to `CRITIQUE-REPORT.md` and is checked for non-trivial diff vs the prior run.
9. **Cost discipline.** Bootstrap workflow median ≤80k tokens (p90 ≤120k) across the 15 runs. Atomic skill median ≤8k tokens.
10. **Two-designer review.** One B2B + one consumer designer rate ≥4 of 5 bootstrap outputs as "would not be obvious as AI-generated to a non-designer" on a forced-choice rubric.
11. **Override capture works.** If a designer edits `DESIGN-DIRECTION.md` between runs, the next bootstrap preserves the edits and records them in `manual-overrides.json`; verified by a scripted test.

---

## 7. Roadmap

| Wave | Weeks | Deliverable | Milestone |
|---|---|---|---|
| 0 | 1–2 | Repo, eval harness, `references/` first cut (wcag, dtcg, radix, shadcn-tailwind, apg index), `assets/scripts/` (contrast, oklch, dtcg-lint), `complete-design-router` stub | infra ready |
| 1 | 3–5 | Layer 0 + Layer 1 (color, typography, spacing, tokens) + `tokens/token-emitter` (DTCG + Tailwind v4 + shadcn) | `@pm-musketeers/complete-design@0.1` — atom-only release; users can generate tokens end-to-end |
| 2 | 6–7 | `bootstrap-design-system` workflow + 6 style codifiers + 4 priority components + 4 critics | `@pm-musketeers/complete-design@0.2` — first JTBD release |
| 3 | 8–9 | `audit-ui` workflow + remaining critics + Layer 2 components (rest) + Layer 3 minimal | `@pm-musketeers/complete-design@0.3` — generation+audit closed loop |
| 4 | 10–12 | Remaining 14 styles + all compositions + redesign workflow | `@pm-musketeers/complete-design@0.4` — full style coverage |
| 5 | 13–14 | AI-UX live skills + `complete-design-bridges` (plain-CSS, Material Web, optional SwiftUI) + extraction workflow | `@pm-musketeers/complete-design@0.5` — public release candidate |
| 6 | 15–16 | Documentation, public skills.sh / Anthropic plugin marketplace listing, two-designer review, eval lift-vs-baseline measurement | `@pm-musketeers/complete-design@1.0` GA |

---

## 8. Success metrics

Each metric specifies dataset, grader, trial count, and ceiling. Targets are baseline-relative where possible.

| Dimension | Target | Measurement protocol |
|---|---|---|
| **Adoption** | 25k installs by Day 90 post-1.0 | `skills.sh` leaderboard + GitHub stars proxy |
| **Trigger recall** | ≥0.85 per-skill on canonical suite | Per-skill `triggers.yaml`: ≥10 should-fire prompts, 3 trials each, hosts ∈ {claude-code, codex-cli, cursor} |
| **False-trigger rate** | ≤0.15 per-skill | Per-skill ≥10 should-not-fire prompts, 3 trials each |
| **Cross-host variance** | per-host pass rate within 0.10 of host-first | Same eval suite run on all 3 hosts |
| **A11y conformance (own examples)** | 100% pass WCAG 2.2 AA contrast (1.4.3, 1.4.11) + 0 axe-core violations | `axe-runner.mjs` CI gate on every generator's `examples/` |
| **Lift vs baseline** | ≥15pp lift on 30-prompt blind aesthetic quality eval, vs. agent with no skill installed | Two-designer blind rating; B2B + consumer judges; forced-choice; 3 trials per prompt |
| **Cost discipline** | Bootstrap p50 ≤80k tokens, p90 ≤120k; atomic p50 ≤8k tokens | Run-cost telemetry on 15-run bootstrap suite + 100-run atom suite |
| **DTCG validity** | 100% of emits validate | `style-dictionary` parse test in CI |
| **Adapter compile** | Tailwind v4 + shadcn emits compile and render | Headless dev-server + Playwright smoke test |
| **Critic recall + precision** | `ai-slop-detector` ≥0.80 recall on slop corpus, ≤0.10 false-positive on good corpus | 30+30 hand-curated samples; medium strictness |
| **Override-preservation correctness** | 100% in scripted test | Edit `DESIGN-DIRECTION.md`, re-run, assert preserved + recorded in `manual-overrides.json` |
| **Terminal-state honesty** | 0 false `PASS` reports | Manual review of 30 random bootstrap runs; any `PASS` with audit findings = bug |

---

## 9. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Anthropic / Vercel absorb the category.** `frontend-design` could fork into a tokens-aware version. | High | High | Move fast on the workflow surface (none of them have it); embed harder-to-replicate canon references; stay framework-agnostic where they are framework-locked. |
| **DTCG spec evolves and breaks our emits.** | Medium | Medium | Version `references/dtcg/` independently; lock to v2025.10 with explicit upgrade evals. |
| **Skills under-trigger anyway.** Even with the template. | Medium | High | Treat trigger eval as a first-class CI gate; ship a `complete-design-router` orchestrator the user can call by name when ambient triggers miss. |
| **Style codifiers feel parochial.** Real designs blend styles. | Medium | Medium | Ship `style-blender` in v0.4 with explicit warnings; lean on the "marketing vs product" two-decisions framing per §2.2 trend 2. |
| **APCA becomes legal conformance.** | Low | Medium | Keep WCAG 2.x as the conformance standard; APCA as informational only. Already encoded. |
| **Vision-based extraction is unreliable.** Vision models classify style at ~60–70%. | Medium | Low | Ship extraction with explicit confidence markers (anydesign pattern); never auto-apply low-confidence inferences. |
| **Cross-host drift.** Codex / Cursor / Junie / Gemini handle SKILL.md slightly differently. | High | Medium | Ship cross-host eval harness in Wave 0; declare narrow `compatibility:` in MVP and expand. |
| **Reference corpus becomes stale (Material 4, iOS 27, Tailwind v5, DTCG v2026.x).** | Certain over time | Medium | Quarterly review cadence; each reference file carries a `knowledge-version` field; bumps re-run the skills that cite them. |
| **Token budget for the full bootstrap exceeds caps on hosts with small context (~Haiku-class).** | Medium | Medium | Workflow subagent dispatch keeps any single agent under ~120k tokens; skill bodies stay under 5k tokens; references load on demand. |

---

## 10. Open questions

| # | Question | Default lean |
|---|---|---|
| Q1 | Stack adapters in the core package vs `complete-design-bridges` companion | Split: core ships DTCG + Tailwind v4 + shadcn + plain CSS; bridges ship Material Web, SwiftUI, Vue/Svelte later |
| Q2 | Should style codifiers compose (e.g. "Bauhaus + Material")? | Strict atomicity; cross-style remixing is `style-blender` only |
| Q3 | Where do code framework outputs >40 lines live? | External `assets/components/<name>/*` templates; not inline in bodies |
| Q4 | Ship a vision "screenshot → style classification" skill? | Defer to v0.3+ as a critic (read-only), not a generator |
| Q5 | Curated icon-set bundle vs chooser? | Chooser only, no bundled icons |
| Q6 | `ai-slop-detector` strictness default? | Medium; document `--strictness=low/high` |
| Q7 | Vector store later? | Re-evaluate at v0.3 if reference corpus exceeds ~25 MB; sqlite-vec for portability |
| Q8 | i18n / RTL / CJK as first-class skills? | Critic + constraint notes embedded in every Layer 1–2 skill; promote if usage warrants |
| Q9 | Telemetry on slop-detector hits to improve the corpus? | Opt-in only; never default; anonymous if enabled |
| Q10 | Paid tier? | No paid skill features in v1.0; future GTM can layer a hosted critique / private-registry SKU |

---

## 11. Adoption strategy

**Distribution.** Publish on `skills.sh` (`npx skills add complete-design/<skill>`), the Anthropic plugin marketplace (`/plugin marketplace add`), and the JetBrains Skill Repository simultaneously at v1.0 launch. Use namespacing (`complete-design/*`) so users discover atoms as a family.

**Discovery.** Two flagship skills with the highest trigger surface:
- `complete-design/bootstrap` — the JTBD entry point; description matches "design system," "theme," "set up tokens," "make this look good," "redesign."
- `complete-design/audit` — the audit entry point; description matches "review my UI," "check accessibility," "audit contrast," "design review."

The remaining 83 skills install with them but discover via composition routing.

**Reference content.** Ship `references/` under a permissive license (Apache-2.0 for knowledge, MIT for code samples) — but the content itself is **summary and synthesis of canonical sources, not verbatim quotation**. Each reference file declares:

```yaml
source-class: summary | citation | original-heuristic
source:       <title, author, edition, year>
source-date:  <ISO date>
license-of-source: <copyrighted | open-license | spec | public-domain>
max-quote:    <chars, default 100>   # never excerpt longer than this
last-reviewed: <ISO date>
```

The package never ships chapter-length excerpts of copyrighted books (Bringhurst, Tidwell, Cooper, etc.). It ships *encoded rules* (measure 45–75ch, leading 1.4–1.6×, modular-scale ratios) with citation. This is the package's most defensible knowledge layer and the part competitors are least likely to clone faithfully — but it must stay on the right side of fair use.

**Partner integrations.** Pre-launch outreach:
- **Vercel skills.sh** — get reviewed; the bootstrap workflow could be featured.
- **Anthropic** — submit to the plugin marketplace; pitch the multi-skill composition as a worked example for other authors.
- **shadcn** — explicit compatibility with their `globals.css` template + `data-slot` pattern; cross-link.
- **Tokens Studio** — DTCG-compatible round-trip; cross-link.
- **Tessl Registry** — security-scored listing.

---

## 12. Out of scope (deliberately, with rationale)

- **A visual editor.** Subframe / Plasmic / v0 win that surface; the package is editor-native by design.
- **A hosted SaaS.** Every skill must run locally inside the user's agent; no API key requirement.
- **A scraping crawler.** `extract-design-system` (v0.5+) uses Playwright in the user's environment with their consent; the package does not run a hosted scraper.
- **Tokenized brand IP.** The package ships generic curated palettes and font pairs only; no brand-licensed material.
- **Replacement of Style Dictionary or Tokens Studio.** The package emits DTCG and integrates; it does not compete with build pipelines.
- **Replacement of Figma.** The package consumes Figma DTCG exports; it does not generate Figma files.

---

## 13. Comparison with v0.1 (what changed and why)

| Area | v0.1 sketch | v0.2 MRD | Why |
|---|---|---|---|
| Coverage of competitive landscape | Sketched | Verified, with installs and per-skill gaps (§2.5) | Required to defend the white-space claim |
| The "four primitives" framing | Implicit | Explicit (§1, §2.6) | Sharper positioning |
| Workflow layer | Mentioned | First-class with 6 named workflows, each a chained-skills + subagent procedure (§3.6) | The user explicitly asked for full JTBD execution alongside atomic invocation |
| Subagent architecture | Implicit | Explicit (§3.7) — 5 subagent types with bounded scope and fan-out rationale | Required to make multi-skill execution safe and parallel where possible |
| Persisted artifacts | Mentioned (`DESIGN-DIRECTION.md`) | First-class contract (§3.11) — 4 named files, read-and-written by every workflow | Closes the dice-roll loop competitive skills induce |
| Top 10 current styles | Confident but unverified | Validated against 6+ trend sources; 4 swaps applied (§4.1) | Geist precision, Material 3 Expressive, Cinematic Dark added; standalone soft-UI/anti-design demoted/merged |
| Top 10 all-time styles | Confident but unverified | Validated; Apple HIG Modernism cut (folded), Neumorphism cut; Web 2.0 and Frutiger Aero historical added (§4.2) | Better defensibility |
| Knowledge architecture | Hybrid file-based (correct in v0.1) | Same conclusion; specific 8-system must-encode list (§3.10) | Concrete enough to build |
| Reference corpus | Listed | Mandated: which 8 systems, which canon files, why each (§3.10) | Implementation-ready |
| Trigger discipline | Mentioned | First-class — 4-part template + ≥20-prompt eval suite per skill, CI-gated (§5) | The single biggest leverage point per Vercel's 56% finding |
| MVP | 5-wave roadmap | Concrete scope, acceptance criteria, success metrics, roadmap (§6–§8) | Production-ready plan |
| Risk register | Sketched | Top-10 risks with mitigations (§9) | MRD-grade |
| Adoption | Implicit | Distribution + partner outreach plan (§11) | Required for launch |

---

## 14. Codex review — acceptance record

This MRD was reviewed by an independent Codex pass before publication. Findings were triaged as ACCEPT (applied) or REJECT (with rationale). All 10 codex findings + all 5 missed opportunities were ACCEPTED; the changes appear in the revisions noted below.

| # | Severity | Finding | Disposition | Where applied |
|---|---|---|---|---|
| 1 | BLOCKER | Skill count math wrong (had 85, actual 89) | ACCEPT | §3.8 total + new §3.14 `manifest.json` as source of truth |
| 2 | BLOCKER | Cross-host portability overclaimed | ACCEPT | New §3.12 Host Compatibility Contract with capability matrix + sequential-fallback rule |
| 3 | HIGH | MVP too large and internally inconsistent | ACCEPT | §6.1 split into v0.1 (atoms + tokens) and v0.2 (bootstrap workflow); `audit-ui` moved to v0.3 |
| 4 | HIGH | Critique gating had no terminal states | ACCEPT | §3.6 W1 steps 13–16 add `PASS`/`PASS_WITH_WARNINGS`/`FAILED_AFTER_REPAIR`/`USER_OVERRIDDEN` + visual-regression step + PR-first diff |
| 5 | HIGH | Persistence had no merge policy | ACCEPT | §3.11 rewritten: `.complete-design/` layout, schema header, diff-before-write, manual-override detection, monorepo support, manifest.lock |
| 6 | HIGH | Atomic mode conflicted with "direction first" | ACCEPT | §3.2 P1 rewritten to require a standalone-bootstrap path in every atom |
| 7 | HIGH | Stack adapter design too thin | ACCEPT | New §3.13 with explicit adapter interface (`detect`, `can-emit`, `emit-tokens`, `emit-component`, `verify-compile`, `verify-a11y`, `unsupported-reason`) |
| 8 | MEDIUM | Style catalog mixed taxonomies | ACCEPT | New §4.0 Direction Model with 5 orthogonal axes (`visual_style`, `platform_language`, `layout_pattern`, `interaction_pattern`, `historical_reference`); reclassified entries |
| 9 | MEDIUM | Eval criteria not measurable | ACCEPT | §6.3 and §8 rewritten with datasets, graders, trial counts, false-trigger ceilings |
| 10 | MEDIUM | Citation policy risked bloat + licensing | ACCEPT | §3.2 P4 + §11 reference-content rewritten: cite at rule granularity, summary-not-excerpt policy, per-file source-class metadata |
| M1 | — | Visual regression screenshots missing | ACCEPT | W1 step 15 added; CRITIQUE-REPORT.md attaches Playwright before/after |
| M2 | — | PR-first workflow not default | ACCEPT | §3.11 point 4 + W1 step 16: diff-by-default, `--apply` required for direct write |
| M3 | — | Trigger traces missing | ACCEPT | §3.14 manifest carries trigger-eval data; per-skill `triggers.yaml` referenced from §8 |
| M4 | — | Host capability matrix as artifact | ACCEPT | §3.12 `compatibility-matrix.json` shipped with package, re-derived in CI |
| M5 | — | Human-correction feedback loop missing | ACCEPT | §3.11 `manual-overrides.json` is first-class; §6.3 criterion 11 requires correct preservation |

No findings were rejected. The MRD increased from ~620 to ~880 lines through these revisions.

**Codex verdict before revisions:** "Ready with substantial revisions, not ready to build from as-is."
**Status after revisions:** ready to begin Wave 0 (infra + references) implementation. A second review pass after `manifest.json` is authored is recommended before Wave 1 starts.

---

## 15. Glossary

- **Atom** — A single SKILL.md that does one decision-unit job (e.g., `palette-generator`).
- **Workflow** — A SKILL.md whose body is a procedure that chains atoms and dispatches subagents to fulfill a JTBD.
- **Subagent** — A task-scoped agent spawned by a workflow with stitched context (direction + relevant artifacts + stack target), not the full user request.
- **Direction** — The chosen aesthetic identity (style + tone + archetype), persisted in `DESIGN-DIRECTION.md`.
- **Tokens** — DTCG v2025.10 JSON values for color/type/spacing/motion/elevation, persisted in `design-tokens.json`.
- **Adapter / Projector** — A skill that projects DTCG tokens to one stack's native format (Tailwind v4 `@theme`, shadcn `:root`, Style Dictionary source, …).
- **Critic / Critique** — Read-only skill that audits and reports; never edits.
- **Style codifier** — A `style/<name>` atom that owns one named style and refuses to mix.
- **Slop tells** — The curated catalog of LLM-default UI defaults the package actively suppresses.
- **DTCG** — W3C Design Tokens Community Group format module; v2025.10 first stable.
- **APG** — WAI-ARIA Authoring Practices Guide (W3C); pattern reference for accessible components.
- **APCA** — Accessible Perceptual Contrast Algorithm (Andrew Somers); used here as informational signal only — WCAG 2.x remains conformance.
- **Knowledge version** — The version of `references/` content a skill assumes; bumping it re-runs the skill's eval suite.

---

## 16. Decision summary (the choices this MRD locks in)

1. **Package shape:** ~85 skills across 6 categories; both workflow orchestrators and atomic skills draw on the same skill set.
2. **Workflow primitives:** 6 named workflows (bootstrap, audit, extract, redesign, maintain, landing-from-brief / dashboard-from-brief).
3. **Subagents:** 5 bounded types (color, typography, spacing/motion, critique, component-patcher); never receive the raw user request.
4. **Persistence:** 4 named artifacts (`DESIGN-DIRECTION.md`, `design-tokens.json`, `CRITIQUE-REPORT.md`, `EXTRACTION-REPORT.md`) under the user's repo root.
5. **Token interchange:** DTCG v2025.10; project to Tailwind v4 `@theme`, shadcn `:root`/`.dark` (OKLCH), Style Dictionary source, plain CSS.
6. **Knowledge architecture:** hybrid file-based (frontmatter / body / `references/` / `assets/`); no vector DB, no knowledge graph in v1.
7. **Must-encode systems (8):** shadcn+Tailwind v4, Radix, React Aria, Material 3, WAI-ARIA APG, DTCG, Apple HIG Liquid Glass + Spectrum 2, AI-UX patterns.
8. **Must-encode canon files (12):** WCAG 2.2, typography (Bringhurst/Butterick/Brown), color (Itten/Radix/OKLCH), motion (Head/Material/HIG), forms (Wroblewski), charts (Few/Munzner), HAX 18, deceptive patterns (Brignull), Pickering, Roselli, Tidwell, microcopy (Polaris+Atlassian+NN/g).
9. **Style catalog:** 10 validated current + 10 validated all-time, with forbidden-pairs lint.
10. **APCA stance:** informational signal only; WCAG 2.x is conformance.
11. **Stack adapters in core:** Tailwind v4 + shadcn + plain CSS. Material Web, SwiftUI, Vue/Svelte → `complete-design-bridges` companion.
12. **Trigger discipline:** 4-part template; ≥20-prompt eval per skill; CI-gated.
13. **MVP wedge:** `bootstrap-design-system` end-to-end on Tailwind v4 + shadcn on three hosts (Claude Code, Codex CLI, Cursor).

---

## 17. Sources

### Competitive landscape (skills.sh / registry direct fetches, May 2026)
- skills.sh leaderboard; anthropics/skills; vercel-labs/agent-skills; shadcn-ui registry; arvindrk/extract-design-system; leonxlnx/taste-skill; pbakaus/impeccable; uxKero/anydesign; Anthropic plugin marketplace; Agensi.io; SkillsLLM; SkillsMP; LobeHub; JetBrains Skill Repository.

### Interaction & UX canon
- Tidwell, Brewer, Valencia. *Designing Interfaces*, 3rd ed. (O'Reilly, 2020).
- Norman. *The Design of Everyday Things*, revised &amp; expanded (Basic Books, 2013).
- Krug. *Don't Make Me Think, Revisited*, 3rd ed. (New Riders, 2014).
- Cooper, Reimann, Cronin, Noessel. *About Face*, 4th ed. (Wiley, 2014).
- Garrett. *The Elements of User Experience*, 2nd ed. (New Riders, 2010).
- Buxton. *Sketching User Experiences* (Morgan Kaufmann, 2007).
- Wroblewski. *Web Form Design* (Rosenfeld Media, 2008); *Mobile First* (A Book Apart, 2011).
- Brignull. *Deceptive Patterns* (Testimonium, 2023).
- Tufte. *The Visual Display of Quantitative Information*, 2nd ed. (Graphics Press, 2001).
- Few. *Information Dashboard Design*, 2nd ed. (Analytics Press, 2013).
- Munzner. *Visualization Analysis and Design* (CRC Press, 2014).
- Hall. *Just Enough Research*, 2024 ed. (A Book Apart, 2024).
- Goodwin. *Designing for the Digital Age* (Wiley, 2009).
- Rosenfeld, Morville, Arango. *Information Architecture*, 4th ed. (O'Reilly, 2015).

### Design-system canon
- Frost. *Atomic Design* (2016) — atomicdesign.bradfrost.com.
- Curtis (EightShapes). "Naming Tokens in Design Systems"; "Tokens in Design Systems"; "Reimagining a Token Taxonomy."
- Kholmatova. *Design Systems* (Smashing Magazine, 2017).
- Mall. *Design That Scales* (Rosenfeld Media, 2023).
- DTCG. *Design Tokens Format Module* v2025.10 — designtokens.org.
- Style Dictionary — styledictionary.com.

### Typography canon
- Bringhurst. *The Elements of Typographic Style*, v4.0 / 20th anniversary (Hartley &amp; Marks, 2012).
- Butterick. *Butterick's Practical Typography*, 2nd ed. (practicaltypography.com, 2018).
- Brown. *Flexible Typesetting* (A Book Apart, 2018).
- Santa Maria. *On Web Typography* (A Book Apart, 2014).
- Lupton. *Thinking with Type*, 2nd revised &amp; expanded (Princeton Architectural Press, 2010).

### Color canon
- Albers. *Interaction of Color*, 50th anniversary (Yale University Press, 2013).
- Itten. *The Art of Color* (Wiley reprint).
- Stone. *A Field Guide to Digital Color* (CRC Press, 2003).
- Wathan &amp; Schoger. *Refactoring UI* (self-published, 2018).
- Radix Colors — radix-ui.com/colors.
- Sitnik (Evil Martians). "OKLCH in CSS" (2022+).
- Somers. APCA / SAPC documentation — apcacontrast.com.

### Accessibility canon
- WCAG 2.2 (W3C Recommendation, 5 Oct 2023; ed. update 12 Dec 2024).
- Pickering. *Inclusive Components* (Smashing Magazine, 2019/2021).
- Pickering. *Inclusive Design Patterns* (Smashing Magazine, 2016).
- Soueidan. practicalaccessibility.today; sarasoueidan.com.
- Roselli. adrianroselli.com — "Under-Engineered" series.
- W3C WAI-ARIA Authoring Practices Guide — w3.org/WAI/ARIA/apg/.

### Motion canon
- Head. *Designing Interface Animation* (Rosenfeld Media, 2016).
- Nabors. *Animation at Work* (A Book Apart, 2017).
- Material Motion — m3.material.io/styles/motion.
- Apple HIG — Motion — developer.apple.com/design/human-interface-guidelines/motion.

### Design systems & components
- Material Design 3 / Expressive — m3.material.io.
- Apple HIG / Liquid Glass — developer.apple.com/design/human-interface-guidelines/.
- Microsoft Fluent UI 2 — fluent2.microsoft.design; @fluentui/react-components v9.
- Shopify Polaris — polaris.shopify.com; @shopify/polaris-tokens; Polaris Web Components (Oct 2025).
- IBM Carbon v11 — carbondesignsystem.com.
- Atlassian Design System — atlassian.design.
- Salesforce SLDS 2 (GA Winter '26) — lightningdesignsystem.com.
- Adobe Spectrum 2 (v1.0 Dec 2025) — s2.spectrum.adobe.com; React Spectrum / React Aria.
- GitHub Primer — primer.style.
- Ant Design v6 — ant.design.
- SAP Fiori (Horizon) — experience.sap.com/fiori-design-web/.
- shadcn/ui — ui.shadcn.com; data-slot, components.json, globals.css template.
- Radix Primitives / Themes / Colors — radix-ui.com.
- React Aria + React Aria Components — react-spectrum.adobe.com/react-aria/.
- Ariakit — ariakit.org.
- Tailwind v4 + Catalyst — tailwindcss.com; catalyst.tailwindui.com.
- Plate.js — platejs.org.
- Origin UI / Aceternity / Magic UI / Kibo UI / Park UI — registry references.

### AI-UX canon
- Macfadyen. *Designing AI Interfaces* (O'Reilly, April 2026).
- Amershi et al. "Guidelines for Human-AI Interaction" (CHI 2019) and HAX Toolkit.
- Shneiderman. *Human-Centered AI* (Oxford University Press, 2022).
- Anthropic. Building Effective Agents (Schluntz &amp; Zhang, Dec 2024); prompting guide; tool-use guide.
- Appleton. Language Model Sketchbook — maggieappleton.com.
- Wattenberger. wattenberger.com.
- Litt. Malleable Software (Ink &amp; Switch, 2025); geoffreylitt.com.
- Vercel AI SDK UI — ai-sdk.dev / sdk.vercel.ai.
- Smashing Magazine. "Designing Agentic AI: Practical UX Patterns" (Feb 2026).
- CopilotKit. "Developer's Guide to Generative UI in 2026."

### Style trends & validation
- Webflow. *8 web design trends to watch in 2026*; *2026 State of the Website Report*.
- Muzli. *Web Design Trends 2026*; *UI Design Trends in 2025*.
- Smashing Magazine. UI category; Claymorphism analysis.
- Nielsen Norman Group. *Neobrutalism: Definition and Best Practices*; *The UX Reckoning: 2025 and Beyond*.
- UX Collective. *Most popular experience-design trends of 2026*; *10 UX design shifts you can't ignore in 2026*; *Material 3 Expressive*.
- Figma. *Top Web Design Trends for 2026*.
- Apple. Liquid Glass announcement (June 2025) + Developer documentation + New Design Gallery.
- Google. Material 3 Expressive launch (2025); 9to5Google Material 3 Expressive recap.
- Setproduct. *Vercel Aesthetic / Blueprint Grid* deep dive.
- basement.studio. *Scaling Vercel*.
- Creative Boom. *50 fonts popular with designers in 2026*.
- It's Nice That. *Graphic trends 2026*.
- Kittl. *Frutiger Aero comeback 2026*.
- Strickland Technology. *Digital Brutalism*.
- Friedman. *Brutalism &amp; Anti-Design: Raw, Unpolished Web Revolution*.
- Envato. *Top 3D Design Trends for 2025*.

### Microcopy canon
- Nielsen Norman Group — nngroup.com.
- Mailchimp Voice &amp; Tone — styleguide.mailchimp.com.
- Shopify Polaris Content — polaris.shopify.com/content.
- Atlassian Design content guidelines — atlassian.design/content.

### Critical / anti-pattern canon
- Brignull. *Deceptive Patterns* (2023).
- Greenfield. *Radical Technologies* (Verso, 2017).
- Monteiro. *Ruined by Design* (Mule Books, 2019).

### Spec / standards
- agentskills.io v1 (Anthropic, 18 Dec 2025).
- W3C DTCG Format Module v2025.10 (28 Oct 2025).
- W3C WAI WCAG 2.2 Recommendation (5 Oct 2023; ed. update 12 Dec 2024).
- W3C WAI-ARIA Authoring Practices Guide.

---

*End of MRD v0.2. Next: Codex read-only review pass per the user's instruction, then targeted revisions before publication.*
