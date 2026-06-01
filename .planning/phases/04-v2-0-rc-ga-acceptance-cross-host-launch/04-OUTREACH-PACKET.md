# complete-design v2.0 — Reviewer Outreach Packet

Prepared: 2026-05-31 | Confidential — reviewer eyes only

---

## Recruitment Message (200 words, ready to send)

[Personalized intro slot]

I'm the author of complete-design — an open-source SKILL.md package that scaffolds the full Garrett 5-stage design process inside Claude Code (the coding agent). It generates research personas, IA sitemaps, Excalidraw wireframes, Mermaid state diagrams, and W3C DTCG design tokens — with stage validation gates between each stage, so the AI doesn't jump straight to hi-fi.

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

**complete-design v2.0 Reviewer Confidentiality Agreement**

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

> **FORMAT REFERENCE — These are synthetic-realistic examples showing the exact structure
> reviewers will receive. They are NOT actual fixture outputs from a real LLM dispatch run.**
>
> Real bundles will be attached after the first clean release-gate run (Wave B Step 0+
> with real CLAUDE_CODE_BIN dispatch). No real DESIGN.md or tokens.json outputs exist yet
> because running `npm run release-gate` requires the live npm @latest binary (Wave B Step 0).
>
> When real bundles are ready: replace this section with actual fixture outputs, stripped of
> internal metadata. Selection: 1 B2B SaaS + 1 consumer + 1 dashboard (per D-73 distribution).

---

### Sample Bundle A: B2B SaaS CRM (format reference)

**Use case:** Relationship intelligence dashboard for sales teams
**Route:** `new-product`
**Stack:** Next 15 + shadcn/ui

#### DESIGN.md (format reference)

```markdown
---
version: "2026-04"
$extensions:
  complete-design:
    generatedAt: "2026-05-31T00:00:00.000Z"
    schemaVersion: "2.0b"
    provenance: "validated"
    routeName: "new-product"
tokens:
  color-primary: "oklch(52% 0.19 256)"
  color-primary-hover: "oklch(45% 0.19 256)"
  color-surface: "oklch(98% 0.01 256)"
  color-surface-muted: "oklch(94% 0.01 256)"
  color-text-default: "oklch(18% 0.02 256)"
  color-text-muted: "oklch(42% 0.04 256)"
  color-border: "oklch(85% 0.02 256)"
  color-success: "oklch(56% 0.17 153)"
  color-warning: "oklch(68% 0.18 62)"
  color-destructive: "oklch(55% 0.22 26)"
  border-radius-sm: "4px"
  border-radius-md: "8px"
  border-radius-lg: "12px"
  font-size-sm: "0.875rem"
  font-size-base: "1rem"
  font-size-lg: "1.125rem"
  font-weight-medium: "500"
  font-weight-semibold: "600"
rationale: |
  Primary blue selected for sufficient contrast against both light surface (oklch 98%)
  and muted surface (oklch 94%). Measured contrast: 4.7:1 WCAG 2.2 AA (pass).
  Destructive red uses OKLCH chroma 0.22 for visibility; warm hue (26°) consistent
  with system status conventions. Success green at 153° hue avoids red-green
  conflation for color-blind users.
---

# Design System — B2B CRM Dashboard

## Stage evidence

| Stage | Status | Gate result |
|-------|--------|-------------|
| discover | complete | VALIDATED — 3 user interviews + OST |
| structure | complete | PASS — sitemap 18 nodes, all typed |
| sketch | complete | PASS — 6 wireframe screens, no hi-fi styling |
| interact | complete | PASS — 4 state machines, all terminal states named |
| style | complete | PASS — contrast measured, tokens emitted |
| systematize | complete | PASS — DESIGN.md validates against April 2026 schema |

## Token rationale

Semantic tier maps directly to DTCG primitive tier.
Component overrides defined for: DataTable, StatusBadge, SidebarNav (≥3 token overrides each).

## Composition

Primary layout: sidebar (240px, fixed) + main content area (fluid).
Navigation: SidebarNav with section grouping + collapse. No top bar (CRM-standard pattern).
Data density: table-first; cards reserved for relationship detail views.
```

#### tokens.json (format reference, DTCG v2025.10)

