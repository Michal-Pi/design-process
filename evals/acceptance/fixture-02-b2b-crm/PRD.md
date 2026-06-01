---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: complete-design/acceptance-corpus
---

# Nexus CRM — Relationship Intelligence Dashboard

## Context

Nexus CRM is a B2B sales tool used by 340 mid-market sales teams (2-15 reps). The current
product surfaces deal data in a flat list view with no relationship context — reps must
manually cross-reference contact history, email threads, and meeting notes to understand
where each deal stands. Sales managers spend 2-3 hours weekly reviewing pipeline health
individually because there is no shared visibility surface.

## Problem

Sales reps lose 25-35% of deal momentum when switching contexts between deal view, contact
timeline, and activity history. Managers have no real-time pipeline confidence signal —
they rely on weekly 1:1s and gut-feel to forecast. The existing list view was built for
data entry, not for navigating complex multi-stakeholder relationships.

## Goals

1. Reduce time-to-context for reps (from "open deal" to "ready to act") from ~4 minutes to
   under 60 seconds.
2. Surface a manager-facing pipeline confidence score that updates in real-time as deal
   signals change (email open rates, last-touch recency, stakeholder engagement breadth).
3. Enable reps to view the full relationship graph (who knows who, when last touched) for
   any deal without leaving the deal view.
4. Reduce manager 1:1 prep time by 50% by surfacing the 3 deals most at risk per rep.

## Non-Goals

- AI-generated email drafts or meeting summaries (Phase 2, separate PRD).
- Integration with LinkedIn Sales Navigator for mutual-connection surfacing (v2.1).
- Mobile native app — responsive web is sufficient for field use cases.
- Territory management or quota assignment (handled by separate Quota module).

## User Stories

**As a sales rep**, I want to see the complete relationship timeline for a deal (all contacts,
touch history, engagement signals) in a single view so I can quickly determine the right
next action without switching tabs.

**As a sales rep**, I want the system to highlight which stakeholders I have not contacted
in over 14 days so I do not lose deals to neglected relationships.

**As a sales manager**, I want a pipeline health dashboard that ranks my team's deals by
risk level so I can focus my coaching time on the deals that need intervention.

**As a sales manager**, I want to see the engagement breadth (number of contacts touched)
per deal because deals with single-threaded relationships close at 60% lower rates.

## Success Metrics

- Rep time-to-context (p50): ≤ 60 seconds from deal open to actionable next step visible.
- Pipeline confidence score accuracy: manager-reported "surprised by lost deal" rate drops
  by ≥ 40% in the first 90 days post-launch.
- Stakeholder staleness alerts actioned within 48 hours: ≥ 65% of surfaced alerts.
- Manager 1:1 prep time self-reported reduction: ≥ 40% (surveyed 30 days post-launch).
- 30-day active user retention among reps who complete onboarding: ≥ 70%.

## Constraints

- Must integrate with existing Nexus CRM REST API (v3.2) without changes to the API layer.
- Design system: Next.js 15 + shadcn/ui components; no custom component library.
- Timeline: 10-week MVP with a 2-week design sprint upfront.
- Team: 3 engineers, 1 designer, 1 PM.
- Accessibility: WCAG 2.2 AA required for all new surfaces (federal procurement requirement).
- Performance: relationship graph must render in under 800ms on a 100-node graph.
