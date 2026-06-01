---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: complete-design/acceptance-corpus
---

# Prism Onboarding — Guided Setup Flow for Enterprise Accounts

## Context

Prism Software serves 1,200 enterprise accounts. New account setup requires configuring
SSO, importing user directories (LDAP/SAML), defining workspace roles, and connecting
at least one data source before any value is delivered. Currently, onboarding is handled
via a 90-minute customer success call plus a 15-page PDF guide. 30% of new enterprise
accounts take longer than 3 weeks to reach their first active use session. Customer
success engineers spend 40% of their time on repetitive setup calls.

## Problem

The existing setup flow is entirely unguided — new admins land in a blank workspace with
no indication of what to do first. The steps are discoverable only through documentation
or a CS call. This creates delays, high CS load, and early churn risk. Enterprise buyers
evaluate onboarding speed as part of their procurement decision.

## Goals

1. Reduce median time-to-first-active-session from 3 weeks to under 5 business days for
   new enterprise accounts.
2. Reduce CS onboarding call load by 50% — new accounts should be self-sufficient through
   setup without a scheduled call.
3. Surface a clear completion progress indicator so admins know exactly what is left to
   configure before inviting their team.
4. Enable CS engineers to monitor onboarding progress per account from a CS dashboard so
   they can intervene proactively when an account has been stuck for more than 2 days.

## Non-Goals

- Automated SSO configuration negotiation (requires manual coordination with IT teams).
- Onboarding analytics for non-admin users (separate product telemetry scope).
- Self-service plan upgrade during onboarding (separate billing surface).
- Localization beyond English for v1.

## User Stories

**As an enterprise IT admin**, I want a checklist-driven setup wizard that shows me exactly
which steps remain before my team can use Prism so I can plan the rollout without reading
a 15-page PDF.

**As an enterprise IT admin**, I want to test SSO connectivity before committing it to
production so I can fix configuration errors without impacting my users.

**As a CS engineer**, I want to see a per-account onboarding progress view in my CS
dashboard so I can identify accounts that have been stuck and reach out before they
churn in the first 30 days.

**As a product manager**, I want to see funnel analytics for the onboarding steps so I
can identify the highest-drop-off steps and prioritize improvements in the next sprint.

## Success Metrics

- Median time-to-first-active-session: from 3 weeks to ≤ 5 business days.
- Self-serve completion rate (without CS call): ≥ 60% of new enterprise accounts.
- CS call volume for onboarding: reduction ≥ 50%.
- Admin-reported onboarding clarity (surveyed at step 3/6): ≥ 4.2/5.0 satisfaction.
- 30-day retention for accounts that completed onboarding: ≥ 85%.

## Constraints

- This is a new-feature addition to Prism's existing Next.js 15 + shadcn/ui codebase.
- SSO and LDAP integration APIs already exist; this PRD covers the UX layer only.
- All setup state must survive browser refresh (persisted to Prism's existing API).
- Accessibility: WCAG 2.2 AA required (federal procurement baseline).
- Timeline: 6-week feature sprint; design starts in week 1.
- Team: 2 frontend engineers, 1 designer, 1 PM.
