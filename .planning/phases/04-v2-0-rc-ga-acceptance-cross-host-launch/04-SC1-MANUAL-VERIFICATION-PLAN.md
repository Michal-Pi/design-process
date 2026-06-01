---
artifact: manual-verification-plan
phase: 04
scope: Phase 2 SC-1 + Phase 3 SC-1 live LLM verification — via npm @beta install path (D-80)
prerequisite_for: npm @latest dist-tag flip + Wave A approval (04-04 T3) + Wave B execution (04-05 T2)
captured: 2026-05-26
revised: 2026-06-01 (rewritten around npm @beta install per Plan 04-00 T5 + D-80)
estimated_duration: 65-80 minutes total
---

# SC-1 Manual Verification Plan — `design --route new-feature` on Next 15 fixture, via npm @beta install

This is the live-LLM acceptance check that was structurally deferred from Phases 2 and 3 to user manual verification on a **clean laptop** (one that has never run design-os before). The goal is to catch host-installation, trigger-discovery, and cold-start failures that the in-tree CI matrix cannot see (CI always runs with the repo already cloned, deps pre-installed, and the trigger corpus warm in vitest memory).

Per **D-80**, this plan exercises the canonical install path that real users will hit at GA: `npm i -g design-os@beta && design-os install`. **It also exercises the deferred `${CLAUDE_SKILL_DIR}` path-resolution validation** that the Plan 04-00 fix-pass introduced — confirming that SKILL.md's `${CLAUDE_SKILL_DIR}/workflows/…` and `${CLAUDE_SKILL_DIR}/references/…` references actually resolve when the skill is loaded under `~/.claude/skills/`.

This plan supersedes any prior ad-hoc test instructions. Follow it sequentially. If a step diverges from "Expected", **stop and capture the divergence in `Notes`** at the bottom before continuing.

---

## Why a clean laptop

In-tree CI verifies:
- Tests pass against the in-tree code (`vitest`, `tsc --noEmit`, `lint:determinism`)
- Static gate correctness (the GateResult ajv schema, fixture inputs)
- Trigger eval against a known corpus

It does **not** verify:
- The published npm tarball installs cleanly on a host the dev never touched
- Skill-loader discovery by Claude Code / Codex CLI / Cursor in a real `~/.claude/skills/` install
- `${CLAUDE_SKILL_DIR}` substitution working in the workflow + reference files at runtime
- That the `design-os` description+triggers actually fire when a user types real intent into a fresh chat
- Cost discipline in a real LLM call (vs. fixture token counts)
- Wall-clock behavior under realistic LLM latency (vs. CI mocked harness)

SC-1 is the gate that catches the gap between "tests green" and "a real user can actually use this". **The npm @beta install path is what real users will hit at GA**, so SC-1 validates the install before owner promotes to `@latest`.

---

## Inputs (what to bring)

