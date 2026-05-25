---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
---

# Scribe — Meeting Transcription & Action Item Extractor

## Problem
Meetings produce decisions and action items that are immediately forgotten or buried in chat history.

## Target Users
- Teams holding 5+ meetings per week (remote or hybrid)
- Project managers responsible for follow-through on meeting decisions

## Jobs-to-be-Done
1. When a meeting ends, I want a structured summary with action items, owners, and due dates extracted automatically.
2. When I review action items from last week's meeting, I want to see completion status alongside this week's agenda.
3. When I wasn't in a meeting, I want to catch up in 2 minutes by reading the AI summary.

## Scope (v1)
- Google Meet and Zoom integrations (join as bot participant)
- Real-time transcription (speaker-attributed)
- Post-meeting summary: decisions, action items (owner + due date), key quotes
- Action item tracking with completion status
- Calendar integration (tie summaries to calendar events)

## Out of Scope
- Microsoft Teams integration (v2)
- In-meeting live summaries ("smart recap")
- CRM sync (Salesforce, HubSpot)
