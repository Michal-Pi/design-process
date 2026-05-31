---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/acceptance-corpus
---

# Helm — Internal Operations Dashboard

## Context

Helm is an internal operations dashboard for a 200-person B2B SaaS company (Orbital
Systems). The operations team (12 people) currently manages customer provisioning,
subscription changes, SLA monitoring, and escalation routing through a combination of
Salesforce, a homegrown internal tool built in Retool, and a shared Google Sheet that
functions as an informal queue. The Retool tool has reached its limits: it cannot handle
the multi-step approval workflows the operations team now requires, and its UI cannot be
customized to match Orbital's internal design system.

## Problem

Operations staff switch between 3-4 tools to complete a single customer provisioning
task (Salesforce for account data, Retool for internal state, Sheets for queuing,
Slack for approvals). Context-switching adds 8-12 minutes per provisioning task and
creates audit trail gaps. Customer SLA breaches are not surfaced until a CS manager
manually checks Salesforce — there is no proactive monitoring surface.

## Goals

1. Consolidate customer provisioning, subscription management, and SLA monitoring into
   a single internal tool, reducing context-switches per provisioning task from 4 tools
   to 1.
2. Build a multi-step approval workflow engine that routes provisioning tasks through
   the correct approval chain based on account tier (self-serve vs. enterprise vs.
   custom contract) and auto-approves below a configurable monetary threshold.
3. Surface real-time SLA breach risk (flagging accounts where the SLA deadline is within
   4 hours) as a persistent alert rail in the ops team view.
4. Generate a structured audit trail for every state transition in the provisioning
   workflow, exportable as a CSV for compliance reviews.

## Non-Goals

- External customer-facing portal for customers to track their own provisioning status.
- Billing system — Helm reads billing data from Stripe but does not write to it.
- HR or user management for internal Orbital staff (separate IT tooling).
- Mobile design — operations is a desktop-only workflow.

## User Stories

**As an operations specialist**, I want to open a single dashboard in the morning and
see my entire queue of pending provisioning tasks with their SLA deadlines so I can
prioritize my day without checking 3 separate tools.

**As a senior ops manager**, I want a multi-step approval flow that automatically routes
provisioning requests above $50k ARR to me before the ops specialist can proceed so
approval gaps do not create compliance risk.

**As a compliance officer**, I want to export the full audit trail for any provisioning
task (every state transition, who approved, timestamp) as a CSV so I can respond to
procurement audits without manual reconstruction.

**As an ops director**, I want a real-time SLA breach risk indicator that flags the
5 accounts most likely to breach in the next 4 hours so I can reallocate staff before
SLAs are missed.

## Success Metrics

- Provisioning task completion time (from first open to final state): reduction from
  current ~35 minutes to ≤ 15 minutes.
- Tool context-switches per task: from 4 tools to 1.
- SLA breach rate: reduction ≥ 40% within 60 days of launch.
- Audit trail export completeness: 100% of state transitions captured (zero gaps).
- Ops team daily active user rate: ≥ 90% of the 12-person team using Helm as primary
  tool within 30 days.

## Constraints

- Tech stack: Next.js 15 + shadcn/ui.
- Data sources: Salesforce CRM API, Stripe subscription API, internal provisioning API
  (REST, existing).
- Authentication: SAML SSO via Okta (already configured for other internal tools).
- Compliance: SOC 2 Type II audit trail requirements — all mutations logged.
- Timeline: 12-week build; 2-week design sprint upfront.
- Team: 2 frontend engineers, 1 backend engineer, 1 designer, 1 PM.