```json
{
  "$schema": "https://www.designtokens.org/tr/2025.10/schema.json",
  "color": {
    "$type": "color",
    "primitive": {
      "blue": {
        "500": { "$value": "oklch(52% 0.19 256)", "$description": "Brand blue" },
        "600": { "$value": "oklch(45% 0.19 256)", "$description": "Brand blue hover" },
        "50":  { "$value": "oklch(96% 0.03 256)", "$description": "Brand blue tint" }
      },
      "neutral": {
        "50":  { "$value": "oklch(98% 0.01 256)", "$description": "Surface" },
        "100": { "$value": "oklch(94% 0.01 256)", "$description": "Muted surface" },
        "800": { "$value": "oklch(18% 0.02 256)", "$description": "Default text" },
        "500": { "$value": "oklch(42% 0.04 256)", "$description": "Muted text" },
        "200": { "$value": "oklch(85% 0.02 256)", "$description": "Border" }
      },
      "green": {
        "500": { "$value": "oklch(56% 0.17 153)", "$description": "Success" }
      },
      "amber": {
        "500": { "$value": "oklch(68% 0.18 62)", "$description": "Warning" }
      },
      "red": {
        "500": { "$value": "oklch(55% 0.22 26)", "$description": "Destructive" }
      }
    },
    "semantic": {
      "primary":    { "$value": "{color.primitive.blue.500}" },
      "primary-hover": { "$value": "{color.primitive.blue.600}" },
      "surface":    { "$value": "{color.primitive.neutral.50}" },
      "surface-muted": { "$value": "{color.primitive.neutral.100}" },
      "text-default": { "$value": "{color.primitive.neutral.800}" },
      "text-muted": { "$value": "{color.primitive.neutral.500}" },
      "border":     { "$value": "{color.primitive.neutral.200}" },
      "success":    { "$value": "{color.primitive.green.500}" },
      "warning":    { "$value": "{color.primitive.amber.500}" },
      "destructive":{ "$value": "{color.primitive.red.500}" }
    },
    "component": {
      "DataTable": {
        "row-hover-bg":    { "$value": "{color.primitive.blue.50}" },
        "header-bg":       { "$value": "{color.primitive.neutral.100}" },
        "selected-border": { "$value": "{color.semantic.primary}" }
      },
      "StatusBadge": {
        "success-bg": { "$value": "{color.primitive.green.500}" },
        "warning-bg": { "$value": "{color.primitive.amber.500}" },
        "error-bg":   { "$value": "{color.primitive.red.500}" }
      }
    }
  },
  "$extensions": {
    "complete-design": {
      "generatedAt": "2026-05-31T00:00:00.000Z",
      "schemaVersion": "2.0b",
      "provenance": "validated",
      "routeName": "new-product",
      "contrastReport": {
        "primary-on-surface": "4.7:1 WCAG 2.2 AA (pass)",
        "text-default-on-surface": "14.2:1 WCAG 2.2 AAA (pass)",
        "text-muted-on-surface": "4.6:1 WCAG 2.2 AA (pass)"
      }
    }
  }
}
```

---

### Sample Bundle B: Consumer Fitness App (format reference)

**Use case:** Adaptive fitness tracking for recreational athletes
**Route:** `new-product`
**Stack:** Vite + plain CSS

#### DESIGN.md (format reference)

