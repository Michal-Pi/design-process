---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/acceptance-corpus
---

# Pulse — Customer-Facing Reporting + Export Dashboard

## Context

Pulse is a reporting and export dashboard for a B2B analytics platform (Beacon Analytics)
serving 800 enterprise accounts. Enterprise customers currently receive usage reports as
weekly email attachments (auto-generated PDFs). The CS and product teams have validated
that 65% of enterprise accounts would use a self-service reporting dashboard if one
existed. The current PDF-email pipeline generates 40-60 ad-hoc report requests per month
from accounts wanting custom date ranges or breakdowns not in the standard template.

## Problem

Enterprise customers need to justify Beacon's value to their own stakeholders (quarterly
business reviews, internal reporting). The existing email PDF approach is static, inflexible,
and cannot be embedded or reshared without manually re-formatting. Customers requesting
ad-hoc breakdowns consume significant CS time. The competitive set (Amplitude, Mixpanel) all
ship self-service reporting dashboards; Beacon's absence of this feature is becoming a
procurement objection.

## Goals

1. Enable enterprise account admins to generate and export custom date-range reports for
   their account's usage data without CS intervention — eliminating ad-hoc report requests.
2. Provide a sharable report link (token-authenticated, expiring after 30 days) that
   enterprise customers can send to their own stakeholders without giving them access to
   the full Beacon platform.
3. Support scheduled email delivery of a chosen report configuration on a weekly or
   monthly cadence, replacing the generic PDF pipeline with a customer-configured version.
4. Export reports in 3 formats: PDF (for QBR presentations), CSV (for further analysis),
   and embeddable iframe snippet (for customer intranets).

## Non-Goals

- Public (unauthenticated) report URLs — links are always token-authenticated.
- White-labeling (custom CSS) for embedded reports — that is an enterprise tier upsell
  in the v2.0 roadmap.
- Real-time data (reports use the same T+1 data warehouse pipeline as the existing emails).
- Cross-account aggregation or benchmarking across enterprise customers.

## User Stories

**As an enterprise account admin**, I want to configure a report with a custom date range
and dimension breakdown (by user cohort, feature, or plan tier) and download it as a PDF
so I can include Beacon usage data in my quarterly business review.

**As an enterprise admin preparing for a stakeholder meeting**, I want to generate a
shareable link to a live report view that expires after 30 days so I can share it without
granting my stakeholders a Beacon login.

**As a data analyst at an enterprise account**, I want to download a CSV export of
all events in a given date range so I can run further analysis in our internal data tools.

**As an enterprise account manager**, I want to configure a weekly email with a fixed
report configuration so my team gets a consistent digest without me manually exporting
it each Friday.

## Success Metrics

- Ad-hoc report request volume (CS tickets): reduction from 40-60/month to ≤ 10/month.
- Self-service export activation rate: ≥ 50% of enterprise accounts using Pulse within
  90 days of launch.
- Time to generate + download a configured report: ≤ 30 seconds.
- Scheduled delivery setup completion rate (starting setup vs. completing it): ≥ 70%.
- Customer satisfaction with reporting (NPS delta): ≥ +12 points vs. email PDF baseline.

## Constraints

- Tech stack: Next.js 15 + Tailwind v4 + shadcn/ui.
- Data layer: reports generated from Beacon's existing Snowflake reporting API.
- Authentication: report links use signed JWT tokens with 30-day expiry; viewer does
  not need a Beacon account.
- Compliance: exported data subject to enterprise DPA; no third-party analytics scripts
  in the export viewer.
- Performance: report generation (data fetch + rendering) ≤ 5 seconds for 12-month ranges.
- Timeline: 10-week build; 2-week design sprint upfront.
- Team: 2 frontend engineers, 1 backend engineer, 1 designer, 1 PM.
