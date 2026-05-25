---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
---

# Refract — Code Review Quality Scorer

## Problem
Code review quality is inconsistent. Some reviews are thorough; others just approve. Teams have no way to measure or improve review culture.

## Target Users
- Engineering leads at teams of 10–50 engineers
- Senior engineers who want to improve their own review practice

## Jobs-to-be-Done
1. When a PR is merged, I want to automatically score the review based on specificity, coverage, and turnaround.
2. When an engineer consistently writes low-quality reviews, I want a coaching prompt sent to their manager.
3. When I join a new team, I want to benchmark review quality against industry norms.

## Scope (v1)
- GitHub integration (PR data + review comments)
- Review quality scoring model (heuristic: length, specificity markers, approval-without-comment detection)
- Per-engineer and team trends
- Weekly Slack digest to engineering leads

## Out of Scope
- GitLab / Bitbucket (v2)
- AI-generated review suggestions
- Performance review integration
