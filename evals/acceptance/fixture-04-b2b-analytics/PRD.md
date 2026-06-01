---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: complete-design/acceptance-corpus
---

# Meridian — Internal Analytics Command Center

## Context

Meridian is an internal analytics product for a 600-person B2B SaaS company (Prism
Software). The data team currently serves analytics requests via Looker dashboards and
ad-hoc Slack reports. Business stakeholders (product managers, growth team, customer
success) spend 2-4 hours per week formatting data exports from Looker into executive
summaries. There is no self-service exploration layer between raw Looker and polished
Slides decks.

## Problem

Decision-makers need quick answers to recurring questions ("what's this week's activation
rate?", "how many accounts reached the feature usage threshold this month?") but must
either write SQL themselves or wait for the data team. The data team is blocked on
recurring "urgent" reporting requests that crowd out higher-leverage analytical work.
Looker's UI has a steep learning curve for non-technical users.

## Goals

1. Enable non-technical stakeholders to answer their top 20 recurring metric questions
   without involving the data team — self-service for at least 80% of weekly reporting
   requests within 60 days of launch.
2. Reduce data team interrupt rate from ≥15 ad-hoc requests per week to ≤3 post-launch.
3. Provide a shared "source of truth" dashboard for the weekly leadership sync — one URL,
   always current, no manual export.
4. Surface anomaly alerts (e.g., activation rate drops >10% week-over-week) proactively to
   the relevant stakeholder Slack channels without requiring manual monitoring.

## Non-Goals

- Custom SQL editor or ad-hoc exploration beyond the pre-curated metric catalog.
- Data pipeline management or dbt model editing (data team tooling scope).
- External customer-facing analytics (separate product; different trust posture).
- Mobile-first design — used on desktop in scheduled syncs and async review sessions.

## User Stories

**As a product manager**, I want to open a dashboard before my weekly leadership sync
and see all 8 core product metrics (activation, DAU, feature adoption, churn risk) in
one view with trend lines so I can present without building a Slides deck.

**As a growth analyst**, I want to configure custom date ranges and cohort filters on
metrics I own so I can slice data for campaign analysis without writing SQL.

**As a data team lead**, I want to publish a new metric to the catalog with a confidence
label (verified, estimated) so stakeholders know when a number is trustworthy.

**As a CS manager**, I want to subscribe to an anomaly alert for net-churn accounts so
I get a Slack ping when the churn rate jumps beyond the threshold I set.

## Success Metrics

- Self-service rate for pre-curated metrics: ≥ 80% of weekly requests resolved without
  data team involvement within 60 days.
- Data team interrupt rate: from ≥ 15/week to ≤ 3/week.
- Time-to-dashboard (stakeholder opens app, reads key metric): ≤ 30 seconds.
- Anomaly alert signal-to-noise: ≥ 70% of fired alerts acted upon within 24 hours.
- Dashboard used in weekly leadership sync without manual export: 12 consecutive weeks.

## Constraints

- Data source: Prism's Snowflake warehouse via internal GraphQL API (no direct SQL
  exposure to the UI layer).
- Tech stack: Next.js 15 + Tailwind v4 (internal design system extends Tailwind tokens).
- Sensitive data: all metric values are internal-confidential; no public sharing endpoints.
- Timeline: 8-week design + build window.
- Team: 2 data engineers, 1 frontend engineer, 1 designer, 1 PM.
