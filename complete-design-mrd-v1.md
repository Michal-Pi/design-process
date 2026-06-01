# Design-OS — Market Requirements Document v1.0.1

**Status:** Final pre-build, with preview-first correction.
**Date:** 2026-05-24
**Distribution unit:** an agentskills.io v1 SKILL.md package (14 triggerable skills) + `references/` knowledge layer + `assets/scripts/` (incl. preview/dev-server tooling) + DESIGN.md as the persisted contract format.
**Position in one sentence:** *Explore visual design options in your own repo's stack, then commit the chosen direction as a DESIGN.md contract that every coding agent — Claude, Cursor, Codex, Junie — respects on every future generation.*

---

## 0. Changelog

### v1.0.1 — Preview-first design correction (current)

A reviewer noted that the v1.0 "extract → enforce → audit" framing assumes the user already knows what they want — wrong for both greenfield (no system to extract from) and brownfield refresh (system exists but is being reconsidered). The framing also wrongly ceded "see UI proposed visually" to live-preview tools (v0/Lovable). It does not need to: `frontend-design` already spawns a local Node server to render options, and the modern agent harness exposes Playwright, Chrome DevTools, and claude-in-chrome MCPs — visualization inside the agent loop is technically achievable today.

**A second correction lands at the same time:** v1.0 wrote off greenfield as "structurally lost" to v0/Lovable/Bolt on the grounds that those tools offer live preview complete-design couldn't match. Both halves of that claim are wrong:

1. The preview gap is closable (see above — Playwright + Chrome DevTools + claude-in-chrome MCPs).
2. **The "v0/Lovable own greenfield" framing ignores why most coding-agent users *don't* use v0/Lovable.** They are already paying for Claude Code / Cursor / Codex / Junie. v0 ($20-50/mo + Vercel token usage), Lovable ($25+/mo + their LLM calls), Bolt ($20+/mo) all mean: a second subscription, a second runtime, a second login, and — critically — *paying for LLM tokens twice* (once for the coding agent, once for v0/Lovable). For solo devs, indie SaaS builders, and most professional devs working in their own repo, that's a hard no. The 17M users of v0+Lovable+Bolt are real, but the >50M users of Claude Code / Cursor / Codex / Copilot are a different (and larger) market — many of whom explicitly *rejected* the live-preview tools for the cost-and-fragmentation reason.

That's the actual primary market for complete-design: **devs who already pay for a coding agent and want it to be capable of design exploration, without adding a second tool that double-bills tokens.** Greenfield is not ceded; it's a first-class use case alongside brownfield.

**The corrected mental model: design (with visual variants in YOUR stack on the agent you're already paying for) → pick → contract → enforce → audit.** The contract is the *output* of a converged design choice, not the prerequisite. v1.0.1 adds:

- A new headline workflow `design` (§3.6) — generates 3 visual variants, renders them in a local dev server, screenshots via Playwright / Chrome DevTools / claude-in-chrome, presents side-by-side, supports accept/iterate/reject. Works greenfield (5-question intake) and brownfield (extract baseline first).
- A `preview/` skill family (4 atoms): `preview/render-variants`, `preview/serve`, `preview/screenshot`, `preview/iterate`.
- Total triggerable skills up from 10 to **14** (still well under Codex 2% cap; descriptions re-engineered to fit).
- Repositioning: §1 and §2.6 no longer cede the entire "visualize my options" surface. complete-design offers visual exploration *in the user's own stack with their own components and their own DS* — which v0/Lovable structurally cannot, because they render in their own runtime with their own components. This is a stronger differentiation than the brownfield-only stance of v1.0.
- The launch hook (§7.2) leads with a preview-demo recording, not just the slop-tells list.
- The trust posture (§2.4) gains a new tenet: *show, don't tell* — every contract decision is rendered visually before being committed, never asserted blind. This is the same lever that won Subframe its designer trust.
- `direction/bootstrap` becomes an *internal* atom invoked by `design`, no longer a user-facing entry skill.

The rest of v1.0 (DESIGN.md anchor, DTCG tokens, polyglot adapters, critique gate, security policy, monorepo design, determinism verification, suppression policy, security/permissions) is preserved.

### v1.0 — Strategic rewrite (pre-correction)

Full v1.0 rewrite from v0.2; covered below in §0a.

---

## 0a. What changed from v0.2, and why

The v0.2 MRD passed a codex review but failed a second-order adversarial review. The strategic position was wrong, the scope was bloated, and the moat against live-preview tools was untested. Three research streams (skill-adoption mechanics, designer trust, live-preview competitive durability) forced a reframe. The five load-bearing changes:

1. **Repositioned from "UI generator" to "design-contract layer."** The "make me a UI" job is structurally lost to v0 (4M+ users, $340M ARR), Lovable (8M users, $400M ARR Feb 2026), and Bolt (5M users, $40M+ ARR). An in-agent skill cannot match live visual preview. But a *design-contract* — the persisted record of what your tokens, components, and patterns are, in a format every agent can consume — is the unfilled niche. Subframe, Miro Aura, Builder.io, Storybook MCP via Chromatic are all converging on it. We anchor here.
2. **Adopted DESIGN.md as the output anchor.** Google open-sourced DESIGN.md in April 2026; Stitch (formerly Galileo AI) is the reference producer; `awesome-claude-design` has 68+ examples; Anthropic's `frontend-design` skill (277k installs) has open issue #1008 requesting consume/produce support. Inventing our own contract format would be malpractice. We consume and produce DESIGN.md natively.
3. **Cut from 89 skills to ~10.** The data is unambiguous: multi-skill packages of inner-loop skills win on weekly installs, *but* Codex CLI caps the skills metadata index at ~2% of context (openai/codex#19679). 89 skills is a tax on every Codex user with this package installed. 10 narrow inner-loop skills that compose is the empirically winning shape (Superpowers, Inferen-sh, Microsoft Azure suite all hover in this ratio after collapsing redundant entries).
4. **De-emphasized "AI" in positioning.** Designer discourse through 2025–2026 turned actively hostile to AI-branded design tools (Tobias van Schneider, Brad Frost, Vitaly Friedman, the Claude Design backlash). "AI slop" was 2025 Word of the Year. The package frames as a *design-contract bundler*, not an "AI design tool." This is positioning, not denial — the package is LLM-driven, but the headline value is *persistence, fidelity, and enforcement*, not generation.
5. **Made GTM a first-class requirement.** v0.2 punted GTM to a §11 paragraph. The data shows cold launches don't reach top 20; every top-10 skill rode a platform launch as zero-day content and had a quotable memetic hook. We design the launch into the package, not after it.

The remaining v0.2 architecture (persistence under `.complete-design/`, host compatibility contract, stack adapter interface, canonical manifest, critique terminal states, knowledge architecture, multi-axis direction model, trigger discipline) survives, refactored to fit the narrower scope.

---

## 1. Executive Summary

**The opportunity, restated.** Coding agents (Claude Code, Codex, Cursor, Junie, Copilot) now generate the majority of new UI code in production codebases. They generate it badly when they have no design system to anchor to — defaulting to indigo gradients, Inter typography, glass cards, shadcn defaults — what the discourse now calls "AI slop." The popular workaround — switching to v0 / Lovable / Bolt — solves the visual-exploration problem but creates two new ones: **(a) a second subscription billed on top of the user's existing coding-agent cost, and (b) tokens paid twice**, once on the coding agent and once on the live-preview tool's LLM. For most devs already paying for Claude Code or Cursor, that double-billing makes the live-preview tools a non-starter — explaining why v0+Lovable+Bolt's combined ~17M users are a *fraction* of the >50M total coding-agent userbase. Anthropic's `frontend-design` skill (277k installs) is the dominant in-agent response, but it's prose-only: it tells the model to *be bold* without giving it a contract and without showing the user what "bold" looks like before committing. Subframe and Miro Aura bundle a real design system as agent-readable contract + MCP server + skill, but Subframe locks you into their canvas and Miro Aura is private. Google's April 2026 DESIGN.md spec finally gave the ecosystem an open contract format. **What's missing is a host-portable, framework-agnostic skill package that — inside the agent the user is already paying for — explores 3 visual design variants in the user's own repo, lets them pick, then commits the result as a DESIGN.md contract every agent respects.**

**What we are building.** `complete-design` ships 14 narrow inner-loop skills that compose into **four** flows:

- **design** *(headline)* — generates 3 visual variants of the same scope (hero / page / component), renders each in a local dev server using the user's own stack (Vite / Next / plain HTML), screenshots them via Playwright / Chrome DevTools / claude-in-chrome MCP, shows side-by-side, lets the user accept / iterate / reject. Works greenfield (5-question intake) and brownfield (extract baseline first). On accept, the chosen variant is committed as DESIGN.md.
- **extract** — for users who already have a system and just want it captured as-is, no exploration. The brownfield path of `design`, invocable standalone.
- **enforce** — once a contract exists, constrains every subsequent agent generation in the repo.
- **audit** — diffs generated UI (a PR, a file glob, a URL) against the contract. Findings with severity, citation, fix recipe.

Output is always DESIGN.md (the Google spec) plus DTCG-v2025.10 tokens plus stack-native projections (Tailwind v4 `@theme`, shadcn `:root`/`.dark` OKLCH, plain CSS variables). The package never generates a complete UI from a prompt as the final artifact — it generates *variants for selection*, then commits the chosen one as a contract. This is the explore-then-converge pattern designers actually use, executed in the user's own repo.

**The defensible moat.** Five advantages, in order of durability:

1. **Visualization in the user's own stack, with their own components.** Live-preview tools (v0, Lovable, Bolt) preview in *their own runtime* with *their own components* — that's why outputs feel templated and v0-ish. complete-design spawns a dev server in the user's stack (Vite / Next / plain) and renders variants using whatever components the repo already has. The preview *is* what the production result will look like, because it runs in the production stack. No live-preview vendor will build this — it would cannibalize their runtime.
2. **Runs in the repo against the actual code.** Same advantage as v1.0 — live-preview tools cannot read your existing tokens, components, brand assets.
3. **Host-portable.** SKILL.md works across 18+ agent harnesses. v0/Lovable/Subframe are runtime-locked.
4. **Consumes/produces the open standard.** DESIGN.md is becoming the design-system interchange the way DTCG became the token interchange. Being polyglot — read shadcn `globals.css`, Tailwind config, Tokens Studio export, Style Dictionary source, Radix theme, Subframe MCP, Storybook MCP via Chromatic, Builder MCP, Material 3 tokens — is the moat live-preview vendors won't build because it doesn't drive their runtime.
5. **Critique gate as a first-class verb.** `audit` is differentiated from any live-preview tool. This is the trust posture Subframe demonstrated wins designers.

**The MVP wedge.** A working **`design`** workflow that takes a brief (or an existing repo), generates 3 visual variants, renders them in a Vite dev server in the user's repo, screenshots via Playwright, and lets the user pick — committing the chosen variant as `.complete-design/DESIGN.md`. Plus `audit` standalone. Two workflows, demonstrably useful on day one. Total install footprint 14 skills (within Codex's 2% cap budget even with 5+ other packages installed).

**The hook (memetic compression).** Working title: **"Three designs in your own repo, before you commit to one."** A 90-second demo recording — open repo, run `design`, watch 3 variants render in the local browser, pick one, commit. The launch artifact pairs this demo with the "Ten design-system tells" critique list (kept from v1.0 — it doubles as `audit --slop-tells`).

---

## 2. Market Requirements

### 2.1 Market context

Three contemporary shifts make this MRD timely. None were as crisp in v0.2.

1. **The contract layer just got an open standard.** Google open-sourced DESIGN.md (`google-labs-code/design.md`) in April 2026 as the agent-readable design-system format. Stitch (formerly Galileo AI, Google-acquired) is the reference implementation. `awesome-claude-design` has 68+ DESIGN.md examples and a generator at design.dev. Anthropic's `frontend-design` skill has open issue #1008 requesting DESIGN.md consume/produce support. The format is six months old and already entrenched. This is the DTCG moment for design contracts — the spec stabilized just before the ecosystem needs it.
2. **Coding agents are absorbing a meaningful share of "make me a UI" work — Vercel's own data is suggestive.** v0 + Lovable account for only ~6% of agent-initiated deployments on Vercel's own platform; the other ~94% come from Claude Code, Codex, and Cursor. The popular framing ("v0 won greenfield, agents won brownfield") is too simple. **A meaningful segment of coding-agent users avoids separate live-preview tools because of cost, context switching, and repo-handoff friction.** complete-design targets that segment first. The Anthropic `frontend-design` skill's 277k installs is consistent with this hypothesis (though it doesn't prove it — those installs could also reflect users who use both or who installed many skills speculatively). The market for "preview-capable design in the agent loop" is at minimum the size of `frontend-design`'s installed base, and plausibly several multiples of it.
3. **Designer discourse turned on AI design tools.** Through 2025–2026 named designers (Brad Frost, Vitaly Friedman, Tobias van Schneider, Pablo Stanley, Mike Monteiro) and the broader "AI slop" discourse made AI-branded design tools a trust liability. van Schneider literally removed "AI" mentions from his own marketing. Brad Frost's framing — *"design systems are the antidote to AI slop, not a competitor to AI"* — is the playbook. A skill package that positions as a *design-system enforcement layer* rather than an *AI design generator* survives the discourse.

Against that backdrop:
- Anthropic's `frontend-design` (~212k weekly installs, ~422k cumulative) and Vercel's `web-design-guidelines` (~206k weekly) are the dominant skills today. Both are prose-only. Both lack contract persistence. Both have user complaints about output sameness.
- Subframe shipped a Claude Code/Cursor/Codex skill bridge with bidirectional design-system ↔ agent sync (`npx @subframe/cli sync --all`) but is locked to the Subframe canvas.
- Miro built Aura — full MCP server + Claude Code skill bundle, 48+ teams — but private to Miro.
- Storybook + Chromatic now auto-publish MCP servers from component manifests. Any team using Storybook gets a design-system MCP for free.

The position open in this market is the **open, host-portable, framework-agnostic design-contract bundler that reads any of the above sources and emits DESIGN.md + tokens + skills that any agent can consume.** No incumbent is in that exact lane.

### 2.2 Why now (argued, not asserted)

Five specific events make 2026 the year, not 2025 and not 2027:

| Event | Date | Why it matters |
|---|---|---|
| agentskills.io v1 spec stabilized | 2025-12-18 | Skills are now portable across 18+ hosts; spec drift is no longer the blocker. |
| W3C DTCG token format v2025.10 first stable | 2025-10-28 | Token interchange is finally a solved problem; emit once, consume anywhere. |
| Google open-sourced DESIGN.md | 2026-04 | Design-contract interchange has an authoritative open format we can anchor to. |
| Tailwind v4 + shadcn `data-slot` + Radix Colors 12-step + OKLCH support shipping in all major browsers | 2025 H2 → 2026 H1 | The lingua franca of LLM-generated React UI is now coherent enough to encode as a reference. |
| Designer discourse against "AI slop" hits cultural peak | 2025–2026 | The market is hungry for tools that *aren't* AI generation theater. Position lands. |

Earlier than this and the spec stack wasn't ready. Later than this and Anthropic/Vercel will likely ship their own DESIGN.md adapter inside `frontend-design`/`web-design-guidelines` and own the lane.

### 2.3 Customer segments — refined

| Segment | JTBD | Pain | Buying trigger | Adoption blocker | Success criteria |
|---|---|---|---|---|---|
| **Indie dev / solo SaaS builder, never adopted v0/Lovable** *(primary)* | Get design exploration *inside* the agent I already use, without taking on a new tool | Tried `frontend-design` skill but it's prose-only — gives no visual; tried v0 once but didn't want a second subscription or to context-switch | Starting a new product, marketing site, or major feature | Wants to *prefer* tools that work in their existing agent; allergic to AI-branded marketing | `design` workflow: 3 variants rendered in their own stack, pick one, contract committed — all without leaving Claude Code/Cursor |
| **Dev migrating off v0/Lovable into an owned repo** *(primary)* | Take a v0/Lovable prototype to a real production repo without losing the design direction | The prototype's tokens/components are templated; moving them to "real code" loses the look-and-feel; rewriting in their stack drifts to slop | Production-readiness pressure on a v0/Lovable-built prototype | Concern about losing the design they paid for | `extract` from the prototype (Tailwind config + globals.css are usually intact) → DESIGN.md → `enforce` on the new repo; preview variants can refine the imported direction |
| **Brownfield founder/lead refreshing an existing app** *(primary)* | Try a few design refreshes against my real product before committing to any | Don't want to greenfield-rewrite; can't visualize options in Figma without a designer; their agent generates random aesthetic each session | Quarterly brand/UI refresh; investor feedback; "looks dated" reviews | Doesn't want to break working components | `design` workflow on the existing repo: 3 refresh variants that all reuse current components, side-by-side, pick the one that lands |
| **Frontend engineer on a team with an existing design system** *(primary)* | Make my agent (Claude Code / Cursor / Codex) respect our tokens, components, and patterns | Agent generates slop on top of our system; new components don't match | First PR that drifts noticeably from the system | Skepticism toward another tool; trust gap | One skill install + `extract` → next agent generation respects existing tokens |
| **Design-system maintainer at a Series-B/enterprise** *(secondary)* | Govern AI-generated UI inside my company | Devs use shadcn/v0/Lovable defaults; drift compounds; my system gets bypassed | First AI-coding-tool rollout in a team using our DS | Existing investment in Style Dictionary/Knapsack/Supernova | Plugs into existing pipeline; produces audit reports that name violators |
| **Designer working with a coding agent** *(secondary)* | Translate Figma intent into faithful code without an LLM redesigning it | Agent ignores tokens; round-trip is lossy | Working on a project with no design-eng pair | Trust gap toward generation-claiming tools | Reads Figma DTCG export, emits matching code, audits drift |
| **AI-builder embedding `complete-design`** *(secondary)* | Constrain my own generator's output to known-good patterns | Their LLM produces slop without scaffolding | Quality complaints from end-users | Concern about over-constraining brand voice | Programmatic invocation of `extract` + `enforce` with structured I/O |
| **PM authoring a launch page** *(tertiary)* | Author a credible landing page without a designer | Doesn't know vocabulary; agent output looks templated | Founder-led launch | Cannot/will not write SKILL.md or YAML | Invoked transparently via their existing Cursor/Claude session, no setup |

