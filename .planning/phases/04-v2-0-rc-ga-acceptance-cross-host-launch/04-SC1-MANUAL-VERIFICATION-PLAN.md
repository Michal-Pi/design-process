---
artifact: manual-verification-plan
phase: 04
scope: Phase 2 SC-1 + Phase 3 SC-1 live LLM verification
prerequisite_for: Phase 4 execution
captured: 2026-05-26
estimated_duration: 60-90 minutes total
---

# SC-1 Manual Verification Plan — `design --route new-feature` on Next 15 fixture

This is the live-LLM acceptance check that was structurally deferred from Phases 2 and 3 to user manual verification on a **clean laptop** (one that has never run design-os before). The goal is to catch host-installation, trigger-discovery, and cold-start failures that the in-tree CI matrix cannot see (CI always runs with the repo already cloned, deps pre-installed, and the trigger corpus warm in vitest memory).

This plan supersedes any prior ad-hoc test instructions. Follow it sequentially. If a step diverges from "Expected", **stop and capture the divergence in `Notes`** at the bottom before continuing.

---

## Why a clean laptop

In-tree CI verifies:
- Tests pass against the in-tree code (`vitest`, `tsc --noEmit`, `lint:determinism`)
- Static gate correctness (the GateResult ajv schema, fixture inputs)
- Trigger eval against a known corpus

It does **not** verify:
- Skill-loader discovery by Claude Code / Codex CLI / Cursor in a real `~/.claude/skills/` (or equivalent) install
- That the `design-os` description+triggers actually fire when a user types real intent into a fresh chat
- Cost discipline in a real LLM call (vs. fixture token counts)
- Wall-clock behavior under realistic LLM latency (vs. CI mocked harness)

SC-1 is the gate that catches the gap between "tests green" and "a real user can actually use this".

---

## Inputs (what to bring)

1. **A clean laptop or VM.** Acceptance criteria:
   - macOS 14+ or Ubuntu 22.04+ or Windows 11 + WSL2
   - Node 22 LTS installed (`node --version` shows `v22.x`)
   - Git installed (`git --version`)
   - Claude Code CLI installed and authenticated to your Anthropic account
   - No prior `~/.claude/skills/design-os` install
   - At least 4 GB free disk (Playwright bundled Chromium is ~300 MB; node_modules ~600 MB; cache headroom)
   - Network access to GitHub, npm registry, api.anthropic.com

2. **The repository:** clone fresh from `https://github.com/Michal-Pi/design-process.git` (do NOT copy from the dev machine — that would defeat clean-laptop).

3. **The Next 15 fixture's PRD** — already in the repo at `evals/fixtures/e2e/next15-tailwind4-shadcn/PRD.md`. Use as-is; do not modify.

4. **A stopwatch / timer** (your phone is fine). Wall-clock is one of the measured outputs.

5. **Anthropic API budget headroom of ~250k tokens** (the p95 ceiling per COST-07). Verify your account has at least that much credit/budget available before starting.

---

## Test plan (4 phases, ~75 minutes total)

### Phase A — Install (~10 minutes)

1. On the clean laptop, clone the repo into a working directory:
   ```bash
   git clone https://github.com/Michal-Pi/design-process.git
   cd design-process
   ```

2. Install dependencies (verify Node 22):
   ```bash
   node --version  # Must show v22.x
   npm ci
   ```
   **Expected:** Install completes in 30-90 seconds. No `peer dep` errors that aren't already noted in the README. `playwright install --with-deps chromium` may auto-run during postinstall.

3. Run the in-tree determinism + lint check to confirm a sound install:
   ```bash
   npx tsc --noEmit
   npm run lint:determinism
   npm test -- --reporter=dot 2>&1 | tail -10
   ```
   **Expected:**
   - `tsc --noEmit` exits 0 with no output.
   - `lint:determinism` reports CLEAN.
   - `npm test` reports ~999 passing, 1-2 pre-existing failures in `tests/gates/stage-2-latch.test.ts` (intermittent timeout flake — acceptable, do NOT debug).

4. Install design-os as a Claude Code skill (the user-facing install path that v2.0 GA users will use):
   ```bash
   # From the repo root:
   mkdir -p ~/.claude/skills
   cp -R skills/design ~/.claude/skills/design-os
   # OR if there's an install script:
   ./bin/design-os.mjs install --target ~/.claude/skills 2>&1 | tail
   ```
   **Expected:** `~/.claude/skills/design-os/SKILL.md` exists; description starts with the v2.0b status line and is ≤200 characters. No errors.