```markdown
---
version: "2026-04"
$extensions:
  complete-design:
    generatedAt: "2026-05-31T00:00:00.000Z"
    schemaVersion: "2.0b"
    provenance: "validated"
    routeName: "new-product"
tokens:
  color-primary: "oklch(62% 0.21 145)"
  color-primary-hover: "oklch(55% 0.21 145)"
  color-surface: "oklch(99% 0.005 145)"
  color-surface-alt: "oklch(96% 0.01 145)"
  color-text-default: "oklch(16% 0.02 145)"
  color-text-muted: "oklch(45% 0.03 145)"
  color-accent: "oklch(65% 0.22 30)"
  color-destructive: "oklch(52% 0.24 25)"
  border-radius-sm: "8px"
  border-radius-md: "16px"
  border-radius-lg: "24px"
  font-size-sm: "0.875rem"
  font-size-base: "1rem"
  font-size-lg: "1.25rem"
  font-weight-medium: "500"
  font-weight-bold: "700"
rationale: |
  Green primary hue (145°) chosen for fitness/health association and strong contrast
  on near-white surface. Measured contrast: 5.1:1 WCAG 2.2 AA (pass). Orange accent
  (30°) for activity streaks and achievement states — warm complementary to green.
  Larger border radii (8/16/24px) for mobile-first consumer feel vs 4/8/12px in the
  B2B variant. High font-weight-bold (700) for activity metrics readability.
---

# Design System — Consumer Fitness App

## Stage evidence

| Stage | Status | Gate result |
|-------|--------|-------------|
| discover | complete | PROTO — synthetic personas (no user interviews; provenance:generated) |
| structure | complete | PASS — sitemap 12 nodes |
| sketch | complete | PASS — 5 wireframe screens |
| interact | complete | PASS — 3 state machines (workout, streak, onboarding) |
| style | complete | PASS — contrast measured |
| systematize | complete | PASS — DESIGN.md validates |

## Composition

Mobile-first. Bottom navigation bar (4 tabs: Today, Progress, Explore, Profile).
Activity cards with motion feedback (XState machine handles start/pause/complete states).
```

---

### Sample Bundle C: Internal Operations Dashboard (format reference)

**Use case:** Internal ops dashboard consolidating provisioning, SLA monitoring, and approvals
**Route:** `new-product`
**Stack:** Next 15 + shadcn/ui

#### DESIGN.md (format reference)

```markdown
---
version: "2026-04"
$extensions:
  complete-design:
    generatedAt: "2026-05-31T00:00:00.000Z"
    schemaVersion: "2.0b"
    provenance: "validated"
    routeName: "new-product"
tokens:
  color-primary: "oklch(48% 0.16 235)"
  color-primary-hover: "oklch(41% 0.16 235)"
  color-surface: "oklch(97% 0.005 235)"
  color-surface-muted: "oklch(93% 0.01 235)"
  color-text-default: "oklch(14% 0.02 235)"
  color-text-muted: "oklch(40% 0.03 235)"
  color-border: "oklch(82% 0.02 235)"
  color-success: "oklch(52% 0.18 153)"
  color-warning: "oklch(65% 0.20 62)"
  color-destructive: "oklch(50% 0.24 24)"
  color-info: "oklch(55% 0.18 235)"
  border-radius-sm: "2px"
  border-radius-md: "4px"
  border-radius-lg: "8px"
  font-size-sm: "0.75rem"
  font-size-base: "0.875rem"
  font-size-lg: "1rem"
rationale: |
  Conservative blue (235°, lower chroma 0.16) for internal tool gravitas. Smaller
  border radii (2/4/8px) for high-density data display. Base font-size 0.875rem for
  data-dense tables. Four semantic status colors (success/warning/destructive/info)
  for SLA monitoring states. Measured contrast: 5.8:1 WCAG 2.2 AA (pass).
---

# Design System — Internal Operations Dashboard

## Stage evidence

| Stage | Status | Gate result |
|-------|--------|-------------|
| discover | complete | VALIDATED — 2 ops lead interviews + existing workflow docs |
| structure | complete | PASS — sitemap 22 nodes (complex approval workflows) |
| sketch | complete | PASS — 8 wireframe screens (table-heavy) |
| interact | complete | PASS — 6 state machines (approval flows, SLA states) |
| style | complete | PASS — contrast measured, 4-status semantic tier |
| systematize | complete | PASS — DESIGN.md validates |

## Composition

Two-panel layout: left sidebar (200px) + main content. Header: global search + user menu.
Approval workflow uses multi-step state machine (pending → review → approved/rejected/escalated).
```

---

> **Attachment instructions for reviewers:**
> When real bundles are ready, replace the "format reference" code blocks above with the
> actual `DESIGN.md` and `tokens.json` files attached as separate files (not inline code blocks).
> Send as a zip: `complete-design-review-bundle-[A|B|C].zip` containing:
> - `DESIGN.md`
> - `tokens.json`
> - `SCORING-RUBRIC.md` (copy from this packet's rubric section)
>
> Do NOT attach: full `design/` directory, persona JSON, gate result files,
> or any file that names the internal fixture source.

---

*Per Pitfall 6 (04-RESEARCH.md §Group G): real bundles attached after Wave B Step 0 + first
release-gate clean run. Format references above show exact structure reviewers will receive.*
