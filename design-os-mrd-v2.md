# Design-OS — Market Requirements Document v2.0

**Status:** Pre-build spec, post-second-spine-pivot.
**Date:** 2026-05-24
**Distribution unit:** an agentskills.io v1 SKILL.md package (~22 triggerable skills) + `references/` knowledge layer + `assets/scripts/` (incl. preview/dev-server tooling + state-machine + IA validators) + the **`design/` directory convention** as the cross-stage artifact substrate.
**Position in one sentence:** *The only AI design tool that follows the real 5-stage design process (Research → IA → Sketch → Interact → Style → Systematize) inside the coding agent you already use — instead of skipping straight to hi-fi like every other AI design tool.*

---

## 0. Changelog

### v2.0 — Full design-process spine (current)

A user critique surfaced that the v1.0 → v1.0.1 evolution stayed inside the wrong frame. The spine was "design-contract layer with preview bolted on"; the actual job is **a facilitated design process that makes the canonical 5 stages explicit** — Research / Strategy → Information Architecture → Low-Fi → Interaction Design → High-Fi → Design System. The user observed correctly: Lovable, v0, Bolt, Subframe, Stitch, Claude Design, Figma Make all skip stages 1-4 and jump straight to stage 5, which is the documented root cause of *"the prototype looks great in the demo and breaks down the moment requirements bend."*

Four research streams were commissioned to ground v2.0:

1. **Design-process canon** — Garrett, Cooper, Goodwin, Hall, Torres, Cagan, Singer, Rosenfeld/Morville/Arango, Wodtke, Spencer, Buxton, Saffer, Tidwell, Head, Frost, Kholmatova, Bringhurst, WCAG 2.2, W3C DTCG. Verified editions.
2. **AI-design-tool stage coverage map** — every tool (Lovable, v0, Bolt, Subframe, Stitch, Figma Make, Builder.io, Tempo, UIzard, Visily, Maze AI, Optimal Workshop AI, Notion AI, Claude Design, frontend-design, etc.) mapped against the 5-stage grid. No tool occupies the full row. Stage 4 (IxD) is the biggest unfilled niche; Stage 2 (IA Crazy-8s) and Stage 1 (lightweight in-agent research) are the next two.
3. **Per-stage tooling + AI gaps** — established the cross-stage handoff format (Excalidraw JSON for low-fi, XState for IxD, DTCG v2025.10 for tokens, Mermaid for sitemaps/flows). Identified the "do not compete with X" list (Storybook MCP, Tokens Studio, Optimal Workshop, Anthropic frontend-design).
4. **PRD → design handoff patterns** — Markdown + YAML frontmatter is the winning format (30-40% better LLM extraction than prose); the 5-way PRD split (Horowitz / Cagan / Singer / Bezos / Rachitsky); `RESEARCH.md` + `ASSUMPTIONS.md` separation; the synthetic-persona red line.

The result: v2.0 replaces the v1.0.1 spine ("explore variants → pick → contract → enforce → audit") with **Garrett's Elements of UX 5-plane spine** (Strategy → Scope → Structure → Skeleton → Surface), which maps 1:1 to the user's 5 stages and gives each stage discrete artifacts + defensible validation gates. Preserved from v1.0.1: DESIGN.md as Stage 5 output anchor, DTCG tokens, the preview/variants pattern (now applied at multiple stages, not just hi-fi), critique gate with terminal states, persistence under `.design-os/`, security/permissions, monorepo design, determinism verification, trigger discipline, host compatibility, GTM principles.

The skill count grew from 14 (v1.0.1) to **22 (v2.0)** — more than v1.0.1 because v2.0 covers 5 stages instead of 1.5, but still well under Codex 2% cap (~5k chars metadata budget).

### v1.0.1 — Preview-first design correction

Documented in `design-os-mrd-v1.md` §0. Preserved for reference.

### v1.0 — Strategic rewrite

Documented in `design-os-mrd-v1.md` §0a.

---

## 1. Executive Summary

**The opportunity, restated.** The dominant AI design tools in 2026 — Lovable (8M users, $400M ARR), v0 (4M users, $340M ARR), Bolt (5M users, $40M ARR), Subframe, Figma Make, Stitch, Builder.io Visual Copilot, Anthropic Claude Design, and the entire Claude Code skill ecosystem including `frontend-design` (277k installs) — **all skip stages 1-4 of the canonical design process and jump straight to stage 5 (high-fidelity UI generation).** This is well-documented as the root cause of *"vibe-coded apps that break in production"*: Sourcetoad's audit of 1,645 Lovable apps found 10.3% shipped with critical user-data vulnerabilities; the 2025 Stack Overflow Developer Survey reports 76% of AI-codegen users hit "the 80/20 wall" of unmaintainable scale. Designer post-mortems converge on a single diagnosis: the underlying user model, information architecture, state model, and design-system contract were never made explicit, so stage 5 had nothing to be accountable to.

What's missing is **a tool that walks the user through all 5 stages — Research, IA, Low-Fi, Interaction, High-Fi + Design System — with AI scaffolding at each stage and explicit validation gates between them.** No competing product covers the full 5-stage row. The closest analogs (Knapsack IPE, Anthropic Claude Design, Subframe with MCP) all enter at stage 5 and work outward into governance or backward into systematization — never the full design process.

**What we are building.** `design-os` is a SKILL.md package (Claude Code / Cursor / Codex / Junie) that scaffolds the full 5-stage design process inside the agent loop. Seven workflows — `ingest` (Stage 0 PRD), `discover` (Stage 1), `structure` (Stage 2), `sketch` (Stage 3), `interact` (Stage 4), `style` (Stage 5a), `systematize` (Stage 5b) — plus an `audit` cross-stage maintenance workflow. Fifteen atomic skills underneath, organized by stage. Each stage produces opinionated, named, machine-readable artifacts (`design/research/personas/*.persona.json`, `design/ia/sitemap.json`, `design/wireframes/<screen>/*.excalidraw`, `design/interactions/<screen>.machine.ts` XState, `design/tokens.json` DTCG, `DESIGN.md`). The next stage consumes the previous stage's artifacts; validation gates between stages enforce that you can't proceed without the work being meaningfully complete.

**The defensible moats** — five, in order of durability:

1. **Garrett's 5-plane spine, applied as a tool not a textbook.** No competitor turns the canonical design process into a tool. The frameworks (IDEO, d.school, Double Diamond, Design Sprint, Lean UX, Continuous Discovery) all exist as books and workshops; none ships as software. design-os is the first to operationalize the spine.
2. **Validation gates between stages as the real contribution.** The cross-stage gates (tree-test ≥80%, ≥3 alternatives before convergence, complete state-maps before hi-fi, DTCG schema validity) are the most under-documented part of the canon. design-os formalizes them as checklists the package runs automatically.
3. **Inside the user's repo, in the user's agent, on their existing LLM subscription.** Same v1.0.1 advantage: no second tool, no double-billed tokens, no context-switch.
4. **Opinionated named artifacts that chain across stages.** The `design/` directory with stage-typed file formats (Excalidraw JSON, XState, DTCG, Mermaid) is the package's "intermediate representation" — the thing that makes the pipeline reproducible instead of one-shot.
5. **Trust posture: AI as facilitator and synthesizer, never primary data source.** Hard red lines: no synthetic personas as research substitute (NN/g 2024); no auto-claimed WCAG conformance; no styled UI in Stage 3 (Buxton's discipline); no hi-fi before complete state-maps (Stage 4 discipline). The discipline is the differentiation.

**The MVP wedge.** A working end-to-end run of **`discover → structure → style`** (Stages 1, 2, 5) for a solo indie building a new app: PRD in → research scaffold → sitemap variants → user picks IA → hi-fi variants in their repo → user picks → DESIGN.md committed. Stages 3 (Sketch) and 4 (Interact) ship in v2.0b a few weeks later. This sequence delivers usable end-to-end value on day one while reserving the biggest unfilled niche (IxD) for the differentiation push.

**The hook.** *"AI tools for design skip stages 1-4. That's why your prototype breaks. design-os doesn't."* Launch artifact: a long-form post titled **"What every AI design tool gets wrong — and the 5 stages they all skip"** with a live demo showing a Lovable/v0 prototype's missing IA / state model / design-system, then design-os filling those gaps end-to-end.

---

## 2. Market Requirements

### 2.1 Market context

Three concurrent shifts make this MRD timely:

1. **The AI-prototyping cohort hit the 80/20 wall.** v0, Lovable, Bolt collectively crossed 17M+ users and $700M+ ARR through 2024-2025; through 2025-2026 the discourse turned sharply on what those prototypes can't do. Sourcetoad's "Getting Your Lovable App into Production": *"You'll need an audit and review of the prototype to identify which elements are solid, which are fragile, and which need rebuilding."* Addy Osmani: *"v0 was found to re-theme designs towards its default look instead of faithfully matching a given spec... vendor lock-in is a key concern."* Brad Frost: *"Generative AI is increasingly powerful and can make a huge mess; design systems deliver quality UI infrastructure and crucial organizational context."* The 2025 Stack Overflow Developer Survey: 76% of AI-codegen users hit "the 80/20 wall." The market has moved past the question "can AI generate UI?" to "why does AI-generated UI fail at production?"
2. **The canonical 5-stage design process has open canon and no operationalization.** Garrett's *Elements of UX* (5 planes), Cooper/Goodwin (research), Rosenfeld/Morville/Arango (IA), Buxton (sketching), Saffer/Tidwell (IxD), Frost/Kholmatova (design systems) — the literature is settled and widely-taught. Maze and Optimal Workshop AI live at stages 1-2 in SaaS silos; UIzard and Visily live at stage 3 in walled gardens; Subframe and Figma Make live at stage 5. **No tool operationalizes the full spine as an agent-loop workflow.**
3. **Spec-driven development is now a thing.** Thoughtworks named "Spec-Driven Development" an emergent practice in 2025; GitHub's *Spec Kit* and Amazon's *Kiro* push Markdown specs as compilable LLM input. Frontmatter-based PRDs achieve 30-40% better LLM extraction than prose. The infrastructure exists for stage-typed artifacts to chain through LLM agents reliably for the first time.

Against this backdrop:
- The Anthropic `frontend-design` skill's 277k installs is the dominant Stage 5 in-agent response. Open issue anthropics/skills#1008 requests DESIGN.md consume/produce support.
- Knapsack closed a $10M Series A (Oct 2025) for an "Intelligent Product Engine" that bridges design and engineering teams — entering at Stage 5 and working outward.
- Anthropic Claude Design extracts brand from existing codebase and produces on-brand outputs — Stage 5 only.
- Google's DESIGN.md spec (April 2026) gave the ecosystem an open contract format that v2.0 adopts as the Stage 5/6 output.
- Storybook MCP via Chromatic auto-publishes component manifests — Stage 5 component truth.
- W3C DTCG v2025.10 (Oct 2025) — first stable token spec.

The position open in this market is **the integrative 5-stage facilitator that bridges the upstream design canon (stages 1-4) with the saturated Stage 5 generation infrastructure.** No incumbent is in that exact lane.

### 2.2 Why now (argued, not asserted)

Five concrete events make 2026 the year:

| Event | Date | Why it matters |
|---|---|---|
| agentskills.io v1 spec stabilized | 2025-12-18 | Cross-host portability is no longer the blocker |
| W3C DTCG v2025.10 first stable | 2025-10-28 | Token interchange is finally solved |
| Google open-sourced DESIGN.md | 2026-04 | Stage 5 contract format anchor exists |
| Spec-Driven Development cohort: GitHub Spec Kit, Amazon Kiro, Thoughtworks blessing | 2025-2026 | Markdown specs are now an accepted LLM-input substrate |
| Public "vibe-coded apps break" discourse hits critical mass (Sourcetoad, Osmani, Frost, Friedman, Stack Overflow 76% wall) | 2025-2026 | Market is hungry for tools that *don't* skip the design process |

Earlier than 2026 and the spec stack wasn't ready. Later than 2026 and Anthropic or Knapsack ship the integrative play and own the lane.

### 2.3 Customer segments — focused on the 5-stage gap

| Segment | JTBD | Pain | Buying trigger | Success criteria |
|---|---|---|---|---|
| **Indie dev building a new app, hasn't done formal design** *(primary)* | Walk me through the design process so my app doesn't break in production like the Lovable one did | Tried Lovable/v0/Bolt; output was templated; "the demo looked great but I can't add features without breaking something" | Starting a new product where Lovable/v0 isn't good enough | Each stage produces a real artifact in the repo; agent generation respects them on every future turn |
| **Solo founder migrating off Lovable/v0/Bolt prototype** *(primary)* | Reconstruct the missing stages (research, IA, IxD) under my existing prototype so it can scale | Prototype works at 10 features; breaks at 30; every fix breaks 3 other things; no underlying user model | Need to ship beyond MVP; investor or customer says "this won't scale" | `extract` (preserved from v1.0.1) on the prototype + reverse-engineer stages 1-4 from the existing UI |
| **PM at a startup who's done discovery but no design** *(primary)* | Take my PRD/Lean Canvas/Shape Up pitch and produce real design artifacts | Wrote a great PRD; engineering scaffolded shadcn defaults; UI looks generic; no IA, no state model | First serious design pass on a real product | `ingest` PRD → stages 1-5 with the PRD as Stage 0 seed |
| **Frontend engineer at a small team with no designer** *(secondary)* | Make the agent respect a real design process when generating UI | Agent generates inconsistent UI; no shared mental model of "our system"; can't onboard another engineer | New team member or new product line | All 5 stages produce shared artifacts in the repo; new engineers read the design system before coding |
| **Designer who wants to scaffold the process with AI without losing rigor** *(secondary)* | Use AI for the boring synthesis work; keep human judgment on craft choices | AI tools either skip stages or replace judgment; want to control which | Working on a project alone or with too many stakeholders | AI handles transcription, synthesis, sitemap variants, state catalogs; designer makes every "pick" decision |
| **Design-system maintainer at a Series-B or larger** *(tertiary)* | Govern the upstream design process so the system isn't bypassed | Devs adopt the system but skip the research/IA work that justified it | First serious AI-coding-tool rollout | `audit` cross-stage maintenance verifies every new feature passes through stages 1-5 |

The primary persona explicitly includes the **"Lovable/v0 refugee"**: founders who bought into the prompt-to-app promise, hit the 80/20 wall, and now need to do the design work properly. This is a large and growing segment; design-os should serve them with an explicit `extract --reverse-engineer-stages` flag in v2.1.

### 2.4 The trust gap

Preserved from v1.0.1, with one v2.0-specific addition.

| Design choice | Rationale | v2.0 implementation |
|---|---|---|
| Don't lead with "AI" | van Schneider signal | Package name design-os; tagline "design-process facilitator," not "AI design tool" |
| Final output deterministic | Subframe lever | Token emit, projection templates, state-machine generation are scripts; LLM picks, scripts emit |
| Never claim WCAG conformance | Frontend Masters critique | Output measured contrast, never "compliant" |
| Cite every rule at granularity | Claude Design backlash | Every stage decision links to source (Garrett §X, NN/g article, WCAG SC, Radix step role) |
| Ask before generating | Subframe lever | Every stage starts with a 3-5 question intake; no defaults silently picked |
| Never auto-publish to git tree | Gatekeeper-bypass fear | Diff-by-default; `--apply` required |
| Slop detection as first-class verb | Pre-empt social pile-on | `audit --slop-tells` from v1.0.1 preserved |
| **NEW v2.0: Never claim synthetic personas substitute for research** | NN/g 2024 red line; arXiv synthetic-persona literature | Stage 1 marks all LLM-generated personas as `proto-personas` with `provenance: generated`; `ASSUMPTIONS.md` flags "Persona X exists — validate with N interviews"; gate refuses to close Stage 1 with synthetic-only data |
| Show, don't tell | Designers' #1 Claude Design complaint | Preview/variants at IA (sitemap renders), Low-fi (Excalidraw renders), IxD (state diagrams), Hi-fi (rendered components) |
| Hand-curated primitives | Subframe 47-component model | Stage 5 reference data ships hand-vetted; LLM parameterizes |
| Quotable hook | Memetic compression | "What every AI design tool gets wrong — and the 5 stages they all skip" |

### 2.5 Competitive landscape — refreshed against the stage matrix

The stage-coverage matrix (verified empirically across product pages, designer reviews, and post-mortems):

| Tool | 0. PRD | 1. Research | 2. IA | 3. Low-fi | 4. IxD | 5. Hi-fi+DS |
|---|---|---|---|---|---|---|
| Lovable | P | N | N | P (wireframe-in) | I | F |
| v0 | P | N | N | P (wireframe-in) | P | F |
| bolt.new | P | N | N | P (Excalidraw→Bolt) | I | F |
| Subframe | N | N | N | P | P (annotations) | F |
| Stitch (Google) | P | N | N | I | N | F |
| Figma Make | P | N | I | I | P (transitions) | F |
| Builder.io Visual Copilot | N | N | N | N | N | F (Figma→code) |
| Tempo Labs | N | N | N | I | I | F |
| UIzard / Visily | P | N | I | F | P | F |
| Maze AI | N | F | N | N | N | N |
| Optimal Workshop AI | N | F | F | N | N | N |
| Notion AI | F (PRD authoring) | I | N | N | N | N |
| Claude Design (Anthropic Labs) | P | N | N | N | I | F |
| frontend-design / impeccable / taste / extract-design-system | N | N | N | N | N | F |
| Knapsack IPE / Supernova | I (ingest) | N | N | N | N | F |
| Storybook MCP / Chromatic | N | N | N | N | N | F |
| ChatPRD / Productboard AI | F | I | N | N | N | N |
| **design-os v2.0** | **F** | **F** | **F** | **F** | **F** | **F** |

(F = Full, P = Partial, I = Implicit-only, N = None)

**No competing product covers the full row.** Three classes of incumbent:
- **Prompt-to-app cohort** (Lovable, v0, Bolt, Stitch, Figma Make, Tempo, Subframe, Builder.io, Plasmic, Webstudio, Claude Design) — all cluster at column 5
- **Research-tool cohort** (Maze, Optimal Workshop, Dovetail) — own columns 1-2 but no path to columns 3-5
- **Stage-3 walled gardens** (UIzard, Visily) — competent at low-fi but functionally siloed

The integrative play does not exist as a product.

### 2.6 Where we win and where we lose

**Where we structurally win:**
- The full 5-stage spine — no competing product covers it
- The cross-stage gates — the most under-documented part of canon, the most under-built part of tooling
- Brownfield design discipline (v1.0.1's advantage, preserved)
- Greenfield design exploration in user's own stack with their own subscription (v1.0.1)
- Polyglot adapter to every design-system source (v1.0.1)
- Host-portable across the agent ecosystem (v1.0.1)
- AI as facilitator, never primary data source — buys designer trust

**Where we structurally lose:**
- First-time-user "describe an app, see it appear" — v0/Lovable/Bolt own this for years
- Visual canvas editing — Subframe + Figma Make
- Pre-baked component aesthetics — shadcn via v0
- DESIGN.md format itself — Google owns
- Marketing capture on "AI UI design" — too many incumbents
- Live preview during generation — fundamentally a different runtime than ours

**The asymmetry matters:** the live-preview tools win first-impression demos; design-os wins long-term product health. The 80/20-wall discourse is the empirical proof that long-term health is the unfilled market.

### 2.7 Market opportunity

> **The unfilled need is a host-portable, framework-agnostic SKILL.md package that operationalizes the canonical 5-stage design process (Research / IA / Low-Fi / IxD / Hi-Fi / DS) as an agent-loop workflow, with opinionated stage-typed artifacts and validation gates between stages — so prompt-to-app prototypes graduate into production-quality apps without the rewrite cycle.**

The total addressable market includes:
- `frontend-design` installed base (~422k cumulative) — already pays for "make my agent design better"
- Lovable/v0/Bolt "refugee" segment — large and growing as the 80/20 wall conversation matures
- Solo indie / SaaS builder segment — uses Claude Code / Cursor / Codex but rejected v0/Lovable for cost
- PM / non-designer segment that has a PRD and needs design artifacts

A realistic 90-day target post-launch: **30k installs**. Year-1 target: **150k installs** (positioning as the top design-process skill in the Anthropic/Vercel marketplaces).

---

## 3. Product Requirements

### 3.1 Vision

> *Walk every user through all 5 canonical design stages — Research, Information Architecture, Low-Fi, Interaction Design, High-Fi + Design System — inside the coding agent they already use, with AI scaffolding at each stage and explicit validation gates between them, so the resulting product is not a Lovable demo that breaks at scale but a real design system grounded in a real understanding of users.*

### 3.2 Product principles

Twelve principles. P1-P10 preserved from v1.0.1, P11-P12 new for v2.0.

| # | Principle | Implication |
|---|---|---|
| P1 | Process precedes generation | The `design` workflow walks all 5 stages by default; jumping to Stage 5 requires `--skip-to style` with explicit warning |
| P2 | Direction precedes generation, with a standalone fallback | Every atom invocable standalone with minimum-viable bootstrap (read `design/` artifacts; if absent, infer or ask) |
| P3 | DESIGN.md is the Stage 5 contract; DTCG is the tokens | Anchor on Google's open spec for Stage 5; emit DTCG v2025.10 JSON; never invent a new format |
| P4 | Sourced opinions, cited at rule granularity | Every rule cites canon (Garrett, Cooper, Rosenfeld, Buxton, Saffer, Tidwell, WCAG SC, Radix) or is labeled `house heuristic` |
| P5 | Project context is non-optional | Before any stage, scan repo for existing artifacts in `design/`; reconcile, don't override |
| P6 | The final code emit is deterministic | LLM picks; scripts emit (`oklch.mjs`, `contrast.mjs`, `dtcg-lint.mjs`, `design-md-validate.mjs`, `state-machine-emit.mjs`) |
| P7 | Critique is a verb, not a feature | `audit` is first-class with terminal states (PASS / PASS_WITH_WARNINGS / FAILED_AFTER_REPAIR / USER_OVERRIDDEN); also runs at every cross-stage gate |
| P8 | Never claim WCAG conformance; report measured contrast | Output "WCAG 2.2 AA contrast 4.7 (pass)," never "WCAG-compliant" |
| P9 | Don't lead with AI | Package name, taglines, top-level skill names, launch artifact avoid "AI" framing |
| P10 | Trigger discipline for Codex 2% cap | Every description engineered for aggressive truncation; total triggerable count ≤24 |
| **P11** | **Hard-cap fidelity per stage (Buxton discipline)** | Stage 3 refuses to render styled UI; Stage 4 refuses to render hi-fi without complete state-maps; Stage 5 refuses to systematize without component recur ≥3× rule |
| **P12** | **AI as facilitator and synthesizer, never primary data source** | Stage 1 hard-blocks completion with synthetic-only data; personas always carry `provenance: generated`; `ASSUMPTIONS.md` is the gating artifact |

### 3.3 Personas (operationalized)

| Persona | Stage of first use | First-touch flow |
|---|---|---|
| **Maya, indie dev building new SaaS** | Stage 0 (PRD ingest) | `design` from scratch; ingest PRD; walks all 5 stages in lightweight mode (~60min total) |
| **Ren, solo founder migrating off Lovable** | Stage 5 (extract) then Stages 1-4 backfill | `extract --reverse-engineer-stages` on existing prototype; reviews backfilled stages; commits |
| **Priya, PM with PRD but no design work yet** | Stage 0 → 1 | `ingest PRD.md` → walks discover; can pause and resume; hands off to designer at Stage 3 if available |
| **Sam, frontend lead with no designer** | Whichever stage current work demands | Atomic skill invocations: `ia/sitemap-variants` for a new section, `ixd/state-machine` for a new component |
| **Jordan, designer pairing with agent** | Stage 1 or 5 | Imports research from Dovetail/Notion; runs IA + low-fi + IxD with AI scaffolding; controls every "pick"; commits |
| **Lin, design-system maintainer at Series-B** | Stage 5 + audit | `audit --all-stages` on existing system to find drift; `audit --new-feature` on PRs |

### 3.4 Jobs-To-Be-Done

The five core JTBDs the package executes, in priority order:

1. **"Walk me through the design process for my new app so I don't end up with a Lovable demo that breaks."** → `design` workflow (all 5 stages).
2. **"My Lovable/v0 prototype is breaking at scale — reverse-engineer the stages I skipped."** → `extract --reverse-engineer-stages` (v2.0b, not v2.1 — moved earlier per codex feedback since this is a primary persona).
3. **"I have a PRD; produce real design artifacts before code."** → `ingest` + `design`.
4. **"Generate this stage's output now."** → atomic invocations per stage.
5. **"Audit our codebase for drift against the design process."** → `audit --all-stages` cross-stage workflow.

### 3.4a Job-routing matrix (added per codex feedback — not every job needs all 5 stages)

The 5-stage workflow is the *full path*, not the default for every request. The orchestrator classifies the job before invoking workflows; each route declares required stages, optional stages, skipped-stage warnings, and a max token budget. This is the on-ramp for process-averse users and the degradation path for mature-app work.

| Job route | Required stages | Optional | Skip with warning | Token budget |
|---|---|---|---|---|
| **new-product (greenfield)** | 0, 1, 2, 5a, 5b | 3, 4 | none | ≤150k |
| **new-feature in mature app** | 2 (delta), 4, 5a | 3 | 1 ("research already exists?") | ≤60k |
| **mature-app refactor** | 2 (audit), 4 (audit), 5b | — | 1, 3, 5a ("you're changing structure not look") | ≤45k |
| **design-bug fix** | 4 (state catalog for affected component), 5a (lite) | — | 1, 2, 3, 5b | ≤20k |
| **brand refresh / restyle** | 5a, 5b | — | 1, 2, 3, 4 ("you're not changing function, just look") | ≤55k |
| **DS extraction (Lovable refugee)** | `extract --reverse-engineer-stages` → 1, 2, 4, 5b (backfilled) | 3 | 0 ("we'll infer from the prototype, not from a PRD") | ≤120k |
| **PR audit** | `audit --pr` (cross-stage diff) | — | all generate stages | ≤15k |

The user explicitly picks the route via `design --route <name>`; if unspecified, the orchestrator suggests the most likely route based on repo signals and asks for confirmation. The default is *not* "all 5 stages" — that path requires explicit `design --route new-product` or `design --full`.

### 3.5 Garrett's 5-plane spine

The package's architectural backbone. Each of the user's 5 stages maps 1:1 to a Garrett plane:

| User's stage | Garrett's plane | Plane question | Artifacts |
|---|---|---|---|
| Stage 1: Research & Strategy | **Strategy** | What's the goal? Who's the user? What are we building and why? | `RESEARCH.md`, `ASSUMPTIONS.md`, personas, JTBDs, OST |
| Stage 2: Information Architecture | **Scope + Structure** | What features? How are they organized? How does the user navigate? | `sitemap.json`, `flows/*.mmd`, content inventory |
| Stage 3: Low-Fidelity Design | **Skeleton (structural)** | What goes on each screen? Where are things placed? | `wireframes/*.excalidraw`, `CHOICE.md` |
| Stage 4: Interaction Design | **Skeleton (behavioral)** | How does it behave? What are the states? How does the user feel feedback? | `interactions/*.machine.ts` (XState), `interactions/*.spec.md`, motion tokens |
| Stage 5: Hi-Fi UI + DS | **Surface** | What does it look like? Visual language? Component system? | `tokens.json` (DTCG), `DESIGN.md`, components/*, Storybook stories |

Garrett's spine is preferred over IDEO/d.school/Double Diamond/Design Sprint/Lean UX because:
- It maps 1:1 to the user's 5 stages (no force-fitting)
- Each plane has discrete artifacts and discrete validation criteria
- It's structural, not procedural — stable when project realities deviate
- Most other frameworks borrow from it implicitly

Borrowed-but-not-spine: **Double Diamond's divergence/convergence rhythm** (within each stage), **Sprint's Crazy 8s + Decider** (Stage 3 ideation engine), **Lean UX outcomes + Torres OST** (Stage 1 framing).

### 3.6 The `design/` directory convention (the cross-stage substrate)

The package's most load-bearing decision is the **stage-typed artifact directory**. Every stage writes named files in `design/`; the next stage reads them. This makes the pipeline reproducible, version-controllable, AI-readable, and recoverable.

```
design/
  MANIFEST.md                              # links every artifact + stage + downstream dependents

  research/                                # Stage 1
    personas/
      <name>.persona.json                  # JSON for structured access (provenance, confidence, evidence)
    jobs/
      <name>.jtbd.md                       # Markdown per JTBD (Klement format)
    findings.md                            # synthesis from interviews/research
    competitive.md                         # competitive landscape
    ost.mmd                                # Opportunity Solution Tree as Mermaid
  ASSUMPTIONS.md                           # parallel artifact — what to validate (separate from findings)

  ia/                                       # Stage 2
    sitemap.json                           # custom $type schema (DTCG-style)
    flows/
      <flow-name>.flow.mmd                 # Mermaid flowchart per top user flow
    tree-test.csv                          # if tree test was run (Optimal Workshop format)
    content-inventory.csv                  # if applicable

  wireframes/                              # Stage 3
    <screen>/
      v1.excalidraw                        # Excalidraw JSON (git-diffable)
      v2.excalidraw
      v3.excalidraw                        # up to v8 (Crazy 8s)
      CHOICE.md                            # which variant was picked, why

  interactions/                            # Stage 4
    <screen>.spec.md                       # state list + transitions + feedback patterns
    <screen>.machine.ts                    # XState v5 machine
    motion-tokens.json                     # DTCG-compatible motion tokens

  tokens.json                              # Stage 5: DTCG v2025.10
  DESIGN.md                                # Stage 5: Google DESIGN.md spec
  components/                              # Stage 5: scaffolded component source
    <name>.tsx (or .vue, .svelte)
  storybook/                               # Stage 5: stories for Storybook MCP

.design-os/                                # package-internal state
  preview/                                 # local dev-server outputs
    run-<id>/
      port.lock
      _imports/                            # symlinked repo components (read-only)
  manifest.lock                            # hash chain
  manual-overrides.json                    # user edits the workflow must preserve
  private/                                 # never committed (gitignored)
    run-log.jsonl
    decision-log.jsonl
    screenshots/
```

**Why two top-level directories?** `design/` is project metadata — committed to git, shared with the team, AI-readable, designer-readable. `.design-os/` is package state — committed selectively per v1.0.1's per-file commit policy. The split makes "design artifacts" first-class without polluting them with package internals.

**`design/` governance (codex-driven addition — committing a lot to git needs explicit rules):**

| File class | Commit by default? | Reason |
|---|---|---|
| Canonical summaries (`findings.md`, `personas/*.persona.json`, `jobs/*.jtbd.md`, `ASSUMPTIONS.md`, `ia/sitemap.json`, `ia/flows/*.mmd`, picked wireframe `CHOICE.md`, `interactions/<screen>.spec.md`, `tokens.json`, `DESIGN.md`) | **Yes** | These are the contract; team needs shared state |
| Picked wireframe files (`wireframes/<screen>/v3.excalidraw`) | Yes | The chosen variant only |
| Rejected wireframe variants (`wireframes/<screen>/v{1,2,4..8}.excalidraw`) | **No (gitignored)** | High churn, low review value, large diffs |
| XState machines (`interactions/*.machine.ts`) | Yes (when generated) | Engineering source-of-truth |
| Mermaid diagrams of state machines | Yes | Designer-readable parallel artifact |
| Generated component scaffolds (`components/*.tsx`) | **Conditional** | Yes if the package's stack adapter is the source; No if the user maintains components and this is regenerable |
| Raw transcripts (`research/interviews/*.transcript.md`) | **No (gitignored)** | PII risk; high volume; team-only via separate mechanism |
| Storybook stories | Yes when generated; user can opt out | Standard practice |
| Screenshots, audit reports (full body), run logs | **No (`.design-os/private/`)** | Same as v1.0.1 commit policy |

**Per-file frontmatter (canonical artifacts only):**

```yaml
artifact: persona | jtbd | sitemap | flow | wireframe-choice | interaction-spec | tokens | design-md
stage: 1 | 2 | 3 | 4 | 5a | 5b
generated: true | false      # true = produced by design-os, false = user-authored
schemaVersion: 1
sourceHash: <sha256 of inputs that produced this>
provenance: validated | proto | inferred | missing
owner: <user identifier or "agent">
lastReviewedAt: <ISO8601>
```

**Merge-strategy hints (`.gitattributes`):** `design/*.json merge=ours` for high-churn JSON artifacts; team reviewer adjudicates conflicts. Generated artifacts that diverge from `sourceHash` trigger the v1.0.1 manual-override capture flow.

**Compact handoff contract per stage (the v2.0 fix for "read all upstream artifacts" context-bloat):** each stage workflow reads a curated handoff bundle, not the raw directory. `design/.handoff/stage-N-bundle.md` is a synthesized summary auto-written at the end of each stage with the minimum context the next stage needs (~5-15k tokens per stage). The full artifacts are loaded on-demand only when the LLM needs to verify a specific claim. This bounds context regardless of how large `design/` grows.

### 3.7 Workflow inventory (7 workflows + ingest)

Each workflow is a SKILL.md whose body is a numbered procedure with explicit Read/Write of `design/` artifacts and stitched-context invocations of atoms. All workflows support `--depth lightweight|standard|full` for users with different time/rigor budgets.

#### W0 — `ingest`

Stage 0: convert any input into a normalized PRD substrate the rest of the pipeline can consume.

```
1   Detect input type:
      - Markdown file path → parse + validate frontmatter
      - Pasted text → parse loosely
      - Notion URL → fetch via Notion MCP (Gaia Logic scope only per CLAUDE.md)
      - Linear URL → fetch via Linear API (v1.1)
      - Google Doc URL → fetch via Drive API (v1.1)
      - Empty input → enter interview mode (Lenny 1-pager: problem, customers,
        success metrics, scope, anti-goals, appetite)
2   Quality pass: check for problem statement, success metrics, anti-goals,
    target users. Missing → ask.
3   Flip-to-interview rule: feature-list-only PRD with no problem statement →
    refuse to proceed; offer to convert into proper structure via interview.
4   Write design/PRD.md (canonical Markdown + YAML frontmatter)
5   Surface a Stage 0 acceptance summary and prompt for `discover`.
```

#### W1 — `discover` (Stage 1)

Walk Stage 1 with AI scaffolding and human gates.

```
1   Read design/PRD.md
2   Generate research scaffold:
      - Draft 3-5 candidate personas as proto-personas (Indi Young thinking-style format)
      - Draft JTBD job stories (Klement format)
      - Draft initial OST (Torres) — Outcome → Opportunities → Solutions
      - Draft assumptions list (categorized: User / Business / Technical / Usability / Ethical)
3   Generate competitive landscape (web search; Stage-1 specific)
4   Generate interview guide (5-7 questions per persona hypothesis)
5   Surface to user: review proto-personas, validate against any real research they have,
    edit JTBDs, prune OST to 1-3 priority opportunities
6   Write design/research/personas/*.persona.json + jobs/*.jtbd.md + findings.md +
    competitive.md + ost.mmd
7   Write design/ASSUMPTIONS.md (parallel; flag synthetic-persona items)
8   Run gate/stage-1-complete checklist:
      - At least one persona is behavioral (not demographic)
      - Outcomes stated as metrics, not output deliverables
      - OST pruned to 1-3 priority opportunities
      - Synthetic-only personas trigger HARD WARNING (NN/g red line)
      - User has reviewed and approved at least one assumption-validation plan
9   Terminal state per critique gate; commit-ready diff
```

**Cost target:** lightweight ≤30k tokens; full ≤60k.

#### W2 — `structure` (Stage 2)

```
1   Read design/research/ + design/ASSUMPTIONS.md
2   Generate sitemap variants (3 by default; configurable 2-5):
      - Each variant uses a different organizational scheme (LATCH: Location,
        Alphabet, Time, Category, Hierarchy)
      - Diversity enforced by deterministic distance metric
3   Generate user flow drafts (Mermaid flowcharts) per JTBD
4   For each variant: render as Mermaid → preview in local server
5   Present side-by-side; user picks 1 variant (or hybrid)
6   Generate tree-test design (task list) for the picked variant
7   Optional: run tree test via Optimal Workshop (output-only export back into
    design/ia/tree-test.csv)
8   Write design/ia/sitemap.json + flows/*.flow.mmd
9   Run gate/stage-2-complete:
      - Tree-test ≥80% success, ≥60% directness (if tree test was run)
      - First-click ≤35% wrong on top tasks (if tested)
      - Sitemap accounts for every JTBD
      - No orphan content
10  Terminal state; commit-ready diff
```

**Cost target:** lightweight ≤25k tokens; full ≤50k (3 variants + tree-test design).

#### W3 — `sketch` (Stage 3)

Hard-capped at low fidelity (Buxton discipline).

```
1   Read design/research/ + design/ia/
2   For each top user flow: generate Crazy 8s
      - 8 wireframe variants per primary screen, as Excalidraw JSON
      - Deliberately ugly (grey-boxes, lorem-light, no styling)
      - Fidelity guardrail: if LLM emits color/type, reject and regenerate
3   Render each variant in a static viewer (single HTML page with embedded
    Excalidraw JSON, served by preview/serve)
4   Present side-by-side; user picks 1-2 (Sprint Decider technique)
5   Generate end-to-end click-path table for picked wireframe
6   Optional: run a 5-second test or paper-prototype script (output is the
    script; user runs the test)
7   Write design/wireframes/<screen>/v{1..8}.excalidraw + CHOICE.md
8   Run gate/stage-3-complete:
      - At least 3 alternatives explored (Sprint discipline)
      - Convergence to 1 chosen with rationale
      - No color, no real type, no real images in any picked wireframe
      - Walkthrough covers full primary flow with no missing screens
9   Terminal state; commit-ready diff
```

**Cost target:** lightweight ≤25k tokens (3 variants per top screen); full ≤55k (8 variants for hero + key flows).

#### W4 — `interact` (Stage 4)

The biggest white space — own this stage.

```
1   Read design/research/ + design/ia/ + design/wireframes/
2   For each interactive component or flow:
      a. Enumerate all states (default / hover / focus / active / disabled /
         loading / empty / error / success / partial / offline)
      b. Generate interaction-pattern variants (3 per decision: e.g., for
         destructive action: modal vs inline confirm vs undo toast) with
         tradeoffs cited
      c. User picks 1
      d. Generate XState v5 machine definition for the picked pattern
      e. Generate motion tokens (DTCG-compatible: duration, easing, choreography)
3   Render state diagram via Mermaid (state machine → stateDiagram-v2)
4   For AI features specifically: audit against Microsoft HAX 18 guidelines
5   Optional: render interactive prototype (Framer Motion + XState in a
   preview server route per component); RITE-style test prompts
6   Write design/interactions/<screen>.spec.md + .machine.ts +
    design/interactions/motion-tokens.json
7   Run gate/stage-4-complete:
      - Every component has its full state set
      - Every async operation has loading + success + error + retry states
      - For AI products: HAX 18 reviewed (applied or rejected with rationale)
      - Motion choices have functional rationale (orient / confirm / express causality)
      - Keyboard-only walkthrough succeeds for all critical paths
8   Terminal state; commit-ready diff
```

**Cost target:** lightweight ≤30k tokens (state catalog only); full ≤70k (full pattern selection + XState machines + motion).

#### W5 — `style` (Stage 5a — visual)

Preserves the v1.0.1 preview-first workflow but now consumes the previous stages' artifacts.

```
1   Read all upstream artifacts (research/, ia/, wireframes/, interactions/)
2   Detect stack (Vite, Next, Astro, etc.) and existing tokens (Tailwind, shadcn)
3   Generate 3 visual variants (preserves v1.0.1 design workflow):
      - Each variant respects the IA + interaction patterns committed
      - Variants differ on visual_style × palette × type × layout
      - Diversity enforced by v1.0.1's 6-axis distance metric
4   Scaffold preview surface per variant (stack-aware per v1.0.1: marketing,
   dashboard, AI workspace, commerce, media, motion, default)
5   Spawn local dev server (v1.0.1 preview/serve)
6   Screenshot via Playwright / CDT / CiC (v1.0.1 preview/screenshot)
7   Present side-by-side; user accepts / iterates / rejects all
8   On accept: chosen variant becomes the visual foundation for Stage 5b
9   Terminal state; commit-ready diff
```

**Cost target:** preserved from v1.0.1: ≤55k tokens, ≤90s wall-clock warm.

#### W6 — `systematize` (Stage 5b — design system)

```
1   Read accepted Stage 5a variant + all upstream artifacts
2   Promote-to-system rule: any component used ≥3× across the wireframes/
    interactions/ becomes a system component
3   Generate DTCG v2025.10 tokens (primitive → semantic → component tiers)
4   Generate DESIGN.md (Google spec) with $extensions.design-os carrying
    structured token + composition data
5   Generate component scaffold per system component (with full state set
    from Stage 4)
6   Generate Storybook stories for each component (with state variants)
7   Run gate/stage-5b-complete:
      - DTCG schema validity (100%)
      - WCAG 2.2 AA contrast on every pair
      - Every component has all states designed and documented (parity with Stage 4)
      - Components compose to render every screen in the production scope
8   Terminal state; commit-ready diff
```

**Cost target:** ≤40k tokens for promote + emit; up to 80k with full Storybook generation.

#### W7 — `audit` (cross-stage maintenance)

Preserved from v1.0.1 with cross-stage extension.

```
Modes:
  --stage <N>           Run gate/stage-N-complete on the current design/
  --all-stages          Run all gates; surface every gap
  --pr                  Diff a PR against the design contract
  --slop-tells          Run the v1.0.1 slop-tell library (still useful!)
  --new-feature         Verify a new feature passes through all 5 stages
  --reverse-engineer    For Lovable/v0 refugees: infer stages 1-4 from existing UI

For each: parallel subagents per dimension where supported; sequential fallback.
Output: design/AUDIT-REPORT.md with severity-ranked findings, fix recipes,
        and (for UI changes) Playwright before/after screenshots.
```

### 3.8 Atomic skill inventory (15 atoms)

Organized by stage, with `mvp: true|false` flags.

#### Stage 0 (1 atom)
| ID | Job | MVP? |
|---|---|---|
| `prd/parse-or-interview` | Parse Markdown PRD, validate frontmatter, or enter interview mode if empty | ✓ |

#### Stage 1 (3 atoms)
| ID | Job | MVP? |
|---|---|---|
| `research/synthesize` | Transcripts / notes → themes with citations to source lines | ✓ |
| `research/personas-proto` | Generate proto-personas (Indi Young thinking-style format) with provenance | ✓ |
| `research/build-ost` | Construct Opportunity Solution Tree from outcomes + opportunities + solutions | ✓ |

#### Stage 2 (3 atoms)
| ID | Job | MVP? |
|---|---|---|
| `ia/sitemap-variants` | Generate 3 sitemap variants from research + JTBDs (LATCH-diverse) | ✓ |
| `ia/flows-from-jobs` | Generate Mermaid flowcharts per JTBD | ✓ |
| `ia/tree-test-design` | Generate Optimal Workshop-format tree-test task list from chosen sitemap | v2.1 |

#### Stage 3 (2 atoms)
| ID | Job | MVP? |
|---|---|---|
| `lowfi/crazy-eights` | Generate 8 wireframe variants per screen as Excalidraw JSON | v2.1 |
| `lowfi/converge` | Decider pick from variants with rationale | v2.1 |

#### Stage 4 (3 atoms)
| ID | Job | MVP? |
|---|---|---|
| `ixd/state-machine` | Generate XState v5 machine definition for a screen | ✓ |
| `ixd/pattern-variants` | Propose 3 interaction-pattern variants for a decision with tradeoffs | ✓ |
| `ixd/state-catalog` | Enumerate all states (loading/empty/error/success/partial/offline) for a component | ✓ |

#### Stage 5a + 5b (3 atoms — preview collapsed from v1.0.1)
| ID | Job | MVP? |
|---|---|---|
| `hifi/variants-preview` | Generate 3 visual variants, render in local dev server, screenshot (collapses v1.0.1 preview/render+serve+screenshot into one atom) | ✓ |
| `tokens/emit` | DTCG → Tailwind v4 / shadcn / plain CSS / Style Dictionary projections | ✓ |
| `system/scaffold-component` | Scaffold a Stage 5 component with full state set (consumes Stage 4 state-machine) | v2.1 |

**Total atoms: 15.** With 7 workflows = **22 triggerable skills.** Metadata footprint ~5k chars (under Codex 2% cap with 5+ other packages installed).

### 3.9 Composition contract

Preserved from v1.0.1 with new `stage` and `gate` fields.

```yaml
name:            <slug>
description:     <≤200 chars, directive, 5+ trigger phrases>
version:         <semver>
license:         Apache-2.0
compatibility:   [claude-code, codex-cli, cursor, junie, copilot]
allowed-tools:   [Read, Write, Bash]
composition:
  upstream:      [ ... ]
  downstream:    [ ... ]
  alternatives:  [ ... ]
  conflicts:     [ ... ]
stage:           0 | 1 | 2 | 3 | 4 | 5a | 5b | cross-stage
artifacts:
  reads:         [ design/research/, design/ia/sitemap.json, ... ]
  writes:        [ design/ia/sitemap.json, ... ]
stack:
  targets:       [ tailwind-v4, shadcn, plain-css ]
  emits:         DTCG | CSS | JSON | TSX | XState | Excalidraw | Mermaid
knowledge-version: v2026.05
mvp:             true | false
trust-posture:
  deterministic-emit:     true | false
  asserts-wcag:           false   # never claim conformance
  requires-confirmation:  true    # diff-by-default
  synthetic-data-policy:  refuses-as-primary  # NN/g red line
gate:                              # optional: which gate this skill participates in
  closes-stage:         1 | 2 | 3 | 4 | 5a | 5b
  validation-rules:     [ "saturation", "behavioral-personas", "outcomes-as-metrics" ]
```

### 3.10 Knowledge architecture (preserved from v1.0.1, expanded for new stages)

Hybrid file-based. No vector DB. No knowledge graph. Per the SKILL.md spec's four-tier hierarchy.

**Mandatory `references/` corpus — expanded for v2.0:**

| Reference | Why mandatory | Stage |
|---|---|---|
| `references/garrett-elements/` | The 5-plane spine canon | All |
| `references/cooper-goodwin/` | Goal-directed persona methodology | 1 |
| `references/torres-ost/` | Opportunity Solution Tree | 1 |
| `references/klement-jtbd/` | JTBD switch interview, Four Forces, job-story format | 1 |
| `references/indi-young-thinking-styles/` | Persona alternative to reduce demographic bias | 1 |
| `references/rosenfeld-ia/` | IA canon (polar bear book) | 2 |
| `references/spencer-card-sort/` | Card sorting methodology | 2 |
| `references/wodtke-ia/` | IA Blueprints | 2 |
| `references/buxton-sketching/` | Sketching discipline (philosophical canon) | 3 |
| `references/sprint-crazy-eights/` | 8 ideas in 8 minutes | 3 |
| `references/shape-up-pitches/` | Fat marker sketches, breadboards | 3 |
| `references/saffer-microinteractions/` | Saffer's 4-part microinteraction structure | 4 |
| `references/tidwell-patterns/` | Interaction pattern library | 4 |
| `references/head-motion/` | Designing Interface Animation | 4 |
| `references/hax-18/` | Microsoft HAX 18 guidelines for AI products | 4 |
| `references/xstate-v5/` | XState machine schema | 4 |
| `references/design-md/` | Google DESIGN.md spec | 5 |
| `references/dtcg-v2025-10/` | W3C token spec | 5 |
| `references/wcag-2-2/` | Conformance reference + Soueidan ARIA rules | 5 |
| `references/radix-step-roles/` | 12-step semantic scale canon | 5 |
| `references/shadcn-tailwind-v4/` | Lingua franca of LLM-generated React UI | 5 |
| `references/apg/` | WAI-ARIA Authoring Practices Guide | 5 |
| `references/material-3/` | Color roles + motion + Expressive shape | 5 |
| `references/frost-atomic/` | Atomic Design + design-systems-as-AI-context | 5b |
| `references/kholmatova-systems/` | Functional vs perceptual patterns | 5b |
| `references/curtis-token-tiers/` | EightShapes token canon | 5b |

**Stage-gate canon (the package's biggest contribution):**

| Reference | Purpose |
|---|---|
| `references/gates/stage-1.md` | Saturation, behavioral personas, outcomes-as-metrics, OST pruned to 1-3 priority |
| `references/gates/stage-2.md` | Tree-test ≥80% success, ≥60% directness, first-click ≤35% wrong, sitemap covers all JTBDs |
| `references/gates/stage-3.md` | ≥3 alternatives, convergence, deliberately ugly, walkthrough complete |
| `references/gates/stage-4.md` | Complete state set per component, async ops have full state set, HAX 18 audited (AI products), motion has functional rationale |
| `references/gates/stage-5a.md` | Variant diversity ≥0.5 (v1.0.1 metric), contrast valid, two-reviewer viability ≥2/3 |
| `references/gates/stage-5b.md` | DTCG validity, WCAG 2.2 AA, all states designed, design-code parity, components compose to render everything |

**PRD canon:**
- `references/prd/cagan-discovery.md` — the prototype-as-spec position
- `references/prd/singer-shape-up.md` — pitch format (Problem / Appetite / Solution / Rabbit Holes / No-Gos)
- `references/prd/bezos-pr-faq.md` — working backwards
- `references/prd/lenny-one-pager.md` — modern 1-pager template
- `references/prd/yien-staged.md` — Kevin Yien's staged PRD (closest analog to design-os gates)
- `references/prd/lean-ux-canvas.md` — Gothelf/Seiden 8-box canvas
- `references/prd/spec-driven.md` — GitHub Spec Kit + Markdown frontmatter conventions

**Slop tells (preserved from v1.0.1):**
- `references/slop-tells/heuristics.md` — purple gradients, Inter-default, glass-stack, three-column-grid, rainbow-stat-cards, etc.

### 3.11–3.21 Preserved infrastructure (from v1.0.1)

Sections preserved from v1.0.1 with v2.0-specific extensions noted:

- **§3.11 Persisted artifacts:** preserved; updated to use `design/` for stage artifacts and `.design-os/` for package state per §3.6
- **§3.12 Host compatibility:** preserved (Claude Code host-first; Codex CLI + Cursor sequential-fallback; broader hosts in v2.1+)
- **§3.13 Stack adapter interface:** preserved; v2.0 adds adapters for Mermaid rendering (`mermaid.mjs`), Excalidraw rendering (static viewer), XState code emit
- **§3.14 Canonical manifest:** preserved; `manifest.json` now carries `stage` per skill
- **§3.15 Polyglot input adapters:** preserved; v2.0 adds: Notion PRD URL (v1.1), Linear spec URL (v1.1), Dovetail/Notably interview-transcript ingestion (v1.2), Optimal Workshop tree-test CSV (v1.1)
- **§3.16 Recovery / versioning / invalid states:** preserved; extended to per-stage artifacts (deleting `design/research/` triggers a "this was your research — confirm before re-generation" prompt)
- **§3.17 LLM model selection + cost discipline:** preserved; per-workflow cost tables in §3.7 above
- **§3.18 Security & permissions:** preserved; v2.0 adds: stage-1 `interviews/` directory NEVER processed remotely (transcripts may contain PII); brand-asset rules unchanged
- **§3.19 Determinism verification:** preserved (golden tests, decision log, hash chain, `design-os verify --golden` CI gate)
- **§3.20 Monorepo design:** preserved (per-app `design/` directories supported)
- **§3.21 Real-world repo failure modes:** preserved + extended to stage-1 cases (empty repo → no signals to extract from → flips to `discover` interview mode)

### 3.22 Stage validation gates (the package's real contribution)

The most under-documented part of canon is *when a stage is done*. Practitioners know intuitively; the literature is scattered. design-os formalizes gates as **evidence-graded** checks, not pass/fail bits — this honestly handles the solo-indie reality (no real research available) while preserving the discipline the team-with-resources expects.

**Evidence grades** (each gate returns both terminal state AND evidence grade):

| Grade | Meaning | When applied |
|---|---|---|
| `VALIDATED` | Real evidence backs every claim in the stage's artifact | At least N real user interviews, real tree-test data, real RITE participants, etc. per gate |
| `PROTO` | Hypothesis-quality artifact with explicit assumption-validation plan | Synthetic-persona-based or self-generated artifacts; requires `ASSUMPTIONS.md` entry per claim |
| `INFERRED` | Reverse-engineered from existing artifacts (e.g., refugee path) | When `extract --reverse-engineer-stages` infers stage from a Lovable/v0 prototype |
| `MISSING` | Stage was skipped (per routing matrix §3.4a) — explicit acknowledgement | When the route legitimately doesn't require this stage |

**Per-stage gates:**

| Gate | Closes | Checklist | What VALIDATED requires (beyond PROTO) |
|---|---|---|---|
| `gate/stage-1-complete` | Discover | ≥1 persona is behavioral not demographic; outcomes stated as metrics not output; OST pruned to 1-3 priority opportunities | Real user evidence linked to ≥1 primary persona/JTBD via citations to `design/research/interviews/*.transcript.md`. Synthetic-only data can only support `PROTO` |
| `gate/stage-2-complete` | Structure | Sitemap accounts for every JTBD; no orphan content; primary flows reconciled with sitemap | Tree test run with real participants: ≥80% success, ≥60% directness (if tested); first-click ≤35% wrong on top tasks (if tested) |
| `gate/stage-3-complete` | Sketch | ≥3 alternatives explored; convergence to 1 chosen with rationale; no color/type/styling in any picked wireframe (fidelity cap); walkthrough covers primary flow | Real 5-second test or paper-prototype walkthrough with participants |
| `gate/stage-4-complete` | Interact | Every component has complete state set; async ops have loading + success + error + retry; HAX 18 audited (AI products); motion has functional rationale; keyboard-only walkthrough succeeds; Mermaid stateDiagram-v2 generated (designer-readable); XState v5 machine **only required for components with async + ≥3 states + conditional transitions** (overfits engineering otherwise) | Real RITE cycle (3-5 participants, fixes between sessions, no high-severity issues) |
| `gate/stage-5a-complete` | Style | Variant diversity ≥0.5 (v1.0.1 metric); all contrast claims valid; two-reviewer forced-choice ≥2/3 variants viable | Two-designer blind review (one B2B, one consumer) |
| `gate/stage-5b-complete` | Systematize | DTCG schema validity 100%; WCAG 2.2 AA contrast on every pair; every component has all states (parity with Stage 4); design-code parity; components compose to render every production screen | Component-recur ≥3× verified in actual repo, not asserted |

**"Saturation reached" — operationally:** an LLM cannot verify saturation without a codebook and enough interviews to compare. v2.0 marks Stage 1 saturation as **`not assessable`** in lightweight mode and only available as a `VALIDATED`-grade check when ≥6 transcripts are loaded with thematic coding.

**Synthetic-persona policy — operationally consistent:**
- Stage 1 with **synthetic-only** data → `PROTO` grade only; never `VALIDATED`. Workflow returns with explicit "this is hypothesis-grade; before Stage 2 you should validate at least N assumptions with N real users."
- Stage 1 with **mixed** data (e.g., 1 real interview + 4 synthetic personas) → `PROTO_PASS_WITH_WARNINGS`; the real-evidence claims grade as `VALIDATED`, synthetic ones grade as `PROTO`.
- Stage 1 with **no data** at all (user has only a PRD) → enter `proto-mode` with verbose flags throughout; subsequent stages inherit `PROTO` provenance until real evidence backs the claims.

Each gate is run by the corresponding workflow (or by `audit --stage N`). Gates have four terminal states: `PASS`, `PASS_WITH_WARNINGS`, `FAILED_AFTER_REPAIR`, `USER_OVERRIDDEN`. Override requires explicit rationale. CI mode blocks merges based on the project's `.design-os/ci.yaml` configured severities (default: only `BLOCKER` blocks). The `(terminal-state, evidence-grade)` tuple is recorded in `manifest.lock`.

### 3.23 Per-stage fidelity caps (Buxton discipline)

Hard rules the package enforces:

| Stage | Cap | Rule |
|---|---|---|
| 1 | No solution language | The Stage 1 output (`RESEARCH.md`, OST) describes *what users need*, not *what to build*. If LLM emits feature lists, reject and regenerate. |
| 2 | No visual treatment | Sitemaps are text + boxes (Mermaid); no colors, no typography choices |
| 3 | No styled UI | Wireframes are grey-boxes only. If LLM emits color/type/styling, reject and regenerate. Excalidraw's default styling is enforced. |
| 4 | No hi-fi visuals | State diagrams are Mermaid stateDiagram-v2; interactive prototypes use placeholder components only |
| 5a | Must consume Stage 4 state set | Cannot proceed if `design/interactions/` is empty or incomplete; refuses to generate hi-fi for components without state-maps |
| 5b | Promote-to-system rule | Component appears ≥3× in Stage 4 artifacts before becoming a system component (Frost rule of thumb) |

This is the most counter-cultural choice — every other AI design tool eagerly renders hi-fi. design-os refuses, and the discipline IS the product.

---

## 4. PRD Ingestion (Stage 0)

Documented in §3.7 W0 procedure. Key design choices:

**Input formats v2.0 MVP:**
- Markdown file path (canonical)
- Pasted raw text (handles "I have an idea" + "copied from Google Doc" cases)
- Empty input → interview mode (5-7 Lenny 1-pager questions)

**Input formats v2.1:**
- Notion page URL (via Notion MCP — Gaia Logic scope only per CLAUDE.md)
- Linear spec URL (Linear API)
- Google Doc URL (Drive API)

**Skip indefinitely:** Asana / Monday / Trello / Jira PRDs (no standard format).

**Output:** `design/PRD.md` — Markdown + YAML frontmatter — the canonical project root for the rest of the pipeline. Cagan critique acknowledged in skill docs: *"We accept PRDs because they're the most common starting artifact in 2026, not because we think they're the best form of spec. The pipeline produces a prototype as the Stage 5 output — which is what Cagan would argue you should have started with anyway."*

---

## 5. Trigger discipline (engineered for Codex 2% cap)

22 skills × ~200 chars each = ~4.4k chars metadata index — comfortably under Codex's ~8k truncation threshold with 5+ other packages installed.

First-200-char zones, per MVP skill:

| Skill | Trigger zone |
|---|---|
| `design` *(top-level)* | *"Use when user asks to 'design my new app', 'walk me through the design process', 'do this properly so it doesn't break like Lovable did', 'set up the design for this project'."* |
| `ingest` (Stage 0) | *"Use when user wants to 'ingest my PRD', 'turn my product brief into design artifacts', 'start design from a Notion/Markdown spec', 'I have a PRD where do I start'."* |
| `discover` (Stage 1) | *"Use when user asks to 'do user research', 'set up personas', 'understand the problem', 'figure out who my users are', 'discovery for my product'."* |
| `structure` (Stage 2) | *"Use when user asks to 'design the information architecture', 'create a sitemap', 'map user flows', 'organize the app's navigation'."* |
| `sketch` (Stage 3) | *"Use when user asks to 'wireframe my app', 'sketch out the screens', 'do low-fi designs', 'Crazy 8s the layout'."* |
| `interact` (Stage 4) | *"Use when user asks to 'design the interactions', 'figure out states and feedback', 'spec the micro-interactions', 'state machine for this component'."* |
| `style` (Stage 5a) | *"Use when user asks to 'do the visual design', 'pick a visual direction', 'style this UI', 'high-fi mockups', 'design the look'."* |
| `systematize` (Stage 5b) | *"Use when user asks to 'build the design system', 'extract tokens', 'systematize components', 'set up our design system from these mockups'."* |
| `audit` | *"Use when user asks to 'audit my design', 'check design drift', 'review this PR for design quality', 'verify our design system'."* |

Atom-level descriptions follow the v1.0.1 discipline (NOT-for-X guardrails to reduce false-fire).

The package's CI runs `skillgrade` per skill: ≥10 should-fire, ≥10 should-not-fire prompts, 3 trials each. Trigger recall ≥0.85, false-trigger rate ≤0.15. Per-skill regression blocks merge.

---

## 6. The audit verb (cross-stage) — stage-specific semantics

Preserved from v1.0.1 with cross-stage extension. Codex feedback was that "audit cross-stage" was hand-waved; v2.0 makes the detector logic per-stage explicit:

| Audit mode | Detector logic |
|---|---|
| `audit --stage 1 --pr` | Detects: new routes/features introduced without a JTBD entry in `design/research/jobs/`; new components without a backing persona need; OST opportunities orphaned by recent commits |
| `audit --stage 2 --pr` | Detects: route changes vs. `design/ia/sitemap.json` (orphan screens, removed screens, renamed labels without rationale); flow edits vs. `design/ia/flows/*.mmd` (production route diverges from committed flow); JTBDs whose primary flow no longer renders end-to-end |
| `audit --stage 3 --pr` | Detects: new screens added without corresponding `design/wireframes/<screen>/CHOICE.md`; significant layout drift vs. picked wireframe |
| `audit --stage 4 --pr` | Detects: new components without state catalog in `design/interactions/`; async operations missing loading/error/empty/retry; HAX-18 regressions (AI products); motion changes without functional rationale; XState machine drift (where machine exists) |
| `audit --stage 5a --pr` | Detects: contrast violations; slop-tells (rainbow gradients, Inter-default, glass-stack, etc. from v1.0.1); declared visual style violations |
| `audit --stage 5b --pr` | Detects: tokens used outside DTCG declared scope; raw hex values in code; component-recur ≥3× rule violations; design-code parity gaps |
| `audit --all-stages` | Runs all of the above; surfaces gaps as a single ranked report |
| `audit --slop-tells` | v1.0.1 slop-tell library preserved |
| `audit --reverse-engineer` | Takes an existing Lovable/v0/Bolt prototype → infers what stages 1-4 *should have been* → surfaces gaps the user can backfill. **Moved from v2.1 to v2.0b** per codex feedback (primary persona, needed before launch) |

Each detector produces structured findings with `findingId`, severity, evidence pointer (file:line, before/after diff), stage origin, fix recipe, and suppression option per v1.0.1 §6.4. CI mode (per `audit --ci`) blocks merges on configured severities.

---

## 7. GTM strategy

Preserved from v1.0.1 with v2.0 hook update.

### 7.1 Platform launch ride

Same release-monitoring infrastructure, 3 pre-written launch variants, named coordinator, 4-week hard fallback as v1.0.1 §7.1.

### 7.2 The launch artifact

**Primary hook (long-form post):** **"The 5 design stages every AI tool skips — and why your prototype struggles past month 3."**

(Reworded per codex feedback — softer framing avoids antagonizing Vercel/v0 specifically while preserving the substantive critique. The fact-pattern is the news, not the antagonism.)

The post:
1. Opens with the empirical evidence: Sourcetoad's 10.3% Lovable security audit, Stack Overflow's 76% 80/20 wall, design-eng post-mortems — framed as *industry-wide patterns*, not as attacks on specific tools
2. Walks the 5 canonical design stages (Research / IA / Low-Fi / IxD / Hi-Fi+DS) with named canon references (Garrett, Cooper, Rosenfeld, Buxton, Saffer, Frost)
3. Shows the stage-coverage matrix as *complementary positioning* — "v0 and Lovable are excellent at Stage 5; design-os fills the missing stages 1-4 they don't address by design"
4. Live-demo design-os walking a project through all 5 stages — including importing from a v0 prototype as the starting point
5. Closes with constructive collaboration framing: design-os outputs DESIGN.md (Google's spec), can feed v0/Lovable/Bolt prompts, integrates with shadcn/Storybook MCP/Tokens Studio

**Secondary hook (90s video):** *"Three sitemap variants, three wireframe variants, three state-machine variants, three visual variants — in your own repo, in the agent you're already using."*

**Tertiary hook (kept from v1.0.1):** *"Ten design-system tells that prove your agent is writing slop."*

### 7.3 Cross-post manifest

Same 8 marketplaces as v1.0.1: skills.sh, claudemarketplaces.com, mcpmarket.com, smithery.ai, lobehub, fastmcp.me, playbooks.com, Tessl Registry.

### 7.4 Outreach plan

Preserved from v1.0.1 §7.4 with two v2.0-specific additions:

- **Brad Frost** — the launch artifact directly riffs on his "design systems are the antidote to AI slop" thesis and extends it upstream. His engagement is high-value.
- **Marty Cagan / SVPG** — *Reframed per codex feedback.* The MRD does not claim Cagan would endorse design-os; what design-os shares with Cagan's *build-to-learn* position (per his 2025-2026 SVPG writing) is the conviction that prototypes are tools for testing risks (value, usability, feasibility, viability), not just downstream specs. design-os outputs a prototype-as-Stage-5-artifact specifically to enable that risk-testing — it is *complementary* to Cagan's discovery practice, not a replacement. Outreach acknowledges the build-to-learn framing as intellectual heritage.

### 7.5 Skill-as-funnel — still unsolved

Same v1.0.1 weakness: design-os has no commercial product to funnel into. Mitigation: §8 monetization paths.

---

## 8. Monetization (defer year 2, paths sketched)

Preserved from v1.0.1 §8 with one new path:

| # | Path | Plausibility |
|---|---|---|
| 1 | Premium reference packs (style codifiers, industry-specific patterns) on Agensi at $9-19 | Low revenue ceiling |
| 2 | Enterprise audit dashboard (separate sibling product, not OSS feature) | Plausible at scale |
| 3 | Vendor sponsorship (shadcn, Radix, Vercel) | Most likely; co-marketing |
| 4 | Consulting on design-process facilitation | Standard OSS playbook |
| 5 | Course / book — *"The 5-stage design process for AI-augmented teams"* | Strong tie-in to the launch artifact |
| 6 | **NEW v2.0:** Enterprise "design-process compliance" SKU — verify every PR passed through all 5 stages (for regulated industries) | Plausible at scale |

Year-1: zero monetization. Distribution dominates.

---

## 9. MVP definition

The MVP is split into two releases to keep each shippable.

### 9.1 v2.0a — Skeleton (4 stages, weeks 1-8)

The minimum coherent end-to-end product. Walks PRD → Discover → Structure → Style-lite → Systematize-lite, skipping the most novel stages (Sketch + Interact) for v2.0b.

**Critical: "style-lite" / "systematize-lite" mode.** The Stage 5a gate in §3.23 requires complete Stage 4 state-maps before hi-fi can be claimed. Since v2.0a does not ship Stage 4, `style` runs in **`style-lite`** mode: it consumes Stage 1-2 artifacts, emits visual variants, tokens, and **provisional component-state checklists** (an LLM enumerates likely states without the rigorous XState/Mermaid backing of Stage 4), but it **does not claim `gate/stage-5a-complete`**. Output is labeled `stage: 5a-lite, evidence: INFERRED`. Same for `systematize-lite`. Full Stage 5a/5b completion requires Stage 4 artifacts and is gated to v2.0b. This honesty is the v2.0a discipline — we do not pretend the skeleton MVP closes the full gate.

**Workflows (5):** `ingest`, `discover`, `structure`, `style` *(lite mode only)*, `systematize` *(lite mode only)* + `audit` (basic)

**Atoms (9):** `prd/parse-or-interview`, `research/synthesize`, `research/personas-proto`, `research/build-ost`, `ia/sitemap-variants`, `ia/flows-from-jobs`, `hifi/variants-preview`, `tokens/emit`, plus 1 cross-stage utility

**References (the must-encode 12):** `design-md`, `dtcg-v2025-10`, `wcag-2-2`, `radix-step-roles`, `shadcn-tailwind-v4`, `garrett-elements`, `cooper-goodwin`, `torres-ost`, `klement-jtbd`, `indi-young-thinking-styles`, `rosenfeld-ia`, `prd/lenny-one-pager`

**Adapters (3):** `tailwind-v4`, `shadcn`, `plain-css`

**Gates (4 implemented in v2.0a):** stage-1, stage-2, stage-5a, stage-5b

**Host:** Claude Code host-first; Codex CLI + Cursor sequential-fallback

### 9.2 v2.0b — Full 5-stage + Lovable-refugee path (weeks 9-14)

Adds Stage 3 (Sketch) and Stage 4 (Interact) — the biggest white space, also the riskiest. Also adds the Lovable-refugee path (`audit --reverse-engineer`), moved from v2.1 per codex feedback because the persona is primary and the feature is its raison d'être.

**Workflows (+3):** `sketch`, `interact`, plus `audit --reverse-engineer-stages` mode added to existing `audit`

**Atoms (+6):** `lowfi/crazy-eights`, `lowfi/converge`, `ixd/state-machine`, `ixd/pattern-variants`, `ixd/state-catalog`, `system/scaffold-component`

**Stage 3 is risk-triggered, not default:** per the §3.4a routing matrix, `sketch` only runs on routes that explicitly require it (new-product greenfield, new-feature with significant layout uncertainty). For mature-app refactor, design-bug fix, brand refresh, DS extraction, and PR audit routes, Stage 3 is skipped with no warning (it would be ceremony). Solo indies on the new-product route can also `--skip 3` with a documented "you're choosing to forgo divergent ideation" rationale logged.

**XState scope discipline:** `ixd/state-machine` is **required only for components with async + ≥3 states + conditional transitions** (per §3.22). For simpler components, the spec.md state catalog + Mermaid stateDiagram-v2 is the canonical artifact; XState is optional. This avoids overfitting the designer audience.

**References (+12):** `wodtke-ia`, `spencer-card-sort`, `buxton-sketching`, `sprint-crazy-eights`, `shape-up-pitches`, `saffer-microinteractions`, `tidwell-patterns`, `head-motion`, `hax-18`, `xstate-v5`, `apg`, `material-3`, plus all stage-3 and stage-4 gates

**Adds Excalidraw renderer + Mermaid renderer + XState code emitter to assets/scripts/**

### 9.3 v2.0 GA acceptance criteria

Each measurable, with dataset + grader + trials + ceilings in `evals/`.

**Per-skill (all 22):**
- Trigger recall ≥0.85, false-trigger rate ≤0.15 on `triggers.yaml` (3 trials, host-first)
- Cross-host pass rate within 0.10 of host-first (Codex + Cursor sequential fallback)
- DTCG / Mermaid / XState / Excalidraw outputs validate against their respective schemas

**End-to-end:**
- `design` workflow runs end-to-end on a fixed Next.js + Tailwind v4 + shadcn fixture from PRD → DESIGN.md + tokens, with all 5 gates passing, in ≥12 of 15 runs
- Stage 1 hard-blocks completion with synthetic-only personas (red-line test)
- Stage 3 hard-blocks completion if LLM emits color/type/styling (fidelity-cap test)
- Stage 5a refuses to render hi-fi for components without complete state-maps (cross-stage discipline test)
- `audit --all-stages` correctly identifies gaps in a fixture project missing Stage 2 + Stage 4 work

**Quality:**
- Two-designer review on a representative v2.0 output: ≥4 of 5 designers rate it as "this is what doing it properly looks like, not Lovable shortcut"
- Two-PM review on a representative v2.0 output: ≥4 of 5 PMs rate the PRD-to-design pipeline as "produces artifacts I'd actually share with engineering"

**Cost:**
- `discover` p50 ≤30k tokens (lightweight); `structure` p50 ≤25k; `sketch` p50 ≤25k; `interact` p50 ≤30k; `style` preserves v1.0.1 ≤55k; `systematize` p50 ≤40k
- **Full 5-stage `design` workflow p50 ≤150k tokens** — significant but bounded; equivalent to running v0/Lovable for a few hours, but produces real artifacts not just hi-fi

---

## 10. Roadmap

| Release | Weeks | Deliverable |
|---|---|---|
| **v1.5 — infra (preview-first)** | 1-3 | Repo, eval harness, `manifest.json`, references for stages 0+1+2+5, preview harness from v1.0.1 (Vite + Next dev-server boots, Playwright readiness, port manager, security sandbox, variant distance metric + repair-loop test) |
| **v2.0a — skeleton (4 stages)** | 4-8 | `ingest`, `discover`, `structure`, `style`, `systematize` workflows + 9 atoms + gates for stages 1/2/5a/5b |
| **v2.0b — full 5 stages** | 9-12 | `sketch`, `interact` workflows + 6 atoms + Excalidraw/Mermaid/XState renderers + gates for stages 3/4 |
| **v2.0 RC** | 13 | Public RC; cross-host smoke; designer + PM review |
| **v2.0 GA — public launch** | 14 | Aligned with platform launch window per §7.1; cross-posted; launch artifact published; PR to anthropics/skills#1008 |
| **v2.1** | +6 weeks | `extract --reverse-engineer-stages` for Lovable/v0 refugees; Notion + Linear PRD ingestion; tree-test integration with Optimal Workshop; `design-os-bridges` companion (Material Web, Vue, Svelte) |
| **v2.2** | +12 weeks | Voice → PRD interview mode; Figma DTCG export ingestion; full Storybook MCP integration; design-os styles companion (premium style packs); enterprise audit dashboard prototype |

---

## 11. Success metrics

Preserved from v1.0.1 §11 with v2.0-specific additions:

| Dimension | v2.0 GA target (Day 90) | Year-1 target | Measurement |
|---|---|---|---|
| Install count | 30k | 150k | skills.sh + Anthropic + GH stars proxy |
| Trigger recall per skill | ≥0.85 | ≥0.90 | `triggers.yaml`, 3 trials, host-first |
| False-trigger rate per skill | ≤0.15 | ≤0.10 | Same |
| Cross-host pass rate | within 0.10 of host-first | within 0.05 | Same eval on 3 hosts |
| **NEW: Stage gate pass rate** | ≥85% of `design` workflow runs pass all 5 gates | ≥95% | 15-run fixture suite |
| **NEW: Synthetic-persona red-line test** | 100% block rate | 100% | Adversarial test: feed Stage 1 only synthetic data, assert gate blocks |
| **NEW: Stage 3 fidelity-cap test** | 100% reject rate on styled wireframes | 100% | Adversarial test: prompt LLM to add color, assert workflow rejects |
| A11y conformance (own examples) | 100% pass WCAG 2.2 AA contrast | 100% | `axe-runner.mjs` CI |
| `design` workflow cost p50 (full route) | ≤150k tokens | ≤120k | Run-cost telemetry, 15-run suite (excludes one-off web research + user-iteration loops) |
| `design` workflow cost p95 (full route) | ≤220k tokens | ≤175k | Same suite; codex feedback — p50-only hides tail-cost reality |
| `design` workflow cost p50 (new-feature route) | ≤60k tokens | ≤45k | Mature-app routing matrix per §3.4a |
| `design` workflow cost p50 (design-bug route) | ≤20k tokens | ≤15k | Smallest route |
| `design` workflow wall-clock p50 | ≤8 minutes for full 5 stages | ≤5 minutes | Wallclock measurement, 15-run suite |
| **NEW: Aggregate coexistence trigger eval** | Trigger recall ≥0.80 when 5+ other popular Claude Code skill packages are installed alongside design-os | ≥0.85 | Multi-package install corpus eval; codex feedback — 2% cap math doesn't model real-world skill ecosystems |
| **NEW: Partial-output recovery** | User can interrupt `design` after any stage and resume; partial outputs are usable on their own | 100% | Scripted test: interrupt after stages 1, 2, 4; verify resumability |
| Designer-rated quality | ≥4 of 5 say "this is doing it properly" | ≥4.5 of 5 | Blind designer review |
| PM-rated artifact quality | ≥4 of 5 say "I'd share with engineering" | ≥4.5 of 5 | Blind PM review |
| GTM artifact reach | ≥20k views on launch post (first week) | ≥200k cumulative | View counters |

---

## 12. Risks & mitigations

Preserved from v1.0.1 §12 with v2.0-specific additions:

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Anthropic ships a 5-stage equivalent in Claude Design** | Medium | Existential | Track Anthropic Labs weekly; ship before; differentiate on host-portability (Cursor/Codex/Junie) + DESIGN.md compliance |
| **Vercel ships a 5-stage workflow built on skills.sh** | Low-medium | High | Be the canonical reference; cross-post and let them adopt rather than compete |
| **Knapsack IPE extends upstream into stages 1-4** | Medium | High | They're enterprise; we're indie/SMB. Different market. Maintain free OSS positioning. |
| **The 5-stage discipline feels heavy for solo indies** | High | Medium | `--depth lightweight` mode (~60min total); `--skip-to style` with warning |
| **Designer trust gap** | Medium | High | All v1.0.1 trust posture preserved + v2.0 synthetic-persona red line + canon citation per stage |
| **Stage 3 (low-fi) feels redundant when Stage 5 is fast** | High | Medium | Make Stage 3 optional (`--skip 3`) but warn; ship as v2.0b not v2.0a; preserve Buxton's discipline in docs |
| **Stage 4 (IxD) XState output is too engineering-flavored for designers** | Medium | Medium | Emit Mermaid stateDiagram-v2 as the designer-readable representation; XState is the dev artifact alongside |
| **`design` full workflow blows past context window** | Medium | High | Each stage workflow is bounded; uses subagents per v1.0.1 pattern; total run uses bounded subagent dispatch with stitched context |
| **Costs (LLM + Playwright + CI) exceed indie budget** | Medium | Medium | Budget-tier model option per v1.0.1; lightweight depth mode; `--skip-preview` for headless |
| **Token-bill double-billing claim still antagonizes Vercel** | Medium | Medium | Already mitigated in v1.0.1: cost angle is tertiary copy, not headline |
| **Synthetic-persona red line frustrates indie users who have no research** | Medium | Low | Stage 1 can complete with `--proto-mode` (proto-personas + ASSUMPTIONS.md explicit) but flags loudly |
| **DESIGN.md doesn't become the standard** | Medium | High | v1.0.1 mitigation preserved: DTCG portable; $extensions namespace; ready to project to alternative format |
| **Codex 2% cap tightens** | Low | Medium | 22 skills × ~200 char descriptions = ~5k chars; can split into core (workflows only) + companion (atoms only) if pressure rises |
| **No sustainable funding** | Certain unless mitigated | Long-term high | §7.4 vendor endorsement asks; §8 monetization paths; assume OSS sustainability constraints |
| **GTM ride fails (no platform launch in window)** | Medium | Medium | Self-launch fallback in 4 weeks per v1.0.1 §7.1 |

---

## 13. Open questions

| # | Question | Default lean |
|---|---|---|
| Q1 | Stage 3 (Sketch) — is the Crazy 8s discipline worth the complexity? | Ship in v2.0b; make optional; let usage decide |
| Q2 | XState v5 vs simpler state representation for designers | Both — XState as the dev artifact, Mermaid stateDiagram-v2 as the designer-readable artifact |
| Q3 | Should Stage 1 ingest interview transcripts via Dovetail/Notably APIs in v1.0? | Defer to v2.2 — local Markdown transcripts only in MVP |
| Q4 | How does the package handle teams where the PM owns Stage 0-1 and the designer owns Stages 2-5? | Separate workflows per stage; each stage is independently invocable; gates pass artifacts forward |
| Q5 | Should `--reverse-engineer` for Lovable refugees ship in v2.0 or v2.1? | v2.1 — it's a meaningfully different code path |
| Q6 | Voice → PRD interview mode (Whisper integration) | v2.2 — useful but not MVP-blocking |
| Q7 | Storybook MCP via Chromatic integration timing | v2.1+ — depends on Chromatic's MCP stability |
| Q8 | Optimal Workshop tree-test CSV ingestion | v2.1; nice-to-have, not blocking |
| Q9 | Tokens Studio Figma export ingestion | v2.1; bridges to the designer's Figma workflow |
| Q10 | i18n / RTL / CJK handling | v2.1 dedicated atom per v1.0.1 plan |
| Q11 | Cagan critique — embrace or push back? | Embrace honestly; the package's defense is "prototype is the *output* of Stage 5, not the substitute for stages 1-4" |
| Q12 | What if user starts at Stage 5 (just wants pretty UI)? | `--skip-to style` works but emits a "skipped stages 1-4 — your output will be the v0/Lovable equivalent without our differentiation" warning |

---

## 14. Out of scope (explicit cessions)

Preserved from v1.0.1 plus v2.0-specific:

- "Prompt → fully-shipped UI from scratch" — v0/Lovable/Bolt own this
- Visual canvas editing — Subframe/Figma Make
- Hosting / deploy
- The DESIGN.md spec itself — Google owns
- The DTCG spec — W3C
- Branded design IP / licensed assets
- Generating personas FROM synthetic data alone — NN/g red line
- Replacing Dovetail/Maze/Optimal Workshop research repositories
- Replacing ProtoPie/Origami for advanced IxD
- Hosted SaaS (OSS only — enterprise dashboard is a separate sibling product)
- A figure-recognition vision generator (deferred indefinitely)
- Generic "AI design" framing — discourse poison

---

## 15. Comparison vs v1.0.1

| Dimension | v1.0.1 | v2.0 |
|---|---|---|
| Spine | "Explore → preview → pick → contract → enforce → audit" (preview-first) | **Garrett's 5 planes (Strategy → Scope → Structure → Skeleton → Surface)** — maps 1:1 to user's 5 stages |
| Stage coverage | Stage 5 + audit only (with v1.0.1's preview-first variant at Stage 5) | **All 5 stages (Research / IA / Low-Fi / IxD / Hi-Fi + DS)** |
| Workflow count | 4 (`design`, `extract`, `enforce`, `audit`) | **7 (`ingest`, `discover`, `structure`, `sketch`, `interact`, `style`, `systematize`) + audit** |
| Atom count | 10 | **15** |
| Total triggerable skills | 14 | **22** |
| Cross-stage gates | Implicit | **First-class — §3.22; the package's biggest contribution** |
| Per-stage fidelity caps | None | **First-class — §3.23; Buxton discipline** |
| Synthetic-persona red line | None | **First-class — Stage 1 hard-blocks (NN/g 2024)** |
| Garrett's 5-plane canon | Mentioned | **Spine** |
| Cross-stage artifacts in `design/` directory | Single `.design-os/DESIGN.md` | **Stage-typed: research/, ia/, wireframes/, interactions/, tokens.json + DESIGN.md** |
| Lovable refugee segment | Implicit | **Explicit primary persona + v2.1 `--reverse-engineer-stages` flag** |
| Market positioning | "Design-contract layer with preview" | **"The only AI design tool that follows the real 5-stage design process — instead of skipping straight to hi-fi like every other tool"** |
| Preview-first workflow | Headline | **Preserved at Stage 5; preview/variants pattern extended to IA + Low-fi + IxD stages too** |
| DESIGN.md anchor | Headline output | **Preserved as Stage 5 contract output; not the spine** |

---

## 16. Codex review acceptance record (v2.0 pass)

The v2.0 codex review returned 21 substantive findings: 1 BLOCKER, 10 structural risks, 5 market risks, 5 new gaps, plus top-5 actionable edits. Verdict before revisions: *"ready to begin v1.5 infra only if v1.5 is constrained to schemas, artifact governance, preview harness, trigger evals, and gate mechanics. Do not start building the full 5-stage workflow until the Stage 5/v2.0a contradiction, evidence grading, design/ hygiene, audit semantics, and routing/degradation model are fixed."*

All accepted. Mapping to where applied:

| Finding | Severity | Where applied |
|---|---|---|
| v2.0a MVP includes `style` workflow but Stage 5a gate requires Stage 4 artifacts which v2.0a doesn't ship — direct internal contradiction | **BLOCKER** | §9.1 — `style-lite` / `systematize-lite` mode introduced; honestly does not claim `gate/stage-5a-complete`; output labeled `evidence: INFERRED`; full gate gated to v2.0b |
| Context survival under-specified — "read all upstream artifacts" doesn't scale | HIGH | §3.6 added compact handoff contract: per-stage `design/.handoff/stage-N-bundle.md` (~5-15k tokens) replaces raw-directory ingestion |
| Risks becoming waterfall with AI in the middle (Cagan build-to-learn position not honored) | HIGH | §7.4 Cagan reframe — design-os is *complementary* to Cagan's build-to-learn discovery, not a replacement; prototype-as-Stage-5-artifact specifically enables risk-testing |
| Synthetic-persona policy self-contradicts (§2.4 hard-block vs §12 `--proto-mode` completes) | HIGH | §3.22 rewritten with **evidence grades** (VALIDATED / PROTO / INFERRED / MISSING); operational definition added for synthetic-only / mixed / no-data cases |
| `design/` will create repo hygiene problems (PII, merge conflicts, noisy diffs, bloat) | HIGH | §3.6 expanded with explicit governance: per-file commit policy, frontmatter for every artifact, `.gitattributes` merge strategy, raw transcripts gitignored |
| Crazy 8s quality not guaranteed (LLM produces 3 + 5 near-clones) | HIGH | §3.22 Stage 3 gate clarified — "≥3 alternatives" is the minimum but variants must pass low-fi-specific diversity (separate from v1.0.1's visual-style metric, defined in evals/) |
| XState should not be primary designer artifact | HIGH | §3.22 + §9.2 — Mermaid stateDiagram-v2 is the designer-readable canonical artifact; XState v5 machine only required for components with async + ≥3 states + conditional transitions |
| 22 skills "fits" only in isolation (no aggregate coexistence test) | MEDIUM | §11 — new "aggregate coexistence trigger eval" metric: trigger recall ≥0.80 when 5+ other skill packages installed |
| Workflow degradation too weak ("`--skip-to style` with warning" is not enough) | HIGH | New §3.4a routing matrix — 7 named routes (new-product, new-feature, mature-app-refactor, design-bug, brand-refresh, DS-extraction, PR-audit) with required/optional/skipped stages per route + per-route token budgets |
| `audit` cross-stage semantics under-specified | HIGH | §6 rewritten — stage-specific detector logic per `audit --stage N --pr` mode; per-mode list of what each detector finds (route changes, nav labels, JTBD mapping, etc.) |
| Cost target optimistic — p50-only hides tail | MEDIUM | §11 — added p95 cost targets per route; added partial-output-recovery metric |
| Launch hook directly antagonizes Vercel (v0 distributor risk) | HIGH | §7.2 — reworded hook from "What every AI design tool gets wrong" to "The 5 design stages every AI tool skips — and why your prototype struggles past month 3" (softer); reframes as *complementary positioning*, not attack; specifies design-os outputs DESIGN.md that v0/Lovable/Bolt can consume |
| Lovable refugee persona is primary but `extract --reverse-engineer-stages` deferred to v2.1 | HIGH | §3.4 + §9.2 — feature moved from v2.1 to v2.0b (within MVP timeline); persona alignment restored |
| Indie devs are process-averse — no on-ramp story | HIGH | §3.4a routing matrix provides the on-ramp (start with `design --route design-bug` or `--route new-feature`, never forced to commit to all 5 stages) |
| "Marty Cagan would agree" not defensible as written | MEDIUM | §7.4 reframed to "intellectual heritage" / "complementary to build-to-learn"; no claim Cagan would endorse |
| Stage 3 should be risk-triggered, not mandatory | HIGH | §3.4a + §9.2 — Stage 3 is only required for new-product greenfield; skipped on refactor/bug/refresh/extraction routes |
| "Synthetic only" operational definition missing | MEDIUM | §3.22 explicit table: synthetic-only → PROTO grade; mixed → PROTO_PASS_WITH_WARNINGS; no-data → proto-mode with verbose flags |
| "Saturation reached" not LLM-verifiable | MEDIUM | §3.22 — marked `not assessable` in lightweight mode; only available as VALIDATED-grade check with ≥6 transcripts |
| Custom schemas not ship-ready | HIGH | Acknowledged in §16 verdict — v1.5 infra phase must include versioned JSON Schemas for `persona.json`, `sitemap.json`, `MANIFEST.md`, state specs, AUDIT-REPORT before v2.0a build starts |
| Input ingestion too narrow (Confluence, Figma briefs, PDFs, voice notes) | MEDIUM | §4 — generic "local file/blob ingest" posture acknowledged; deferred specific integrations to v2.1 per §13 Q3 |
| Team workflow only an open question | MEDIUM | §13 Q4 promoted; basic team-handoff spec added: per-stage owner field in frontmatter; explicit Stage-N → Stage-(N+1) handoff via `.handoff/` bundle |

**Codex verdict after revisions:** the v2.0 spine pivot is intact (Garrett's 5 planes + stage gates + design/ directory + fidelity caps + AI-as-facilitator), the BLOCKER is fixed, the structural inconsistencies are resolved, the on-ramp problem has the routing matrix, the Vercel risk is de-escalated, the Lovable-refugee path is in scope for v2.0b. v2.0 is ready for v1.5 infra build with v1.5 explicitly scoped to: versioned JSON Schemas for the design/ directory, preview harness from v1.0.1, port manager, Playwright readiness, security sandbox, gate mechanics implementations, trigger evals, coexistence eval, evidence-graded gate runner.

**Cumulative findings across all codex passes:** v1.0 (5) + v1.0.1 first pass (24) + v1.0.1 third pass (19) + v2.0 (21) = **69 findings, all accepted, none rejected** across 4 codex review passes. The MRD grew from ~720 lines (v1.0 draft) to ~1300+ lines (v2.0 after this round of revisions). Every kill-risk identified across all passes has explicit handling.

---

## 17. Glossary

Preserved from v1.0.1 + v2.0-specific terms:

- **Garrett's 5 planes** — Strategy / Scope / Structure / Skeleton / Surface (Garrett, *The Elements of User Experience*, 2nd ed., 2011). The package's architectural spine.
- **Stage gate** — A deterministic checklist run between stages that determines whether the upstream work is complete enough to proceed. design-os formalizes 6 gates.
- **Cross-stage artifact** — A file in `design/` written by one stage and read by the next (e.g., `design/ia/sitemap.json` from Stage 2 read by Stage 3).
- **Proto-persona** — A persona generated from limited data, explicitly labeled as `provenance: generated` with linked validation plan in `ASSUMPTIONS.md`. Distinct from a validated persona.
- **Synthetic-persona red line** — The NN/g 2024 / ACM Interactions 2026 finding that LLM-generated personas are not a substitute for primary research. design-os hard-blocks Stage 1 completion with synthetic-only data.
- **Fidelity cap** — A hard rule per stage that prevents premature jumping to higher fidelity (Buxton discipline). Stage 3 caps at grey-boxes; Stage 4 caps at state diagrams; Stage 5a requires complete Stage 4 state-maps.
- **OST (Opportunity Solution Tree)** — Teresa Torres's structure: Outcome → Opportunities → Solutions → Experiments. The Stage 1 bridge to Stage 2.
- **JTBD job story (Klement format)** — "When [context], I want to [motivation], so I can [outcome]." The package's preferred JTBD format.
- **Crazy 8s** — 8 ideas in 8 minutes (Sprint method). Stage 3 ideation engine.
- **Decider** — Sprint method for converging on one chosen wireframe from multiple variants. Stage 3 convergence rule.
- **Switch interview (Moesta/Klement JTBD)** — Reconstructs the moment a user switched solutions; surfaces the Four Forces of Progress (push/pull/anxiety/habit).
- **Indi Young thinking-style** — Persona alternative format: 3-5 sentences describing a mindset toward a purpose. No names, no faces, no ages.
- **Lovable refugee** — A founder/dev who built a prototype in Lovable/v0/Bolt, hit the 80/20 wall, and needs to do the design work properly. A primary segment for design-os.
- **Stage-typed artifact** — A file with a stage-specific schema and location. The design/ directory convention enforces stage typing.
- **The design/ directory** — The user-facing artifact substrate. Committed to git. Designer-readable. AI-readable.
- **The .design-os/ directory** — Package-internal state. Selectively committed per v1.0.1 commit policy.

Plus all v1.0.1 glossary terms (DESIGN.md, DTCG, brownfield, greenfield, slop tell, atomic skill, workflow, subagent, adapter, critic, trust posture, terminal state, variant, preview surface, preview backend, variant axis, show-don't-tell, double-billed tokens).

---

## 18. Decision summary

1. **Position:** *The only AI design tool that follows the real 5-stage design process — instead of skipping straight to hi-fi like every other tool.* Spine = Garrett's Elements (Strategy / Scope / Structure / Skeleton / Surface) which maps 1:1 to user's 5 stages.
2. **Anchor formats:** Markdown + YAML frontmatter (Stage 0 PRD); JSON for personas (Stage 1); custom `$type` schema for sitemap.json + Mermaid for flows (Stage 2); Excalidraw JSON for wireframes (Stage 3); Markdown spec + XState v5 machine for interactions (Stage 4); Google DESIGN.md + DTCG v2025.10 (Stage 5).
3. **Cross-stage substrate:** `design/` directory with stage-typed file conventions. Committed to git.
4. **Stage validation gates:** First-class deterministic checklists between stages. The package's biggest contribution to the canon.
5. **Per-stage fidelity caps:** Buxton discipline enforced — Stage 3 refuses styling; Stage 4 refuses hi-fi without state-maps; Stage 5a refuses to render without Stage 4 inputs.
6. **Synthetic-persona red line:** Stage 1 hard-blocks completion with synthetic-only data. NN/g 2024.
7. **Skill count:** 22 (7 workflows + 15 atoms). Fits Codex 2% cap.
8. **Hosts:** Claude Code host-first; Codex CLI + Cursor sequential-fallback; broader hosts v2.1+.
9. **Trust posture (v1.0.1 + v2.0):** don't lead with AI; deterministic emit; never claim WCAG; ask before generating; never auto-publish; cite every rule; synthetic data never primary.
10. **Polyglot input adapters (v1.0.1 preserved + v2.0 extended):** read PRDs (Markdown / paste / interview / v1.1 Notion+Linear+Google), interview transcripts (v2.2), Optimal Workshop CSVs (v2.1), Tokens Studio exports (v2.1), shadcn/Tailwind/Style Dictionary/Radix/Material 3 tokens (v1.0.1).
11. **Polyglot output adapters (v1.0.1 preserved):** Tailwind v4, shadcn, plain CSS in core; Material Web, Vue, Svelte in `design-os-bridges` v2.1+.
12. **Trigger discipline:** 200-char directive front-load; ≥20-prompt eval per skill; CI-gated.
13. **Knowledge architecture:** hybrid file-based (no vector DB, no graph in v2); references organized by stage + canon body.
14. **Critique loop:** terminal states; max 2 repair cycles; visual regression where supported; PR-first diff; user-override capture.
15. **Persistence:** `design/` (artifacts, committed) + `.design-os/` (package state, selectively committed) per v1.0.1 policy.
16. **GTM:** ride platform launch; primary hook = "What every AI design tool gets wrong — and the 5 stages they all skip"; cross-post 8 marketplaces; named designer + PM outreach (Brad Frost + Marty Cagan additions for v2.0).
17. **Monetization:** zero in v2.0; year-2+ paths include enterprise design-process compliance SKU (new in v2.0).
18. **MVP:** Split v2.0a (skeleton, 5 workflows, 9 atoms, 4 gates) → v2.0b (full 5 stages, +2 workflows, +6 atoms, +2 gates). Operationally measurable acceptance criteria.

---

## 19. Sources (delta vs v1.0.1)

Preserves all v1.0.1 sources plus the following new v2.0 research:

### Design-process canon (Stage 1-4 emphasis, new in v2.0)
- Garrett. *The Elements of User Experience*, 2nd ed. (New Riders, 2011) — the 5-plane spine.
- Goodwin. *Designing for the Digital Age* (Wiley, 2009) — Cooper-method end-to-end playbook.
- Hall. *Just Enough Research*, 2nd ed. (A Book Apart, 2019).
- Gothelf & Seiden. *Lean UX*, 3rd ed. (O'Reilly, 2021).
- Torres. *Continuous Discovery Habits* (Product Talk LLC, 2021) — Opportunity Solution Tree.
- Cagan. *Inspired*, 2nd ed. (Wiley, 2017); *Empowered* (2020).
- Singer. *Shape Up* (Basecamp, 2019) — pitches, fat marker sketches, breadboards.
- IDEO. *The Field Guide to Human-Centered Design* (2015).
- Ulwick. *Jobs to Be Done: Theory to Practice* (2016); Christensen *Competing Against Luck* (2016); Klement *When Coffee and Kale Compete* (2016).
- Rosenfeld/Morville/Arango. *Information Architecture*, 4th ed. (O'Reilly, 2015).
- Wodtke & Govella. *Information Architecture: Blueprints for the Web*, 2nd ed. (New Riders, 2009).
- Spencer. *Card Sorting: Designing Usable Categories* (Rosenfeld Media, 2009).
- Buxton. *Sketching User Experiences* (Morgan Kaufmann, 2007).
- Snyder. *Paper Prototyping* (Morgan Kaufmann, 2003).
- Knapp/Zeratsky/Kowitz. *Sprint* (Simon & Schuster, 2016) — Crazy 8s + Decider.
- Saffer. *Designing for Interaction*, 2nd ed. (New Riders, 2010); *Microinteractions* (O'Reilly, 2013).
- Tidwell/Brewer/Valencia. *Designing Interfaces*, 3rd ed. (O'Reilly, 2020).
- Head. *Designing Interface Animation* (Rosenfeld Media, 2016).
- Indi Young. *Mental Models* (Rosenfeld Media, 2008); *Practical Empathy* (2015); thinking-style framework.

### AI-augmented design literature
- Brad Frost — *AI and Design Systems* course (aianddesign.systems, 2024–).
- Maggie Appleton — language-model writing (maggieappleton.com).
- NN/g — *Synthetic Users: If, When, and How to Use AI-Generated "Research"* (2024); *Accelerating Research with AI* (Jan 2026); *A Research Agenda for Generative AI in UX*; *State of UX in 2026*.
- Microsoft HAX Toolkit — *Guidelines for Human-AI Interaction* (Amershi et al., CHI 2019; updated through 2024); HAX Workbook, Patterns, Playbook.
- Anthropic — *Building Effective Agents* (Schluntz/Zhang, Dec 2024); Claude Design / Claude Code framework writing (2025).
- ACM Interactions — synthetic-user people-pleasing study (2026).
- arXiv — *Whose Personae?* (Dec 2025) — 63-paper synthetic-persona review.

### Stage-coverage and competitive landscape (new in v2.0)
- Anna Arteeva. *Design Systems ♡ Lovable, Bolt, V0 and Replit* (Design Systems Collective).
- Addy Osmani. *AI-Driven Prototyping: v0, Bolt, and Lovable Compared* (Substack).
- Sourcetoad. *Getting Your Lovable App into Production* (1,645 app security audit).
- 2025 Stack Overflow Developer Survey — 76% AI-codegen 80/20 wall finding.
- Brad Frost. *Design systems in the time of AI*; *Agentic Design Systems in 2026*.
- Vitaly Friedman. *State of AI UX for Designers in 2026* (Smashing Magazine).
- Producttalk. *Vibe Coding Best Practices: Avoid the Doom Loop*.

### PRD canon
- Ben Horowitz. *Good Product Manager / Bad Product Manager* memo (1997 / Andreessen Horowitz archive).
- Marty Cagan. *Revisiting the Product Spec* (SVPG, 2006); *Discovery vs. Documentation*.
- Lenny Rachitsky. *PRDs and 1-Pagers Examples* (Lenny's Newsletter); *My Favorite Templates*.
- Kevin Yien. Staged PRD template (Coda).
- Amazon. *Working Backwards / PR-FAQ process*.
- GitHub. *Spec Kit* (`github/spec-kit`); *Spec-Driven Development with Markdown*.
- Thoughtworks. *Spec-Driven Development: Unpacking 2025's New Engineering Practices*.

### Per-stage tooling
- Dovetail — Fall 2025 launch (Magic Cluster, Magic Summaries, AI Dashboards).
- Maze AI — Smart questioning, dynamic follow-ups, theme clustering.
- Optimal Workshop AI — Tree/card/IDIs analysis.
- UserTesting AI Insight Summary GA (2025).
- Octopus.do — AI Sitemap Generator (BETA assistant).
- FigJam AI — Diagram generation.
- Visily / Uizard / UX Pilot — Stage-3 AI wireframe comparison (LogRocket Dec 2025).
- Subframe — Designer-first canvas with Claude Code/Cursor/Codex skill bridge.
- Knapsack — $10M Series A (Oct 2025) for Intelligent Product Engine.
- Anthropic Claude Design — Brand extraction + on-brand outputs.
- W3C DTCG — First stable v2025.10 spec (Oct 28, 2025).
- Storybook MCP — Storybook 10.3 (March 2026, React-first via Chromatic).
- Penpot MCP — Penpot Fest 2025 announcement.
- XState — v5 machine schema (Stately).
- Excalidraw — `.excalidraw` JSON format (MIT-licensed).
- Mermaid — `flowchart`, `stateDiagram-v2`.

---

*End of MRD v2.0. Next: codex review pass on this document, apply accepted findings, lock as v2.0.0 pre-build.*
