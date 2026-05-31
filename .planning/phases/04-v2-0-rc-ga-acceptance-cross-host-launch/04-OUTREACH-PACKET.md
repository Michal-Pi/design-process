# design-os v2.0 — Reviewer Outreach Packet

Prepared: 2026-05-31 | Confidential — reviewer eyes only

---

## Recruitment Message (200 words, ready to send)

[Personalized intro slot]

I'm the author of design-os — an open-source SKILL.md package that scaffolds the full Garrett 5-stage design process inside Claude Code (the coding agent). It generates research personas, IA sitemaps, Excalidraw wireframes, Mermaid state diagrams, and W3C DTCG design tokens — with stage validation gates between each stage, so the AI doesn't jump straight to hi-fi.

I'm looking for [designers / product managers] who can give me 60-90 minutes of honest feedback on the outputs. This is a blind review — you'll see the generated DESIGN.md and tokens from a realistic PRD, without knowing which AI created it.

Your feedback will be used to verify the package meets a professional bar: "does this look like proper design process, or like an AI shortcut?" I'll share the full release notes and give you early access to the package as thanks.

No publication of your name or company. The review is governed by the NDA below (CC-licensed, no exclusivity, expires at GA ship date).

Reply to accept a review slot. I'll send 3 anonymized DESIGN.md + tokens.json bundles and the scoring rubric.

---

## Scoring Rubric — Designer (5-point Likert)

**Primary question:**
"This output looks like what doing design properly looks like — not like a Lovable/v0 shortcut."

| Score | Label |
|-------|-------|
| 1 | Strongly disagree |
| 2 | Disagree |
| 3 | Neutral |
| 4 | Agree |
| 5 | Strongly agree |

**Three free-form prompts:**

1. What stage of the design process does this output feel like it's at? What's missing?
2. If you received this from an AI collaborator, would you feel comfortable building on it for a real project? Why or why not?
3. What one thing would you change to make this more useful in your actual workflow?

---

## Scoring Rubric — PM (5-point Likert)

**Primary question:**
"These artifacts are something I'd actually share with an engineering team to scope and build from."

| Score | Label |
|-------|-------|
| 1 | Strongly disagree |
| 2 | Disagree |
| 3 | Neutral |
| 4 | Agree |
| 5 | Strongly agree |

**Three free-form prompts:**

1. Does the PRD-to-DESIGN.md pipeline produce the level of detail you'd want before handing off to engineering?
2. What's missing from these outputs that would make them complete enough to drive a real sprint?
3. How does this compare to the design documentation you typically receive before an engineering kickoff?

---

## Lightweight NDA Template (CC BY 4.0, no exclusivity)

**design-os v2.0 Reviewer Confidentiality Agreement**

By accepting a review assignment, you agree to:

1. Keep the provided DESIGN.md + tokens.json bundles confidential until the public launch date.
2. Not use the design artifacts as inspiration for client work without permission.
3. This agreement does not restrict your general skills, methods, or knowledge gained from reviewing.
4. The agreement expires automatically 30 days after the public launch date.

You do **NOT** agree to: exclusivity of any kind, non-compete provisions, or restrictions on future work.

This is a lightweight, good-faith agreement — not a legally-binding commercial NDA. Both parties understand its informal nature.

Licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — owner may adapt this template.

---

## Reviewer Tracking

Track `n_designers` and `n_pms` progress toward n≥5 each. GA ships only when both thresholds are met OR owner documents explicit override in CHANGELOG.

| Reviewer | Role | Recruited Date | Bundle Sent | Score (1–5) | Status |
|----------|------|----------------|-------------|-------------|--------|
| [Add when recruited] | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

**Threshold:** 5 designers AND 5 PMs required before GA (ACCEPT-07 / ACCEPT-08).

---

## Anonymized Sample Bundles (3 of 15 acceptance fixtures)

**[PLACEHOLDER — to be attached after 15-fixture suite dry-run passes. Do not attach before the suite completes its first clean run.]**

Selection criteria when ready:
- 1 bundle from the B2B SaaS use-case category
- 1 bundle from the consumer use-case category
- 1 bundle from the dashboard use-case category

Per bundle, attach:
- `DESIGN.md` (stripped of internal fixture metadata)
- `tokens.json` (DTCG format; no identifying filename)

Do NOT attach: the full `design/` directory, raw persona JSON, gate result files, or any file that names the fixture source.

Per Pitfall 6 (04-RESEARCH.md §Group G): outreach packet is two steps. This step (a) is the draft message, rubric, and NDA — ready to send. Step (b) is attaching the anonymized bundles after the 15-fixture suite dry-run passes, in Plan 04-05.
