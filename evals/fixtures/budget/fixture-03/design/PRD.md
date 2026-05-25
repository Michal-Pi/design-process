---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
---

# DevPulse — Engineering Metrics Dashboard

## Problem
Engineering managers lack real-time visibility into team velocity, PR cycle times, and deployment frequency.

## Target Users
- Engineering managers at teams of 8–30 engineers
- VPs of Engineering who need weekly rollups

## Jobs-to-be-Done
1. When I have a 1:1, I want to quickly pull up an engineer's recent contributions without digging through GitHub.
2. When I report to the board, I want DORA metrics automatically computed from our CI/CD data.
3. When a sprint ends, I want to see whether velocity improved compared to the last 4 sprints.

## Scope (v1)
- GitHub and GitLab integration (OAuth)
- PR cycle time, merge frequency, review turnaround
- DORA four key metrics (deployment frequency, lead time, MTTR, CFR)
- Per-engineer and team-level breakdowns
- Slack digest (weekly)

## Out of Scope
- Jira / Linear integration (v2)
- Automated performance reviews
- Salary benchmarking
