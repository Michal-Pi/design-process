---
phase: 04-v2-0-rc-ga-acceptance-cross-host-launch
plan: "04-04"
subsystem: gtm
tags: [outreach, rapid-response, maintainers, launch-post, wave-a]
dependency_graph:
  requires: [04-00, 04-01, 04-02, 04-03]
  provides: [reviewer-recruitment-packet, d79-triggers, maintainer-contact, gtm-01-draft]
  affects: [docs/RAPID-RESPONSE.md, docs/MAINTAINERS.md, docs/LAUNCH-POST-DRAFT.md]
tech_stack:
  added: []
  patterns: [markdown-content-docs, gtm-wave-a-private-outreach]
key_files:
  created:
    - .planning/phases/04-v2-0-rc-ga-acceptance-cross-host-launch/04-OUTREACH-PACKET.md
    - docs/LAUNCH-POST-DRAFT.md
  modified:
    - docs/RAPID-RESPONSE.md
    - docs/MAINTAINERS.md
decisions:
  - "OQ-7 resolved: anthropics/skills#1008 PR is the FIRST action in Wave B — establishes technical provenance before public post amplifies the claim"
  - "OQ-8 resolved: GTM-02 video is Wave B after 15-fixture suite passes; no contracted production"
  - "OQ-9 resolved: Brad Frost via Twitter DM (@brad_frost); Marty Cagan via LinkedIn with intellectual heritage framing"
  - "OQ-10 resolved: marketplace cross-post is manual for v2.0 GA (~90 min copy-paste vs 8h+ scripting)"
metrics:
  duration: ~30m
  completed_date: "2026-05-31"
  tasks: 2
  files: 4
---

# Phase 4 Plan 04: Track R Wave A — Outreach Packet + D-79 Triggers + MAINTAINERS + GTM-01 Draft

**One-liner:** Reviewer outreach packet (200-word message + Likert rubrics + NDA + tracker), D-79 Severity 1/2/3 trigger conditions prepended to RAPID-RESPONSE.md, MAINTAINERS.md owner contact filled, and Wave A GTM-01 launch post drafted (1,642 words, process framing, TRUST-04 enforced).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T1 | Outreach packet + RAPID-RESPONSE D-79 triggers + MAINTAINERS fill-in | f34a31b, 23ba7e5, 29fecf2 | 04-OUTREACH-PACKET.md, docs/RAPID-RESPONSE.md, docs/MAINTAINERS.md |
| T2 | GTM-01 launch post draft (Wave A) | 14432b1 | docs/LAUNCH-POST-DRAFT.md |
| T3 | Human checkpoint (Wave A approval) | PENDING — owner action required | — |

## Decisions Made

**OQ-7:** anthropics/skills#1008 PR is the first Wave B action — establishes technical provenance ("we built this for the DESIGN.md spec") before the public post amplifies the claim.

**OQ-8:** GTM-02 video is a Wave B owner-records deliverable after 15-fixture suite passes. Owner uses QuickTime or Loom. No AI-generated voiceover (TRUST-04).

**OQ-9:** Brad Frost outreach via Twitter DM (@brad_frost per his preferred public channel). Marty Cagan via LinkedIn DM with "intellectual heritage acknowledgment" framing — not endorsement request.

**OQ-10:** 8-marketplace cross-post is manual for v2.0 GA. Manual copy-paste from MARKETPLACE-MANIFEST.md costs ~90 minutes; scripting 8 different submission flows costs >8 hours. Manual wins.

## Deviations from Plan

None — plan executed exactly as written. The existing RAPID-RESPONSE.md structure was a clean Phase 1 stub, making the prepend straightforward. MAINTAINERS.md had three @TBD instances (primary, backup, copy reviewer) — all three replaced. The historical note referencing @TBD was also updated.

## Verification Results

