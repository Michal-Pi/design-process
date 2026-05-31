---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/acceptance-corpus
---

# Kinetic — Adaptive Fitness Tracking App

## Context

Kinetic is a consumer fitness tracking app targeting recreational athletes who train
4-6 days per week (running, cycling, strength). The market is saturated with passive
trackers (Apple Fitness, Garmin Connect) that log data but do not adapt training plans
based on accumulated fatigue or personal goal trajectories. Kinetic's differentiator is
adaptive periodization: the app re-plans the week's training based on last night's
sleep, HRV trend, and the user's stated goal (race in 8 weeks, maintain base fitness).

## Problem

Recreational athletes follow rigid training plans that do not account for life variability.
Missing a workout invalidates the plan; training while fatigued risks injury. Existing apps
log outcomes but do not prescribe adjustments. Athletes either over-train (injury risk) or
guilt-skip days (plan abandonment). 60% of fitness app users have abandoned a training
plan at least once due to a life disruption.

## Goals

1. Surface a "today's recommended session" based on fatigue level (HRV + sleep) + days
   until goal event — reducing the athlete's planning decision to one tap.
2. Enable users to adjust a session's load in real-time (swap intervals for an easy run)
   without invalidating the macro training block structure.
3. Show a training load trend (acute:chronic workload ratio) that communicates injury
   risk in plain language, not sports science jargon.
4. Integrate with Apple Health and Garmin Connect for automatic activity sync — zero
   manual logging.

## Non-Goals

- Social features (leaderboards, group challenges) — separate social module roadmap.
- Nutrition tracking (out of scope for v1; covered by integration partners).
- Coaching marketplace (human coach review of plans) — v2.0 feature.
- Wearable hardware — Kinetic is software-only; reads from existing device APIs.

## User Stories

**As a recreational runner**, I want to open the app each morning and see one clear
recommended workout (with explanation why) so I do not spend 10 minutes deciding what
to do.

**As a cyclist training for a century ride**, I want to adjust today's session intensity
without breaking next month's training structure so I can accommodate an unexpected work
deadline without guilt.

**As an athlete returning from a minor injury**, I want the app to recognize my reduced
weekly volume and ramp me back up gradually so I do not re-injure myself by rushing
back to previous loads.

**As a user who syncs Apple Health**, I want my sleep and HRV data to automatically
factor into tomorrow's session recommendation so I do not have to manually input
readiness each morning.

## Success Metrics

- Day-14 retention: ≥ 40% (industry average: 22% for fitness apps).
- Sessions completed as recommended vs. manually adjusted: ≥ 55% completion rate.
- Athlete-reported "plan felt achievable this week" (weekly survey): ≥ 4.0/5.0.
- Mean time from app open to "today's session confirmed": ≤ 20 seconds.
- Training block completion rate (8-week goal): ≥ 35% of users complete their first block.

## Constraints

- Tech stack: Vite 6 + plain CSS (custom design language; no Tailwind or component library).
- Platforms: iOS + Android via React Native wrapper with the Vite web core.
- Health data: Apple HealthKit (iOS), Google Fit (Android), Garmin Connect API.
- Privacy: all health data stored on-device; server receives only anonymous aggregate signals.
- Timeline: 14-week build with 3-week design sprint (weeks 1-3).
- Team: 3 engineers (2 mobile, 1 backend), 1 designer, 0.5 PM.