5. Restart Claude Code (close the terminal, open a new one, run `claude`). Confirm the skill is loaded:
   ```bash
   # In the new claude session:
   /help
   ```
   **Expected:** The available-skills list shows `design-os` (or equivalent). If it doesn't, the skill loader didn't pick up the install — **STOP** and capture this as the first divergence; do not work around it.

---

### Phase B — Cold-start trigger discovery (~5 minutes)

The point of this phase is to verify the `description` + `triggers.yaml` for `design-os` and the `design` workflow actually fire on a realistic user intent. **Do not** invoke `/design-os` or `node bin/design-os.mjs` directly — that bypasses the trigger surface.

1. Start a new Claude Code session (no prior context):
   ```bash
   claude
   ```

2. Type a realistic user prompt (paste exactly):
   ```
   I want to add a "real-time collaborative editing" feature to my existing
   Next.js + Tailwind v4 + shadcn task-management app. Walk me through the
   design process from sitemap to tokens before I write code.
   ```

3. **Expected:** Claude should invoke the `design` skill (it should appear in the response trace as a Skill tool invocation, or Claude should announce something like "Using design to walk through the 5-stage process for your new feature"). The `design --route new-feature` route should be selected automatically based on stack detection (Next + Tailwind + shadcn existing app + new feature scope).

   **If Claude does NOT invoke the skill** (e.g., it answers with generic design advice instead, or it asks "do you want me to use design-os?"), the trigger description is too weak to fire on real intent — capture this divergence; this is exactly the kind of gap SC-1 exists to catch.

---

### Phase C — Full new-feature run (~50 minutes, ≤8 min p50 wall-clock target per COST-10)

This phase runs the actual `design --route new-feature` workflow end-to-end against the Next 15 fixture. The clean-laptop wall-clock is the measured value.

1. Still in the same Claude Code session (so the trigger already fired in Phase B), provide context:
   ```
   The app lives at evals/fixtures/e2e/next15-tailwind4-shadcn in this repo.
   The existing PRD is at evals/fixtures/e2e/next15-tailwind4-shadcn/PRD.md
   (TaskFlow — team task management). The new feature is real-time
   collaborative task editing: two users editing the same task description
   simultaneously, with cursor presence, optimistic UI, conflict resolution.
   ```

2. **Start your stopwatch.** Allow Claude to drive the full route. Do NOT interrupt unless one of these happens:
   - Claude asks for a missing input the PRD already contains (this is a regression worth capturing — do not feed it, instead capture "Claude re-asked for X").
   - Claude tries to write outside the working directory (security violation — STOP and capture).
   - Claude exits with a hard error.