| Check | Result |
|-------|--------|
| `04-OUTREACH-PACKET.md` exists | PASS |
| `grep -c "Severity 1\|Severity 2\|Severity 3" docs/RAPID-RESPONSE.md` | 4 (3 headers + 1 in D-79 section title) |
| `grep -c "@TBD" docs/MAINTAINERS.md` | 0 |
| `test -f docs/LAUNCH-POST-DRAFT.md` | PASS |
| `grep "DRAFT" docs/LAUNCH-POST-DRAFT.md` | PASS (first line) |
| Prohibited AI framing phrases | 0 (grep returns 0) |
| MAINTAINERS.md line count | 36 (≥10 spec met) |
| Launch post word count | 1,642 (within 1,200-1,800) |
| Recruitment message word count | 180 (within 180-220 spec) |
| Watcher signal source present | PASS (.complete-design/watcher/anthropic-labs-*.json) |
| Wave B marketplace list in launch post | 0 (no leakage) |
| Repo URL consistent across docs | PASS (https://github.com/Michal-Pi/design-process) |
| Owner email consistent | PASS (michal.pilawski@gmail.com in MAINTAINERS) |
| Test count in post (1,394) | PASS (not stale 999) |

## Recruitment Message Word Count

**180 words** — within the 180-220 acceptable range per D-75 spec.

## Launch Post Quality Check

- **Word count:** 1,642 (within 1,200-1,800)
- **DRAFT header:** Line 1 (`<!-- DRAFT — awaiting Brad Frost / Marty Cagan feedback before Wave B publication -->`)
- **TRUST-04 enforced:** Zero prohibited phrases ("AI-powered", "AI design tool", "AI-generated", "AI-driven", "revolutionary", "industry-disrupting")
- **Process framing used:** "SKILL.md package", "5-stage design process", "Garrett spine", "stage-gated", "evidence-graded"
- **Intellectual heritage citations (NOT endorsers):** Garrett §3.2 literal quote; Brad Frost Atomic Design 3× recurrence principle; Marty Cagan INSPIRED build-to-discover sequence
- **Concrete gate behaviors listed:**
  - Stage 1 hard-blocks VALIDATED grade on synthetic-only personas
  - Stage 5a returns `not_runnable, reason: stage-4-artifacts-absent` when interactions/ empty
  - Frost ≥3× recurrence enforced as gate finding in Stage 5b
  - 100/100 adversarial block rate on each of three adversarial corpora
- **Test count:** 1,394 (not 999)
- **Competitor framing:** Factual ("optimized for the demo moment; cost visible at month 3")
- **Wave B specifics:** NOT included (marketplace list, 8-platform cross-post — deferred to 04-05)

## Known Stubs

**04-OUTREACH-PACKET.md §Anonymized Sample Bundles:** Explicitly marked as PLACEHOLDER pending 15-fixture suite dry-run. This is intentional per Pitfall 6 (04-RESEARCH.md §Group G) and D-75 two-step design. Step (b) — attaching bundles — is Plan 04-05 scope.

## Threat Flags

No new threat surface introduced. All files are documentation/content. No new network endpoints, auth paths, or schema changes.

T-04-04-01 mitigation confirmed: launch post passes TRUST-04 check (grep returns 0 for all prohibited phrases).

## Awaiting at T3 Checkpoint

The following Wave A human actions are NOT taken by this plan (per the `autonomous: false` constraint and explicit mode=`--auto` instruction to take no external actions):

1. Make GitHub repo public (https://github.com/Michal-Pi/design-process)
2. Send Brad Frost DM via Twitter (@brad_frost) with repo link + `04-OUTREACH-PACKET.md` recruitment message
3. Send Marty Cagan LinkedIn DM (intellectual heritage framing per OQ-9)
4. Send recruitment message to 1-2 designer + PM contacts from owner's network

Plan 04-05 (Wave B) cannot execute until T3 is approved. Per D-72 stealth-then-Frost: Wave B blocks on Wave A completion.

## Self-Check: PASSED

Created files verified:
- `.planning/phases/04-v2-0-rc-ga-acceptance-cross-host-launch/04-OUTREACH-PACKET.md` — FOUND
- `docs/LAUNCH-POST-DRAFT.md` — FOUND
- `docs/RAPID-RESPONSE.md` — modified, Severity 1/2/3 present
- `docs/MAINTAINERS.md` — modified, @TBD count = 0

Commits verified in `git log --oneline`:
- f34a31b docs(04-04): create reviewer outreach packet per D-75
- 23ba7e5 docs(04-04): extend RAPID-RESPONSE.md with D-79 Severity 1/2/3 triggers
- 29fecf2 docs(04-04): fill in MAINTAINERS.md owner contact (was @TBD)
- 14432b1 docs(04-04): draft GTM-01 launch post Wave A version
