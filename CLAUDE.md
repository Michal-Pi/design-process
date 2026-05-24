<!-- GSD:project-start source:PROJECT.md -->
## Project

**design-os**

A SKILL.md package (Claude Code / Cursor / Codex / Junie) that scaffolds the canonical 5-stage design process — Research → IA → Low-Fi → Interaction → Hi-Fi + Design System — inside the coding agent the user already uses. Unlike Lovable / v0 / Bolt / Subframe / Figma Make / Claude Design which all jump straight to Stage 5 hi-fi generation, design-os walks the full Garrett spine (Strategy → Scope → Structure → Skeleton → Surface) with AI scaffolding at each stage and explicit validation gates between them.

**Core Value:** **The 5-stage design process, operationalized as an agent-loop workflow with stage-typed artifacts in `design/` and validation gates between stages — so prototypes don't break at production scale.** If everything else fails, this must work: a user runs `design --route new-product` on a fresh PRD, and at the end has a real `design/` directory with research, IA, IxD, hi-fi, and a DESIGN.md contract — each stage gated, each gate cited to canon.

### Constraints

- **Tech stack — distribution:** SKILL.md package per agentskills.io v1 spec. Compatibility: claude-code, codex-cli, cursor, junie, copilot (host-first Claude Code; sequential-fallback Codex + Cursor).
- **Tech stack — assets:** Vite + Next + Astro adapters for preview; Playwright for screenshots; Excalidraw JSON, Mermaid, XState v5 as artifact formats; DTCG v2025.10 for tokens; Google DESIGN.md spec.
- **Tech stack — references corpus:** organized by stage + canon body. Local Markdown only (no vector DB, no knowledge graph in v2).
- **Trigger budget:** Codex 2% metadata cap — ≤24 triggerable skills total; per-skill descriptions ≤200 chars. Per-skill `skillgrade` CI gates regressions.
- **Cost budget:** see R23. Full `design` workflow ≤150k tokens p50, ≤220k p95. Stage-bounded subagent dispatch with stitched context to avoid context-window blowouts.
- **Timeline:** 14 weeks to GA. v1.5 infra weeks 1-3 → v2.0a skeleton weeks 4-8 → v2.0b full 5 stages weeks 9-12 → RC week 13 → GA week 14.
- **License:** Apache-2.0.
- **Trust posture (non-negotiable):** never claim WCAG conformance; never use synthetic personas as primary research; never auto-publish to git tree (diff-by-default, `--apply` required); never lead with "AI" framing.
- **Determinism:** LLM picks; scripts emit. Golden tests + decision log + hash chain + `design-os verify --golden` CI gate.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Stack split (read this first)
| Layer | What it is | Lives where |
|---|---|---|
| **(a) What design-os ITSELF ships** | The SKILL.md package, its `references/` corpus, `assets/scripts/` (Node deterministic emitters), eval/CI harness | The published agentskills.io v1 package — installed into the user's `.claude/skills/` or equivalent |
| **(b) What design-os GENERATES for the user** | `design/` artifacts: PRD.md, persona JSON, sitemap.json, Mermaid flows, Excalidraw wireframes, XState machines, DTCG tokens, DESIGN.md, component scaffolds | The user's repo |
| **(c) What design-os READS from the user's repo** | The user's existing PRD, framework (Vite/Next/Astro), tokens (if any), shadcn/Tailwind config, existing components | The user's repo |
## Recommended Stack
### (a) Core technologies — what design-os itself ships
| Technology | Version | Purpose | Why Recommended |
|---|---|---|---|
| **agentskills.io v1 SKILL.md spec** | v1 (stabilized 2025-12-18) | Distribution unit; cross-host portability | The MRD locks this. v1 is now the open standard; supported in Claude Code, Cursor, Codex CLI, Junie, Copilot (VS Code Agent Skills, GA 2026). Two required frontmatter fields (`name`, `description`); `compatibility` and `allowed-tools` optional/experimental. Treat `compatibility` as best-effort, not enforceable. ([spec](https://agentskills.io/specification), [agensi reference](https://www.agensi.io/learn/skill-md-format-reference)) |
| **Markdown + YAML frontmatter** | CommonMark + YAML 1.2 | Skill bodies, references corpus, generated artifacts (PRD, JTBD, gates) | Per the MRD's §3.6 + §3.10 + every host's SKILL.md loader. Frontmatter parsed by `gray-matter` in adapter scripts; never invent a new format. |
| **Node.js** | **22 LTS** (also support 20 LTS) | Runtime for `assets/scripts/` deterministic emitters (`oklch.mjs`, `contrast.mjs`, `dtcg-lint.mjs`, `design-md-validate.mjs`, `state-machine-emit.mjs`) | Node 22 is current LTS; matches Playwright 1.59+ bundled runtime. Avoid Node 21 (odd-numbered, unsupported in Vite 6+). |
| **TypeScript** | **5.7+** (strict mode, `"target": "ES2022"`, `"module": "NodeNext"`) | Type-checked deterministic scripts + adapter source | Per CLAUDE.md universal rule: strict mode, no `any`, `unknown` + Zod guards at boundaries. Scripts compiled with `tsx` or shipped as `.mjs` after a `tsc --emit` step; do **not** ship raw TypeScript to consumers. |
| **Zod** | **4.4.x** (current: 4.4.3) | Runtime schema validators for `persona.json`, `sitemap.json`, `MANIFEST.md` frontmatter, audit-report, DTCG token files, Excalidraw JSON | Zod 4 stable, 14× faster string parsing, ~57% smaller bundle; `.meta()` annotations let us co-locate doc-generation metadata with the schema. Pair with `zod-to-json-schema` to emit the versioned JSON Schemas R24 calls out as a v1.5 prerequisite. ([Zod v4 notes](https://zod.dev/v4), [InfoQ summary](https://www.infoq.com/news/2025/08/zod-v4-available/)) |
| **`gray-matter`** | 4.0.x | Parse YAML frontmatter from PRD / SKILL.md / artifact files | De facto standard; battle-tested; ESM-friendly. |
| **`yaml` (eemeli/yaml)** | 2.x | YAML 1.2 round-trip writer for emitting artifact frontmatter (preserves comments) | js-yaml does NOT round-trip cleanly; `yaml` does. Critical for any artifact we both read and write. |
| **`ajv`** | 8.x | JSON Schema validation when consuming/emitting DTCG, Excalidraw, XState machine JSON | DTCG ships as JSON; we validate every emit against the published 2025.10 schema. `ajv-formats` for `application/design-tokens+json` extension. |
| **`culori`** | 4.x (ESM) | OKLCH ↔ sRGB / OKLab / contrast math in `assets/scripts/oklch.mjs` + `contrast.mjs` | CSS Color Module 4 reference implementation in JS. Tailwind v4 ships OKLCH defaults; DESIGN.md spec is OKLCH-ready. Native ESM in v1.0+. ([culorijs.org](https://culorijs.org/)) |
| **`apca-w3` + `@bjornlu/wcag-contrast`** | latest | WCAG 2.2 contrast measurement (we REPORT measured, we never CLAIM "compliant") | Per P8: emit "WCAG 2.2 AA contrast 4.7 (pass)" — never "WCAG-compliant". Two libs because APCA is the modern direction but WCAG ratios are still what auditors quote. |
| **Playwright** | **1.60.x** (`@playwright/test`) | Stage 5a variant screenshots; visual regression for golden tests; readiness probes for spawned dev servers | Locked to LTS per Microsoft's tested Node 22 matrix. The MRD's preview harness preserved from v1.0.1 depends on this. Browsers (Chromium 147 / Firefox 148 / WebKit 26.4) bundled. ([release notes](https://playwright.dev/docs/release-notes)) |
| **`vitest`** | 2.x | Unit tests for deterministic scripts; runs the `evals/` golden tests + schema-validation tests | First-party Vite ecosystem fit; ESM-native; fastest for our small TS surface. |
| **`tsx`** | 4.x | Run TS scripts directly (`tsx assets/scripts/oklch.mts ...`) without precompile in dev | Replaces ts-node; native Node 20+ ESM loader. Production scripts are precompiled `.mjs`. |
### (a-cont) Eval / CI harness — design-os's own quality gates
| Technology | Version / Status | Purpose | Why Recommended |
|---|---|---|---|
| **`skillgrade`-style trigger harness** | Build in-tree (no shipped OSS yet) | Per-skill ≥10 should-fire + ≥10 should-not-fire prompts × 3 trials; recall ≥0.85; false-trigger ≤0.15 (R15) | Anthropic's "Skills 2.0" introduced the same pattern in skill-creator (eval framework + A/B + trigger tuning) but there is **no standalone npm `skillgrade` package as of May 2026**. Implement in-tree per the MRD §5; design the format so we can adopt the Anthropic harness when it ships externally. LOW confidence on availability. ([Anthropic skill-creator post](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)) |
| **Aggregate coexistence eval** | In-tree | Per R15 + §11: trigger recall ≥0.80 with 5+ other popular skill packages installed alongside | No off-the-shelf tool. Build harness that installs `frontend-design`, `extract-design-system`, and the top-3 unrelated Anthropic skills into a fixture, runs the trigger eval. |
| **`axe-core`** | **4.11.x** (current: 4.11.4) | `axe-runner.mjs` CI gate per success metric "100% pass WCAG 2.2 AA contrast on own examples" | Industry-standard accessibility engine; 57% WCAG issue detection automated. Pair with Playwright for headless runs. ([npm](https://www.npmjs.com/package/axe-core)) |
| **GitHub Actions** | n/a | CI: schema validation, trigger eval per skill, axe-runner, golden tests, coexistence eval | Apache-2.0 OSS standard. Build matrix per host (Claude Code / Codex / Cursor). |
### (b) Artifact format pinning — what design-os generates
| Format | Version | Stage | Why this exact pin |
|---|---|---|---|
| **W3C DTCG Design Tokens** | **2025.10** (first stable, 2025-10-28) | 5b | First stable spec; media type `application/design-tokens+json`; `.tokens` / `.tokens.json` extension; primitive→semantic→component tiers supported via `$type` + groups. R11 + P3 lock this. ([DTCG announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), [spec](https://www.designtokens.org/tr/2025.10/format/)) |
| **Google DESIGN.md** | **April 2026 open-source release** (Apache-2.0, `google-labs-code/design.md`) | 5b | Markdown + YAML frontmatter; tokens in frontmatter, rationale in body. We **emit** with our `$extensions.design-os` carrying structured token + composition data per §15. Track upstream; schema may evolve (animations / dark-mode / breakpoints still under discussion). MEDIUM confidence on schema stability over 14 weeks. ([repo](https://github.com/google-labs-code/design.md), [Google blog](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/)) |
| **Excalidraw JSON** | element schema v2 (current `@excalidraw/excalidraw` 0.18+) | 3 | Excalidraw's `.excalidraw` JSON: `{ type, version, source, elements[], appState, files }`. Generate via `convertToExcalidrawElements()` from skeleton format — do **not** hand-build raw element JSON. MIT-licensed. ([docs](https://docs.excalidraw.com/docs/codebase/json-schema)) |
| **Mermaid** | **11.15.x** (npm `mermaid` latest) | 2 (flowchart), 4 (stateDiagram-v2) | `flowchart` for user flows (Stage 2); `stateDiagram-v2` for designer-readable state machines (Stage 4, the canonical designer artifact per §3.22 / open-Q2). XState is the engineering parallel artifact, not a replacement. Render via `@mermaid-js/mermaid-cli` headless. ([npm](https://www.npmjs.com/package/mermaid)) |
| **XState v5** | **5.20.x** (`xstate@5.20.1` per Context7) | 4 | The MRD's IxD machine format. v5 actor-model + setup() pattern + `assign` actions. **Required only** for components with async + ≥3 states + conditional transitions (§3.22 — codex finding). For everything else, Mermaid is enough. (Context7: `/statelyai/xstate`) |
| **Markdown + YAML frontmatter (canonical artifacts)** | CommonMark + YAML 1.2 | all | Per-artifact frontmatter schema in §3.6: `artifact`, `stage`, `generated`, `schemaVersion`, `sourceHash`, `provenance`, `owner`, `lastReviewedAt`. Versioned per R24. |
| **Persona JSON** | `schemaVersion: 1` (we own the schema) | 1 | Custom schema validated by Zod + emitted as JSON Schema for external consumers. `provenance` field is the synthetic-persona red line carrier (P12). |
| **Sitemap JSON (custom `$type` schema)** | `schemaVersion: 1` (we own) | 2 | Custom DTCG-style schema per §3.6. Sibling Mermaid flowcharts for human-readable. |
| **Optimal Workshop CSV (tree-test results)** | their export format | 2 | Read-only ingestion at the boundary; never produce. v2.1+. |
### (b-cont) Stack adapters — what design-os generates *into* the user's stack
| Adapter target | Version (what we expect/emit) | Why |
|---|---|---|
| **Tailwind CSS v4** | **4.1.x** (CSS-first `@theme` config, OKLCH defaults, Oxide engine) | Lingua franca of LLM-generated React UI. CSS-first config aligns 1:1 with DTCG token tiers — emit `@theme { --color-primary-500: oklch(60% 0.2 270); }`. ([v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4)) |
| **shadcn/ui** | latest (2026-Q2 — components are copy-paste; pin in eval fixture) | Default React component target. Per CLAUDE.md shadcn rule, generated wrappers in `components/`; never modify `components/ui/` directly. Tailwind v4 compatibility confirmed by shadcn. ([shadcn tailwind-v4 docs](https://ui.shadcn.com/docs/tailwind-v4)) |
| **Plain CSS** | Modern CSS (CSS Color 4, `@layer`, `oklch()`) | Fallback for projects not on Tailwind. Emit raw `:root { --color-primary: oklch(...); }`. |
| Material Web / Vue / Svelte | n/a | Out-of-core; ships as `design-os-bridges` companion in v2.1+ per MRD §3.15. **Not** in v2.0a/b. |
### (c) Preview-adapter targets — what design-os DETECTS in the user's repo
| Framework | Version supported | Adapter responsibility |
|---|---|---|
| **Vite** | **6.x** (current; Node 20+, Environment API; v7 also acceptable) | Spawn `vite dev --port <managed>`, await ready signal, screenshot via Playwright. ([Vite 6 announcement](https://vite.dev/blog/announcing-vite6)) |
| **Next.js** | **15.x** (App Router stable; Turbopack-ready; React 19 supported) | Spawn `next dev`, await ready, Playwright. App Router only — no Pages Router in v2.0a/b. ([Next.js 15 blog](https://nextjs.org/blog/next-15)) |
| **Astro** | **5.x** (Content Layer stable, server islands; v6 acceptable) | Spawn `astro dev`, await ready, Playwright. Static-first sites + content-driven products. ([Astro 5](https://astro.build/blog/astro-5/)) |
## Supporting Libraries
| Library | Version | Purpose | When to Use |
|---|---|---|---|
| `@mermaid-js/mermaid-cli` | 11.x | Headless Mermaid render to SVG/PNG for stage-2 + stage-4 previews | Only in preview/render pipeline; not at SKILL.md load time |
| `@excalidraw/mermaid-to-excalidraw` | latest | Mermaid → Excalidraw conversion for Stage 3 sketch seeding | Optional Stage 3 atom `lowfi/from-mermaid` (v2.1+) |
| `style-dictionary` | 4.x | Reference projection target for DTCG → Tailwind v4 / shadcn / plain CSS | Used as a validation oracle in `tokens/emit` tests, not a runtime dependency |
| `js-yaml` | — | **Do not use** for round-trip writes | Use `yaml` (eemeli/yaml) instead |
| `commander` | 12.x | CLI parsing for `assets/scripts/*.mjs` (e.g., `dtcg-lint.mjs --file ...`) | Only inside deterministic emitters; SKILL.md body invokes via Bash |
| `pino` | 9.x | Structured logging for `.design-os/private/run-log.jsonl` | Per v1.0.1 §3.18 run logs spec |
| `globby` | 14.x | File discovery for `design/` walking | Adapter scripts only |
| `semver` | 7.x | `schemaVersion` comparison for artifact backwards-compat checks | Anywhere we load a versioned artifact |
## Development Tools
| Tool | Purpose | Notes |
|---|---|---|
| **`tsc --noEmit`** | Strict TypeScript checking on adapter source | Hooked into CI; `"strict": true`, `"noUncheckedIndexedAccess": true` |
| **`eslint` + `@typescript-eslint`** | Lint adapter source + scripts | Config: forbid `any`, forbid `// @ts-ignore` without justification (CLAUDE.md universal rule) |
| **`prettier`** | Format TS + Markdown | Pin via `.prettierrc`; run in pre-commit hook |
| **`tsup`** | Bundle adapter scripts to single `.mjs` per script for shipping | Avoids requiring users to `npm install` design-os's deps |
| **`changesets`** | Version + changelog management for the SKILL.md package | Maps to `version:` frontmatter in skill manifest |
| **`gh` CLI** | GTM cross-post automation; release PRs | Per CLAUDE.md commit/PR conventions |
| **`playwright install --with-deps chromium`** | One-time browser binary install in CI | Cache binaries between runs |
## Installation
# Inside the design-os repo (build/CI):
# Core
# Render + preview
# Dev
# After install (one-time):
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| **Mermaid stateDiagram-v2 as designer-readable + XState as dev artifact** | XState as primary | Never. Codex finding §16 + §3.22: XState alone overfits engineering. Mermaid is canonical for designers; XState appears only when async + ≥3 states + conditional transitions. |
| **Excalidraw JSON for low-fi** | TLDraw, Whimsical export, hand-drawn SVG | Excalidraw is MIT-licensed, has stable JSON, has programmatic generation via `convertToExcalidrawElements`, and is the de facto LLM-friendly low-fi format. TLDraw's JSON is less stable. Whimsical has no open export. |
| **DTCG v2025.10** | Tokens Studio JSON (legacy), Style Dictionary proprietary, Figma Variables JSON | DTCG is now W3C stable + multi-vendor backed. Tokens Studio + Style Dictionary both target DTCG output. Figma Variables JSON is a one-way export, not an interchange. |
| **Zod 4** | Valibot, ArkType, TypeBox, raw JSON Schema + Ajv | Zod 4 is now performance-competitive (14× faster than v3). Valibot wins on bundle size for browser; we run in Node, so it's a non-factor. ArkType is fast but smaller ecosystem. Raw JSON Schema is what we *emit* for external consumers (via `zod-to-json-schema`) — but we *author* in Zod. |
| **Playwright** | Puppeteer, Selenium, Cypress | Playwright is multi-browser (matches the screenshot-variants requirement), first-party Microsoft, bundled browser binaries. v1.0.1 already chose this; preserved. |
| **Node 22 LTS** | Bun, Deno | Bun's npm compatibility still has rough edges with the long tail of design-tool packages (axe, culori ESM, gray-matter). Deno requires shimming for `gray-matter` and friends. Stick with Node LTS for the package; users may run their *app* on Bun/Deno — design-os doesn't care. |
| **Local Markdown `references/` corpus** | Vector DB (Pinecone, Chroma), knowledge graph (Memgraph) | The MRD explicitly forbids these in v2 (§3.10, §16). Markdown only. The reason is determinism + cost + zero infra dependency for users. |
| **Vite 6 + Next 15 + Astro 5 adapters** | Remix, Nuxt, SvelteKit, RedwoodJS | The MRD scopes preview adapters to Vite/Next/Astro for v2.0. Others ship via `design-os-bridges` companion in v2.1+. |
| **Astro 5** | Astro 6 | Astro 6 stable per March 2026 articles; 5 is the conservative LTS-like pin for v2.0 GA (June 2026). Re-evaluate at v2.1. MEDIUM confidence — verify against Astro release cadence at v1.5 kickoff. |
## What NOT to Use
| Avoid | Why | Use Instead |
|---|---|---|
| **React / Next / Vue / Svelte in design-os itself** | The package ships as SKILL.md + Node scripts. Shipping a frontend framework would (a) bloat the package past Codex 2% cap, (b) lock to a runtime, (c) violate "inside the user's agent" principle | Plain Markdown + Node `.mjs` scripts. Frameworks appear only as ADAPTER TARGETS for user-repo output. |
| **Vector DB / RAG / Embeddings (Pinecone, Chroma, FAISS, Weaviate)** | MRD §3.10 + §16 explicitly forbids. Determinism + zero-infra principle | Local Markdown `references/`. LLM reads on demand via Read tool. |
| **Knowledge graph (Memgraph, Neo4j, RDF)** | Same as above | Local Markdown |
| **A separate package manager (pnpm/yarn workspaces) at user install** | Users install via host skill installer, not npm. Workspaces add no value | Plain `npm` in the design-os build repo only |
| **`js-yaml` for round-trip writes** | Does not preserve comments or quote styles; corrupts frontmatter on rewrite | `yaml` (eemeli/yaml) v2 |
| **ts-node** | Deprecated for ESM; replaced by tsx + native Node loader | `tsx` v4 |
| **`puppeteer`** | Single-browser; superseded by Playwright for our screenshot-variants need | `@playwright/test` |
| **Synthetic-persona generation as Stage 1 PRIMARY output** | NN/g 2024 red line; MRD P12 + §3.22 hard-blocks `VALIDATED` grade | Generate as `PROTO`-grade with `provenance: generated`; require `ASSUMPTIONS.md` |
| **WCAG conformance CLAIMS in output** | P8 trust posture; not legally defensible | Report MEASURED contrast: "WCAG 2.2 AA contrast 4.7 (pass)" |
| **Auto-publishing to user's git tree** | Trust posture — diff-by-default; `--apply` required | Write to `.design-os/preview/` first; surface diff; await user confirm |
| **CommonJS** | Vite 6 + Mermaid 11 + culori 1+ + Excalidraw + Playwright are all ESM-only or ESM-first | Pure ESM (`"type": "module"`) throughout design-os |
| **Tailwind v3** | Old config-file model, no OKLCH defaults, doesn't align with DTCG `@theme` | Tailwind v4 (CSS-first `@theme`, OKLCH) |
| **Node 18, 21, 23 (odd)** | 18 EOL April 2025; 21/23 are non-LTS; Vite 6 dropped 18 | Node 22 LTS (also 20 LTS) |
| **Pages Router (Next.js)** | App Router is stable since Next 13.4 (May 2023); receives all new investment | Next.js App Router only |
| **`@types/excalidraw`** | Package ships its own types in `@excalidraw/excalidraw` | Use first-party types |
| **Confluence / Asana / Monday / Jira PRD ingestion** | No standard format per MRD §4 | Markdown + paste + interview mode in MVP; Notion / Linear / Google Doc in v2.1 |
## Stack Patterns by Variant
- Use the Vite adapter to spawn `next dev` (Next 15+ uses Turbopack by default)
- Detect tokens via the shadcn `cn()` + Tailwind `@theme` config
- Emit `design/tokens.json` (DTCG) + `app/globals.css` `@theme` block + `design/DESIGN.md`
- Generate component scaffolds in `components/` (NOT `components/ui/` per CLAUDE.md shadcn rule)
- Use the Vite adapter directly
- Emit plain CSS custom properties + `design/tokens.json`
- Component scaffolds go in `src/components/`
- Use the Astro adapter; Astro Content Layer is read-only from our perspective
- Emit DTCG tokens + Astro-friendly CSS variables
- Defer component scaffolding (`system/scaffold-component`) to user choice; Astro's `.astro` files are not in v2.0a/b adapter list
- Adapter spawns Vite as a fallback to mount the prototype's exported source
- `audit --reverse-engineer` infers Stage 1-4 from the rendered UI per MRD §6 / §9.2
- Sequential-fallback adapter pattern from v1.0.1 §3.12
- No parallel subagents; one-shot stages
- Trigger eval must still pass within 0.10 of Claude Code (R15 + §11)
## Version Compatibility
| Package A | Compatible With | Notes |
|---|---|---|
| Node 22 LTS | Playwright 1.60.x | Bundled browsers tested matrix per Playwright release |
| Node 22 LTS | Vite 6.x | Vite 6 requires Node 20+; Node 22 is the production target |
| Node 22 LTS | culori 4.x (ESM) | Native ESM; works with `"type": "module"` |
| Tailwind v4.1 | shadcn/ui (2026 cohort) | Confirmed by shadcn `tailwind-v4` docs |
| TypeScript 5.7 | Zod 4.4 | Zod 4 redesigned generics for TS 5.4+; 5.7 is well within range |
| Mermaid 11.15 | `stateDiagram-v2` | v2 is the modern unified-v3-renderer implementation; the diagram type to use |
| XState 5.20 | `@xstate/inspect`, `@xstate/react` | If user wants visualization in their app; not a design-os dependency |
| DTCG 2025.10 | Style Dictionary 4.x | SD 4 has DTCG output transforms; useful as test oracle |
| DESIGN.md (April 2026) | DTCG 2025.10 | DESIGN.md frontmatter token format aligns with DTCG; treat DESIGN.md as a "DTCG + rationale" wrapper |
| agentskills.io v1 | Claude Code, Codex CLI, Cursor, Junie, Copilot (VS Code Agent Skills) | `compatibility:` field is experimental; treat as documentation, not enforcement |
| Zod 4 | `zod-to-json-schema` 3.x | Required to emit JSON Schemas per R24 |
## Confidence Assessment
| Item | Confidence | Source quality |
|---|---|---|
| agentskills.io v1 spec stability + frontmatter shape | HIGH | Official spec + agensi reference doc |
| DTCG v2025.10 first stable, media type, multi-file | HIGH | W3C DTCG announcement (2025-10-28), official spec |
| Google DESIGN.md April 2026 OSS release, Apache-2.0 | HIGH | Google blog + GitHub repo |
| DESIGN.md schema stability over 14-week build window | MEDIUM | Spec explicitly says "may change" — animations, dark-mode, breakpoints unresolved |
| Tailwind v4.1 stable + OKLCH defaults + CSS-first | HIGH | Tailwind blog (Jan 2025 v4.0, Apr 2025 v4.1) |
| Next.js 15 stable, App Router, Turbopack-ready | HIGH | Next.js blog + Vercel release |
| Astro 5 stable; v6 exists | HIGH | Astro blog; v6 stable per March 2026 |
| Vite 6 stable, Node 20+ requirement | HIGH | Vite official blog + migration guide |
| Playwright 1.60.x current LTS + Node 22 matrix | HIGH | Playwright release notes |
| XState v5.20 stable; setup() pattern | HIGH | Context7 `/statelyai/xstate` (verified) |
| Mermaid 11.15 + stateDiagram-v2 + flowchart | HIGH | npm + mermaid.js.org |
| Zod 4.4.3 stable + performance claims | HIGH | Zod v4 docs + InfoQ |
| Excalidraw JSON schema + `convertToExcalidrawElements` | HIGH | Excalidraw dev-docs |
| culori 4.x ESM + OKLCH | HIGH | culorijs.org |
| axe-core 4.11.x + WCAG 2.2 coverage | HIGH | npm + dequelabs/axe-core |
| `skillgrade` as a standalone tool | LOW | Anthropic introduced the pattern in skill-creator (2026), but no shipped OSS package by that name. Treat as in-tree harness we build, not a dependency. |
| Codex 2% trigger metadata cap exact value | MEDIUM | The MRD asserts ~5k chars threshold; verify against current Codex CLI release at v1.5 kickoff |
| Trigger recall ≥0.85 / false-trigger ≤0.15 thresholds | MEDIUM | Aspirational; calibrate against the in-tree harness; Anthropic skill-creator targets are similar |
## Open recommendations to surface in roadmap
## Sources
- [agentskills.io v1 SKILL.md spec](https://agentskills.io/specification) — frontmatter fields, compatibility status
- [SKILL.md field reference (Agensi)](https://www.agensi.io/learn/skill-md-format-reference) — frontmatter details
- [W3C DTCG v2025.10 announcement (2025-10-28)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) — first stable
- [DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) — full spec
- [Google DESIGN.md GitHub (`google-labs-code/design.md`)](https://github.com/google-labs-code/design.md) — open-source spec, Apache-2.0
- [Google Stitch DESIGN.md announcement (Apr 2026)](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/)
- [Vite 6 release blog](https://vite.dev/blog/announcing-vite6) — Node 20+, Environment API
- [Next.js 15 release blog](https://nextjs.org/blog/next-15) — App Router stable, React 19 support
- [Astro 5 release blog](https://astro.build/blog/astro-5/) — Content Layer stable, server islands
- [Tailwind CSS v4.0 release blog](https://tailwindcss.com/blog/tailwindcss-v4) — OKLCH, CSS-first `@theme`
- [shadcn/ui — Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — compatibility confirmation
- [Playwright release notes](https://playwright.dev/docs/release-notes) — 1.60.x, Node 22 matrix
- [Mermaid npm (11.15.x)](https://www.npmjs.com/package/mermaid) — current; stateDiagram-v2 status
- [Mermaid stateDiagram-v2 docs](https://mermaid.js.org/syntax/stateDiagram.html)
- [Excalidraw JSON schema dev-docs](https://docs.excalidraw.com/docs/codebase/json-schema) — element format
- [Excalidraw mermaid-to-excalidraw API](https://docs.excalidraw.com/docs/@excalidraw/mermaid-to-excalidraw/api) — programmatic generation pattern
- [Zod v4 docs](https://zod.dev/v4) — performance, .meta(), v4.4 release
- [InfoQ on Zod v4](https://www.infoq.com/news/2025/08/zod-v4-available/) — performance + bundle size deltas
- [culori — JS color library](https://culorijs.org/) — OKLCH conversion, ESM
- [axe-core npm (4.11.x)](https://www.npmjs.com/package/axe-core) — current accessibility engine
- Context7 `/statelyai/xstate` — XState 5.20.1, setup() pattern (verified via ctx7)
- [Anthropic skill-creator blog](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) — evals + trigger tuning pattern (skillgrade analog)
- [Anthropic frontend-design DESIGN.md issue #1008](https://github.com/anthropics/skills/issues/1008) — referenced in MRD §11 GTM hook
- [VS Code Agent Skills docs](https://code.visualstudio.com/docs/copilot/customization/agent-skills) — Copilot host support
- MRD §3.5–§3.21, §9, §10, §11, §15, §16 — local file at `/Users/pilawski/My_projects/skillsos/Design Docs Frontend/design-os-mrd-v2.md`
- PROJECT.md R11, R13, R23, R24 — local file at `/Users/pilawski/My_projects/skillsos/Design Docs Frontend/.planning/PROJECT.md`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
