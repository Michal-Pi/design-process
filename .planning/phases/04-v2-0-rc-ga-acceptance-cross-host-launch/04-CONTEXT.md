---
phase: 04-v2-0-rc-ga-acceptance-cross-host-launch
phase_number: 4
phase_name: "v2.0 RC + GA — Acceptance, Cross-Host, Launch"
captured: 2026-05-26
mode: discuss (auto)
prior_phases:
  - 01 (Infrastructure & Determinism Foundation — COMPLETE)
  - 02 (v2.0a Skeleton — COMPLETE)
  - 03 (v2.0b Full 5 Stages + Lovable Refugee Path — COMPLETE, gsd-verifier PASS)
---

# Phase 4 Context: v2.0 RC + GA — Acceptance, Cross-Host, Launch

## Domain

Phase 4 validates the full design-os package against the §11 / R22 acceptance criteria across Claude Code + Codex CLI + Cursor, enforces the aggregate coexistence eval ≥0.80 release gate, completes designer + PM blind reviews, ships the launch artifact + cross-post to 8 marketplaces + named outreach + PR to anthropics/skills#1008, and reaches GA — so design-os is the OSS canonical 5-stage design-process facilitator with measurable trust posture.

Phases 1-3 shipped the 5-stage pipeline + lite/full gate promotions + reverse-engineer + migration. Phase 4 is the **release engineering + launch** phase — no new pipeline capability, only validation, hardening, and GTM.

## Carrying Forward From Earlier Phases

**From Phase 1 (Infrastructure):**
- Aggregate coexistence eval harness exists (TRIG-03 will reuse it as the release gate, not build a new one)
- `lint-determinism.mjs` blocks LLM client imports in `assets/scripts/` — preserved
- `skillgrade` per-skill harness ships per-skill recall/false-fire (the release-gate scope is *aggregate*, not per-skill)
- Anthropic-Labs watcher cron + heartbeat already active from week 1 (GTM-06 ✓)
- `axe-runner.mjs` does NOT exist yet — Phase 4 ships it for ACCEPT-09

**From Phase 2:**
- Trust posture (P8, P12) is locked: "report measured contrast, never claim WCAG-compliant"; "no synthetic persona as primary research, INFERRED two-layer disclosure"
- `evals/fixtures/budget/` directory exists with 15-fixture skeleton (per-phase budgets) — Phase 4 expands the corpus
- Next 15 + Tailwind v4 + shadcn e2e fixture exists (02-05) — one of the 15 reuses it

**From Phase 3:**
- 17 locked decisions D-54..D-70 honored in code
- 18 codex findings caught + fixed across 5 plans (lessons-forward distilled in INVARIANTS.md)
- `audit --all-stages`, `audit --new-feature`, `audit --reverse-engineer-stages` all wired
- `design --route new-product / mature-app-refactor / DS-extraction` all ship
- Per-stage `tokenBudget` actually reaches subagents (03-05 codex P2 fix `159e493`)
- **SC-1 (live LLM run on clean laptop) is intentionally deferred to user manual verification BEFORE Phase 4 begins**

## Decisions

### Engineering / acceptance validation

**D-71 [LOCKED] — Reviewer recruitment is owner-driven, parallel to engineering**

The engineering planner does NOT block on reviewer recruitment (5 designers + 5 PMs for ACCEPT-07/08). Phase 4 plans ship in two parallel tracks:
- **Track E (engineering):** 15-fixture suite + adversarial CI + cross-host parity + cost gate + axe-runner + release-gate harness. Time-boxed, ships independently.
- **Track R (recruitment):** Owner-recruited from personal network. Claude drafts (per D-75) the outreach packet + scoring rubric + lightweight NDA + recruitment message. Reviewers feed back ratings; once n≥5 each is met, ACCEPT-07/08 are scored.

GA timing: GA cannot ship without ACCEPT-07/08 satisfied OR explicit owner override (with override documented in CHANGELOG).

- **Why:** Owner's network has the highest signal-to-noise reviewer pool (real designers, real PMs); paid panels skew toward template-following raters. External recruitment (e.g., Brad Frost adjacency) would slow Week 1 launch.
- **How to apply:** Planner schedules ACCEPT-07/08 in its own plan/wave, not gating the engineering waves.

**D-72 [LOCKED] — Two-wave stealth-then-Frost launch sequence**