1. **A clean laptop or VM.** Acceptance criteria:
   - macOS 14+ or Ubuntu 22.04+ or Windows 11 + WSL2
   - Node 22 LTS installed (`node --version` shows `v22.x`)
   - Claude Code CLI installed and authenticated to your Anthropic account
   - No prior `~/.claude/skills/design-os` install (if you have one, back it up: `mv ~/.claude/skills/design-os ~/.claude/skills/design-os.pre-sc1-backup`)
   - At least 1 GB free disk (the published tarball is ~220 kB; node_modules ~500 MB for the global install; cache headroom)
   - Network access to npmjs.org and api.anthropic.com (NOT github.com — npm flow doesn't need git)

2. **npm credentials are NOT needed** for this verification — we're only consuming the public `@beta` tag, not publishing.

3. **A stopwatch / timer** (your phone is fine). Wall-clock is one of the measured outputs.

4. **Anthropic API budget headroom of ~250k tokens** (the p95 ceiling per COST-07). Verify your account has at least that much credit/budget available before starting.

---

## Test plan (4 phases, ~70 minutes total)

### Phase A — Install via npm @beta (~5 minutes)

1. On the clean laptop, verify Node version (no git clone required — the working directory can be anywhere you like):
   ```bash
   node --version  # Must show v22.x
   mkdir -p /tmp/sc1-run-$(date +%Y%m%d)
   cd /tmp/sc1-run-$(date +%Y%m%d)
   ```

2. Install design-os globally from the `@beta` dist-tag:
   ```bash
   npm i -g design-os@beta
   ```
   **Expected:** Install completes in 30-60 seconds. The package is small (~220 kB tarball, 156 files); npm fetches deps; no build step (skills are pre-bundled). No `peer dep` errors.

3. Verify the bin:
   ```bash
   design-os --version
   ```
   **Expected:** Output is `2.0.0-beta.0`.

4. Run the install subcommand to copy the SKILL.md package into your Claude Code skills directory:
   ```bash
   design-os install
   ```
   **Expected output:**
   ```
   Installed design-os skill to: <home>/.claude/skills/design-os

   Restart your Claude Code session (or run /reload-skills if available) to pick up the new skill.
   ```

5. Verify the bundled layout (P1 fix from Plan 04-00 — the install copies more than just SKILL.md):
   ```bash
   ls ~/.claude/skills/design-os/
   ```
   **Expected:** Shows `SKILL.md`, `workflows/`, `atoms/`, `audit/`, `handoff/`, `references/`. If only `SKILL.md` is present without the supporting dirs, the install command shipped without the Plan 04-00 fix — **STOP** and capture.

6. **${CLAUDE_SKILL_DIR} substitution probe** (the deferred Plan 04-00 architectural validation):

   Restart Claude Code (close the terminal, open a new one, `cd /tmp/sc1-run-…`, run `claude`). In the new session, paste this exact prompt:

   > I'm testing a SKILL.md package called `design-os`. Please run these 4 checks and report each one as PASS or FAIL with a one-line note:
   >
   > 1. Is the `design` skill listed in your available skills? (`/help` or skill discovery — whatever surfaces them)
   > 2. Read the file `${CLAUDE_SKILL_DIR}/workflows/discover.md` from the design-os skill. Did the Read succeed and return real content?
   > 3. The file `discover.md` references other files via paths like `${CLAUDE_SKILL_DIR}/references/...`. Pick the first such reference inside `discover.md` and Read it. Did THAT Read succeed?
   > 4. Briefly: did the `${CLAUDE_SKILL_DIR}` substitution resolve correctly in both reads, or did you have to manually substitute the path?

   **Expected outcomes (capture below in Notes; this is the architectural gate):**
   - **All 4 PASS** → substitution carries through across files; proceed to Phase B + onward; this unblocks the @latest dist-tag flip.
   - **1+2 PASS, 3+4 FAIL** → substitution is SKILL.md-only; the workflow + atom files would need to switch to a different ref strategy (relative paths or inlined content). **STOP** Phase 4 progression here and report.
   - **1 PASS but 2 FAIL** → substitution doesn't work even from SKILL.md; the whole reference architecture needs rethinking. **STOP** and report.

---

### Phase B — Cold-start trigger discovery (~5 minutes)

The point of this phase is to verify the `description` + `triggers.yaml` for `design-os` and the `design` workflow actually fire on a realistic user intent. **Do not** invoke `/design-os` or `design-os` directly — that bypasses the trigger surface.

1. Open a fresh Claude Code session if you haven't already (you can reuse the session from Phase A step 6 if it's still alive). Your working dir can be anywhere — `~/.claude/skills/` is what Claude Code reads from, not your `cwd`. For this verification, an empty tmp dir is fine:
   ```bash
   cd /tmp/sc1-run-$(date +%Y%m%d)
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

This phase runs the actual `design --route new-feature` workflow end-to-end. The clean-laptop wall-clock is the measured value.

1. Still in the same Claude Code session (so the trigger already fired in Phase B), provide context. **Note:** the canonical TaskFlow PRD that fixture-01 of the acceptance corpus references lives inside the published npm package at `node_modules/-g/design-os/evals/.../PRD.md` (or wherever npm installed it). For SC-1, **paraphrase the TaskFlow context inline** in your prompt rather than fishing for the file:

   ```
   The app is "TaskFlow" — a B2B SaaS team task management tool built on
   Next.js 15 + Tailwind v4 + shadcn/ui. Existing surfaces: dashboard,
   project list, task detail, settings. Existing roles: project owner,
   project member.

   The new feature is real-time collaborative task editing: two users
   editing the same task description simultaneously, with cursor presence,
   optimistic UI, conflict resolution.

   Please run design --route new-feature and produce the stage-2/4/5a
   artifacts in a staged preview directory I can review before applying.
   ```

2. **Start your stopwatch.** Allow Claude to drive the full route. Do NOT interrupt unless one of these happens:
   - Claude asks for a missing input the prompt already contains (regression worth capturing — do not feed it, instead capture "Claude re-asked for X").
   - Claude tries to write outside your working directory (security violation — STOP and capture).
   - Claude exits with a hard error.

3. Throughout the run, Claude should pass through these stages (visible in its narration):
   - **Stage 2 (structure):** Updated `sitemap.json` with new route(s) for the collaborative-edit surface; a Mermaid flowchart for the editing flow.
   - **Stage 4 (interact):** A `.spec.md` for the collaborative editor screen describing states (idle, joining, editing-active, conflict-detected, recovering, offline), transitions, microinteractions; a Mermaid `stateDiagram-v2` per D-58.
   - **Stage 5a (style-lite):** Updated `tokens.json` and/or screenshots / Playwright fixture references for the new screen. (Because the `new-feature` route's `requiredStages` are `[2, 4, 5a]`; Stage 1 is skipped-with-warning.)

4. **Stop the stopwatch** when Claude announces the workflow is complete (or after 25 minutes — whichever comes first; over-25min is a hard p95 miss).

5. Inspect the outputs:
   ```bash
   # In a second terminal:
   cd /tmp/sc1-run-$(date +%Y%m%d)
   ls -R .design-os/preview/
   # Or wherever design-os wrote outputs (it MUST be a staged preview, not
   # auto-applied, per the trust posture — diff-by-default, --apply required).
   ```

   **Expected:**
   - Output went to `<cwd>/.design-os/preview/<run-id>/` (the staged-preview path per Phase 3 lesson 3), NOT directly into a `design/` directory.
   - The staged tree includes: `ia/sitemap.json` updates, `flows/<new-feature>.mmd`, `interactions/<screen>.spec.md`, `interactions/<screen>.diagram.mmd`, `wireframes/<screen>/CHOICE.md` (probably), `tokens.json` updates if any new component-tier tokens emerged.
   - No DESIGN.md regeneration (that's Stage 5b, which is NOT in the `new-feature` required stages).

6. Run the relevant gates against the staged output to confirm pass:
   ```bash
   # Replace <run-id> with the actual subdirectory name from `ls .design-os/preview/`:
   design-os gate --stage 2 --design-dir ".design-os/preview/<run-id>" 2>&1 | tail -5
   design-os gate --stage 4 --design-dir ".design-os/preview/<run-id>" 2>&1 | tail -5
   design-os gate --stage 5a --design-dir ".design-os/preview/<run-id>" 2>&1 | tail -5
   ```

   **Expected:** Each command exits 0 with a `pass` or `pass_with_warnings` GateResult. If any returns `failed_after_repair` or `not_runnable`, the workflow output is incomplete or invalid — capture which stage and the finding.

---

### Phase D — Apply + token accounting (~10 minutes)

1. If Phase C looked good, simulate the user accepting the design:
   ```bash
   design-os apply --design-dir ".design-os/preview/<run-id>" 2>&1 | tail
   ```
   **Expected:** Artifacts move into `<cwd>/design/` (or wherever the apply target resolves to). No errors.

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
   design-os audit --all-stages --design-dir "./design"
   ```

   **Expected:** Audit completes cleanly; any findings are MEDIUM/LOW severity (none should be BLOCKER on a route that just shipped).

