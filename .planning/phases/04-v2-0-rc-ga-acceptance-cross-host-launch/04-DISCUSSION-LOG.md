---
phase: 04-v2-0-rc-ga-acceptance-cross-host-launch
captured: 2026-05-26
mode: discuss (auto, single batch turn)
---

# Phase 4 Discussion Log

Audit trail of the discussion that produced `04-CONTEXT.md`. Not consumed by downstream agents.

## Pre-discussion state

- Phase 3 verified complete (`03-VERIFICATION.md`, commit `23ab53f`); STATE.md `completed_phases: 3`, `total_phases: 4`.
- ROADMAP Phase 4 entry locked: goal + 21 requirement IDs + 5 SCs + 2-week duration.
- No prior 04-SPEC.md, no prior 04-CONTEXT.md, no 04-DISCUSS-CHECKPOINT.json.
- No `.continue-here.md` blocking anti-patterns.
- User chose "Start Phase 4 discuss (recommended)" via AskUserQuestion at phase-entry checkpoint.

## Areas presented (all 4 selected — auto-batched)

### Area 1: Reviewer recruitment (ACCEPT-07/08)

**Question:** Blind reviews need 5 designers + 5 PMs. How to source them?

**Options presented:**
- (a) Your own network — owner recruits, Claude drafts outreach
- (b) Mixed: network + 1-2 named externals (Brad Frost adjacency)
- (c) Paid panel via UserTesting/Maze/RallyUX
- (d) Defer ACCEPT-07/08 to post-launch retrospective

**User selected:** (a) Own network — owner recruits, Claude drafts outreach.

**Captured as:** D-71 (recruitment is owner-driven, parallel to engineering) + D-75 (Claude builds outreach packet `04-OUTREACH-PACKET.md`).

### Area 2: Launch sequencing (GTM-01..05/07)

**Question:** Long-form post + video + 8-marketplace cross-post + Brad Frost/Cagan outreach + anthropics/skills PR. What ordering?

**Options presented:**
- (a) Soft-launch first: repo public + post + 2 marketplaces, then PR + outreach week 2
- (b) Big-bang: all 5 GTM items same day
- (c) Stealth-then-Frost: ship + private outreach first, public post last
- (d) Marketplace-first: 8 marketplaces first, then own-channel post

**User selected:** (c) Stealth-then-Frost — ship + private Brad Frost + Cagan outreach + 1-2 trusted reviewers Week 1; revise; public launch Week 2.

**Captured as:** D-72 (two-wave stealth-then-Frost). Implies anthropics/skills PR + marketplaces + GTM-01 post all land Week 2 (Wave B); private outreach + repo public land Week 1 (Wave A); RAPID-RESPONSE.md authored during Wave A so it's ready before Wave B exposure.

### Area 3: 15-fixture suite composition (ACCEPT-01)

**Question:** How should the 15 fixtures be distributed?

**Options presented:**
- (a) Stack-balanced (6 Next, 5 Vite, 3 Astro, 1 plain CSS)
- (b) Use-case-balanced (5 B2B SaaS, 5 consumer, 3 dashboard, 2 marketing)
- (c) Refugee-weighted (8 Lovable/v0/Bolt + 4 fresh + 3 mature-app)
- (d) Adversarial-tilted (4 normal + 4 ambiguous + 4 incomplete + 3 edge)

**User selected:** (b) Use-case-balanced.

**Captured as:** D-73. Stack distribution falls out naturally from use-case. Required reservations: 1 fixture for the existing Next 15 + Tailwind v4 + shadcn e2e regression baseline (from 02-05); 1 fixture for `mature-app-refactor` route exercise (D-67); 1 fixture for `DS-extraction` route exercise (D-62..D-64). Remaining 12 split across use-case mix exercising `new-product` and `new-feature` routes.

### Area 4: Cost discipline gate (COST-07/COST-10)

**Question:** What's the response if cost gate fails at RC?

**Options presented:**
- (a) Hard release gate: blocks GA
- (b) Soft gate: ships with overrun documented in release notes
- (c) Graduated gate: p50 hard, p95 + wall-clock soft
- (d) Per-route gates instead of aggregate

**User selected:** (c) Graduated gate.

**Captured as:** D-74. p50 ≤ 150k = HARD block GA. p95 ≤ 220k + wall-clock ≤ 8min = SOFT, up to 30% overshoot allowed with disclosure.

## Claude's discretion (decisions surfaced without explicit user input)

- **D-76 (Adversarial CI corpus fixed-seeded):** Claude locked this because regenerated corpora violate the Phase 1 determinism CI invariant. Defensible without re-asking the user.
- **D-77 (Cross-host sampling):** Claude locked sampled approach (5 per host with escalation) because full N×3 matrix would burn most of Phase 4's 2-week CI budget. Defensible release-engineering pattern (canary then full).
- **D-78 (axe-runner scope = 15-fixture only):** Claude locked this because P8 trust posture explicitly forbids claiming WCAG compliance on user outputs; "own examples" boundary is clear.
- **D-79 (GTM-07 explicit triggers):** Claude defined Severity 1/2/3 trigger conditions for the rapid-response pivot. Documented during Wave A per D-72.

These are documented in CONTEXT.md as Locked but flagged as Claude's discretion in the body — user can override during plan-phase if any disagree.

## Open questions deferred to planner

OQ-6 (PRD source mix), OQ-7 (anthropics PR timing within Wave B), OQ-8 (GTM-02 video production), OQ-9 (outreach format), OQ-10 (marketplace automation).

## Deferred ideas (post-GA / v2.1 / Phase 5)

- Junie + Copilot host parity
- 30+ fixture suite expansion
- Live-LLM trigger eval in CI
- Material Web / Vue / Svelte bridges
- Notion / Linear / Google Doc PRD ingestion
- Multi-page URL crawl in reverse-engineer
- Cross-AI codex peer review of release artifacts

## Scope-creep redirects

None during this discussion. All 4 areas stayed within Phase 4 boundary.

## Mode notes

- Auto mode active; user explicitly chose "Start Phase 4 discuss" (interactive) over autonomous/skip.
- Single batched AskUserQuestion turn (4 questions) used instead of 4 sequential turns — appropriate given user time-budget signals and that the areas were orthogonal.
