---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
---

# Onboard — Employee Onboarding Workflow Builder

## Problem
HR teams manage onboarding in spreadsheets. New hires miss tasks; managers don't know who is blocked.

## Target Users
- HR managers at companies with 50–500 employees
- IT admins provisioning access for new hires

## Jobs-to-be-Done
1. When a new hire starts, I want their 30-day checklist to be automatically generated from a template.
2. When a task is overdue, I want the responsible person to receive an automatic nudge.
3. When I need to report to leadership, I want to see onboarding completion rates per cohort.

## Scope (v1)
- Drag-and-drop workflow template builder
- Per-hire checklist with owner assignment
- Automated reminders (email + Slack)
- Onboarding progress dashboard
- HRIS webhook trigger (BambooHR, Workday)

## Out of Scope
- Offboarding workflows (v2)
- Learning management system (LMS) integration
- E-signature (v2)
