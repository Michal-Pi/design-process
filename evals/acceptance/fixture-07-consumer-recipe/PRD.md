---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: complete-design/acceptance-corpus
---

# Mise — Weekly Meal Planning + Recipe Discovery App

## Context

Mise is a consumer app for home cooks who want to meal-plan weekly and reduce food waste.
The target user is 28-45, cooks 4-5 times per week, buys groceries on a weekly schedule,
and currently juggles Paprika (recipe manager), Notes (shopping list), and a mental model
of what is in the fridge. The problem space is fragmentation: recipe discovery, meal
planning, pantry tracking, and shopping lists live in separate tools with no connective
tissue.

## Problem

Home cooks spend 15-20 minutes each Sunday deciding what to cook during the week, then
another 10-15 minutes building a shopping list manually by scanning through recipes.
By Wednesday, pantry reality diverges from the plan, leading to either waste or last-minute
grocery runs. Existing apps (Mealime, Whisk) are either too rigid (fixed meal plans) or
too passive (recipe save without planning workflow).

## Goals

1. Reduce weekly meal planning + grocery list time from ~35 minutes to under 10 minutes
   by surfacing recipe suggestions that use ingredients the user already has.
2. Generate a consolidated, deduplicated grocery list from the week's meal plan with one
   tap — sorted by store section.
3. Track pantry staples (user-maintained, not auto-detected) and surface recipes that
   maximize use of expiring items to reduce food waste.
4. Enable recipe saving from any URL via a share-sheet extension with one-tap ingredient
   parsing into the pantry model.

## Non-Goals

- Nutritional tracking or calorie counting (out of scope; creates compliance burden).
- Restaurant recommendations or food delivery integration.
- Automated pantry tracking via receipt scanning (v2; requires high-quality OCR pipeline).
- Social recipe sharing or following other cooks (v2 social layer).

## User Stories

**As a home cook planning Sunday evening**, I want to see 5 recipe suggestions based on
what I already have in my pantry so I can plan the week without buying ingredients I
will not use.

**As a user who saved 20 recipes last month**, I want the app to surface my saved recipes
sorted by "most of these ingredients already in pantry" so my collection is actionable
rather than decorative.

**As a busy parent on Wednesday night**, I want to swap one recipe in my existing meal
plan without rebuilding the shopping list from scratch so I can adapt to schedule changes.

**As a user returning from the grocery store**, I want to check off items I bought and
have the pantry model update automatically so the next round of suggestions reflects
what I actually have.

## Success Metrics

- Weekly planning session time (in-app timed): ≤ 10 minutes for a 5-dinner plan.
- Grocery list generation (one tap to shareable list): ≤ 5 seconds.
- Food waste self-reported reduction (30-day survey): ≥ 30% of users report less waste.
- Day-30 retention: ≥ 35%.
- Recipe save-to-actually-cooked rate: ≥ 25% (current typical: < 5% on competitor apps).

## Constraints

- Tech stack: Astro 5 + plain CSS (content-heavy, statically rendered recipe pages for SEO).
- Recipe parsing: structured data extraction from recipe URLs via server-side headless browser.
- Platforms: web-first with iOS PWA install prompt; Android in v2.
- Privacy: pantry data stored locally (IndexedDB); only recipe IDs synced to server.
- Timeline: 12-week build window; 2-week design sprint in weeks 1-2.
- Team: 2 engineers, 1 designer, 0.5 PM.
