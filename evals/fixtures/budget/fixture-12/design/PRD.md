---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
---

# Heatmap — Customer Journey Analytics

## Problem
Product teams know where users drop off but not why. Session recordings are overwhelming to review; heatmaps lack context.

## Target Users
- Product managers and UX designers at B2C SaaS companies (1k–100k MAU)
- Growth engineers running A/B tests

## Jobs-to-be-Done
1. When a conversion drops, I want to see click heatmaps, scroll depth, and rage-click clusters on the affected page within 5 minutes.
2. When I run an A/B test, I want side-by-side heatmaps for each variant.
3. When I present to stakeholders, I want a shareable link that plays a curated session reel without exposing raw PII.

## Scope (v1)
- JavaScript snippet for web apps (auto-track clicks, scrolls, form interactions)
- Click heatmaps, scroll heatmaps, rage-click overlays
- Session recording with PII masking (email, credit card fields)
- A/B test variant comparison view
- Shareable highlight reel (curator picks N sessions, shares link)

## Out of Scope
- Mobile SDK (iOS, Android)
- Real-time alerting
- Funnels and cohort analysis (covered by other tools in their stack)