- **Wave A (private — Week 1):** Repo public on GitHub; private outreach to Brad Frost + Marty Cagan + 1-2 owner-trusted reviewers; collect feedback; revise launch artifact (GTM-01 post) + landing page + README based on feedback.
- **Wave B (public — Week 2):** Revised GTM-01 post on owner-channel (HN/personal blog); 90s video (GTM-02); cross-post to all 8 marketplaces (GTM-03); PR to anthropics/skills#1008 (GTM-05); named outreach delivered (GTM-04 — but framed as intellectual heritage acknowledgment for Cagan, not endorsement claim).

GTM-07 rapid-response pivot plan is documented during Wave A (so it's ready before Wave B exposure).

- **Why:** Owner explicitly chose this order. Lowest blast radius if a Wave A bug surfaces; strongest narrative once Wave B lands because Brad Frost/Cagan reactions inform the post. Avoids the "ship-then-cringe" pattern where the post locks a take Brad Frost would push back on.
- **How to apply:** Planner schedules launch tasks across two waves. Wave B tasks are blocked on Wave A revisions landing.

**D-73 [LOCKED] — 15-fixture acceptance suite, use-case-balanced**

Distribution: **5 B2B SaaS + 5 consumer + 3 dashboard + 2 marketing** (= 15). Stack distribution (Next.js / Vite / Astro / plain CSS) falls out naturally from use-case — most B2B SaaS → Next, consumer leans Vite or Next, dashboards = Next + shadcn, marketing leans Astro.

Specifically:
- 1 fixture must be the existing Next 15 + Tailwind v4 + shadcn e2e fixture from Phase 2 plan 02-05 (regression coverage)
- 1 fixture must exercise `mature-app-refactor` route (D-67 path)
- 1 fixture must exercise `DS-extraction` route (D-62..D-64 path)
- The remaining 12 exercise `new-product` and `new-feature` routes across use-case mix

Per ACCEPT-01: ≥12/15 must pass all 5 gates per run.

- **Why:** Use-case balance reflects real-world Lovable-refugee distribution (mostly B2B SaaS + consumer + dashboards). Stack-balanced or refugee-weighted distributions would over-test specific paths at the cost of breadth. Adversarial-tilted would weaken ACCEPT-07/08 because reviewers would see broken outputs.
- **How to apply:** Planner builds 15 PRD specs early (one of its first tasks) so the rest of Phase 4 can iterate against them. PRD sourcing: owner-written for ~5; remaining ~10 from anonymized real-world examples or published PRD-template galleries.

**D-74 [LOCKED] — Graduated cost-discipline gate**

GA gate behavior on the 15-fixture suite per COST-07/COST-10:
- **p50 ≤ 150k tokens per full `design` workflow run** → **HARD BLOCK.** If exceeded, GA cannot ship; Phase 4 reopens with budget-replan task.
- **p95 ≤ 220k tokens** → **SOFT.** Up to 30% overshoot allowed (i.e., effective ceiling 286k) with disclosure in CHANGELOG + README "known cost behavior" section. Triggers v2.0.1 follow-up.
- **wall-clock p50 ≤ 8 min** → **SOFT.** Same 30% overshoot allowed with disclosure (effective ceiling ~10.4 min).

Per-route budgets from `evals/fixtures/budget/*.fixture.json` continue to hold and are NOT independently graded — only aggregate suite numbers feed the release gate.

- **Why:** p50 is the median user's experience — non-negotiable. p95 + wall-clock are tail-latency metrics; honest disclosure beats blocking the release on outliers. PostgreSQL/Postgres-style cost-discipline: ship with known characteristics rather than ship-late.
- **How to apply:** Cost-discipline task lands a `npm run release-gate` script that runs the 15-fixture suite, computes p50/p95/wall-clock, and exits 0 only if p50 ≤ 150k. Soft-gate outcomes write to `RELEASE-NOTES.md` automatically.

**D-75 [LOCKED] — Outreach packet is a Phase 4 engineering deliverable**

Owner-recruited reviewer pipeline depends on a packet built by Claude in Phase 4:
- `04-OUTREACH-PACKET.md` containing: 200-word recruitment message; 1-page scoring rubric (5-point Likert: "this is what doing it properly looks like, not a Lovable shortcut" for designers; "produces artifacts I'd actually share with engineering" for PMs; plus 3 free-form prompts); a lightweight reviewer NDA template (CC-licensed, no exclusivity claims); 3 anonymized DESIGN.md + tokens.json bundles drawn from the 15-fixture suite (after the suite passes its first dry-run).
- Sample-size enforcement: blind-review collection script tracks `n_designers / n_pms` against the n≥5 each requirement; CHANGELOG `## Reviews` section auto-populated.

- **Why:** Owner does the recruitment but needs a ready-to-send packet to keep recruitment lift to under 1 hour of work. Decouples engineering Track E from recruitment Track R.
- **How to apply:** Planner schedules `04-OUTREACH-PACKET.md` early in the engineering track so owner can start sending right after Wave A lands.

### Adversarial CI scope

**D-76 — Adversarial CI corpus = fixed seeded, not regenerated**

ACCEPT-02/03/04 each require 100/100 block rates. The 100 cases per acceptance criterion are:
- Stored as fixed fixtures in `evals/adversarial/<accept-id>/cases/` (100 `.case.json` files per dir).
- Each case has a deterministic seed (referenced by run ID).
- Cases are NOT regenerated per CI run — that would break golden determinism (lesson 4 + Phase 1 `lint-determinism`).
- Cases ARE expanded by hand when a new attack pattern is found in the wild; adding a case is a normal PR.

- **Why:** Determinism CI is sacred (Phase 1 invariant). Regenerated corpora would mean a fixture passing today and failing tomorrow without a code change. Fixed corpora give clean blame trails.
- **How to apply:** Planner generates initial 100-case corpora using the existing `evals/adversarial/inferred-disclaimer/`, `evals/adversarial/fid-06-frost-recurrence/`, and Phase 2's `evals/adversarial/red-05/`, `evals/adversarial/red-06/` patterns as templates. Each acceptance criterion gets its own corpus.

### Cross-host parity (DIST-05/06)

**D-77 — Per-fixture per-host smoke + per-host cost-aggregate (not full N×3)**

Per DIST-05/06: pass-rate on Codex CLI + Cursor must be within 0.10 of host-first (Claude Code). Two interpretations:
- **Full N×3 matrix:** Run all 15 fixtures on each of 3 hosts = 45 runs per release-gate eval. Most rigorous, highest CI cost.
- **Adopted approach:** Sample-N per host + aggregate cost.
  - On Claude Code: run all 15 fixtures (the host-first baseline).
  - On Codex CLI + Cursor: run a deterministic sample of 5 fixtures each (1 from each use-case category) to compute pass-rate; aggregate cost numbers are extrapolated.
  - Compare pass-rates; if Codex or Cursor sample falls outside 0.10 of host-first, escalate to full N=15 on that host.

- **Why:** Phase 4 is 2 weeks. Full 45-run matrix would burn most of the CI budget. Sampled approach with escalation is the standard release-engineering pattern (canary then full).
- **How to apply:** Planner writes a `cross-host-parity.mjs` driver that takes a host name and a sample size; CI matrix uses sample=5 by default, sample=15 only on regression detection.

### Axe-runner CI (ACCEPT-09)

**D-78 — axe-runner gate scope = 15-fixture suite generated outputs**

ACCEPT-09 requires 100% pass WCAG 2.2 AA contrast on the package's "own examples". Scope:
- **In scope:** The DESIGN.md + tokens output for each of the 15 acceptance fixtures (since these ARE the package's own examples that the GTM-01 post will reference).
- **In scope:** The 2026 demo site (if shipped — TBD with planner).
- **Out of scope:** User-generated outputs (those are user responsibility — design-os MEASURES, never CLAIMS).

axe-runner emits measured contrast values per fixture; release gate fails if ANY of the 15 fixtures' generated UI fails AA contrast (contrast < 4.5:1 for normal text, < 3:1 for large text).

- **Why:** "Own examples" is the trust-posture boundary — design-os never claims WCAG compliance for user outputs, only for its own demonstration artifacts. Scoping the gate narrowly preserves P8.
- **How to apply:** Planner ships `axe-runner.mjs` (CI tool) + integrates into the release-gate script from D-74. Failure mode: hard block on the 15-fixture set, no soft-tolerance.

### GTM-07 rapid-response pivot triggers

**D-79 — Anthropic-Labs watcher trigger conditions explicit**

`GTM-07 rapid-response pivot plan` is documented during Wave A. Pivot triggers are explicit:
- **Severity 1 (interop pivot):** Anthropic Labs ships a tool with ≥3 of (Stage 2 sitemap generation, Stage 3 wireframe generation, Stage 4 state machine generation, Stage 5b DTCG token emission) AND ≥1 of (open-source under Apache-2.0 / MIT, DESIGN.md spec consumer, runs in Claude Code). Pivot: design-os repositions as "the bridge between Claude Design and DESIGN.md spec consumers" — interop-first messaging.
- **Severity 2 (no pivot needed):** Anthropic Labs ships a tool with only Stage 5b token emission (overlaps with GTM-03 marketplaces but not the spine). Continue as planned.
- **Severity 3 (out of scope):** Anthropic ships hi-fi-only generator (Claude Design current state). No change needed.

Watcher heartbeat already in place (GTM-06 ✓). Pivot trigger check runs weekly during Phase 4; bi-daily during Wave B launch window.

- **Why:** A vague "rapid-response plan" is operationally useless. Owner needs trigger conditions explicit so the pivot can be invoked without re-litigating "is this severe enough".
- **How to apply:** Planner ships `RAPID-RESPONSE.md` (extends the Phase 1 stub from 01-04) with these exact trigger conditions. Triggers reference the existing watcher signals (`.design-os/watcher/anthropic-labs-*.json`).

## Open Questions (for planner to resolve during plan-phase)

- **OQ-6:** PRD source mix for the 12 non-route-specific fixtures — handwritten by owner (~3-5), drawn from public PRD template galleries (~5-7), anonymized real-world examples (~2-4)? Planner allocates owner-write time against engineering tasks.
- **OQ-7:** anthropics/skills#1008 PR timing within Wave B — first action (signals "we built this for the spec") or last (signals "this is now battle-tested")? Probably first; planner confirms.
- **OQ-8:** Video production for GTM-02 — owner records, contracted, or AI-generated voiceover with manual screencap? Planner identifies dependencies and timeline.
- **OQ-9:** Brad Frost / Marty Cagan outreach format — email DM with PDF packet, Twitter DM with link, LinkedIn outreach? Owner preference + Brad Frost's preferred channel.
- **OQ-10:** Marketplace cross-post automation vs manual — 8 marketplaces × 5-10 fields each. Script it once or copy-paste? Planner ROI-checks.

## Deferred Ideas (post-GA / v2.1 / Phase 5)

- **Junie + Copilot host parity** — DIST-07 lists "Junie + Copilot" but those are scoped to v2.1 per CLAUDE.md tech stack ("design-os-bridges" companion). Phase 4 ships Claude Code + Codex + Cursor only.
- **15-fixture suite expansion to 30+** — only if v2.0 acceptance reveals coverage gaps. Not for v2.0 GA.
- **Live-LLM trigger eval in CI** — currently the trigger eval uses fixture prompts; live LLM trigger eval is more expensive and lands post-GA.
- **Bridges for Material Web / Vue / Svelte** — explicitly v2.1+ per MRD §3.15.
- **Notion / Linear / Google Doc PRD ingestion** — v2.1+ per MRD §4.
- **Multi-page URL crawl in reverse-engineer** — OQ-5 from Phase 3, capped at depth=1 for v2.0 GA.
- **Cross-AI peer review of release artifacts** — could use `/gsd-review --codex` on the release-gate harness, but not gating GA.
- **Cost discipline replan task if D-74 hard-gate hits** — would be a Phase 4 extension or v2.0.1 plan; not pre-planned.

## Scope Guardrails

**In scope:**
- 15-fixture acceptance suite, use-case-balanced (D-73)
- Adversarial CI: ACCEPT-02/03/04/05 with fixed 100-case corpora (D-76)
- Aggregate coexistence ≥0.80 release gate (TRIG-03) — uses Phase 1 harness
- Designer + PM blind reviews (ACCEPT-07/08) via owner network (D-71, D-75)
- axe-runner CI on 15-fixture outputs (D-78)
- Cost-discipline release gate, graduated (D-74)
- Cross-host parity: Claude Code (host-first) + Codex CLI + Cursor (DIST-05/06), sampled (D-77)
- Launch: 2-wave stealth-then-Frost (D-72)
- GTM-01..05/07 deliverables
- Rapid-response pivot plan with explicit triggers (D-79)
- Outreach packet (D-75)

**Out of scope (deferred):**
- See "Deferred Ideas" above

## Canonical Refs

- `.planning/PROJECT.md` — Project intent, R-series requirements (R11, R15, R22, R23, R24)
- `.planning/REQUIREMENTS.md` — 21 Phase 4 requirement IDs (ACCEPT-01..09, DIST-05/06/07, TRIG-03, COST-07/10, GTM-01..05/07)
- `.planning/ROADMAP.md` — Phase 4 entry + 5 Success Criteria (lines 31, ~Phase 4 details)
- `.planning/STATE.md` — Phase 3 status (`completed`, `completed_phases: 3`)
- `.planning/phases/01-v1-5-infrastructure-determinism-foundation/01-CONTEXT.md` — Phase 1 decisions (D-1..D-11+)
- `.planning/phases/02-v2-0a-skeleton-4-stages-end-to-end-lite-mode-stage-5a-5b/02-CONTEXT.md` — Phase 2 decisions
- `.planning/phases/03-v2-0b-full-5-stages-lovable-refugee-path/03-CONTEXT.md` — Phase 3 decisions D-54..D-70
- `.planning/phases/03-v2-0b-full-5-stages-lovable-refugee-path/03-VERIFICATION.md` — Phase 3 verifier output
- `skills/workflows/INVARIANTS.md` — 7 lessons-forward + gate-result contract (lessons 1-7)
- `assets/scripts/gates/base.mjs` — `GateResult` discriminated union (for any new gates this phase adds)
- `evals/fixtures/budget/` — existing budget fixtures (new-product-full, mature-app-refactor, ds-extraction, audit-all-stages, plus per-stage Phase 2 fixtures)
- `evals/coexistence/` — Phase 1 aggregate coexistence harness (release-gate reuse target)
- `evals/adversarial/` — existing adversarial fixtures from Phases 2-3 (inferred-disclaimer, fid-06-frost-recurrence, red-05, red-06) — templates for ACCEPT-02/03/04 100-case corpora
- `skills/design/SKILL.md` — v2.0b status; Phase 4 may update to `v2.0` status when GA ships
- `references/wodtke-ia.md`, `references/saffer-microinteractions.md`, etc. — reference corpus for GTM-01 post citation

## Code Context (from light scout)

**Reusable assets:**
- `assets/scripts/run-subagent.mjs` (with `tokenBudget` passthrough from 03-05) — release-gate harness will use this
- `evals/coexistence/run.mjs` (Phase 1) — release-gate eval driver
- `evals/triggers/*/triggers.yaml` (Phase 2 + 3) — coexistence eval inputs
- `assets/scripts/cli/audit.mjs` (Phase 2 + 3 extensions) — Phase 4 release-gate may call this
- `bin/design-os.mjs` — dispatcher; Phase 4 may add `node bin/design-os.mjs release-gate <subcmd>` or similar
- `evals/fixtures/budget/*.fixture.json` — extend with the 15 acceptance fixtures
- `.github/workflows/*.yml` — existing CI matrix; Phase 4 adds cross-host + release-gate workflows

**New files Phase 4 will create (rough list — planner refines):**
- `assets/scripts/release-gate.mjs` — orchestrates 15-fixture run + p50/p95 + axe-runner + coexistence eval
- `assets/scripts/cross-host-parity.mjs` — driver for sampled cross-host matrix (D-77)
- `assets/scripts/axe-runner.mjs` — accessibility CI (D-78)
- `evals/acceptance/*` — 15 PRD specs + expected-output snapshots
- `evals/adversarial/accept-{02,03,04,05}/cases/*.case.json` — 100-case corpora per criterion (D-76)
- `04-OUTREACH-PACKET.md` (in `.planning/phases/04-.../`) — recruitment + scoring packet (D-75)
- `RAPID-RESPONSE.md` — extended from Phase 1 stub with D-79 triggers
- `RELEASE-NOTES.md` — auto-written by release-gate when soft-tolerances trigger
- `.github/workflows/release-gate.yml` — CI workflow

**INVARIANTS.md compliance reminders (cumulative from Phases 2-3 codex catches):**
- Lesson 1: any new gate findings use `{checkId, status, evidence: string}`
- Lesson 2: any new CLI exports `{name, describe, builder, handler}` (verify via `node bin/design-os.mjs <cmd> --help`)
- Lesson 3: any new gate stages to `.design-os/preview/<run-id>/` and gates the staged path — no `--staged` flag
- Lesson 4: ajv-validate any parsed artifact
- Lesson 5: coverage by count AND identity, not globby ≥1
- Lesson 6: real CLI flag surfaces; verify before writing in docs
- Lesson 7: path-traversal containment via `path.resolve()` + sandbox compare

## Next steps

1. Run `/gsd-plan-phase 4` to produce `04-XX-PLAN.md` files. Planner should:
   - Split into Track E (engineering) and Track R (recruitment/launch) per D-71.
   - Track E waves: (Wave 1) Fixture corpus + adversarial seeds; (Wave 2) Release-gate harness + axe-runner + cross-host driver; (Wave 3) Coexistence eval wiring + RAPID-RESPONSE.md.
   - Track R waves: (Wave A) Outreach packet + private launch; (Wave B) Public launch + marketplaces + anthropics PR + outreach delivery.
2. Owner: verify Phase 2 SC-1 (live LLM run of `design --route new-feature` on Next 15 fixture) on a clean laptop BEFORE Phase 4 execution begins.
3. After Phase 4 execution + release-gate PASS: gsd-verifier confirms goal achievement, STATE marks Phase 4 complete, GA tag cuts.