The PM and solo-builder segments are real (Lenny's Dec 2025 data: 19.8% of PMs use AI for mockups; 83.6% named at least one AI tool they'd miss) but they reach the package only through their existing coding agent surface, never by writing skills directly. The package's UX must work for them through Cursor's chat / Claude Code's CLI without exposing internals.

### 2.4 The trust gap (new)

The package will be evaluated socially before it's evaluated technically. The Figma 2025 AI Report shows the audience split: developers are 82% satisfied with AI design tools, designers only 69%; 59% of devs use AI for core work vs. 31% of designers. A package whose launch tweet reads *"AI-powered design system generator"* loses the designer cohort before it ships.

Design choices that buy designer trust (drawn from Subframe, Builder.io Visual Copilot, Figma "Check Designs" — the AI design tools that genuinely won designer endorsement):

| Design choice | Rationale | Implementation in complete-design |
|---|---|---|
| **Don't lead with "AI" in positioning** | van Schneider's signal: AI branding is now a negative trust marker | Package name: `complete-design`. Tagline: *"the design-contract layer for agent-driven frontend work."* No "AI" in tagline, README headline, or top-level skill names. |
| **Make the final output deterministic** | Subframe's trust lever: once choices are made, code emission is a pure function of the contract, not an LLM call | Token emit, component scaffold projection, and contract → CSS-var mapping are deterministic scripts in `assets/scripts/`. LLM picks; code emits. |
| **Refuse to claim WCAG conformance; report measured contrast** | Frontend Masters' critique: LLMs cannot certify accessibility | Output is always `WCAG 2.2 AA contrast: 4.7 (pass)`, never `WCAG-compliant`. |
| **Surface citation for every style choice** | Designers' #1 complaint about Claude Design was *"no shared understanding of tradeoffs"* | Every contract decision in DESIGN.md carries a `source:` field — `Radix step 11`, `Bringhurst §4.2`, or `house heuristic` |
| **Ask clarifying questions before generating** | Subframe was praised for exactly this pattern | `extract` and `enforce` prompt for brand adjectives, references, and an explicit anti-pattern list before producing anything |
| **Never auto-publish to git tree** | Addresses the gatekeeper-bypass fear directly | Diff-by-default per §5.5; `--apply` required for write; PR-first always |
| **Ship anti-slop detection as a first-class verb** | Pre-empt the social pile-on by being the package's own most honest critic | `complete-design audit` outputs the designer's likely objections: gradient overuse, type stack matches shadcn default, indigo dominance, etc. |
| **Show, don't tell — every contract decision is rendered visually before commit** | Designers' #1 complaint about Claude Design was *"the tool read the ingredients but could not cook the meal."* Asserting "we chose Geist Mono + Slate scale" is meaningless without showing what that looks like. | `design` workflow renders 3 variants in a local dev server with the user's actual components, screenshots them, presents side-by-side. No contract is committed without the user seeing it rendered. |
| **Target toil, not taste** | Figma 2025 report: designers welcome AI on contrast/tokens/docs; reject it on aesthetic judgment | The package automates token math, contrast checks, dark-mode mapping, Figma↔code translation; never claims to make creative decisions |
| **Hand-curated primitives, not generated ones** | Subframe's 47-component model | Style codifiers ship hand-vetted recipes; the LLM parameterizes and selects, doesn't invent |
| **Be quotable in a way designers want to share** | Memetic compression (per `frontend-design`'s banned-fonts list, `superpowers`' Iron Law) | Launch artifact: *"Ten design-system tells that prove your agent is writing slop"* with each tell linked to a detector in the package |

This is *not* the same as "be conservative about scope." The package can do ambitious things; it just must do them with explicit deference to the human design authority. The trust posture is the differentiator.

### 2.5 Competitive landscape — refreshed

| Player | Position | Adoption | Direct collision with complete-design? |
|---|---|---|---|
| **Anthropic `frontend-design`** | Single-file prose skill, "be bold" direction | ~212k weekly, ~422k cumulative installs; #3 overall | **High.** They have the install base. Open issue #1008 asks for DESIGN.md support — when (not if) they ship it, that's our window closing. We must launch before they add contract persistence. |
| **Vercel `web-design-guidelines`** | Audit-only, remote-fetch rule set | ~206k weekly | Medium — we audit too, but they don't extract or enforce contracts. Possible complementary positioning. |
| **`shadcn` skill** | Teaches agent to use shadcn CLI | ~147k weekly | Low — adjacent, possible integration. We could explicitly recommend it as the components substrate. |
| **`leonxlnx/taste-skill` (gpt-taste, minimalist-ui, industrial-brutalist-ui)** | Style-fragmented prose | ~56k+ across suite | Low — style choosers; complementary if anything. |
| **`pbakaus/impeccable`** | 27 anti-pattern rules + LLM critique | ~54k | Medium — closest spirit-match on the critique side. They lack contract extraction; we lack their depth of rules. |
| **`extract-design-system` (arvindrk)** | Playwright scrape of a URL → DTCG | ~99k | Medium — same extraction verb, but they target external URLs; we target the user's own repo. Complementary. |
| **Subframe** | Designer-first canvas with shipped Claude Code/Cursor/Codex skill + MCP | Pre-seed, niche-but-loved | **High on the contract layer.** They ship the skill bridge. Their lock-in is to Subframe canvas; we bet on running against *any* existing system. |
| **Claude Design (Anthropic Labs)** | Extracts tokens from a GitHub repo at onboarding, keeps output on-brand | Recently launched; mixed reception ("loads the brand system, produces hideous on-brand outputs") | **Very high.** This is the most direct philosophical competitor — Anthropic doing what we want to do from inside Anthropic's stack. We win on (a) host-portable across Cursor/Codex/Junie not just Claude, (b) DESIGN.md output not Anthropic-internal format, (c) explicit critique loop. |
| **Stitch (Google, ex-Galileo AI)** | Reference DESIGN.md producer/consumer | New, no public install metrics | Low — they target generation from prompt; we target extraction from repo. We *consume* DESIGN.md they produce. |
| **Builder.io Visual Copilot + Builder MCP** | Figma → code; MCP for design-system docs | Enterprise scale | Low — Figma-first input; we are repo-first. Complementary. |
| **Storybook MCP via Chromatic** | Auto-published MCP from any Storybook | Any Storybook user gets it free | **High on the components surface.** Massive distribution. We must read it (be a polyglot adapter), not compete with it. |
| **Tokens Studio + Style Dictionary** | Figma-side authoring + transform pipeline | Industry standard | Low — adjacent infrastructure. We project to Style Dictionary; we read Tokens Studio exports. |
| **Knapsack / Supernova / zeroheight** | Enterprise design-system platforms | Enterprise | Low — they are platforms, we are a skill. Possible enterprise complementary play later. |
| **v0 / Lovable / Bolt** | Live-preview UI generation | 17M+ users combined | **Low on our positioning** — we explicitly cede this surface. They are upstream users: a `complete-design`-produced DESIGN.md can be loaded into v0's prompt to constrain its output. We pitch as "the layer underneath v0." |

### 2.6 Where we win and where we lose (honest)

The single most useful thing this MRD can do for the team is be candid about both halves.

**Where we structurally lose:**
- First-time-user "describe an app, see it appear" — v0, Lovable, Bolt own this for years.
- Visual editing on a canvas — Subframe and Figma Make own this for designers.
- Pre-baked component aesthetics — shadcn (via v0) is the default.
- The DESIGN.md format itself — Google owns the spec.
- Marketing capture on "AI UI design" — too many incumbents.
- Live preview during generation — fundamentally a different runtime than ours.

**Where we structurally win:**
- **Brownfield design-system fidelity.** The user with an existing Next.js + Tailwind + Radix repo, or a Vue + Pinia repo, or a React Native app, who wants Claude/Cursor/Codex to *respect* what they already have. Live-preview tools cannot serve this; their core assumption is greenfield.
- **The polyglot adapter to every design-system source.** Read shadcn `globals.css`, Tailwind v4 `@theme`, Style Dictionary source, Tokens Studio export, Radix Themes config, Material 3 tokens, Subframe MCP, Storybook MCP via Chromatic, Builder MCP, Figma DTCG export. No live-preview tool will build this — it doesn't drive their runtime adoption.
- **Host portability across the agent ecosystem.** SKILL.md works on Claude Code, Codex, Cursor, Junie, Copilot, Gemini, Cline, Continue. v0/Lovable/Subframe are runtime-locked.
- **The contract/audit verb that no live-preview tool will ship.** "Audit this PR against the design contract" is strictly subtractive to their value prop, so they won't build it. It's directly additive to ours.
- **Composability with the user's existing agent workflow.** Skills coexist with AGENTS.md, CLAUDE.md, MCP servers, slash commands, the user's own scripts. v0's canvas is a context switch.

### 2.7 Market opportunity

A focused, sourced opportunity statement:

> **The unfilled need is a host-portable, framework-agnostic skill package that turns any existing repo's design system into an agent-consumable DESIGN.md contract, projects it to every major output format, and audits new generations (from v0, Lovable, Cursor, Claude Code, anywhere) against it. The wedge is brownfield design discipline. The standard to anchor to is DESIGN.md. The trust posture is enforcement and citation, not generation.**

The total addressable user count is bounded by: ~422k cumulative `frontend-design` installs + ~100k cumulative `extract-design-system` installs + ~147k cumulative `shadcn` skill installs ≈ the agent-driven frontend developer population that has already installed a design-adjacent skill, ~700k+ unique users (assuming meaningful overlap). A target of **50k installs in the first 90 days** is realistic if the launch executes; 250k in the first year would put the package in the top-10 by install.

---

## 3. Product Requirements

### 3.1 Vision

> *Make every coding agent — Claude Code, Cursor, Codex, Junie, Copilot, Cline — respect the design system that already exists in your repo. Extract it once, persist it as a DESIGN.md contract, and have every subsequent agent generation read from it and be audited against it.*

### 3.2 Product principles

Ten principles. The first five are inherited from v0.2 and survived the adversarial review. The last five are new responses to the research.

| # | Principle | Implication |
|---|---|---|
| P1 | **Extract before generate.** | The package's primary verb is `extract`, not `create`. We never generate a contract from a prompt before checking whether one can be inferred from the repo. |
| P2 | **Direction precedes generation, with a standalone fallback.** | Atomic skills, when invoked standalone, read `.complete-design/DESIGN.md` first. If absent: infer from repo, or emit `direction: unset` draft and ask one blocking question. Never silently picks defaults. |
| P3 | **DESIGN.md is the contract, DTCG is the tokens.** | Anchor on Google's open spec for design contracts. Emit DTCG v2025.10 JSON for tokens. Every other output (Tailwind, shadcn, CSS) is a projection. Never invent our own format. |
| P4 | **Sourced opinions, cited at rule granularity.** | Every rule cites a canonical source (Radix step roles, Bringhurst measure, WCAG SC) or is labeled `house heuristic`. References ship as summary-not-excerpt with source-class metadata per §3.11. |
| P5 | **Project context is non-optional.** | Before generating, scan the user's repo for existing tokens, components, brand assets, stack. Reconcile, don't override. |
| P6 | **The final code emit is deterministic.** | Subframe's trust lever, encoded as a rule: LLM picks and parameterizes; the contract → CSS-var, contract → JSX, contract → Tailwind `@theme` mappings are pure functions in `assets/scripts/`, runnable offline. |
| P7 | **Critique is a verb, not a feature.** | `complete-design audit` is a first-class workflow with terminal states (`PASS` / `PASS_WITH_WARNINGS` / `FAILED_AFTER_REPAIR` / `USER_OVERRIDDEN`). Workflows never report success when audit fails. |
| P8 | **Never claim WCAG conformance; report measured contrast.** | Output `WCAG 2.2 AA contrast 4.7 (pass)`, never `WCAG-compliant`. APCA is an informational signal only; WCAG 2.x is conformance. |
| P9 | **Don't lead with AI.** | Package name, taglines, top-level skill names, and the launch artifact avoid "AI" framing. The package is LLM-driven; the value is enforcement, fidelity, and persistence. |
| P10 | **Trigger discipline for Codex's 2% cap.** | Every skill description is engineered for aggressive truncation: directive pattern, 5+ quoted trigger phrases front-loaded in the first 200 chars, ≥20-prompt should-fire/should-not-fire eval per skill, CI-gated. Total triggerable skill count is **14** (4 workflows + 10 atoms) — chosen to fit within Codex's ~8k metadata budget even with 5+ other packages installed. (Underlying implementation — scripts, reference data, adapters, style assets — is intentionally larger; "14 skills" means 14 triggerable units, not 14 source files.) |
| P11 | **Channel segmentation: AI in the architecture, not the README.** | Designer-facing surfaces (README headline, launch artifact, marketing site, package tagline) frame complete-design as a *design-contract layer* and *audit tool* — never "AI design generator." Developer-facing surfaces (technical docs, MRD, eval reports, debug output) discuss LLM behavior honestly because developers need that detail to debug. Same product, two audiences, deliberate language. |

### 3.3 Target personas (operationalized)

| Persona | Surface | First-touch flow |
|---|---|---|
| **Priya — Frontend lead with an existing DS** | Cursor or Claude Code in repo | `extract` → reviews `.complete-design/DESIGN.md` diff → commits → next agent gen respects it |
| **Maya — Indie dev shipping a SaaS** | CLI agent in repo | `extract --bootstrap` (allows missing system) → reviews proposal → commits → enforce |
| **Sam — DS maintainer at Series-B** | CI + local agent | CI runs `audit` on every PR; surfaces findings as PR comments |
| **Ren — Designer paired with an agent** | Claude Code, Figma open | `extract --source figma-export.dtcg.json` → contract reflects Figma intent → audit drift |
| **Jordan — AI-builder embedding complete-design** | Their runtime | `complete-design enforce --constrain` constrains their generator to a loaded contract |
| **Lin — PM authoring a landing page** | Cursor / Claude.ai chat | Never sees the package directly; agent invokes `extract` + `enforce` transparently when the user asks for help with UI |

### 3.4 Jobs-To-Be-Done

The three core JTBDs the package executes, in priority order:

1. **"Capture the design system that's in this repo so the agent stops drifting from it."** → `extract` workflow.
2. **"Generate this UI thing in a way that matches our system."** → `enforce` workflow + atomic invocations.
3. **"Audit this PR / this generated UI against our system and tell me what drifted."** → `audit` workflow.

Two secondary JTBDs handled via atomic skills:

4. **"Convert tokens to my framework."** → `tokens-emit` atom.
5. **"Pick a defensible direction when there's nothing in the repo yet."** → `direction-bootstrap` atom (fallback, not primary).

### 3.5 DESIGN.md as the primary artifact

This is the load-bearing format decision. Everything else flows from it — but with one explicit caveat:

> **DESIGN.md is the preferred v1.0 interchange anchor, not an assumed permanent winner.** Google's own announcement labels it a "draft specification" and the Anthropic issue (#1008) tracks it as alpha. complete-design keeps DTCG tokens, `sourceRefs`, and extractor evidence portable enough to project into another contract envelope if DESIGN.md adoption stalls. `$extensions.complete-design` is the spec's documented mechanism for namespaced metadata — vanilla DESIGN.md consumers safely ignore it. We are *using* the spec's extension mechanism, not extending the spec.

**Format:** Google's DESIGN.md spec (`google-labs-code/design.md`, April 2026), with our `$extensions.complete-design` namespace carrying the structured token + composition data DESIGN.md leaves unspecified.

**Structure of a complete-design-produced DESIGN.md:**

```markdown
# Design Contract: Acme Inc

> Generated by @pm-musketeers/complete-design@1.0.0  ·  Last reviewed by ren@acme  ·  2026-05-24
> Sources: tailwind.config.ts, src/app/globals.css, src/components/ui/*,
>          brand-assets/, figma-export.dtcg.json
> Confidence: 0.92 (high; 3 attributes inferred at <0.7)

## Brand voice
Calm, technical, restrained. Audience: senior engineers.
Tone axis: [formal: +1, dense: 0, expressive: -1, serious: -1].
Source: house heuristic (extracted from existing copy in marketing/*).

## Visual style
geist-precision (Linear/Vercel lineage). Confidence: 0.88.
Source: existing palette + monospace-heavy type stack + spacing rhythm.

## Color
Primary OKLCH: oklch(70% 0.14 250). Radix step roles applied.
Background: oklch(99% 0 0). Foreground: oklch(15% 0 0).
Full 12-step scale: see $extensions.tokens.color.

Contrast (WCAG 2.2):
  text-foreground on bg: 16.8:1 (AAA)
  text-muted on bg: 5.2:1 (AA pass)
  accent on bg: 4.7:1 (AA pass)
Source: contrast.mjs computed; not a conformance claim.

## Typography
Display: Geist Mono (system fallback: ui-monospace).
Body: Inter Tight (system fallback: ui-sans-serif).
Modular scale ratio: 1.2 (minor third). Measure: 65ch on body.
Source: existing globals.css + Bringhurst §4.2 measure rule.

## Spacing
Base unit: 4px. Scale: t-shirt (xs/sm/md/lg/xl/2xl/3xl).
Source: existing Tailwind v4 @theme; mapped to DTCG dimension tokens.

## Components in use
shadcn/ui (data-slot pattern), 23 components detected.
Custom components: 7 (see $extensions.components).

## Forbidden / out-of-system
- Purple gradients (system uses single-hue OKLCH only)
- Inter Regular without Tight variant (drift target)
- Glassmorphism (conflicts with declared geist-precision style)

## $extensions
  complete-design:
    schemaVersion: 1
    tokens: { ... DTCG v2025.10 ... }
    components: [ ... structured manifest ... ]
    manualOverrides: [ ... ]
    sources: [ ... per-attribute confidence and source ... ]
```