---

## Pass criteria (SC-1 satisfied)

All of these must be true:

- [ ] `npm i -g design-os@beta` completes cleanly on the clean laptop (Phase A step 2)
- [ ] `design-os --version` returns `2.0.0-beta.0` from the installed bin (Phase A step 3)
- [ ] `design-os install` copies the bundled SKILL.md package (with workflows/, atoms/, audit/, handoff/, references/) to `~/.claude/skills/design-os/` (Phase A step 5)
- [ ] **${CLAUDE_SKILL_DIR} substitution probe: all 4 checks PASS** (Phase A step 6 — the architectural gate that blocks @latest dist-tag flip)
- [ ] Skill fires on realistic user intent without explicit `design-os` invocation (Phase B step 3)
- [ ] `design --route new-feature` runs to completion (Phase C step 4)
- [ ] Output lands in `.design-os/preview/<run-id>/`, not directly into `design/` (Phase C step 5)
- [ ] Stages 2, 4, 5a gates all return pass or pass_with_warnings (Phase C step 6)
- [ ] `apply` succeeds and lands artifacts cleanly (Phase D step 1)
- [ ] Total token usage ≤ 60k (hard p50) or ≤ 78k (soft p95 per D-74); wall-clock ≤ 8 min hard or ≤ 10.4 min soft (Phase D step 2)
- [ ] No security violations (writes outside working dir, secrets in logs, etc.)

If any check fails, capture in **Notes** below. If **${CLAUDE_SKILL_DIR}** probe fails on items 3+4 (substitution doesn't carry to non-SKILL.md files), the @latest dist-tag flip is blocked until the workflow/atom files are restructured.

---

## Notes (fill in during the run)

```
npm install completed cleanly: Y / N (time: __ seconds)
design-os install completed cleanly: Y / N
Time from `npm i -g` to /help showing the skill: ___ minutes (target: <5)

${CLAUDE_SKILL_DIR} substitution probe (Phase A step 6):
  Check 1 (skill listed): PASS / FAIL  ___
  Check 2 (workflow read): PASS / FAIL  ___
  Check 3 (workflow→reference read): PASS / FAIL  ___
  Check 4 (substitution worked automatically): PASS / FAIL  ___

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

- **PASS:** Proceed with `npm dist-tag add design-os@2.0.0 latest` (Plan 04-05 Step 0) → Wave A approval (04-04 T3) → Wave B execution (04-05 T2) → Phase 4 verifier → tag v2.0.0.
- **PASS-WITH-NOTES:** Share the notes. Minor drift (e.g., wall-clock 9 min instead of 8) is within D-74 soft tolerance and is documented in CHANGELOG; proceed but record.
- **FAIL — especially ${CLAUDE_SKILL_DIR} check 3+4 fail:** The @latest dist-tag flip is blocked. Likely fix-pass: rewrite workflow + atom file refs to use relative paths from each file's location (not `${CLAUDE_SKILL_DIR}/…`), or inline the referenced content where possible. Spin a new plan 04-00b or hotfix.
- **FAIL — Phase B trigger doesn't fire:** SKILL.md description tuning; iterate the description text before re-publishing a `2.0.0-beta.1`.
- **FAIL — Phase C run exits with hard error:** Real bug. Reproduce, file an issue, fix before @latest flip.
- **FAIL — cost overrun:** Expected at beta stage; document but do not block the @latest flip.
