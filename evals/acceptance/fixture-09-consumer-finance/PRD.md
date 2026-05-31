---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/acceptance-corpus
---

# Ledger — Personal Finance Clarity App

## Context

Ledger is a consumer personal finance app targeting 25-40 year olds who have outgrown
"just check the bank app" but do not want the complexity of Mint or YNAB. The target
user earns $60k-$130k, has 2-4 financial accounts, has a vague sense of a budget but
no structured tracking, and has tried and abandoned at least one budgeting app in the
past 2 years. The core insight: most personal finance apps are built for financial
optimization; Ledger is built for financial clarity — showing users where their money
is going without judgment or 47-category budget templates.

## Problem

Personal finance apps have a 60% abandonment rate in the first 30 days. The primary
reasons: too much setup friction (manual account categorization, budget template
decisions before seeing real data), anxiety-inducing UI ("you're over budget in
Dining!"), and poor mobile UX for the small decisions made throughout the week. Users
want to feel in control, not surveilled.

## Goals

1. Enable a user to go from "just downloaded" to "first meaningful financial insight"
   in under 5 minutes without manually categorizing a single transaction.
2. Surface the single most actionable spending insight each week (e.g., "You spent
   $340 on dining — $180 more than last month") as a push notification.
3. Reduce the perceived cognitive load of budgeting by showing a "calm" / "watch" /
   "act" status bar rather than raw over/under numbers.
4. Provide a savings-gap indicator (how far from a stated goal: "Italy trip in October")
   without requiring complex financial planning.

## Non-Goals

- Investment tracking or portfolio management.
- Tax preparation or filing integration.
- Debt payoff planning or amortization tools.
- Bill negotiation or subscription cancellation services.
- Joint account management or couples finance features (v2).

## User Stories

**As a new user connecting my bank for the first time**, I want to see a spending
summary for last month with categories already inferred so I get value immediately
without spending 20 minutes categorizing transactions.

**As a user who just spent $600 on an unexpected car repair**, I want the app to
reforecast my month without requiring me to manually adjust 12 budget categories so
I understand the impact without becoming anxious.

**As a user with a travel savings goal**, I want to see at a glance whether I am on
track this month without doing math so the goal feels achievable rather than abstract.

**As a weekly user**, I want a one-tap recap of this week's spending vs. last week
that I can skim in 30 seconds so I stay aware without over-monitoring.

## Success Metrics

- Time from install to first spending insight: ≤ 5 minutes.
- Day-30 retention: ≥ 45% (industry average: 25%).
- Weekly notification engagement (tap-through from spending insight): ≥ 50%.
- User-reported "I feel less anxious about money" (60-day survey): ≥ 55% positive.
- Category accuracy without user correction (ML model benchmark): ≥ 85% on common
  merchant categories.

## Constraints

- Tech stack: Vite 6 + Tailwind v4.
- Financial data: Plaid API for account linking (existing integration).
- Privacy: transaction data never leaves user's encrypted storage; server processes
  only anonymized aggregate signals for insight generation.
- Regulation: not a licensed financial advisor; UI language must avoid "advice" framing.
- Timeline: 16-week build; 3-week design sprint.
- Team: 2 engineers, 1 designer, 1 PM.