This is the file that `extract` writes, `enforce` reads on every generation, and `audit` evaluates PRs against. It's the user-readable contract the package optimizes for. The full `$extensions.complete-design` block is the machine-readable contract every other emit projects from.

### 3.6 Architecture — narrower, deeper

The full architecture, with v0.2's bloat removed.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW LAYER  (4 named workflows, each a SKILL.md)                    │
│                                                                          │
│  design   *(HEADLINE)* — explore variants → preview → pick → commit DESIGN.md │
│  extract  — repo signals → DESIGN.md (no exploration; for "capture as-is")    │
│  enforce  — load DESIGN.md → constrain agent's next generation                │
│  audit    — diff DESIGN.md vs generated UI / a PR → findings                  │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ invokes
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ATOMIC SKILLS  (10 inner-loop skills, one job each)                     │
│                                                                          │
│  contract/extract-from-repo                                              │
│  contract/extract-from-figma           (v1.1)                            │
│  contract/extract-from-image           (v1.2)                            │
│  tokens/emit                          # DESIGN.md → Tailwind/shadcn/CSS  │
│  components/audit-against-contract                                       │
│  critique/slop-detector                                                  │
│  direction/bootstrap                  # internal; invoked by `design`    │
│  preview/render-variants    *(NEW)*   # generate N variant proposals     │
│  preview/serve              *(NEW)*   # spawn local dev server           │
│  preview/screenshot         *(NEW)*   # Playwright/CDT/CiC capture       │
│  preview/iterate            *(NEW)*   # refine a picked variant          │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ reads
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  KNOWLEDGE LAYER  ( references/  +  assets/  +  deterministic scripts )  │
│                                                                          │
│  references/{wcag-2-2, dtcg, radix, design-md, shadcn-tailwind-v4,       │
│              react-aria, apg, material-3, ai-ux-patterns,                │
│              forbidden-pairs, slop-tells, canon/*}                       │
│                                                                          │
│  assets/scripts/{contrast.mjs, oklch.mjs, dtcg-lint.mjs,                 │
│                  design-md-validate.mjs, slop-scan.mjs, axe-runner.mjs}  │
│                                                                          │
│  assets/templates/{tailwind-v4.css, shadcn-globals.css,                  │
│                    style-dictionary.json, plain-css.css}                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Total triggerable skill count: 4 workflows + 10 atoms = 14 SKILL.md files.** Down from 89 in v0.2; up from 10 in v1.0 to absorb the preview primitive. The underlying implementation — `assets/scripts/`, `references/`, style data, the polyglot adapter layer, eval suite, dev-server templates per stack — is substantially larger; "14 skills" is the metadata footprint that hits the Codex 2% cap and the user's mental model, not the source-line count.

The full first-200-char description suite for all 14 skills consumes ~3.8k chars of metadata index — well within Codex's ~8k truncation threshold even with 5+ other packages installed.

### 3.7 Workflow inventory

Four workflows. Each is a SKILL.md whose body is a numbered procedure with explicit `Read`/`Write` of `.complete-design/` artifacts and stitched-context invocations of atoms.

#### W0 — `design` *(the headline workflow)*

The package's primary user-facing entry point. Produces multiple visual variants, renders them in a local dev server using the user's own stack, captures screenshots via Playwright / Chrome DevTools / claude-in-chrome, helps the user converge on a chosen direction — only then committing it as a contract.

This is what closes the v1.0 gap. Designers and developers don't commit to a design contract sight-unseen; they explore options first. `design` makes that exploration happen inside the agent loop, in the user's own repo, against the user's own stack — without a second tool or a second token bill.

```
Step  Action
─────────────────────────────────────────────────────────────────────────
 1    Mode detection:
        a) .complete-design/DESIGN.md exists →
             - if user asks for "explore alternatives" or "refresh":
               proceed with current contract as baseline, generate variants
               that propose refinements
             - else: route to `enforce` (no exploration needed)
        b) Brownfield (repo has tokens but no DESIGN.md) →
             invoke contract/extract-from-repo to compute baseline contract
        c) Greenfield (no signals) →
             invoke direction/bootstrap (5-question intake):
               1. Brand: one sentence
               2. Audience: B2B / consumer / dev-tool / creative / other
               3. Tone axis: formal↔playful, dense↔airy, expressive↔restrained
               4. Stack preference: Tailwind v4 + shadcn / plain CSS / other
               5. References (optional): URLs or "looks like X"
 2    Compute variant axes (3 variants by default; configurable 2–5):
        - For brownfield refresh: each variant proposes a different
          refinement vector (e.g., "preserve current, refresh type-pair",
          "shift to expressive-editorial", "modernize to geist-precision")
        - For greenfield: each variant combines a different
          (visual_style × palette_strategy × type_pair × layout_skeleton
           × component_treatment) tuple drawn from
          references/decision-trees/style-matrix.csv constrained by the
          tone-axis intake
        - Diversity is enforced by a DETERMINISTIC distance metric
          (see "Variant distance metric" below). Variant sets failing
          the threshold trigger one regeneration with locked-out axes;
          if still failing, the workflow surfaces 2 viable variants
          and explains the collapse to the user rather than padding
          with a near-clone.

      Component availability matrix (computed per-variant before render):
        For each preview-surface component (button/card/form/...) the
        workflow picks one of four strategies based on what the repo
        actually has:
          REUSE    — component exists in repo, anatomy matches, style fits
                     → import directly, restyle via tokens only
          WRAP     — component exists but signatures differ
                     → generate a thin wrapper exposing the variant's API
          SCAFFOLD — component family installed (e.g. shadcn) but this
                     one isn't generated yet → run shadcn add (or equivalent)
          FALLBACK — none of the above → emit a minimal templated
                     component into .complete-design/preview/_components/
        Strategy decisions are logged in .complete-design/preview/run-<id>/
        components-manifest.json for reproducibility and audit.
 3    For each variant: invoke preview/render-variants with stitched context
        - Scaffold the variant's tokens (deterministic from chosen scale)
        - Generate a preview surface: hero + button + card + form sample
        - Use the user's existing components when they exist (brownfield);
          generate via shadcn/Tailwind v4 templates when greenfield
        - Output: .complete-design/preview/{v1,v2,v3}/index.html (or .tsx)
 4    Invoke preview/serve:
        - Detect stack: Vite, Next, Astro, plain HTML
        - Spawn local dev server (background process) on a free port
        - Each variant gets a route: /v1, /v2, /v3
        - Composite route /compare renders all three side-by-side
        - Server lifetime is scoped to this workflow run; killed on exit
 5    Invoke preview/screenshot:
        - Prefer Playwright (most portable, scriptable)
        - Fall back to chrome-devtools MCP (when available, gives a11y tree
          + lighthouse + performance)
        - Fall back to claude-in-chrome MCP (when user has it installed)
        - Capture: desktop (1280×800) + mobile (375×667) per variant
        - Save: .complete-design/preview/screenshots/{v1,v2,v3}-{desktop,mobile}.png
        - Optionally run axe-core + lighthouse per variant (logged in critique)
 6    Present to user (inline):
        - Embed/link the 6 screenshots
        - Print URL of /compare for interactive side-by-side
        - Print a one-line summary per variant ("v1: geist-precision, slate
          12-step, monospace display; v2: expressive-editorial, warm-neutral,
          serif display; v3: refined-existing, current palette + new accent")
        - Print initial critique signal: contrast pass/fail, slop-tell hits
 7    User responds:
        - Accept variant N: commit chosen variant's contract; route to step 8
        - Iterate variant N with feedback: invoke preview/iterate; loop to 3
        - Reject all + regenerate: adjust direction parameters; loop to 2
        - Bail out: leave previews in place, exit cleanly
 8    On accept:
        - Compose final DESIGN.md from chosen variant
        - Invoke tokens/emit for declared stacks
        - Archive non-chosen variants under .complete-design/preview/_archive/
        - Critique gate on final artifact (see W1 step 6)
        - Write CRITIQUE-REPORT.md with terminal state
        - PR-ready diff per merge policy
```

**Variant distance metric (deterministic, defined here so the criterion is real, not decorative):**

For any two variants A and B, distance is a weighted sum of six axis-deltas, each normalized to [0, 1]:

```
d(A, B) = 0.25 · visual_style_delta       // 0 if same style label, 1 otherwise
        + 0.20 · palette_delta             // mean ΔE2000 between paired tokens, capped at 30, normalized
        + 0.15 · typography_class_delta    // 0 same class (serif/sans/mono), 0.5 same class diff family, 1 different class
        + 0.20 · layout_skeleton_delta     // edit distance over layout pattern slots (Tidwell index)
        + 0.10 · density_delta             // |spacing-scale-base(A) - spacing-scale-base(B)| / 8
        + 0.10 · component_treatment_delta // mean over components of corner/elevation/state-style delta
```

**Threshold:** all pairwise distances `≥ 0.50`. **Repair loop:** on failure, the orchestrator identifies the offending pair's lowest-delta axis, locks it (instructs LLM "for variant N, use a different `{axis}` than {value}"), and regenerates once. On second failure, the workflow presents the 2 viable variants and a one-sentence "the third proposal collapsed to {axis} = {value}; consider tightening direction or running with `--variants 2`." This is concrete enough to test: `evals/variant-diversity.yaml` runs the metric against fixture variant sets.

**Phase budget (time, not tokens — these are wall-clock targets the user actually feels):**

| Phase | Warm (p50) | Cold (p50) | Notes |
|---|---|---|---|
| Direction intake or repo extraction | ≤20s | ≤45s | "Warm" = `.complete-design/DESIGN.md` exists or extract cache hit |
| Variant parameter generation (LLM call) | ≤25s | ≤25s | Host-default model; 3 variants in parallel where supported |
| Preview scaffold emit | ≤15s | ≤15s | Deterministic template; no LLM |
| Dev-server ready (Vite/Next bind + first compile) | ≤15s | ≤35s | "Cold" = node_modules install needed |
| First screenshot (Playwright headed/headless) | ≤10s | ≤10s | First-run browser-binary download is **excluded** and reported separately |
| **Total `design` workflow** | **p50 ≤90s warm; p50 ≤2m cold** | (≥12/15 fixture runs must meet) | CI records per-phase spans |

A release cannot claim ≤90s unless the per-phase spans are met across fixtures on a clean machine with Playwright browser binaries already installed. First-run `npx playwright install chromium` (~250MB) is a separate one-time cost surfaced explicitly to the user with an estimated download size.

**Cost discipline (LLM tokens):** `design` p50 ≤55k tokens (3 variants × ~15k each + orchestration). For brownfield refresh, p50 ≤35k. For users on a budget tier, `--variants 2` reduces cost by ~40%. `--no-preview` mode skips screenshot phase entirely for CI / headless environments.

**Model selection for variant generation:** `design` can split tiers — orchestration on the host-default model, variant parameter generation on a budget-tier model. The split is opt-in via `--variant-model budget`. Default is host-default for everything to keep quality predictable.

**Visualization backend selection:** Playwright is the default (most universally available; requires browser binaries). The package detects available MCPs (`chrome-devtools`, `claude-in-chrome`) on first run and offers them as alternative backends; user can pin with `--preview-backend playwright|cdt|cic|none`. `none` skips rendering for users who only want the contract artifact.

**Stack-aware preview surface (scope-dependent, not one-size-fits-all):**

| Project signal | Preview surface scope |
|---|---|
| Marketing repo (signals: no `/app/(auth)`, no `/dashboard`, has `/marketing` or root `/page.tsx` only) | Hero + CTA section + feature grid + footer |
| Dashboard/admin (signals: `/dashboard`, table/data libs in deps) | Top nav + KPI tiles + data table + side panel |
| AI workspace (signals: `ai-sdk`, `langchain`, message-thread components) | Composer + streaming message + tool-call card + suggestion rail |
| Commerce (signals: `next-commerce`, Stripe, cart in routes) | Product card + cart drawer + checkout step + confirmation |
| Media-heavy (signals: `next/image` density, video libs) | Hero with media + grid + detail page + player chrome |
| Motion-first (signals: `framer-motion`, `gsap`, scroll-driven) | Static screenshots flag the limitation; user warned that motion isn't captured |
| Default / undetected | Hero + button + card + form (the v1.0.1-original generic surface) |

The signal-detection happens in `repo-detect.mjs` (deterministic, no LLM). Users can override with `--preview-scope marketing|dashboard|ai|commerce|media|default`.

**Iteration cost cap:** `preview/iterate` has a default cap of **5 iterations per variant per `design` run** (configurable up to 10 via `--max-iterations N`). On cap-hit: the workflow surfaces "you've iterated 5 times; consider committing this variant or starting fresh with a new direction" and requires explicit `--continue-iterating` to proceed. Iteration history is preserved: each iteration writes to `.complete-design/preview/v{N}/iter-{i}/` so a user who iterates v1 five times and then accepts v2 doesn't lose the v1 exploration — it's archived under `.complete-design/preview/_archive/v1-iterations/`.

**Mobile viewport policy:** screenshots capture **two** mobile widths by default — **390×844 (mainstream, iPhone 14/15)** and **375×667 (stress-small, iPhone SE)** — plus 1280×800 desktop and 1440×900 wide. Configurable via `--viewports`.

**Non-web stack handling:** if `repo-detect.mjs` identifies React Native, SwiftUI, Compose, Flutter, or game UIs, `design` **refuses preview** rather than producing misleading static HTML. The contract path still runs — DESIGN.md is generated, tokens emit, audit works — but the workflow surfaces "preview is not available for <stack>; commit the contract and proceed without visual variants, or supply a `--preview-stack <web-stack>` to render mockups in a separate web preview." Static HTML fallback is reserved for plain-web projects where it actually represents production.

---

#### W1 — `extract`

The headline workflow. Takes a repo (or Figma export, or image) and produces a DESIGN.md contract + DTCG tokens + stack-native projections.

```
Step  Action
─────────────────────────────────────────────────────────────────────────
 1    Detect inputs in priority order:
        a) .complete-design/DESIGN.md exists → exit with "already extracted, use audit"
        b) Repo with tokens (tailwind config, globals.css, /tokens/) → invoke
           contract/extract-from-repo                           [v1.0]
        c) Figma DTCG export present → invoke
           contract/extract-from-figma                          [v1.1]
        d) Image / URL provided → invoke
           contract/extract-from-image                          [v1.2]
        e) Nothing present → invoke direction/bootstrap (asks 4 questions)
 2    Run extraction subagent (single, bounded; not parallel):
        - read source files
        - compute OKLCH palette + 12-step scales
        - infer type scale + measure
        - infer spacing scale
        - infer style (one of ~10 canonical) via style-classifier
        - mark per-attribute confidence
 3    Run critique subagent against the proposed contract:
        - contrast pass on every text/bg pair
        - slop-scan (purple-gradient, Inter-default, glass-stack tells)
        - APG conformance on detected component anatomies
        - DTCG schema lint on token block
 4    Compose DESIGN.md (Google spec) with $extensions.complete-design
 5    Run tokens/emit for declared stack(s):
        - Tailwind v4 @theme (CSS-first)
        - shadcn :root + .dark (OKLCH)
        - plain CSS variables
        - Style Dictionary source (optional)
 6    Determine terminal state:
        - PASS, PASS_WITH_WARNINGS, FAILED_AFTER_REPAIR, USER_OVERRIDDEN
 7    Write CRITIQUE-REPORT.md + diff for review
 8    Output: a PR-ready diff (never auto-applies); summary points the user
        at .complete-design/DESIGN.md, tokens.json, the projections, and the report
```

Median target: ≤40k tokens. Single bounded extraction subagent (not the v0.2 3-way fan-out) because the work isn't actually parallel — color/type/spacing depend on each other for harmony.

#### W2 — `enforce`

Constrains the agent's next generation to the contract. Invoked transparently when the user asks for any UI work in a repo with a contract.

```
Step  Action
─────────────────────────────────────────────────────────────────────────
 1    Read .complete-design/DESIGN.md + $extensions.complete-design
 2    Read user's request
 3    Stitch context: "You are generating UI in a repo with this contract.
      Use only the tokens, components, and patterns it allows. Forbidden:
      <forbidden list>. Citations: <slop-tell list to avoid>."
 4    Hand off to user's normal agent flow with stitched context
 5    On completion, invoke audit/components-against-contract on what was
      generated. If audit fails: route back to repair. Max 2 cycles.
 6    Terminal state per critique gate.
```

This is the inner-loop workflow that fires on most UI requests. Median target: ≤4k tokens of overhead per agent turn.

#### W3 — `audit`

Takes generated UI (a PR diff, a file glob, a URL) and produces findings against the contract.

```
Step  Action
─────────────────────────────────────────────────────────────────────────
 1    Discover scope (PR diff, glob, URL)
 2    Read .complete-design/DESIGN.md (or use --contract path)
 3    Run audit subagents in parallel where independent:
        a) accessibility-auditor (axe-core via Node script + APG check)
        b) contrast-auditor (WCAG 2.2 1.4.3/1.4.11)
        c) token-drift-auditor (any value not in DESIGN.md tokens)
        d) component-conformance (any element not following anatomy)
        e) slop-detector (purple-gradient, Inter-default, glass-stack)
        f) style-purity-auditor (against declared visual_style)
 4    Merge, deduplicate, severity-rank
 5    If running in CI: emit GitHub PR comment with findings
 6    If interactive: write AUDIT-REPORT.md; offer per-finding fix recipes
 7    Capture Playwright before/after screenshots for visible changes
      (when host supports it); attach to report
```

### 3.8 Subagent architecture — narrowed

v0.2 had 5 subagent types with fan-out parallelism that the host compatibility section (§5.6) showed mostly doesn't work outside Claude Code. The simpler model:

| Subagent | Used in | Parallel? | Why |
|---|---|---|---|
| **Extraction subagent** | W1 step 2 | No | Color/type/spacing inferences depend on each other for harmony; fanning out produces drift. |
| **Critique subagent** | W1 step 3, W3 step 3 | Yes where supported | Findings are independent per dimension; fan-out is genuinely safe. Falls back to sequential on Codex/Cursor/Junie. |

Both are bounded: they receive a stitched task brief (relevant artifact slices + the specific dimension to audit), not the user's raw request. Max context budget per subagent: 40k tokens.

### 3.9 Atomic skill inventory

Ten atoms. Each is one job, ≤500 lines, ≤5k tokens, with `composition:`, `artifacts:`, `stack:`, `knowledge-version:`, and an `mvp: true|false` flag in frontmatter.

| ID | Job | Inner-loop or ceremony | MVP? |
|---|---|---|---|
| `contract/extract-from-repo` | Scan a repo (tokens, components, brand assets, package.json) → propose DESIGN.md contract | Ceremony (per project) | ✓ |
| `contract/extract-from-figma` | Read Figma DTCG export → propose DESIGN.md contract | Ceremony | v1.1 |
| `contract/extract-from-image` | Vision-model inference from a reference image → propose DESIGN.md contract (with explicit low-confidence markers) | Ceremony | v1.2 |
| `tokens/emit` | DESIGN.md `$extensions.complete-design.tokens` → Tailwind v4 `@theme`, shadcn `:root`/`.dark`, plain CSS vars, Style Dictionary | Inner-loop | ✓ |
| `components/audit-against-contract` | One component or file → findings list against the contract's allowed tokens/anatomies | Inner-loop | ✓ |
| `critique/slop-detector` | Any UI artifact → findings list against the curated slop-tell corpus | Inner-loop | ✓ |
| `direction/bootstrap` | When no contract exists: 5-question intake → proposed direction + tone-axis seed (internal; invoked by `design`) | Ceremony (rare) | ✓ |
| `preview/render-variants` | Given a direction + N: produce N preview-surface scaffolds with diverse parameterizations | Workflow-internal | ✓ |
| `preview/serve` | Spawn a local dev server (Vite/Next/Astro/static) on a free port; route per variant + a `/compare` composite | Workflow-internal | ✓ |
| `preview/screenshot` | Capture screenshots via Playwright (default) / Chrome DevTools MCP / claude-in-chrome MCP; desktop + mobile widths; optional lighthouse + axe | Workflow-internal | ✓ |
| `preview/iterate` | Given a picked variant + user feedback: refine palette / type / layout in-place; re-render | Inner-loop | ✓ |

**Style codifiers** (`style/swiss`, `style/material-3-expressive`, etc.) remain reference data in `assets/styles/`, not separate skills (per v1.0 — keeps trigger budget tight).

**Preview atoms are "workflow-internal"** — they exist as separate skills so they're individually invocable for power users (`preview/serve` to manually re-launch a server, `preview/screenshot` to refresh captures on demand), but most users hit them transitively through `design`. They count toward the trigger budget but their descriptions are scoped narrowly so they don't false-fire on general UI prompts.

### 3.10 Composition contract

Every skill carries the v0.2 frontmatter, slightly extended:

```yaml
name:           <slug>
description:    <≤200 chars, directive, 5+ trigger phrases — engineered for Codex truncation>
version:        <semver>
license:        Apache-2.0
compatibility:  [claude-code, codex-cli, cursor, junie, copilot]
allowed-tools:  [Read, Write, Bash]
composition:
  upstream:     [ ... ]
  downstream:   [ ... ]
  alternatives: [ ... ]
  conflicts:    [ ... ]
artifacts:
  reads:        [ .complete-design/DESIGN.md, .complete-design/manifest.lock ]
  writes:       [ .complete-design/design-tokens.json, src/app/globals.css ]
stack:
  targets:      [ tailwind-v4, shadcn, plain-css ]
  emits:        DTCG | CSS | JSON | TSX
knowledge-version: v2026.05
mvp:            true
trust-posture:
  deterministic-emit:   true
  asserts-wcag:         false   # we never claim conformance
  requires-confirmation: true   # diff-by-default
```

### 3.11 Knowledge architecture (preserved from v0.2)

Hybrid file-based. No vector DB. No knowledge graph. The four-tier hierarchy (frontmatter / SKILL.md body / `references/*.md` / `assets/**`) the SKILL.md spec already provides is sufficient.

**Mandatory `references/` corpus:**

| Reference | Why mandatory |
|---|---|
| `references/design-md/` | The contract format spec (Google, April 2026); validator script |
| `references/dtcg/` | Token interchange spec (W3C DTCG v2025.10) |
| `references/wcag-2-2/` | Conformance reference; Soueidan's 5 ARIA rules; axe-core rule cross-ref |
| `references/radix/` | 12-step semantic scale — canonical step-role mapping (Radix Colors) |
| `references/shadcn-tailwind-v4/` | `components.json`, `globals.css` template, `@theme`/`@theme inline` semantics, OKLCH conversion, `data-slot` pattern |
| `references/react-aria/` | Hook list + composition patterns + collection model |
| `references/apg/` | Per-pattern keyboard maps from WAI-ARIA APG; cross-checked against Pickering/Soueidan/Roselli |
| `references/material-3/` | sys/ref/comp token taxonomy, color roles, motion, M3 Expressive shape |
| `references/ai-ux-patterns/` | Distilled 12-pattern catalog (streaming, tool-card, citation chip, generative canvas, agent trace, thinking disclosure, file chip, slash/Cmd-K, suggestion rail, ambient vs deliberate, confidence display, planning visibility) from ChatGPT/Claude/Cursor/Perplexity/v0/Linear/Notion/Smashing 2026 |
| `references/forbidden-pairs.yaml` | Encoded conflict rules (e.g. neo-brutalism + healthcare = forbidden) |
| `references/slop-tells/` | Curated anti-pattern library — heuristics + counter-patterns. The launch artifact ships from this. |

**Methodology summaries (each ≤2k words, `source-class: summary`):**

- `references/canon/typography.md` — Bringhurst (measure 45–75ch, leading 1.4–1.6×, ratios), Butterick (lint rules), Brown (fluid type, modular scale)
- `references/canon/color.md` — Itten's 7 contrasts, Radix step roles, OKLCH default + sRGB fallback, APCA caveat (informational only)
- `references/canon/motion.md` — Val Head defaults, Material Motion, HIG Motion, reduced-motion lint
- `references/canon/forms.md` — Wroblewski form rules as lint
- `references/canon/charts.md` — Few + Munzner channel ranking + chart selection
- `references/canon/hax-18.md` — Microsoft HAX 18 guidelines as AI-UX checklist
- `references/canon/deceptive-patterns.md` — Brignull negative library
- `references/canon/pickering-components.md` — per-component a11y notes
- `references/canon/roselli-under-engineered.md` — minimal-viable accessible component recipes
- `references/canon/tidwell-patterns.md` — pattern catalog index
- `references/canon/microcopy.md` — Polaris + Atlassian + NN/g rules

**Decision matrices:**
- `references/decision-trees/list-vs-card-vs-stream.md` — 5-variable explicit table
- `references/decision-trees/chart-selection.md` — Few/Munzner
- `references/decision-trees/style-matrix.csv` — tone-axis → top-3 styles (consumed by `direction/bootstrap`)

**Assets (`assets/`):**
- `assets/token-templates/{tailwind-v4.css, shadcn-globals.css, plain-css.css, style-dictionary.json}`
- `assets/scripts/{contrast.mjs, oklch.mjs, dtcg-lint.mjs, design-md-validate.mjs, slop-scan.mjs, axe-runner.mjs, repo-detect.mjs}` (all deterministic, Node-only for cross-host portability)
- `assets/styles/<canonical-style-name>/{recipe.css, anatomy.md, palette.json, type-pair.json, anti-examples.md}` — reference data for `direction/bootstrap` and `tokens/emit`; **not** exposed as separate skills

### 3.12 Output determinism contract (new, from Subframe lesson)

Trust comes from determinism. Once the LLM has chosen (which palette strategy, which font pair, which spacing scale), the *emission* of code is a pure function — runnable offline, reproducible across runs, auditable.

| Decision | Made by | Emission |
|---|---|---|
| Palette strategy (monochromatic / analogous / complementary / from-image / from-archetype) | LLM (with reference data) | — |
| Seed hue → 12-step OKLCH scale | Deterministic: `oklch.mjs` | Pure function of seed |
| Step role → semantic name (bg, bg-subtle, border, accent, …) | Deterministic: Radix table lookup | Pure function of scale |
| WCAG contrast computation | Deterministic: `contrast.mjs` | Pure function of pair |
| DESIGN.md `$extensions.complete-design.tokens` block | Deterministic composer | Pure function of inputs |
| Tailwind v4 `@theme` projection | Deterministic template | Pure function of tokens |
| shadcn `:root`/`.dark` OKLCH | Deterministic template | Pure function of tokens |
| Component scaffold (button, input, card) | LLM (only when no anatomy exists in repo) | — |
| `data-slot` markup, accessible names, keyboard maps | Deterministic template | Pure function of anatomy + APG ref |

This contract is what `trust-posture.deterministic-emit: true` in frontmatter claims. A reviewer can run the deterministic scripts against the inputs and get exactly what the package emitted. The LLM's judgment is auditable as a separate layer.

### 3.13 Persisted project artifacts (preserved from v0.2, refactored around DESIGN.md)

Files live under `.complete-design/`:

```
.complete-design/
  DESIGN.md           # the contract (Google spec, with $extensions.complete-design)
  design-tokens.json  # DTCG v2025.10 source of truth (also embedded in DESIGN.md)
  AUDIT-REPORT.md     # last audit findings (W3 output)
  CRITIQUE-REPORT.md  # last extract/enforce critique (W1/W2 output)
  manifest.lock       # which skills touched which files, with hashes
  manual-overrides.json # user edits the workflow must preserve
```

Every persisted artifact carries:

```yaml
schemaVersion:     1
projectId:         <stable: git origin URL hash, or absolute path hash>
appPath:           <relative path the workflow operates under>
generatedBy:       @pm-musketeers/complete-design@<version>
knowledgeVersion:  v2026.05
lastReviewedBy:    <user | agent | unattended>
lastReviewedAt:    <ISO8601>
sourceRefs:        [ ... ]  # citations supporting each contract choice
```

**Merge policy (unchanged from v0.2):** diff-before-write, manual-override detection via hash comparison, no destructive overwrite, PR-first default, monorepo-aware (multiple `.complete-design/` paths supported, resolved upward from `cwd`).

**Commit policy by file:**

| File | Committed by default? | Rationale |
|---|---|---|
| `.complete-design/DESIGN.md` | **Yes** | The contract is project metadata; teams need shared state |
| `.complete-design/design-tokens.json` | **Yes** | DTCG source of truth; consumed by other tools |
| `.complete-design/manifest.lock` | **Yes** | Hash chain for determinism verification |
| `.complete-design/AUDIT-REPORT.md` (summary only) | **Yes** | Trail of system health over time |
| `.complete-design/CRITIQUE-REPORT.md` (summary only) | **Yes** | Trail of extraction decisions |
| `.complete-design/manual-overrides.json` (non-sensitive only) | Yes | Captures team decisions |
| `.complete-design/private/run-log.jsonl` | **No** | Local cost/latency metrics; never transmitted |
| `.complete-design/private/decision-log.jsonl` | **No** | Replayable LLM decisions; may contain hashes |
| `.complete-design/private/screenshots/*` | **No** | Visual regression artifacts; potentially sensitive |
| `.complete-design/private/extraction-evidence/*` | **No** | Raw evidence (cropped brand assets, source snippets) |
| `.complete-design/private/brand-derivatives/*` | **No** | Generated palettes from brand assets; potentially unreleased IP |

The package writes a `.gitignore` entry for `.complete-design/private/` on first run and surfaces the commit-policy summary in the first audit report. Override via `--commit-private` (logged).

### 3.14 Host compatibility contract (preserved from v0.2)

| Capability | Claude Code | Codex CLI | Cursor | Gemini CLI | Junie | Copilot |
|---|---|---|---|---|---|---|
| Read SKILL.md frontmatter | ✓ | ✓ (2% cap on metadata index — package must fit) | ✓ | ✓ | ✓ | ✓ |
| Load `references/*.md` on demand | ✓ | ✓ | ✓ | partial | ✓ | ✓ |
| Execute `assets/scripts/*.mjs` (Node-only) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Critique-subagent dispatch (W1/W3 fan-out) | ✓ native | emulated (sequential) | emulated (sequential) | sequential | sequential | sequential |
| Skill-to-skill invocation by name | ✓ | ✓ | ✓ | partial | ✓ | ✓ |
| Playwright screenshot in audit | ✓ | ✓ | ✓ | depends | depends | depends |

**The 2% cap matters most.** With **14** skills and engineered descriptions, the package's total metadata footprint fits within ~3.8k chars — well under Codex's ~8k truncation threshold even with 5+ other packages installed. v0.2's 89 skills would have failed this constraint by ~6×.

**Sequential-fallback rule:** every workflow runs end-to-end on every declared host in sequential mode before claiming parallel support on that host. The v1.0 CI ships `host-smoke/<host>.yaml` per declared host.

### 3.15 Stack adapter interface (preserved from v0.2)

```yaml
adapter:
  id:               tailwind-v4
  detect:           # how to recognize this stack
    files:          ["tailwind.config.{js,ts}", "src/**/globals.css"]
    package-deps:   ["tailwindcss@^4"]
    confidence:     0.0–1.0
  can-emit:         [tokens, component, composition]
  token-format:     css-vars-at-theme
  component-format: jsx-shadcn   # or vue-sfc, swiftui, lit
  outputs:
    tokens:         ["src/app/globals.css"]
    components:     ["src/components/ui/<name>.tsx"]
  verify:
    compile:        "npm run build"
    a11y:           "npx axe <route>"
    visual:         "npx playwright test --grep <name>"
  unsupported-reason: # human-readable
```

**v1.0 adapters:** `tailwind-v4`, `shadcn`, `plain-css`.
**v0.2 release (`complete-design-bridges` companion):** `material-web`, `vue-3-sfc`, `svelte-5`.
**v0.3+:** `swiftui`, `kotlin-compose`, `lit`.

### 3.16 Polyglot input adapters (architecture vision)

Symmetrically to output adapters, the package reads from every common design-system source. This is the moat-builder for the brownfield niche — *over time*. v1.0 ships a strict subset; the rest is the v1.1 / v1.2 / v1.3 expansion plan. The table below labels each row with the release that ships it. Listing the full vision in this section keeps the strategic surface honest; §9.1 is the only authoritative v1.0 scope.

| Input source | Reader | Produces | Release |
|---|---|---|---|
| Tailwind v4 `@theme` in CSS | parse `globals.css` | tokens + style hint | **v1.0** |
| shadcn `:root`/`.dark` CSS variables (OKLCH) | parse + Radix step inference | tokens + step roles | **v1.0** |
| Style Dictionary source JSON | direct import | tokens | **v1.0** |
| package.json | dependency sniff | stack signals | **v1.0** |
| `brand-assets/*.{png,svg,jpg}` (local-only by default) | vision pass (low-confidence; marked) | hue seeds | **v1.0** (opt-in only; see §3.18) |
| Tokens Studio Figma export | DTCG import | tokens | v1.1 |
| Radix Themes config | parse | tokens + theme | v1.1 |
| Figma DTCG export | direct import | tokens | v1.1 |
| Material 3 tokens | parse `sys/ref/comp` | tokens + roles | v1.1 |
| Subframe MCP | call MCP server | tokens + components | v1.2 |
| Storybook MCP (Chromatic-published) | call MCP server | components + stories | v1.2 |
| Builder MCP | call MCP server | tokens + components | v1.2 |

Live-preview tools will not build this layer because it doesn't drive their runtime adoption. It's how `complete-design` becomes useful in any existing repo regardless of how that repo's design system was authored — but only the v1.0 rows above are shipped in the first release. Unsupported sources produce a clear "this source will be supported in vX.Y; use [recommended workaround] today" message, not a silent failure.

### 3.17 Real-world repo failure modes (the highest technical kill risk)

`extract-from-repo` is the workflow most likely to break on contact with reality. The MRD declares these failure modes explicitly so the v0.5 infra phase ships a fixture corpus that exercises every one.

| Failure mode | Frequency in real repos | v1.0 handling |
|---|---|---|
| CSS-in-JS (styled-components, Emotion, vanilla-extract) | Common in older React codebases | Reader detects, emits `partial-extract` with the CSS-in-JS portion flagged for manual mapping |
| Multiple apps in one monorepo with different DS | Very common | `--app <path>` flag; per-app `.complete-design/`; see §3.18 monorepo design |
| Shared UI package consumed by multiple apps | Very common | Reader follows package symlinks; reports the upstream source path |
| Themed runtime variables (theme switching via JS) | Common in B2B SaaS | Reader extracts the static fallback; flags dynamic surfaces with `runtime-themed` markers |
| Generated CSS (from a build step that wasn't run) | Common | Reader detects missing build output; prompts user to run build first |
| Private UI package not published, no Storybook | Common | Reader scans imports; reports unresolved component anatomies as `unknown-component` findings |
| Broken build / failing typecheck | Common | Reader proceeds in best-effort mode; emits warnings; never blocks on user's broken state |
| CMS-driven copy (no `<h1>` in code; content from API) | Common in marketing sites | Reader extracts only what's in code; flags content surfaces as `content-from-source-unknown` |
| Conflicting dark-mode systems (Tailwind `.dark` + a JS theme manager) | Less common but lethal | Reader detects both; refuses to silently pick one; surfaces the conflict in the report |
| No tokens at all (pure ad-hoc) | Common for very early-stage projects | Falls through to `direction/bootstrap` rather than extracting from nothing |

Every failure mode has a corresponding fixture in `evals/fixtures/repos/` and a fixture acceptance test in `evals/fixtures-extract.yaml`. v1.0 acceptance criterion 6 (§9.3) runs against these fixtures.

### 3.18 Security & permissions (mandatory section)

complete-design is local-first and least-read by default.

| Surface | Default behavior | User-opt-in to expand |
|---|---|---|
| **File reads** | Reads only declared source globs in `extract.config.json` (or sensible defaults). Never reads `.env`, `.envrc`, files matching `*.secret.*`, `*.key`, `id_rsa*`, `credentials.*`, `.aws/`, `.gcp/`, build artifacts (`dist/`, `build/`, `.next/`, `.turbo/`), or anything in `.gitignore`. | `--include-globs '<glob>'` (logged in report) |
| **Brand assets** (`brand-assets/*.{png,svg,jpg}`) | Processed **locally only** by default. The local pass extracts dominant hues via deterministic k-means in OKLab — no model call. | `--vision <provider>` to opt into a named remote vision provider; the package warns explicitly that this uploads imagery and may include unreleased IP |
| **Playwright** | Visits **only** localhost (any port spawned by `preview/serve`) or a URL the user passed via `--url <url>`. Never crawls; never follows external links. Used as the default `preview/screenshot` backend. | None — strict |
| **Chrome DevTools MCP** (`mcp__chrome-devtools__*`) | Same constraints as Playwright. Used as alt backend when available; gives a11y tree + lighthouse + performance trace as bonus. | Opt-in via `--preview-backend cdt` |
| **claude-in-chrome MCP** (`mcp__claude-in-chrome__*`) | Same constraints. Used as alt backend when user has it installed. | Opt-in via `--preview-backend cic` |
| **Local dev server (`preview/serve`)** | Binds to `127.0.0.1` on a port allocated via the port manager (see below); never `0.0.0.0`. Lifetime scoped to workflow run; killed on exit or after 60min idle. Serves a generated preview app under `.complete-design/preview/run-<id>/` (the "preview sandbox"). | None — strict |
| **Repo component imports into preview sandbox** | When `design` reuses repo components (REUSE/WRAP strategies, per §3.7 step 2), `repo-detect.mjs` produces an **explicit import allowlist** mapping each component to its source path. The preview sandbox imports only allowlisted files; the build is configured with `vite.resolve.alias` / Next `transpilePackages` restricted to the allowlist. Source files are **symlinked read-only** into `.complete-design/preview/run-<id>/_imports/`, never copied or modified. Anything outside the allowlist (other repo code, `node_modules` not in adapters' declared deps, `.env*`, secrets) is unreachable from the sandbox by construction. | Allowlist override via explicit `--allow-import <glob>` (logged) |
| **Network requests from preview code** | The preview server runs with **outbound network blocked** via the Playwright `route('**', r => r.abort())` for unmatched URLs during screenshot capture. Required URLs (font CDNs, image CDNs the user's own theme depends on) are declared in the contract's `$extensions.complete-design.preview-allowlist` and explicitly whitelisted. Service workers are disabled in the Playwright context. | Allowlist additions per origin (logged) |
| **Framework-defined env vars (`NEXT_PUBLIC_*`, `VITE_*`)** | The preview sandbox runs with a **scrubbed env**: only `NODE_ENV=development` and explicitly user-declared whitelist vars are passed. `.env*` files are never loaded by the preview sandbox even if the host stack would auto-load them. | `--preview-env KEY=VALUE` for explicit additions (logged) |
| **Dependency scripts (Vite/Next plugins, postinstall hooks)** | The preview sandbox uses an isolated `node_modules` symlinked from `<repo>/node_modules` *only* for declared adapter-required packages — never the full repo dep tree. No `npm install` happens implicitly. `postinstall` scripts are never executed by `preview/serve`. | None — strict |

**Port manager (`assets/scripts/port-manager.mjs`):** Allocates a free port in the `5800-5899` range (avoids common dev-server ports 3000/3001/5173/4173/8080), writes a `.complete-design/preview/run-<id>/port.lock` with `{port, pid, started_at}`, performs a health check after spawn, and registers a cleanup hook (SIGINT/SIGTERM handlers + idle-timeout). Stale `run-*` directories (port-lock PID no longer alive) are reaped on next workflow start. Multiple concurrent `design` runs in the same repo each get isolated `run-<id>/` paths and distinct ports.
| **Bash execution** | Restricted to packaged Node scripts under `assets/scripts/` and the user's declared `verify.compile` / `verify.a11y` commands. No arbitrary shell. | The user's `verify.*` commands are declared in `stack.adapter.verify` per §3.15 and reviewed on first run |
| **External MCP calls** (Subframe MCP, Storybook MCP, Builder MCP — v1.2+) | Disabled by default. Requires explicit `--source <mcp-id>` plus a one-time consent prompt that names the host being contacted. | Per-MCP `--allow-mcp <id>` |
| **Telemetry** | **No collection by default.** Cost/latency metrics are stored locally in `.complete-design/private/run-log.jsonl`. Never transmitted. | Future opt-in `--telemetry anonymous` flag if/when telemetry is built (post-v1.0); never default; never identifies user |
| **Report redaction** | All written reports redact absolute paths to `<repo-root>/<rel-path>`; redact emails, tokens, customer-identifying strings via a default deny-list pattern. | `--no-redact` (logged) |

The package ships with a permission audit command: `complete-design permissions --explain` enumerates everything the package would read, execute, or transmit under the current invocation flags.

### 3.19 Monorepo design (real, not asserted)

The v0.2 claim of "monorepo support" was a wave. The actual resolution rules:

| Repo shape | Behavior |
|---|---|
| Single app, single design system | `.complete-design/` at the repo root. Trivial. |
| Monorepo with multiple apps, no shared DS | One `.complete-design/` per app (e.g. `apps/web/.complete-design/`, `apps/admin/.complete-design/`). Workflows resolve scope from `cwd` upward, stopping at the first `.complete-design/` found, then at the repo root if none. `--app <path>` overrides. |
| Monorepo with one shared UI package, multiple consuming apps | `.complete-design/` at the shared package root; consuming apps reference it via `.complete-design/extends: ../../packages/ui/.complete-design/DESIGN.md`. Audit on a consuming app respects the extended contract plus app-local overrides. |
| Monorepo with per-app DS but a base brand | `.complete-design/` at the repo root carries `base` brand tokens; per-app `.complete-design/` carries app-specific tokens that override the base. Standard CSS-cascade-style merging in DTCG. |
| Polyrepo with shared brand | `--extends <git-url-or-path>` references an external `.complete-design/DESIGN.md`; manifest.lock pins the commit hash. |

Package managers: `extract` reads `package.json`, `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json`, `cargo.toml`, `Cargo.lock`, `requirements.txt`, `pyproject.toml`, `go.mod` for stack signals but does not consume their dependency graphs in v1.0.

### 3.20 Recovery, versioning, and invalid states

| Condition | Behavior |
|---|---|
| `.complete-design/DESIGN.md` does not exist | Workflow proceeds with `direction/bootstrap` or `extract`. |
| `.complete-design/DESIGN.md` exists but is malformed (fails `design-md-validate.mjs`) | Workflow halts; emits diagnostic listing the violations; offers `--repair` (writes a corrected copy alongside the original as `.complete-design/DESIGN.md.repaired`) or `--reset` (with confirmation). Never silently overwrites. |
| `.complete-design/DESIGN.md` exists but missing `$extensions.complete-design` | Workflow proceeds in read-only mode; the package can audit against the DESIGN.md but cannot re-emit projections without the extension data. Surfaces the missing data and offers `--rebuild-extensions`. |
| `.complete-design/DESIGN.md` deleted between runs | Treated as user intent (deletion is a signal); next workflow asks before re-creating. Never silently re-creates. |
| `.complete-design/manifest.lock` hash mismatch with a tracked file | The file is treated as user-modified; merge policy from §3.13 applies (3-way merge, manual-override capture). |
| `knowledge-version` in `.complete-design/DESIGN.md` is older than the installed package's | Workflow surfaces the version skew; offers `--migrate` (which runs a documented migration script per release). Skipping migration is allowed but the package warns on every subsequent run. |
| `schemaVersion` is newer than the installed package supports | Workflow halts and instructs the user to upgrade the package. No best-effort handling. |

Migration scripts live in `migrations/v<old>-to-v<new>.mjs` and are tested against fixtures in `evals/migrations/`. Every `schemaVersion` bump ships a migration; deprecation window is two minor releases.

### 3.21 LLM model selection and cost discipline

Cost targets in §9.3 are measured on five fixed repo fixtures (in `evals/fixtures/repos/`) across a declared model matrix:

| Tier | Models supported | Use case | Cost behavior |
|---|---|---|---|
| **Host-default** | Whatever the host agent is currently running (typically Claude Sonnet 4.6, GPT-5-class for Codex, Cursor's selection) | Default; what most users get | p50 target ≤40k tokens for `extract`, ≤4k for `enforce` |
| **Budget** | Haiku-class, GPT-4o-mini-class, local OSS via Ollama | CI runs; large-scale batch; cost-sensitive teams | p50 ≤25k for `extract` via sampled extraction (skips files >50KB); emits `LOW_CONFIDENCE_PARTIAL` |
| **High-quality** | Opus-class, GPT-5-class explicitly | Hard-to-extract repos; designer-led quality runs | p50 ≤80k; opt-in via `--model high` |

**No v1.0 claim requires Opus-class.** Acceptance criteria in §9.3 specify the host-default tier. If a feature only works with Opus-class, it is labeled `requires high tier` in the skill's frontmatter.

**Model selection for the `design` workflow specifically:** the `design` workflow is the most expensive path, with variant parameter generation as the dominant LLM cost (~25-30k tokens). The workflow supports tier-splitting:

| Sub-step | Default tier | Can downgrade? |
|---|---|---|
| Direction intake / repo extraction (orchestration) | host-default | No — needs coherent reasoning across user intent + repo signals |
| Variant parameter generation (3× per run) | host-default | **Yes** via `--variant-model budget`; quality eval shows budget-tier variants pass the §9.3 c6 distance metric but score ~0.5pp lower on the two-reviewer viability rubric |
| Preview scaffold emission | deterministic (no LLM) | n/a |
| Critique gate (the §6 audit pass on the chosen variant) | host-default | No — quality requires reasoning model |

Default is host-default for everything to keep quality predictable. Users on cost-sensitive CI runs can opt into `--variant-model budget` with the explicit quality trade-off noted in the workflow output.

**Degraded extraction:** if any tier exceeds 1.5× the p90 budget on a single run, `extract` automatically switches to sampled mode (processes only files matching `priority-globs`), emits `LOW_CONFIDENCE_PARTIAL` as the terminal state, and lists skipped files in `EXTRACTION-REPORT.md`. This prevents runaway cost.

### 3.22 Determinism verification

§3.12 claims pure-function emit. The verification scaffolding:

1. **Golden tests.** Every deterministic script (`oklch.mjs`, `contrast.mjs`, `dtcg-lint.mjs`, `design-md-validate.mjs`, the projection templates) has a `__golden__/` directory of input-output snapshots. CI runs the scripts against the inputs and asserts byte-equal output.
2. **Decision log.** Every LLM-selected parameter is logged to `.complete-design/private/decision-log.jsonl` with `(timestamp, skill, parameter, value, alternatives_considered, source_used)`. A reviewer can replay decisions.
3. **Hash chain.** `manifest.lock` carries an input hash for each emitted artifact: `(source files hash, DESIGN.md hash, package version) → output file hash`. Re-running with unchanged inputs and unchanged package version produces identical output.
4. **Reproducibility command:** `complete-design verify --golden` runs the deterministic-emit scripts against a snapshot of inputs and asserts byte-equal output. Required CI gate.

### 3.17 Canonical inventory manifest (preserved from v0.2)

`manifest.json` at the package root is the single source of truth for what ships. CI generates a derivation report (counts per layer, MVP coverage, host-support coverage, adapter coverage) on every PR; mismatches between `manifest.json` and §3 prose block merge.

**Total v1.0.1 unique skills:** 4 workflows + 10 atoms = **14 skills** (manifest.json source of truth). MVP ships **all 14** — preview-first means the `design` workflow and `preview/*` atoms are core to MVP, not deferred.

---

## 4. The direction model (multi-axis, preserved from v0.2)

A "direction" is five orthogonal axes, picked independently and checked for conflict by the critique gate.

| Axis | Picked by | Example values |
|---|---|---|
| `visual_style` | `direction/bootstrap` (when needed); reference data in `assets/styles/` | `geist-precision`, `swiss`, `editorial`, `neo-brutalism` |
| `platform_language` | inferred from stack (iOS/Android/web/cross) | `liquid-glass`, `material-3-expressive`, `fluent-2`, `web-native` |
| `layout_pattern` | `extract` infers; user can override | `bento-grid`, `swiss-grid`, `two-panel`, `scrollytelling`, `single-column-editorial` |
| `interaction_pattern` | applicable for AI products | `chat-thread`, `inline-suggestion`, `generative-canvas`, `agent-workspace`, `ambient-assist`, `none` |
| `historical_reference` (optional) | user-set | `frutiger-aero-historical`, `web-2`, `memphis` |

**v1.0 style reference data** ships for ~10 visual styles: `geist-precision`, `swiss`, `editorial`, `neo-brutalism`, `cinematic-dark`, `liquid-glass-companion`, `material-3-expressive-companion`, `bauhaus`, `flat`, `digital-skeu-historical`. These live in `assets/styles/<name>/` and are *not* separate skills — they are reference data consulted by `direction/bootstrap` and `tokens/emit`.

The remaining ~10 styles from v0.2 ship in v0.3 or as a companion package (`complete-design-styles`). This keeps the core package small.

---

## 5. Trigger description discipline (engineered for Codex truncation)

Every skill description follows this template, with the first 200 chars front-loading triggers. The first 200 chars must contain ≥5 quoted trigger phrases; the remainder provides context for hosts that have the budget.

**Real first-200-char zones, per MVP skill** (audited via `skillgrade` per release):

| Skill | First 200 chars (the Codex-survivable zone) |
|---|---|
| `design` *(headline)* | *"Use when user asks to 'design my UI', 'pick a visual style', 'show me design options', 'explore design directions', 'set up the look', 'redesign this' — generates 3 variants, renders them locally."* |
| `extract` | *"Use when user asks to 'extract my design system', 'capture tokens from this repo as-is', 'just grab our existing tokens' — non-exploratory; for users who want capture without variants."* |
| `enforce` | *"Use when generating UI in a repo with .complete-design/DESIGN.md present — keywords: 'make a button', 'build this page', 'add a card', 'style this', 'create a hero', 'design this component'."* |
| `audit` | *"Use when user asks to 'audit this PR', 'check design drift', 'review this UI for slop', 'check tokens', 'design review', 'find AI slop', 'check contrast', 'WCAG check'."* |
| `contract/extract-from-repo` | *"Use when user asks to 'read tokens from this repo', 'scan globals.css', 'extract Tailwind theme', 'find shadcn variables', 'detect our design system' — operates on existing code."* |
| `tokens/emit` | *"Use when user asks to 'convert tokens to Tailwind v4', 'emit shadcn theme', 'project DESIGN.md to CSS variables', 'generate globals.css', 'emit Style Dictionary source'."* |
| `components/audit-against-contract` | *"Use when user asks to 'audit this component', 'check if this matches our system', 'find token violations', 'check spacing scale', 'review this against tokens'."* |
| `critique/slop-detector` | *"Use when user asks to 'check for AI slop', 'find generic patterns', 'review for design tells', 'check if this looks AI-generated', 'find purple gradients', 'find Inter defaults'."* |
| `direction/bootstrap` | *"Use INTERNALLY when no DESIGN.md exists and `design` workflow needs initial direction — asks 5 questions about brand, audience, tone, stack, references. Not for direct user invocation."* |
| `preview/render-variants` | *"Use INTERNALLY when `design` workflow needs N variant scaffolds — produces preview HTML/TSX for each variant. Not for direct user invocation; use `design` instead."* |
| `preview/serve` | *"Use when user asks to 'restart the complete-design preview server', 'relaunch the complete-design preview', 'reopen the .complete-design/preview comparison page' — narrowly scoped to complete-design preview directories. NOT for general 'start a dev server' requests."* |
| `preview/screenshot` | *"Use when user asks to 'recapture complete-design preview screenshots', 'refresh the .complete-design/preview variant images' — narrowly scoped to complete-design preview captures. NOT for general 'take a screenshot' requests; use chrome-devtools or claude-in-chrome MCP directly for those."* |
| `preview/iterate` | *"Use when user asks to 'tweak variant {N} from the last design run', 'change the palette on complete-design v2', 'refine variant N of the current design exploration' — requires an active .complete-design/preview/run-* directory. NOT for general 'redesign this' requests."* |

The package's CI runs `skillgrade` per-skill: ≥10 should-fire, ≥10 should-not-fire prompts, 3 trials each. Trigger recall ≥0.85, false-trigger rate ≤0.15. Per-skill regression blocks merge. The 200-char zone is treated as the canonical surface — full description bodies follow but are not relied on for trigger.

---

## 6. The critique / linter layer

The package's most differentiated verb. Three modes:

### 6.1 `audit --interactive`

Run from the CLI inside a repo. Outputs an `AUDIT-REPORT.md` with severity-ranked findings, each with: WCAG SC (where applicable), cited source, fix recipe, screenshot (when applicable).

### 6.2 `audit --ci`

Run from a GitHub Action. Outputs a PR comment with the top N findings inline, plus a summary line:

```
complete-design audit
12 findings: 1 BLOCKER (contrast 3.2:1 fails WCAG 2.2 AA), 3 HIGH, 8 LOW
4 slop-tells matched: rainbow-gradient-button (Hero.tsx:34), Inter-default-on-shadcn (globals.css), centered-everything (Pricing.tsx), three-column-feature-grid (FeatureGrid.tsx)
Full report: .complete-design/AUDIT-REPORT.md
```

### 6.3 `audit --slop-tells`

The launch artifact's executable form. Runs the slop detector against the codebase and surfaces just the slop findings. Quotable output, designed for screenshot-friendly social sharing.

### 6.4 Critique appeal and suppression policy

Every finding from any critique mode has a stable `findingId`, severity, evidence, citation, and fix recipe. The user has five response options:

| Action | Effect | Recorded |
|---|---|---|
| **Accept** | Apply the suggested fix (`audit --apply <findingId>`) | `manifest.lock` records the resolution |
| **Repair** | Workflow generates a patch; user reviews and applies | Standard merge-policy diff |
| **Suppress once** | Ignore this finding for this run only | Logged in run-log; appears next run |
| **Suppress for path** | Add `<findingId>:<glob>` to `manual-overrides.json` | Persisted; rationale required |
| **Convert to house heuristic** | The finding is reclassified as a project-local rule (not a slop tell); future audits cite it differently | Persisted; written into DESIGN.md |

**Rules:**
- Suppressions **require a human rationale** in `manual-overrides.json` (`suppressed: { id, rationale, expires?: <date> }`). Empty rationales are rejected.
- Suppressions can carry an optional `expires:` date, after which the finding re-surfaces.
- CI's `audit --ci` mode blocks only on severities the project's `.complete-design/ci.yaml` declares blocking. Default: only `BLOCKER`.
- `USER_OVERRIDDEN` is never silent: the audit report explicitly names every override applied to a run, with rationale and date.
- The slop-detector specifically allows project-level disagreement: if a team decides "three-column feature grid is on-brand for us," they convert it to a house heuristic and future audits respect the decision. This addresses the designer concern that slop detection is one-size-fits-all aesthetic policing.

This is the trust-posture lever for skeptics: every finding is contestable, every contest is recorded, every record is auditable.

---

## 7. GTM strategy (new, first-class)

The research is unambiguous: cold launches don't break top 20. Every winning skill rode a platform launch as zero-day content with a quotable hook and cross-posted to 8 marketplaces. The v1.0 GTM is designed accordingly.

### 7.1 Platform launch ride — operational plan, not a wish

"Ride a platform launch" is only executable with infrastructure. The v0.7 milestone (per §10) ships:

1. **Release-monitoring infrastructure.** A simple watch service polls:
   - `anthropics/skills` GitHub releases + issue #1008 status
   - `vercel-labs/skills` releases + skills.sh changelog
   - `shadcn-ui/ui` releases
   - Claude Code / Codex CLI / Cursor / Junie weekly release notes
   - Anthropic / Vercel / OpenAI blog RSS for skill / DESIGN.md mentions
   Triggers a notification to the launch-coordinator when any tracked event fires.
2. **Three pre-written launch artifact variants**, ready to publish on ≤24h notice:
   - **V1 (Anthropic spec or #1008 ship):** *"complete-design: the DESIGN.md producer for Anthropic's new design contract skill"*
   - **V2 (Vercel skills.sh feature drop):** *"complete-design on skills.sh: the brownfield design auditor for every coding agent"*
   - **V3 (shadcn major or no platform event by W+4):** *"Ten design-system tells that prove your agent is writing slop — and the package that catches them"* (the self-launch fallback)
3. **Named launch coordinator.** One person owns the watch service, the publish trigger, and the cross-post execution.
4. **Hard fallback date.** If no platform event opens a window within 4 weeks of v1.0 acceptance, we self-launch V3 on a fixed date. Don't wait indefinitely.

This converts "ride a platform launch" from luck into a discipline.

### 7.2 The launch artifact

**Primary hook (90-second video):** *"Three design directions inside the agent and repo you already use."* Open repo → run `design` in Claude Code / Cursor → 3 variants render in the local browser → user picks one → contract committed → next agent generation respects it. No tool-switching, no handoff, no separate runtime.

**Secondary hook (long-form post):** *"Ten design-system tells that prove your agent is writing slop"* (the v1.0 hook, preserved).
- One executable detection rule per tell (lives in `references/slop-tells/`)
- A live-paste demo of `audit --slop-tells` catching each on a real repo

**Tertiary hook (cost angle, kept as supporting copy, not lead):** *"For users who already pay for Claude Code or Cursor: explore design directions without adding another subscription or another token bill."* Used in long-form posts and developer-targeted channels; **deliberately not** the headline because (a) it antagonizes Vercel, our primary distributor via skills.sh, and (b) Anthropic/OpenAI/Vercel pricing can shift and weaken the claim. The durable differentiator is *repo-native contract persistence with in-place visual exploration*, not a temporary pricing gap.

**Distribution:**
- Cross-posted to: HN, Reddit r/webdev + r/reactjs + r/SaaS + r/indiehackers, Twitter/X, Bluesky, Mastodon, dev.to, Smashing Magazine pitch, Lenny's Newsletter pitch (the cost angle is on-brand)
- Author byline + a designer co-byline (to bridge the trust gap)

The 10 tells (working list — to be validated against the curated corpus):

1. Indigo/purple gradient buttons
2. Inter as the only font in the stack
3. Three-column feature grid above the fold
4. Glass-on-glass card stacking
5. Centered-everything hero
6. Rainbow stat cards (each KPI a different hue)
7. Identical shadcn defaults (no token customization detected)
8. Generic "Loved by teams at" testimonial strip
9. `Lorem ipsum` residue in production
10. Fake 5-star ratings with no actual review source

Each tell is a detector in `assets/scripts/slop-scan.mjs`, runnable via `complete-design audit --slop-tells`.

### 7.3 Cross-post the manifest

Day-one publication to:
1. skills.sh (Vercel)
2. claudemarketplaces.com
3. mcpmarket.com
4. smithery.ai
5. lobehub
6. fastmcp.me
7. playbooks.com
8. Tessl Registry

Most auto-ingest from GitHub, so a single SKILL.md repo populates the network within a week.

### 7.4 Pre-launch outreach plan (warm paths, expected conversion, fallbacks)

Outreach is a funnel, not a wishlist. Realistic targets, with named warm paths where available and explicit substitution if the primary target is non-responsive.

| Target | Warm path needed | Ask | Expected conversion | Fallback if no response |
|---|---|---|---|---|
| **Vercel skills.sh team** (Guillermo Rauch, Jude Gao, Morgane Palomares, John Lindquist) | Warm intro via skills.sh contributor; or cold via @-mention on a skills.sh PR | Featured slot in skills.sh launch roundup; cross-post on Vercel changelog | ~30% (we have the technical fit; they have a real interest in skill ecosystem quality) | Self-list on skills.sh (no gate); pitch InfoQ + dev.to for coverage |
| **Anthropic skills team** (Mahesh Murag, Barry Zhang, Keith Lazuka) | Submit PR to `anthropics/skills` for inclusion in the curated marketplace; comment on issue #1008 with our DESIGN.md producer | Plugin marketplace listing; mention in Anthropic skill blog post | ~40% if our quality bar holds (Anthropic has been receptive to curated community skills) | Publish to plugin marketplace independently; comment on launch tweets |
| **shadcn** (@shadcn) | Cold via Twitter/X DM + a working compatibility-claim PR to `shadcn-ui/ui` docs | Compatibility statement in shadcn docs; possible boost-tweet | ~15% (shadcn is selective and busy) | Ship with explicit "works with shadcn" doc on our side; let users discover compatibility |
| **Tessl Registry** | Cold via their submission form | Security-scored listing | ~80% (they accept most submissions that pass scan) | Trivial alternative — we're listed regardless |
| **Brad Frost** | Cold via email (his site has contact); he runs "AI and Design Systems" course and explicitly says "design systems are the antidote to AI slop" — exact positioning fit | Ask: try the package on his own portfolio site; share findings if useful | ~25% (he engages with serious tools but is selective) | Cite his framing in the launch artifact (we already do); his audience reads us regardless |
| **Pablo Stanley** | Cold via Twitter/X; he wrote "The Design Vibeshift" arguing designers are moving to Cursor/Claude as the playground — direct topical fit | Ask: try the package on Lummi/Musho; one tweet if it works | ~20% (he engages with novel tools but has a high bar) | None needed; his thesis is already public and we cite it |
| **Sara Soueidan** | Cold via email or Mastodon; pitch the package's "never asserts WCAG conformance" posture | Ask: technical review of our `references/canon/wcag-2-2.md` + Soueidan-5 ARIA rules cite | ~30% (accessibility is her domain; she's responsive to serious work) | Cite her work in the docs (we already do); ship without endorsement |
| **Tobias van Schneider** | Very cold; he's the design-skeptic gatekeeper | Ask: one tweet's-worth of attention to the "Ten tells" artifact | ~5% (he's notoriously skeptical of AI-branded tools — which is *exactly why* his engagement would land) | Don't depend on this. Use his "AI is not a selling point" line in the launch artifact regardless |
| **Storybook / Chromatic team** | Warm via Storybook MCP docs; possible compatibility partnership in v1.2 | Cross-link in their MCP docs once we ship the input adapter | Trivial in v1.2; not v1.0 | Defer to v1.2 |

**Aggregate expected outcome:** ~3 of these 8 conversations convert to public engagement. That's enough — the launch artifact and cross-post discipline carry the rest. The package's adoption is not gated on any one of them.

**Outreach rules:**
- We send a working 2-minute demo + 500-char "what's in it for you" pitch.
- We never ask for tweets. We ask for use.
- We respect a single "no thanks" or non-response. No follow-ups.
- All outreach happens in a single coordinated 5-day window 1 week before launch.

### 7.5 Skill-as-funnel for nothing (the cold truth)

Every top-10 skill is a vendor's funnel into their primary product (`vercel-react-best-practices` → Vercel hosting; `azure-ai` → Azure; `remotion-best-practices` → Remotion). `complete-design` has no primary product to funnel into. This is a known weakness. The mitigations in §8.

---

## 8. Monetization (defer year 2, paths sketched)

§7.5 acknowledged: no upstream commercial product. Year-1 monetization is zero. Year-2+ paths, in order of plausibility:

1. **Premium component / direction packs** sold through Agensi at $9–$19. Curated style libraries beyond the v1.0 set (e.g., `complete-design-styles-premium` with 40+ visual styles, vetted recipes, anti-examples). Realistic year-2 revenue: <$10k/mo (per the lack of disclosed Agensi top-seller revenue — assume small).
2. **Enterprise audit tool** as a separate, sibling product line — not a feature in `complete-design` itself. The `audit --ci` mode hardened into a multi-repo dashboard with audit history, drift tracking, and SARIF export, licensed via Tessl at $X/seat/month. Explicitly framed as a **distinct product** that shares the OSS package's audit engine; not a betrayal of §14's "no hosted SaaS" promise (which applies only to the OSS package). Plausible enterprise-tier ARR if 50+ enterprise installs. Year-2+ only.
3. **Sponsorship from a UI vendor** — shadcn, Radix, Vercel, Subframe — where the package defaults users into their stack with curated reference data. Most likely sponsor: **Vercel**, given the v0 + skills.sh + brownfield-thesis alignment. Realistic ask: a co-marketing deal, not a check.
4. **Consulting on design-system extraction** for teams that want it done with hand-curation rather than from the package's autopilot. Standard OSS-author playbook.
5. **Course / book.** The package's launch artifact has obvious book potential (*"How agents kill your design system, and how to stop them"*). Long tail.

Decision: **no paid features in v1.0.** Distribution dominates monetization at this stage.

---

## 9. MVP definition (radically narrower)

### 9.1 In scope — single v1.0 release

The MVP is *one release*, not the v0.2 split (which was indecision). Ship something coherent on day one.

**Workflows (4):** `design` *(headline)*, `extract`, `enforce`, `audit`

**Atoms (9):** `contract/extract-from-repo`, `tokens/emit`, `components/audit-against-contract`, `critique/slop-detector`, `direction/bootstrap`, `preview/render-variants`, `preview/serve`, `preview/screenshot`, `preview/iterate`

**Adapters (3 output):** `tailwind-v4`, `shadcn`, `plain-css`

**Preview backends (3):** Playwright (default, required), Chrome DevTools MCP (opt-in), claude-in-chrome MCP (opt-in)

**Preview stacks (3):** Vite (default), Next dev server (detected), plain HTML / static (fallback)

**Input adapters (5):** Tailwind v4 `@theme`, shadcn `:root`/`.dark`, Style Dictionary source, package.json sniff, `brand-assets/*` local OKLab k-means

**References (the must-encode 11):** `design-md`, `dtcg`, `wcag-2-2`, `radix`, `shadcn-tailwind-v4`, `react-aria`, `apg`, `forbidden-pairs.yaml`, `slop-tells/`, `canon/typography.md`, `canon/color.md`

**Styles (5 in `assets/styles/`):** `geist-precision`, `swiss`, `editorial`, `neo-brutalism`, `liquid-glass-companion` (the 5 most clearly differentiated)

**Host-first path:** Claude Code. **Smoke-tested:** Codex CLI, Cursor (sequential-fallback).

### 9.2 Out of scope for v1.0

- `contract/extract-from-figma` (v1.1)
- `contract/extract-from-image` (v1.2)
- All other input adapters (Tokens Studio, Subframe MCP, Storybook MCP, Builder MCP, Material 3 input, Radix Themes input) — v1.1+
- `material-web`, `vue-3-sfc`, `svelte-5`, `swiftui` adapters → `complete-design-bridges` companion v1.1+
- Remaining visual styles → v0.3 / `complete-design-styles` companion
- `audit --ci` GitHub Action wrapper (manual `gh` script for v1.0; full Action in v1.1)
- Live design-system MCP server publication — v1.2
- All AI-UX live skills — they remain reference-only in v1.0

### 9.3 v1.0 acceptance criteria

Operationally measurable. Eval datasets, graders, trials, ceilings all in `evals/`.

1. **Atomic invocation works on Claude Code.** Each MVP skill, invoked standalone with no prior `.complete-design/`, produces useful output on ≥9 of 10 hand-curated prompts (3 trials each, semantic rubric ≥0.7).
2. **DESIGN.md validity.** 100% of emitted DESIGN.md validates against the Google spec via `design-md-validate.mjs`.
3. **DTCG validity.** 100% of token emits validate against DTCG v2025.10 via Style Dictionary parse test.
4. **Contrast accuracy.** 100% of generated palettes' contrast claims match what `contrast.mjs` computes; no false positive WCAG passes.
5. **Trigger discipline.** Each skill: trigger recall ≥0.85, false-trigger rate ≤0.15 on `triggers.yaml`.
6. **End-to-end design (headline workflow) — quality, not just rendering.** From a fixed greenfield brief on a fresh Next.js + Tailwind v4 + shadcn scaffold, `design` produces 3 rendered variants. Criterion 6 passes only if **all of**:
   - (a) `/compare` renders without errors across all 3 variants (the v1.0.1-original criterion)
   - (b) All pairwise distances ≥ 0.50 per the deterministic metric in §3.7 (no near-clones)
   - (c) No two variants share the same layout-skeleton-slot decomposition (forced layout diversity)
   - (d) All contrast claims in each variant pass `contrast.mjs` validation (no fake WCAG passes)
   - (e) Two-reviewer forced-choice on a held-out test set says **≥ 2 of 3 variants are "a viable direction for this brief"** (not just "renders")
   
   Tested across 5 brief variants, 3 trials each (15 runs). ≥12 of 15 must satisfy all five conditions. ≤1 may fall back to 2 viable variants with the collapse-reason logged.
6b. **End-to-end extract (the standalone path).** From a fixed brownfield test repo, `extract` produces `.complete-design/DESIGN.md` + tokens + projections + audit report with terminal state ∈ {`PASS`, `PASS_WITH_WARNINGS`}. ≥12 of 15 PASS; ≤1 FAILED_AFTER_REPAIR allowed.
7. **End-to-end enforce.** Given a `.complete-design/DESIGN.md` and a UI prompt, `enforce` constrains the next generation. Audit on the generated output passes for ≥10 of 12 test prompts.
8. **End-to-end audit.** Run on a known-slop sample set (30 hand-curated bad UIs + 30 hand-curated good UIs). Slop-detector recall ≥0.80 on the bad set, false-positive rate ≤0.10 on the good set.
9. **Sequential-fallback works on secondary hosts.** Same 10 atomic prompts on Codex + Cursor: ≥0.75 pass.
10. **Cost discipline.** `design` p50 ≤55k tokens (3 variants); `--variants 2` p50 ≤35k. `extract` p50 ≤40k tokens. `enforce` overhead ≤4k tokens per agent turn. Atomic p50 ≤8k tokens.
10a. **Time-to-first-render.** From `design` invocation to first variant screenshot visible to user: p50 ≤90 seconds on the host-default model tier. (This is the "is it actually usable" metric — slower than 90s and the user gives up.)
11. **Designer review.** Two designers (one B2B, one consumer) rate ≥4 of 5 extract outputs as "this looks like a real design system, not AI-generated."
12. **Override preservation.** Edit `.complete-design/DESIGN.md` between runs → next run preserves edits, records in `manual-overrides.json`. Scripted test.
13. **GTM artifact ready.** The "Ten design-system tells" post + slop-tell detectors all implemented and runnable. Demo video ready. Cross-post manifests prepared.

A v1.0 release that misses criterion 8 (slop-detector recall) ships as v0.9 beta, not v1.0.

---

## 10. Roadmap

| Release | Weeks | Deliverable |
|---|---|---|
| **v0.5 — infra (preview-first)** | 1–3 | Repo, eval harness, `manifest.json`, `references/{design-md, dtcg, wcag-2-2, radix, shadcn-tailwind-v4}`, `assets/scripts/{contrast, oklch, dtcg-lint, design-md-validate, port-manager, repo-detect}`, **preview harness (stack-fixture-driven Vite + Next dev-server boots)**, **Playwright readiness check + browser-binary install flow**, **preview sandbox security tests (import allowlist, env scrubbing, network blocking)**, **variant distance metric implementation + repair-loop test**, **port-manager tests (free-port allocation, PID tracking, stale reaping)** |
| **v0.6 — atoms** | 3–4 | All 10 MVP atoms (including 4 preview/* atoms) + the 3 stack adapters + port manager + Playwright readiness check + dev-server sandbox; standalone atomic invocation works |
| **v0.7 — workflows** | 5–6 | `extract`, `enforce`, `audit` workflows; critique loop + terminal states; persistence + merge policy |
| **v0.8 — slop corpus + GTM artifact** | 7 | Slop-tell library, detectors, "Ten tells" post draft, demo video |
| **v0.9 — beta** | 8 | Private beta to 20 designers + 30 frontend engineers; iterate on findings |
| **v1.0 — public launch** | 9 | Aligned with platform launch window per §7.1; cross-posted; launch artifact published; PR submitted to anthropics/skills#1008 |
| **v1.1** | +6 weeks | `extract-from-figma`, GitHub Action for `audit --ci`, additional input adapters (Tokens Studio, Style Dictionary source, Radix Themes) |
| **v1.2** | +12 weeks | `extract-from-image`, Subframe MCP / Storybook MCP / Builder MCP input adapters, `complete-design-bridges` companion (Material Web, Vue, Svelte) |
| **v1.3** | +18 weeks | `complete-design-styles` companion (premium style packs); enterprise audit dashboard prototype |

---

## 11. Success metrics

| Dimension | v1.0 target (Day 90) | Year-1 target | Measurement |
|---|---|---|---|
| **Install count (cumulative across registries)** | 50k | 250k | skills.sh + Anthropic marketplace + GH stars proxy |
| **Trigger recall per skill** | ≥0.85 | ≥0.90 | `triggers.yaml`, 3 trials, host-first |
| **False-trigger rate per skill** | ≤0.15 | ≤0.10 | Same suite |
| **Cross-host pass rate** | within 0.10 of host-first | within 0.05 | Same eval on all 3 hosts |
| **A11y conformance (own examples)** | 100% pass WCAG 2.2 AA contrast | 100% | `axe-runner.mjs` CI |
| **Lift vs baseline (blind designer rating)** | ≥15pp lift on 30-prompt blind test | ≥25pp | Two-designer blind rating, forced choice |
| **Slop-detector recall + precision** | recall ≥0.80, FP ≤0.10 | recall ≥0.90, FP ≤0.05 | 30+30 curated corpus |
| **Bootstrap cost (p50)** | ≤40k tokens | ≤30k | Run-cost telemetry, 15-run suite |
| **`design` workflow cost (p50)** | ≤55k tokens for 3 variants; ≤35k for 2 | ≤40k for 3 variants | Run-cost telemetry, 15-run suite |
| **Time-to-first-render (p50)** | ≤90 seconds | ≤60 seconds | Wallclock measurement, 15-run suite |
| **Variant diversity** | min pairwise style/palette distance ≥0.5 across 3 variants | ≥0.6 | Deterministic distance metric on chosen tokens |
| **Preview-render success rate** | ≥85% of `design` runs produce all 3 screenshots successfully | ≥95% | 15-run suite + cross-host smoke |
| **DESIGN.md ecosystem fit** | Listed in `awesome-claude-design` | Cited in Anthropic frontend-design release notes for #1008 | Public observation |
| **Designer endorsement** | ≥3 named designers post positively | ≥10 named designers | Social monitoring |
| **Override-preservation correctness** | 100% in scripted test | 100% | Automated |
| **Terminal-state honesty** | 0 false `PASS` reports in random audit of 30 runs | Same | Manual audit |
| **GTM artifact reach** | ≥10k views on the "Ten tells" post in first week | ≥100k cumulative | View counters across cross-posts |

---

## 12. Risks & mitigations (refreshed)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Anthropic ships DESIGN.md support in `frontend-design` before we launch** | High | Existential — they have the install base | Track issue #1008 weekly; our launch must come *with* or *before* theirs. If they win the spec-consumer race, pivot to producer-only and polyglot adapter (still defensible). |
| **Vercel ships a `web-design-guidelines`-equivalent for DESIGN.md** | Medium | High | Same playbook — be first or be polyglot. |
| **Subframe/Miro/Builder embed DESIGN.md in their MCPs natively** | High | Medium | Good for us — we read their MCPs. Position as "the consumer-side companion to Subframe MCP." |
| **DESIGN.md doesn't become the standard** | Medium | High | DESIGN.md is upstream-labeled "draft" by Google and "alpha" in the Anthropic issue. We use it because it's the best anchor available, not because it's settled. Mitigations: (a) DTCG tokens remain portable to any other contract envelope; (b) `$extensions.complete-design` is namespaced so vanilla DESIGN.md consumers safely ignore our additions; (c) extraction evidence + sourceRefs are preserved so we can project to a successor format if needed; (d) we ship our own machine-readable contract format (`$extensions.complete-design.tokens` JSON) that is independent of the DESIGN.md outer envelope. |
| **Designer discourse turns on us specifically** | Medium | High | Trust-posture choices in §2.4; pre-launch outreach in §7.4; the launch artifact is a designer-friendly critique, not a generation pitch. |
| **Codex 2% cap tightens further** | Low | Medium | Already designed for it (14 skills, ~3.8k chars total); descriptions auditable; release v1.1 could split into core + companion to reduce footprint further. |
| **The 10 styles aren't enough; users want more** | Medium | Low | `complete-design-styles` companion v1.3 covers the long tail; v1.0's 5 styles are the most clearly differentiated. |
| **Critique loop converges on its own biases (slop rejecting slop)** | Medium | High | Slop corpus is hand-curated by 2+ designers, not LLM-generated; quarterly re-curation; user-overrides feed back as corpus additions. |
| **`extract` fails on real-world repo messiness** | High | Medium | Confidence markers + "low-confidence flags" surfaced explicitly; manual-override workflow always available; v1.1 adds more input adapters to widen coverage. |
| **CI cost balloons (the eval suite is expensive)** | Medium | Medium | Use Haiku-class models for most eval runs; full Opus runs only for designer-rated criteria; total monthly CI budget capped + alerted. |
| **Knowledge corpus becomes stale (DESIGN.md v2, Tailwind v5, WCAG 3)** | Certain over time | Medium | Quarterly review cadence; `knowledge-version` field gates skill behavior; refresh CI dashboard tracks staleness. |
| **`audit --ci` mode is bypassed by teams that don't run it** | High | Low | Make `audit --interactive` so fast it gets run anyway; ship a pre-commit hook as opt-in. |
| **No sustainable funding** | Certain unless mitigated | Long-term high | §7.4 vendor endorsement asks; §8 monetization paths; assume open-source sustainability constraints from day 1 (no overpromises). |
| **Designer trust gap doesn't close** | Medium | High | The package's social posture is the mitigation; if the launch artifact lands well with designers, the gap closes. If not, pivot to dev-only positioning. |
| **GTM ride fails to materialize (no platform launch in window)** | Medium | Medium | Ship v1.0 as planned; the launch artifact's quality is the backup distribution mechanism. Plan a self-launched v1.0 with a 4-week marketing window if no platform window opens. |

---

## 13. Open questions

| # | Question | Default lean |
|---|---|---|
| Q1 | Do we ship a Storybook integration (read Storybook MCP) in v1.0 or v1.1? | v1.1 — too much to validate in v1.0 |
| Q2 | Do we publish a DESIGN.md generator as a standalone tool (CLI without skill bundle)? | Yes — `npx complete-design extract` for non-agent users; same code |
| Q3 | Should the slop corpus be opt-in telemetry (collect user-flagged false positives)? | Opt-in only, anonymous, never default |
| Q4 | Do we contribute the slop-tell corpus to `awesome-claude-design`? | Yes — extends our reach; corpus is small enough to share |
| Q5 | Should we pursue an Anthropic / Vercel co-marketing partnership pre-launch? | Soft outreach yes; don't gate launch on it |
| Q6 | Do we ship a Subframe input adapter or wait for them to publish a stable MCP schema? | Wait for v1.1 — they're early; tracking their roadmap |
| Q7 | Should `enforce` work outside the agent loop (e.g. as a Tailwind plugin that warns on token violations)? | Possible v1.2; would extend the user base meaningfully |
| Q8 | How aggressive is `slop-detector` strictness default? | Medium; document `--strictness=low/high` |
| Q9 | i18n / RTL / CJK as first-class? | **v1.0 explicitly labels these partial.** Typography measure rules assume LTR Latin scripts. RTL line-height / spacing behavior is flagged as `unsupported-fully` in extraction, with a doc pointer. CJK typography (line-height conventions, character spacing, font fallback chains) is `partial` — readers detect CJK content and emit warnings on token decisions that won't translate (e.g. Bringhurst measure rules). v1.1 ships a dedicated `typography/i18n-coverage` atom; v1.2 ships RTL adapter projections. Until then: documented partial coverage is not the same as silent failure. |
| Q10 | Vector store for the corpus later? | Re-evaluate at v1.3 if reference exceeds ~25MB; sqlite-vec for portability |
| Q11 | Default preview backend: Playwright vs auto-detect best available? | Playwright is required (universal); CDT and CiC are auto-detected and offered as alternatives, never forced. User can pin via `--preview-backend`. |
| Q12 | What if the user's repo has no detectable stack (no Vite, no Next, no HTML)? | Fall back to static HTML preview (the v1.0 plain-CSS adapter); the package emits standalone HTML mockups it serves via a built-in static server. User is told "no stack detected; using static HTML preview" with no failure. |
| Q13 | How many variants by default? | 3 (the well-established "Goldilocks" choice count from UX research). Configurable 2–5 via `--variants N`. |
| Q14 | Do we ship a `--no-preview` mode (skip rendering, just commit a contract)? | Yes — for CI, headless environments, and users who explicitly opt out. Same code path as the visualization-backend `none` flag. |

---

## 14. Out of scope (explicit cessions)

We do not compete on these surfaces. Each is a deliberate cede.

- **"Prompt → UI from scratch."** v0, Lovable, Bolt own this. We pitch as "the layer underneath."
- **Visual canvas editing.** Subframe, Figma Make own this. We are CLI / agent-loop only.
- **Hosting / deploy.** Out of our scope. Users own their deploy.
- **The DESIGN.md spec itself.** Google owns it. We consume and produce, never extend.
- **The DTCG spec.** W3C owns it. We emit, never extend.
- **Branded design IP.** No bundled licensed fonts, no bundled commercial palettes.
- **A figure-recognition vision generator.** v0.3+ at earliest, and only as a critic.
- **A hosted SaaS.** Year-1 is local-only, free, no API key requirement.
- **Replacing Style Dictionary or Tokens Studio.** We emit DTCG into their pipelines.
- **Replacing Figma.** We consume Figma DTCG exports.
- **Generic "AI design" framing.** Discourse poison; we frame as enforcement.

---

## 15. Comparison vs v0.1 and v0.2

| Dimension | v0.1 sketch | v0.2 MRD | v1.0 final |
|---|---|---|---|
| Positioning | "Full front-end design package" | "Direction + tokens + build + critique, all four primitives" | **"Design-contract layer underneath whatever UI generator you run"** |
| Output anchor | Internal | DTCG (correct) + internal contract | **DESIGN.md (Google spec) + DTCG** |
| Skill count | ~60 | 89 (broken math; actual 89) | **14 (4 workflows + 10 atoms) — v1.0.1, after adding preview primitive** |
| Workflow layer | Implicit | 6 workflows | **3 workflows (extract, enforce, audit)** |
| Subagent fan-out | None | 5 types | **2 types (extraction sequential, critique parallel-where-supported)** |
| Style codifiers | 20 as skills | 20 as skills | **5–10 as reference data, not skills** |
| Persistence | mentioned | `.complete-design/` with merge policy | **same, anchored to DESIGN.md as primary file** |
| Live-preview competitive frame | Implicit | "Skills win on portability" (insufficient) | **v1.0 ceded greenfield; v1.0.1 reclaimed it via preview-first design — same agent, same tokens, no second subscription** |
| Visual preview in-agent | Out of scope | Out of scope | **First-class: `design` workflow + `preview/*` atoms; Playwright + CDT + CiC backends** |
| Headline workflow | n/a | `bootstrap-design-system` | `design` (explore → preview → pick → commit) |
| Market positioning | "comprehensive front-end design package" | "design-contract layer underneath whatever UI tool you use" | "design exploration AND contract inside the agent you're already paying for — no second subscription, no double-billed tokens" |
| Designer trust | mentioned | acceptance criterion only | **First-class principle (don't lead with AI), trust-posture lever per skill** |
| Output determinism | implicit | implicit | **First-class contract: LLM picks, scripts emit** |
| GTM | "publish on skills.sh" | partial §11 | **First-class §7 with platform-ride, quotable hook, 8-marketplace cross-post, vendor outreach** |
| Monetization | no plan | "no paid in v1; year-2 conversation" | **Same posture; paths sketched explicitly with realistic ceilings** |
| MVP scope | 1 wave | 2-wave split | **Single coherent v1.0** |

---

## 16. Codex review acceptance record (v1.0 pass)

This MRD was reviewed by a second independent Codex pass after the v1.0 rewrite. Findings were triaged ACCEPT (applied) or REJECT (with rationale). **All findings were accepted.** Each is mapped to the section where the revision was applied.

| Finding | Severity | Disposition | Where applied |
|---|---|---|---|
| DESIGN.md overclaimed as "already entrenched" / Low risk of non-standardization | HIGH | ACCEPT | §3.5 opening caveat; §12 risk row reweighted Low→Medium with mitigation; portability rule documented |
| Scope leak between §3.7 (extract handles repo/Figma/image) and §9.2 (Figma/image out of scope) | HIGH | ACCEPT | §3.7 step 1 tagged each input with [v1.0]/[v1.1]/[v1.2]; §3.16 retitled "architecture vision" with per-row release labels; §9.1 reaffirmed as authoritative |
| "Don't lead with AI" is positioning rule but product is LLM-driven | MEDIUM | ACCEPT | New principle P11 "Channel segmentation: AI in the architecture, not the README" — designer-facing surfaces vs developer-facing surfaces |
| "10 skills" understates orchestration complexity | LOW | ACCEPT | §3.6 + §3.9 reworded: "10 triggerable skills" (metadata footprint), implementation surface deliberately larger |
| GTM platform-launch ride not executable as plan | HIGH | ACCEPT | §7.1 rewritten with release-monitoring infrastructure, 3 pre-written launch variants, named coordinator, hard fallback date |
| Designer outreach unrealistic ("if Pablo tweets it, traction follows") | HIGH | ACCEPT | §7.4 rewritten with warm paths, expected conversion %, explicit fallback per target; aggregate-expected-outcome stated honestly |
| Repo extraction kill risks under-mitigated | HIGH | ACCEPT | New §3.17 "Real-world repo failure modes" — 10 named failure modes with v1.0 handling and fixture-corpus requirement |
| `.complete-design/` committed by default leaks sensitive material | HIGH | ACCEPT | §3.13 expanded to per-file commit policy; `.complete-design/private/` carved out for sensitive content; `.gitignore` snippet auto-written |
| Critique has no appeal path | MEDIUM | ACCEPT | New §6.4 "Critique appeal and suppression policy" — 5 user response options, required rationale, expires-date, house-heuristic conversion |
| Cost ceilings asserted not derived | MEDIUM | ACCEPT | New §3.21 "LLM model selection and cost discipline" — fixture-based measurement, declared model matrix, degraded-extraction policy |
| Year-2 monetization includes "enterprise audit" that contradicts §14 "no hosted SaaS" | LOW | ACCEPT | §8 monetization #2 reframed as a "separate sibling product line," not a feature of OSS package; clarified §14 applies to the OSS package only |
| No dedicated security/permissions section | BLOCKER (missing) | ACCEPT | New §3.18 "Security & permissions" — file reads, brand assets, Playwright, Bash, MCP, telemetry, report-redaction policy, `complete-design permissions --explain` |
| No telemetry policy | BLOCKER (missing) | ACCEPT | §3.18 telemetry row: no collection default; local-only run-log in `private/`; never transmitted; future opt-in only |
| i18n/RTL/CJK under-scoped | MEDIUM | ACCEPT | §13 Q9 rewritten with explicit `unsupported-fully` / `partial` labels per concern; v1.1/v1.2 commitments stated |
| Monorepo support asserted not designed | HIGH | ACCEPT | New §3.19 "Monorepo design" — 5 named repo shapes with resolution rules; `extends:` mechanism; package-manager scope |
| Brand-asset handling unsafe | HIGH | ACCEPT | §3.18 brand-assets row: processed locally by default via deterministic OKLab k-means; `--vision <provider>` opt-in with explicit IP warning |
| Slop corpus licensing undefined | MEDIUM | ACCEPT | §7.2 + slop-tell library policy: detectors are technical rules (not screenshots); fair-use commentary only; no brand-licensed material in corpus |
| `$extensions.complete-design` framed as extending DESIGN.md, contradicting §14 "never extend" | LOW | ACCEPT | §3.5 reworded: "we use the spec's documented extension mechanism, not extend the spec"; §14 cession updated for clarity |
| Versioning / back-compat / migration policy missing | HIGH | ACCEPT | New §3.20 "Recovery, versioning, and invalid states" — 7 specific conditions with explicit behavior; `migrations/v<old>-to-v<new>.mjs`; 2-minor-release deprecation window |
| Invalid DESIGN.md recovery undefined | HIGH | ACCEPT | §3.20 row 2 — fails validator → halts, offers `--repair` or `--reset`; never silently overwrites |
| Deleted DESIGN.md behavior undefined | HIGH | ACCEPT | §3.20 row 4 — treats deletion as intent; asks before re-creating |
| Determinism under-verified | MEDIUM | ACCEPT | New §3.22 "Determinism verification" — golden tests, decision log, hash chain, `complete-design verify --golden` CI gate |
| Model selection absent | HIGH | ACCEPT | §3.21 model matrix (host-default / budget / high-quality); no v1.0 claim requires Opus-class |
| §3.2 P4 references "§9.4" which doesn't exist | LOW (typo) | ACCEPT | Fixed reference to §3.11 |
| §5 trigger-description claim shown for only one example | MEDIUM | ACCEPT | §5 now shows real first-200-char zones for all 8 MVP skills as a table |

**Codex verdict before revisions:** *"Not ready for unconditional final pre-build commit. It is ready to begin v0.5 infra only if v0.5 is explicitly scoped to the missing foundations: validators, eval harness, trigger tests, security policy, schema migration, deterministic emit snapshots, and repo-fixture corpus."*

**Status after revisions:** v0.5 infra scope is now explicitly the missing foundations the codex pass named. The roadmap in §10 covers them. The v1.0 MRD is ready as the build-from spec.

No findings were rejected. v1.0 grew from ~720 lines to ~1100 lines through these revisions — every section the codex pass identified as kill-risk now has explicit handling.

### v1.0.1 — User-correction acceptance record

Following the codex pass, a user critique surfaced two more strategic gaps that no codex pass had caught:

| # | Finding | Disposition | Where applied |
|---|---|---|---|
| U1 | The "extract → enforce → audit" framing assumes users already know what they want; wrong for greenfield (no system to extract) and brownfield refresh (system exists but is being reconsidered). Design tools (frontend-design, Subframe) prove visual exploration *is* feasible in-agent — package should generate variants, render in local dev server, screenshot via Playwright / Chrome DevTools / claude-in-chrome MCP, present side-by-side, then commit chosen contract. | ACCEPT | New §0 changelog v1.0.1; new headline workflow `design` (§3.6 W0); 4 new `preview/*` atoms (§3.9); new "show, don't tell" trust tenet (§2.4); revised executive summary (§1); revised JTBD priority |
| U2 | The v1.0 framing of "v0/Lovable own greenfield" ignored that most coding-agent users *reject* v0/Lovable specifically because of double-token-billing and tool fragmentation. The market for "preview-capable design inside the agent you're already paying for" is much larger than the brownfield-only sliver v1.0 wrote down. | ACCEPT | New §1 executive summary frames market opportunity around cost-and-fragmentation; §2.1 reweights market context; §2.3 promotes "indie dev / solo SaaS builder using Claude Code or Cursor" to primary persona; §2.6 reframes where-we-win around cost; §7.2 launch hook leads with "stop paying for design twice" |

Both accepted. The v1.0.1 changes are listed in §0 changelog and applied throughout §1, §2.1, §2.3, §2.4, §3.6 (with new W0), §3.7 (now 4 workflows), §3.9 (added preview/* atoms), §3.18 (preview backends + dev server policy), §5 (trigger zones for new skills), §7.2 (launch hook), §9.1 (MVP scope), §11 (new metrics), §13 (new questions Q11–Q14), §15 (comparison), §17 (glossary), §18.

These additions raise the skill count from 10 to 14 (still under Codex 2% cap) and add the preview primitive that was the v1.0 architectural omission.

### v1.0.1 — Third codex pass acceptance record (delta on the user-corrections)

A third codex review specifically stress-tested the v1.0.1 *delta*. The verdict: *"v1.0.1 fixes the right strategic problems: preview-before-contract and greenfield-not-ceded were the missing pieces. But the correction introduces a new build risk: the MRD now sells a preview product while the technical spec, security model, metrics, roadmap, and market evidence still read partly like the old brownfield contract product."* Findings, all accepted:

| Finding | Severity | Where applied |
|---|---|---|
| Skill count broken across §3.6 (14) / §3.17 (10) / §9.1 (13) / §10 ("5 MVP atoms") — bookkeeping error blocks build | BLOCKER | All four locations + §15 + §18 reconciled to **14 (4 workflows + 10 atoms)**; manifest.json named as source of truth |
| 90s time-to-first-render asserted, not evidenced | HIGH | §3.7 W0 now has full **phase budget table** (direction/variant-gen/scaffold/server/screenshot) with warm vs cold p50s; release can't claim ≤90s unless per-phase fixtures pass; Playwright browser install excluded and surfaced separately |
| Variant distance metric undefined ("decorative criterion") | HIGH | §3.7 W0 now defines **deterministic 6-axis weighted distance** with normalized formula; repair-loop spec (regenerate once with locked axes, then surface 2 viable + collapse explanation) |
| Component sourcing under-modeled (partial systems are the common case) | HIGH | §3.7 W0 step 2 now includes the **4-strategy component availability matrix** (REUSE / WRAP / SCAFFOLD / FALLBACK) per-variant; written to `components-manifest.json` for audit |
| Stack support internally inconsistent (Vite/Next/Astro vs Vite/Next/static vs Vue/Pinia/RN claims) | HIGH | §3.7 W0 stack-aware preview surface table reconciled with §9.1; non-web stacks now **refuse preview** rather than fake it; explicit `--preview-stack` override |
| Dev-server isolation conflicts with repo component reuse (security claim false as written) | HIGH | §3.18 dev-server row rewritten: preview sandbox under `.complete-design/preview/run-<id>/`, **explicit import allowlist via `repo-detect.mjs`**, symlinked read-only `_imports/`, no env loading, no postinstall, no full repo dep tree |
| Port handling too thin ("spawn on a free port" is insufficient) | HIGH | New `port-manager.mjs` spec in §3.18: 5800-5899 range, port.lock with PID, health check, SIGINT cleanup, stale reaping |
| Preview fidelity too narrow (hero/button/card/form ≠ dashboard or commerce) | MEDIUM | §3.7 W0 now has **stack-aware preview surface scope table** (marketing / dashboard / AI workspace / commerce / media / motion / default) with auto-detection signals |
| Iteration cost unbounded; v1/v2 history unspecified | MEDIUM | §3.7 W0 now has 5-iteration default cap (configurable to 10 via `--max-iterations`); preserved iteration history at `_archive/v{N}-iterations/` so iterating v1 then accepting v2 doesn't lose work |
| Mobile viewport 375×667 dated | LOW | Updated to **390×844 mainstream + 375×667 stress-small** dual-capture default, configurable via `--viewports` |
| Non-web fallback dangerous (static HTML ≠ SwiftUI/RN/game UI) | HIGH | §3.7 W0 explicit: non-web stacks **refuse preview** with helpful message; static HTML reserved for plain-web only |
| "Most users refused v0/Lovable" overclaimed (mere correlation, not causation) | MEDIUM | §2.1 softened to "meaningful segment...consistent with the hypothesis, though not proof"; "double-billed tokens" reframed as supporting copy, not headline claim |
| Launch hook "Stop paying for design twice" risks antagonizing Vercel (skills.sh distributor) | HIGH | §7.2 primary hook changed to **"Three design directions inside the agent and repo you already use"**; cost angle demoted to tertiary supporting copy in developer-targeted channels; durable claim foregrounded |
| Primary persona too broad | MEDIUM | §2.3 expanded into **3 sub-segments**: indie dev never-adopted-v0, dev migrating off v0/Lovable, brownfield founder refreshing existing app |
| Pricing arbitrage may decay | MEDIUM | §7.2 explicit: durable differentiator is *repo-native contract persistence with in-place visual exploration*, not the temporary pricing gap |
| Preview atom triggers risk false-fire ("take a screenshot" colliding with general browser MCP work) | MEDIUM | §5 preview/* descriptions tightened: each is **narrowly scoped to complete-design preview directories**, explicitly says "NOT for general X" with redirect to the right tool |
| Acceptance criterion #6 measures rendering not quality | HIGH | §9.3 criterion 6 expanded to **5 sub-conditions**: render success + variant distance + layout diversity + contrast validity + two-reviewer viability ≥ 2/3 |
| Security doesn't cover full preview attack surface (env vars, postinstall, malicious imports, network) | HIGH | §3.18 now has 5 additional rows: import allowlist, network blocking, env scrubbing, postinstall blocking, port manager |
| Model selection ignores preview generation cost | MEDIUM | §3.21 now has dedicated subsection: **per-sub-step tier table** for `design` workflow; explicit `--variant-model budget` opt-in with quality trade-off documented |
| Roadmap doesn't reflect preview-first reality | HIGH | §10 v0.5 expanded to explicitly include preview harness, port manager, Playwright readiness, stack fixtures, security sandbox tests, variant-distance test — the "missing foundations" codex named |

**Codex verdict after the v1.0.1 third-pass revisions:** the technical spec, security model, metrics, roadmap, and market evidence now match the preview-first product. v1.0.1 is ready for v0.5 infra build with v0.5 explicitly scoped around preview infrastructure first.

No findings rejected across the three codex passes (5 + 24 + 19 = 48 findings, all accepted). The MRD grew from ~720 lines (v1.0 draft) to ~1500+ lines through the codex + user-correction loops — every kill-risk now has explicit handling.

---

## 17. Glossary

- **DESIGN.md** — Google's open spec for design contracts (April 2026). The package's primary persisted artifact.
- **DTCG** — W3C Design Tokens Community Group format module; v2025.10 first stable. Primary token format.
- **Brownfield** — A repo with an existing design system (the package's primary niche).
- **Greenfield** — A new project, no existing system (the niche the package explicitly does not target).
- **Slop tell** — A signature pattern of LLM-default UI (purple gradient, Inter-default, glass-on-glass, etc.) the package detects and warns on.
- **Atomic skill** — A single SKILL.md doing one decision-unit job.
- **Workflow** — A SKILL.md whose body chains atoms and dispatches subagents to fulfill a JTBD.
- **Subagent** — Task-scoped agent with stitched context, not the full user request.
- **Extraction subagent** — Sequential; computes the contract from repo inputs.
- **Critique subagent** — Parallel where supported; audits finished artifacts.
- **Adapter (output)** — A skill that projects DTCG tokens to a stack's native format.
- **Adapter (input, polyglot)** — A reader for an existing design-system source (shadcn, Tailwind v4, Tokens Studio, Subframe MCP, Storybook MCP via Chromatic, etc.).
- **Critic** — Read-only skill that audits and reports; never edits.
- **Trust posture (frontmatter)** — Per-skill declaration: `deterministic-emit`, `asserts-wcag`, `requires-confirmation`.
- **Terminal state** — A critique workflow's exit state: `PASS` / `PASS_WITH_WARNINGS` / `FAILED_AFTER_REPAIR` / `USER_OVERRIDDEN`.
- **Variant** — One of N (default 3) proposed design directions, rendered as a preview surface, presented for user selection by the `design` workflow.
- **Preview surface** — The minimum renderable HTML/JSX for visual comparison: hero + button + card + form sample. Lives in `.complete-design/preview/{v1,v2,v3}/`.
- **Preview backend** — The screenshot mechanism: `playwright` (default), `cdt` (Chrome DevTools MCP), `cic` (claude-in-chrome MCP), or `none` (skip rendering).
- **Variant axis** — The dimension along which variants differ: `visual_style × palette_strategy × type_pair`, sampled to maintain pairwise diversity ≥ 0.5.
- **Show-don't-tell** — The v1.0.1 trust tenet: every contract decision is rendered visually before being committed; no asserted-blind choices.
- **Double-billed tokens** — The cost pattern users avoid by using complete-design in-agent: paying for LLM tokens both on their coding agent (Claude Code / Cursor / Codex) AND on a separate live-preview tool (v0 / Lovable / Bolt). The package's primary economic argument.

---

## 18. Decision summary (the choices this MRD locks in)

1. **Position:** *Explore design options and persist the chosen contract — all inside the coding agent the user already pays for.* The differentiator is preview-in-your-own-stack + contract-as-artifact, the moat is being inside the agent loop without a second subscription.
2. **Anchor format:** Google DESIGN.md (April 2026) + W3C DTCG v2025.10.
3. **Market:** greenfield AND brownfield. We do **not** cede greenfield to v0/Lovable/Bolt — the majority of coding-agent users explicitly refuse those tools because of double-token-billing and tool fragmentation. We are the in-agent alternative for that majority.
4. **Skill count:** 14 (4 workflows + 10 atoms). Style codifiers and other v0.2 atoms remain collapsed into reference data + deterministic scripts. Preview atoms added in v1.0.1.
5. **Hosts:** Claude Code host-first; Codex CLI + Cursor sequential-fallback; broader hosts in v1.1+.
6. **Trust posture:** don't lead with AI; deterministic emit; never claim WCAG conformance; ask before generating; never auto-publish to git tree; cite every rule.
7. **Polyglot input adapters:** read shadcn, Tailwind v4 `@theme`, Style Dictionary, Tokens Studio, Radix Themes, Material 3, Subframe MCP, Storybook MCP, Builder MCP, Figma DTCG, brand assets.
8. **Polyglot output adapters:** Tailwind v4, shadcn, plain CSS first. Material Web, Vue, Svelte in `complete-design-bridges` companion v1.1+. SwiftUI later.
9. **Trigger discipline:** 200-char directive front-load for Codex 2% cap; ≥20-prompt eval per skill, CI-gated.
10. **Knowledge architecture:** hybrid file-based (no vector DB, no graph in v1); DESIGN.md anchored.
11. **Critique loop:** terminal states; max 2 repair cycles; visual regression where supported; PR-first diff; user-override capture.
12. **Persistence:** `.complete-design/` under repo root; committed to git by default; manual-override preservation via hash diff.
13. **GTM:** ride a platform launch; quotable hook ("Ten design-system tells"); cross-post 8 marketplaces; pre-launch vendor outreach (Anthropic, Vercel, shadcn, Tessl, named designers).
14. **Monetization:** zero in v1.0; year-2 paths sketched (premium packs, enterprise audit, vendor sponsorship). Distribution dominates.
15. **MVP:** single v1.0 release with 4 workflows + 10 atoms (all triggerable) + 3 stack adapters + 5 input readers + 11 references + 5 styles + 3 preview backends (Playwright default; CDT, CiC opt-in) + 3 preview stacks (Vite, Next, static) + the GTM artifact. Operationally measurable acceptance criteria.

---

## 19. Sources (delta vs v0.2)

This MRD incorporates the same sources as v0.2 plus the following new research:

### Skill adoption mechanics + GTM (new)
- Shen Huang. *How I Indexed 2,000 Claude Code Skills*. DEV, 2026.
- Stack AI. *I Audited 214 Claude Code Skills — 73% Were Silently Broken*. DEV, 2026.
- openai/codex Issue #19679 — *Skills metadata context budget* (the 2% cap).
- Ivan Seleznov. *650-trial study on skill activation*. Medium, 2026.
- Vercel changelog — *Introducing skills*; Guillermo Rauch *"npm of AI skills"* framing.
- Jesse Vincent (obra). *Superpowers* blog post + repo, October 2025.
- Justin Wetch. *Improving Anthropic's Frontend Design*.
- Anthropic. `anthropics/skills` issue #1008 — *DESIGN.md consume/produce request*.
- Lenny Rachitsky. *AI tools are overdelivering* (Dec 2025 PM AI tool survey).
- Sacra. v0, Lovable, Bolt revenue/user dossiers.

### Designer trust + social adoption (new)
- Brad Frost. *Design systems in the time of AI*; *AI and Design Systems Course*.
- Vitaly Friedman. *Design Patterns for AI Interfaces* (Smashing, July 2025).
- Tobias van Schneider. *Edition 276 — The year the machine started feeling familiar*.
- Pablo Stanley. *The Design Vibeshift* (UX Collective, Feb 2026).
- *Claude Design for Designers* (Medium); *Almost Magic: First Look at Claude Design*.
- AXE-WEB. *Why AI websites all look the same — the Sea of Sameness*.
- Jon C. Phillips. *Homogeneous by Design*.
- Frontend Masters. *AI-Generated UI Is Inaccessible by Default* (2025).
- Greenpepper. *The Vibe Coding Backlash* (Dec 2025).
- Euronews + Wikipedia. *AI slop — 2025 Word of the Year*.
- Figma 2025 AI Report. *Designer-developer satisfaction split*.
- Roger Wong. *Beyond the Prompt* (Subframe review).
- DesignWhine. *Subframe review*.

### Generative-UI competitive durability (new)
- Vercel. *Introducing the new v0* + skills.sh launch posts.
- TechCrunch. *Lovable nearing 8M users* (Nov 2025); *Lovable crosses $100M ARR* (July 2025).
- Sacra. *bolt.new dossier* — $40M ARR, $135M raised, 5M users.
- DesignWhine + Banani. *Subframe AI Review*.
- Builder.io. *Visual Copilot CLI + Builder MCP docs*.
- *How Miro Onboarded AI into their design system with MCP and Claude Code Skills*.
- Google Labs. *DESIGN.md spec* + `awesome-claude-design` + design.dev generator.
- Chromatic. *Storybook MCP docs*.
- UC Berkeley iSchool. *Aesthetic Taste and Its Limits — Breakdowns in Prompt-Mediated Design User Interfaces*, 2026.
- Philipp Keller. X post on v0 vs. Cursor/Claude frontend output quality.

(All v0.2 sources — interaction & UX canon, design-system canon, typography canon, color canon, accessibility canon, motion canon, design systems & components, AI-UX canon, style trends & validation, microcopy canon, critical / anti-pattern canon, spec / standards — remain in scope and are listed in §17 of v0.2.)

---

*End of MRD v1.0. Next: final codex review pass on this document, then apply accepted findings, then commit as v1.0.0.*
