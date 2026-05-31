# ACCEPT-05: Frost ≥3× Recurrence Rule — Coverage by Existing Harness

## Status

ACCEPT-05 is **covered by the existing adversarial harness** at:

```
evals/adversarial/fid-06-frost-recurrence/
```

## Why No New Corpus

Per `04-RESEARCH.md §Group B` (Open Question 3 resolved) and `03-VERIFICATION.md SC-3`:

The `fid-06-frost-recurrence/` harness already provides full ACCEPT-05 coverage:
- `run.test.ts` exercises the Frost ≥3× recurrence rule enforcement via `countComponentRecurrences()`
- The harness includes: 2 blocked cases (< 3× recurrences → blocked) + 1 pass case (≥3× → passes)
- 03-VERIFICATION.md SC-3 confirmed: "FID-06 adversarial 2/2" — both cases pass

ACCEPT-05 does NOT require a new 100-case corpus because the requirement is:
> "Stage 5b ≥3× recurrence rule enforced and verifiable in fixture"

This is a spot-fixture requirement (enforceable by 2 deterministic cases), NOT a
statistical robustness requirement (which would warrant 100 cases).

## Release Gate Integration

`assets/scripts/release-gate.mjs` (Plan 04-02) includes the `fid-06-frost-recurrence`
harness in its ACCEPT-05 acceptance check rather than running a separate corpus.

## Reference

- Existing harness: `evals/adversarial/fid-06-frost-recurrence/run.test.ts`
- Phase 3 verification: `03-VERIFICATION.md SC-3`
- Planning decision: `04-RESEARCH.md §Group B` (ACCEPT-05 section)
- Locked decision: `04-01-PLAN.md` Task 2 action block (ACCEPT-05 note)