3. Throughout the run, Claude should pass through these stages (visible in its narration):
   - **Stage 2 (structure):** Updated `sitemap.json` with new route(s) for the collaborative-edit surface; a Mermaid flowchart for the editing flow.
   - **Stage 4 (interact):** A `.spec.md` for the collaborative editor screen describing states (idle, joining, editing-active, conflict-detected, recovering, offline), transitions, microinteractions; a Mermaid `stateDiagram-v2` per D-58.
   - **Stage 5a (style-lite):** Updated `tokens.json` and/or screenshots / Playwright fixture references for the new screen. (Because `new-feature` route's `requiredStages` per `assets/scripts/routing/registry.mjs` are `[2, 4, 5a]` and `1` is skipped-with-warning.)

4. **Stop the stopwatch** when Claude announces the workflow is complete (or after 25 minutes — whichever comes first; over-25min is a hard p95 miss).

5. Inspect the outputs:
   ```bash
   # In a second terminal, still in the repo root:
   git status
   git diff --stat
   ls -R evals/fixtures/e2e/next15-tailwind4-shadcn/design/
   # Or wherever design-os wrote outputs (it MUST be a diff, not auto-applied,
   # per the trust posture — diff-by-default, --apply required).
   ```

   **Expected:**
   - Output went to `.design-os/preview/<run-id>/` at the repo root (the staged-preview path per Phase 3 lesson 3), NOT directly into `design/`.
   - The diff includes: `ia/sitemap.json` updates, `flows/<new-feature>.mmd`, `interactions/<screen>.spec.md`, `interactions/<screen>.diagram.mmd`, `wireframes/<screen>/CHOICE.md` (probably), `tokens.json` updates if any new component-tier tokens emerged.
   - No DESIGN.md regeneration (that's Stage 5b, which is NOT in the `new-feature` required stages).

6. Run the relevant gates against the staged output to confirm pass:
   ```bash
   # Replace <run-id> with the actual subdirectory name from `ls .design-os/preview/`:
   node bin/design-os.mjs gate --stage 2 --design-dir ".design-os/preview/<run-id>" 2>&1 | tail -5
   node bin/design-os.mjs gate --stage 4 --design-dir ".design-os/preview/<run-id>" 2>&1 | tail -5
   node bin/design-os.mjs gate --stage 5a --design-dir ".design-os/preview/<run-id>" 2>&1 | tail -5
   ```

   **Expected:** Each command exits 0 with a `pass` or `pass_with_warnings` GateResult. If any returns `failed_after_repair` or `not_runnable`, the workflow output is incomplete or invalid — capture which stage and the finding.

---

### Phase D — Apply + token accounting (~10 minutes)

1. If Phase C looked good, simulate the user accepting the design:
   ```bash
   node bin/design-os.mjs apply --design-dir ".design-os/preview/<run-id>" 2>&1 | tail
   ```
   **Expected:** Artifacts move into `evals/fixtures/e2e/next15-tailwind4-shadcn/design/` (or wherever the project root design dir is). No errors.

2. Token + wall-clock accounting:
   - **Wall-clock measured:** ___ minutes (from your stopwatch)
   - **Wall-clock p50 target (COST-10):** ≤ 8 minutes
   - **Wall-clock p95 soft tolerance (D-74):** ≤ 10.4 minutes (8 × 1.3)

   In your Claude Code session, ask:
   ```
   What was the total token usage for this design --route new-feature run?
   Itemize by stage if you can.
   ```

   **Expected:** Total ≤ 60k tokens (the `new-feature` route's `budgetTokensP50` per registry.mjs). If between 60k and 78k (60k × 1.3) it's within p95 soft tolerance per D-74. Above 78k → cost-discipline finding.

3. Optional but recommended — run the audit retrospective against the applied output:
   ```bash
   node bin/design-os.mjs audit --all-stages --design-dir "evals/fixtures/e2e/next15-tailwind4-shadcn/design"
   ```

   **Expected:** Audit completes cleanly; any findings are MEDIUM/LOW severity (none should be BLOCKER on a route that just shipped).

---

## Pass criteria (SC-1 satisfied)

All of these must be true:

- [ ] Skill discovers in a fresh `~/.claude/skills/` install (Phase A step 5)
- [ ] Skill fires on realistic user intent without explicit `/design-os` invocation (Phase B step 3)
- [ ] `design --route new-feature` runs to completion (Phase C step 4)
- [ ] Output lands in `.design-os/preview/<run-id>/`, not directly into `design/` (Phase C step 5)
- [ ] Stages 2, 4, 5a gates all return pass or pass_with_warnings (Phase C step 6)
- [ ] `apply` succeeds and lands artifacts cleanly (Phase D step 1)
- [ ] Total token usage ≤ 60k (hard p50) or ≤ 78k (soft p95 per D-74); wall-clock ≤ 8 min hard or ≤ 10.4 min soft (Phase D step 2)
- [ ] No security violations (writes outside working dir, secrets in logs, etc.)

If any check fails, capture in **Notes** below. Phase 4 execution can begin if **all** checks pass; otherwise plan-phase 4 may still proceed (planning isn't gated on SC-1) but Phase 4 plans should explicitly address the failed check before the corresponding plan executes.

---

## Notes (fill in during the run)

```
Wall-clock: ___ minutes
Total tokens: ___ k
Trigger fired automatically? Y / N
Output went to .design-os/preview/? Y / N
Stage 2 gate result: ___
Stage 4 gate result: ___
Stage 5a gate result: ___
Apply succeeded? Y / N
Audit blockers? Y / N (if Y, list checkIds)

Divergences from Expected (one per line):
-
-
-

Overall verdict: PASS / PASS-WITH-NOTES / FAIL
```

---

## After verification

- **PASS:** Tell the engineer (me) and we proceed with Phase 4 execution.
- **PASS-WITH-NOTES:** Share the notes; Phase 4 plans will fold in any drift before execution.
- **FAIL:** Phase 4 planning continues (so we're ready), but Phase 4 execution waits for a fix-pass on whatever failed. Likely candidates: trigger description tuning (Phase B Step 3 failure), staged-path regression (Phase C Step 5 failure), cost overrun (Phase D Step 2 failure).
