---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/acceptance-corpus
---

# Stackwatch — Dependency Health SaaS

## Context

Stackwatch is a developer-tooling SaaS product targeting engineering teams of 5-50
developers. The product monitors npm, pip, and cargo dependency trees, identifies
outdated packages, known CVEs, and licensing conflicts, and routes remediation tasks
directly to the team's sprint board. The current MVP was built in Lovable as a
prototype; the team now needs a production-grade product with a proper information
architecture and interaction design.

## Problem

Dependency health is managed inconsistently across teams. Security patches wait weeks
in backlogs because the urgency signal is buried in email alerts that engineers
filter-out. Engineering managers have no dashboard showing dependency debt trends across
projects. License compliance reviews are done manually before each enterprise procurement
renewal, costing 2-4 days of engineering time per quarter.

## Goals

1. Surface the top 5 security-critical dependency updates per project on a daily digest
   that engineers actually open (target: 60% open rate within 24 hours).
2. Give engineering managers a cross-project dependency health score that trends over
   time so they can include it in quarterly engineering reports.
3. Automate license conflict detection at PR-merge time via GitHub App integration,
   eliminating manual pre-procurement reviews.
4. Enable one-click Jira/Linear ticket creation for any identified dependency update,
   pre-populated with CVE context and remediation steps.

## Non-Goals

- Runtime vulnerability scanning (SAST/DAST) — that is a security tooling vertical.
- Support for non-package-manager dependencies (vendored binaries, system packages).
- Self-hosted deployment option (v2.0 roadmap; current target is cloud SaaS only).
- AI-generated remediation code (separate product vision; not in this PRD scope).

## User Stories

**As a backend engineer**, I want to see which of my project's dependencies have CVEs
with CVSS scores above 7.0 so I can prioritize patches before the next sprint planning.

**As an engineering manager**, I want a weekly email digest showing dependency health
scores for all projects I own so I can track technical debt trends without manually
pulling reports.

**As a security lead**, I want to define a policy (e.g., no GPL-licensed packages in
production builds) and receive automated alerts when that policy is violated at merge time.

**As an engineering lead**, I want Stackwatch to automatically create a Jira ticket with
full CVE context when a severity-high vulnerability is found so my team does not have to
manually triage the alert.

## Success Metrics

- Daily digest open rate (first 30 days): ≥ 60%.
- Mean time from CVE publication to engineer-acknowledged ticket: ≤ 48 hours.
- Engineering manager self-reported time spent on manual dependency audits: reduction ≥ 70%.
- License policy violation detection at merge time: ≥ 95% recall on known GPL/AGPL patterns.
- NPS from engineering teams (90 days post-launch): ≥ 40.

## Constraints

- Tech stack: Vite 6 + plain CSS (no Tailwind, no shadcn — the team has a custom design system).
- Integrations in scope for v1: GitHub App, Jira Cloud, Linear.
- No mobile-specific design required; developer tool used on desktop only.
- Performance: dashboard must load with ≤ 200ms LCP on a typical 20-project portfolio.
- Timeline: 12-week build window; design sprint weeks 1-2.
