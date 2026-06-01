# TRIG-04 Contingency: complete-design-core / complete-design-atoms Split

**Status:** Contingency document — do NOT execute unless trigger criteria are met.
**Owner:** Named maintainer in MAINTAINERS.md (weekly Anthropic-Labs watcher per D-30).
**Created:** 2026-05-25 (Plan 03)
**Last Updated:** 2026-05-25

---

## Overview

The TRIG-04 contingency is the fallback plan if aggregate coexistence recall falls below
≥0.80 after 2 rounds of trigger-corpus tuning. It splits the single `complete-design` package
into two separately-published packages:

- **`complete-design-core`**: the 5 primary workflow skills (design, audit, handoff, + 2 TBD)
- **`complete-design-atoms`**: the 15+ stage-specific atom skills shipping in Phase 2+

This reduces the trigger metadata footprint per package, staying safely below the
Codex 2% trigger-metadata cap (Pitfall 9: ~5k chars threshold per skill package).

---

## Trigger Criteria

Execute this split if **ALL** of the following conditions are met:

1. **Aggregate coexistence eval** (`npm run eval:coexistence`) reports `recall < 0.80`
   in the `evals/coexistence/last-run.json` output.

2. **Two rounds of trigger-corpus tuning** have been attempted:
   - Round 1: tuned trigger keywords in `evals/coexistence/triggers/complete-design.yaml`
     and re-ran the eval.
   - Round 2: tuned per-skill `evals/triggers/{design,audit,handoff}/triggers.yaml`
     and re-ran the eval.

3. **Root-cause diagnosis** confirms the recall failure is due to trigger budget
   exhaustion (≥5k chars in the aggregate skill description metadata), NOT a
   keyword-overlap issue addressable by trigger tuning.

**Decision authority:** The named maintainer in MAINTAINERS.md makes the final call.
No unilateral split without the maintainer's explicit sign-off.

---

## Mechanical Split Procedure

### Step 1: Create complete-design-core package

```bash
# Create a new package directory (sibling to complete-design repo)
mkdir complete-design-core
cd complete-design-core
npm init -y

# Copy core skills only
cp -r ../complete-design/skills/design ./skills/design
cp -r ../complete-design/skills/audit ./skills/audit
cp -r ../complete-design/skills/handoff ./skills/handoff
```

**`complete-design-core` SKILL.md frontmatter:**

```yaml
---
name: complete-design-core
description: >
  5-stage design process core skills: research, IA, wireframes, interactions,
  hi-fi. Stage-gated workflows. Excludes atom skills — see complete-design-atoms.
compatibility: [claude-code, codex-cli, cursor]
---
```

**Trigger budget:** ≤2.5k chars in description across all core skills.

### Step 2: Create complete-design-atoms package

```bash
# Create atoms package directory
mkdir complete-design-atoms
cd complete-design-atoms
npm init -y

# Copy atom skills only (Phase 2+ skills)
# 15 atom skills TBD in Phase 2 planning
```

**`complete-design-atoms` SKILL.md frontmatter:**

```yaml
---
name: complete-design-atoms
description: >
  complete-design atom skills: individual stage commands for research, IA, wireframes,
  interactions, hi-fi. Install alongside complete-design-core for full workflow.
compatibility: [claude-code, codex-cli, cursor]
---
```

**Trigger budget:** ≤2.5k chars in description across all atom skills.

### Step 3: Update package.json publish targets

Both packages are published to npm independently:

```json
{
  "name": "complete-design-core",
  "version": "2.0.0",
  "peerDependencies": {
    "complete-design-atoms": "^2.0"
  }
}
```

### Step 4: Update agentskills.io v1 frontmatter

Each package gets its own SKILL.md with separated `description` fields.
Total chars across both packages: ≤5k (stays within the Codex 2% cap).

---

## Trigger Budget Recalculation

After the split, the trigger budget is distributed:

| Package | Max description chars | Max total trigger chars |
|---------|----------------------|------------------------|
| complete-design-core | ≤2,500 | ≤2,500 |
| complete-design-atoms | ≤2,500 | ≤2,500 |
| **Total** | **≤5,000** | **≤5,000** |

This preserves the combined budget of a single complete-design package (≤5k chars per
the Codex 2% cap) while halving the per-package trigger footprint, giving each
package room to add trigger keywords without competing for the shared budget.

---

## Skills Allocation

| Skill | Package | Rationale |
|-------|---------|-----------|
| `design` | core | Primary entry point; highest-traffic skill |
| `audit` | core | Standalone value — Lovable refugee use case |
| `handoff` | core | Required for multi-stage workflows |
| All Phase 2 atoms (15+) | atoms | Lower individual traffic; grouped for budget |

---

## rollback Plan

If the split reduces recall further (expected if trigger-budget was not the root cause):

1. Revert to the monorepo package.
2. Investigate trigger keywords directly.
3. File an Open Q3 issue with empirical data showing the root cause.

---

## References

- `evals/coexistence/last-run.json` — current aggregate recall number
- `evals/coexistence/aggregate-eval.mjs` — harness that produces last-run.json
- `evals/coexistence/triggers/complete-design.yaml` — the corpus that informs the recall measurement
- `.github/workflows/aggregate-coexistence.yml` — CI that runs the eval weekly
- `REQUIREMENTS.md` — TRIG-04 requirement: contingency lever documented in Plan 03
- `CONTEXT.md` D-15, D-16 — coexistence eval methodology

---

*This document was generated by Plan 03 execution (Phase 1, v1.5 Infrastructure & Determinism Foundation).*
*It documents the contingency lever — it does NOT execute the split.*
*The split fires only if the empirics from the aggregate coexistence eval show recall <0.80 after 2 rounds of tuning.*
