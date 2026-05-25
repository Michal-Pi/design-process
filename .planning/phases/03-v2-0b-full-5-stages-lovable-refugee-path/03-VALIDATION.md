# Phase 3 Validation Architecture

The Validation Architecture for Phase 3 lives in `03-RESEARCH.md` — see the **"## Validation Architecture"** section (approximately line 951).

This file is a routing aid. The content below summarises what is covered there so tools and reviewers can find it without grepping.

## What Section 11 covers

| Topic | Location |
|-------|----------|
| Test framework (vitest 2.x, config, run commands) | RESEARCH.md §Validation Architecture — Test Framework table |
| Phase requirements → test map (FID-03, FID-06, WF-04, WF-05, D-60, D-64, D-65, AUDIT-02, ROUTE-01) | RESEARCH.md §Validation Architecture — Phase Requirements → Test Map table |
| Per-task and per-wave sampling rate (quick run / full suite / phase gate) | RESEARCH.md §Validation Architecture — Sampling Rate |
| Wave 0 gaps (adversarial suites, golden fixtures, gate test files, migration tests, budget fixtures) | RESEARCH.md §Validation Architecture — Wave 0 Gaps checklist |

## Phase-level gate command

```
npx vitest run   # full suite — must stay ≥ phase-start count
npx tsc --noEmit
node assets/scripts/lint-determinism.mjs assets/scripts/
```

All three must be clean before `/gsd-verify-work` is called.
