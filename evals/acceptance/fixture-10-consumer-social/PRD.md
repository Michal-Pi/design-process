---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/acceptance-corpus
---

# Ripple — Social Reading Highlights Feature

## Context

Ripple is a reading app (e-books + articles) with 85,000 monthly active users. The
core product — reading tracking, progress sync, and reading goals — is mature and
stable. The growth team has identified that users who share a highlighted passage at
least once have a 2.4× higher 90-day retention rate. Currently, sharing is limited to
a basic copy-to-clipboard and an iOS share sheet — no Ripple-native social layer
exists. This PRD covers the Social Reading Highlights feature: a way for users to
share and discover highlighted passages from books within the Ripple community.

## Problem

Reading is a solitary activity, but the most valuable insights come from the margins —
the notes and highlights other thoughtful readers make. Ripple users have collectively
created 2.1 million highlights across 14,000 books, but those highlights are entirely
private. Users have no way to discover how others engaged with a passage they found
meaningful, and there is no network effect to grow the platform from.

## Goals

1. Enable users to publish a highlight (with optional annotation) to a community feed
   with one tap from inside the reading experience, without interrupting the reading flow.
2. Surface community highlights on the book page so new readers can see which passages
   other readers found meaningful before they reach them.
3. Allow users to follow other readers and see a personalized highlights feed.
4. Create a "shared reading" experience for book clubs: a private group where all
   members' highlights for a chosen book are visible to each other.

## Non-Goals

- Full social profiles (follower counts, bios, external links) — Ripple is reading-first.
- Public comments on highlights (moderation complexity deferred to v2).
- Integration with Goodreads or The StoryGraph for cross-platform follows.
- Monetization (premium highlights, author-shared content) — separate product workstream.

## User Stories

**As a reader who just highlighted a passage**, I want to share it to the Ripple
community with one tap and an optional note so I can contribute to the collective margin
without interrupting my reading session.

**As a user browsing a book page**, I want to see the top 5 community highlights for
that book (by reaction count) so I can decide whether to add it to my reading list
based on what resonated with other readers.

**As a book club organizer**, I want to create a private shared-reading group for our
current book so all members' highlights are visible to each other during our 4-week
reading period.

**As a follower**, I want to see a feed of highlights from readers I follow, sorted by
recency, so I can discover interesting passages without browsing all 14,000 books.

## Success Metrics

- Highlight share rate (% of sessions where ≥1 highlight is published): ≥ 8% within
  60 days of launch (baseline: 0% Ripple-native share, 2% clipboard share).
- Community highlights viewed per book page visit: ≥ 1.5 highlights/session.
- 90-day retention for users who share ≥1 highlight: ≥ 70% (vs. current 42% baseline).
- Book club group creation: ≥ 500 groups in the first 90 days.
- Highlight feed daily active users: ≥ 15% of MAU visiting feed at least once per day.

## Constraints

- This is a new-feature addition to Ripple's existing Next.js 15 + shadcn/ui codebase.
- Privacy: highlights are opt-in public; default is private (no behavioral change for
  non-sharing users).
- Content moderation: automated keyword filter at publish time (existing infrastructure).
- Rate limiting: community feed API limited to 200 req/min/user to prevent scraping.
- Timeline: 8-week feature sprint.
- Team: 2 frontend engineers, 1 backend engineer, 1 designer, 1 PM.
