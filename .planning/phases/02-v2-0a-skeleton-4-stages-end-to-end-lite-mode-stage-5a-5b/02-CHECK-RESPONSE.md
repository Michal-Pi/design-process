# Phase 2 Plan-Checker Response (Iteration 1)

**Response date:** 2026-05-25
**Checker verdict:** PASS-WITH-CONCERNS
**Response verdict:** All BLOCKING and HIGH findings addressed. Selected MEDIUM/LOW addressed. Wave structure updated.

---

## Finding Resolution Table

| Finding | Severity | Disposition | Plan(s) Edited | Delta |
|---------|----------|-------------|----------------|-------|
| F-01: 02-04 hidden dep on 02-03 | BLOCKING | FIXED | 02-04-PLAN.md, ROADMAP.md | Added `02-03` to depends_on; wave 3→4. Option A chosen (F-01 analysis: 02-04 systematize workflow calls budget-check.mjs and reads design/tokens.json DTCG structure — both from 02-03. Option B would move budget-check.mjs to 02-02 but it logically belongs in the tokens/style layer). |
| F-02: SC-5 recall unverifiable | BLOCKING | FIXED | 02-05-PLAN.md | Added 6 triggers.yaml files (evals/triggers/<skill>/triggers.yaml per Phase 1 pattern), phase2-skillgrade.test.ts asserting recall ≥0.85 per skill, and skillgrade.mjs run to T-02-05-B action. SC-5 truth added to must_haves. |
| F-03: 15-fixture eval suite missing | HIGH | FIXED | 02-05-PLAN.md | Added 15-fixture static PRD.md suite (evals/fixtures/budget/fixture-01..15/) and budget-p50-measurement.test.ts to T-02-05-C. Note: full p50 measurement on 15 e2e runs is a Phase 4 deliverable; Phase 2 ships the fixture harness + enforcement mechanism documentation. |
| F-04: DESIGN.md emit content untested | HIGH | FIXED | 02-04-PLAN.md | Added tests/gates/systematize-emit.test.ts to T-02-04-B: validates emitted DESIGN.md against design-md.2026.04.json via validateDesignMd(), asserts evidence:INFERRED and stage:5b-lite. Deferred to T-02-05-B e2e if emit logic is not extractable, with documented rationale. |
| F-05: stage-2-to-3 naming (bundle mismatch) | HIGH | FIXED | 02-02-PLAN.md | Renamed all occurrences of stage-2-to-3 → stage-2-to-5a in 02-02. Added bundle-sufficiency eval run (npx vitest run evals/bundles/) to both verify steps. |
| F-06: skills/design/SKILL.md path + dispatch chain unverified | HIGH | FIXED (partial) | 02-05-PLAN.md | Path confirmed: Phase 1 shipped skills/design/SKILL.md (01-04-SUMMARY key_files — FOUND). Path discrepancy in F-06 does not exist. Added dispatch chain import verify step to T-02-05-B verify command. The e2e test already asserts dispatch stage sequence. |
| F-07: --depth flag missing from workflow bodies | MEDIUM | FIXED | 02-01, 02-02, 02-03, 02-04, 02-05 | Added --depth lightweight/standard/full dispatch to discover, structure, style, systematize, ingest, and audit workflow procedure bodies. Lightweight skips TRUST-05 intake and reduces output counts. Standard is default. Full expands all counts. |
| F-08: MVPA-02 counts 9 atoms, plans deliver 8 | MEDIUM | DEFERRED | — | Audit: Phase 2 plans deliver 8 atoms (ATOM-01..06 + 13..14). MVPA-02 cites MRD §9.1 as the 9-atom source. Phase 2 CONTEXT.md/RESEARCH.md are authoritative for Phase 2 scope — both list 8 atoms. The 9th atom (likely hifi/variants-preview ATOM-13 counted separately from its spec ref, or a research/competitive atom in MRD §9.1) is a MRD/Phase scope discrepancy to surface in Phase 3 planning. No plan change — ATOM-13 (hifi/variants-preview) is already covered by 02-03-PLAN.md T-02-03-B. |
| F-09: budget-check missing from structure.md | MEDIUM | FIXED | 02-02-PLAN.md | Added pre/post budget-check steps to structure workflow body with "if script absent, skip with warning" fallback (matching discover workflow pattern). |
| F-10: stage-2-to-3 naming (LOW duplicate of F-05) | LOW | FIXED | 02-02-PLAN.md | Resolved as part of F-05 fix. |
| F-11: DTCG validation uses simple structural check | LOW | FIXED | 02-03-PLAN.md | Updated T-02-03-A action to: (a) confirm dtcg-lint.mjs NOT in 01-01-SUMMARY key_files; (b) use ajv structural check with known DTCG v2025.10 $type enum; (c) document path in test file header. |
| F-12: RED-06 conceptual weakness undocumented | LOW | FIXED | 02-01-PLAN.md | Added requirement to T-02-01-B done criterion: run.test.ts must include inline comment explaining RED-06 tests gate determinism post-write; upstream LLM threat mitigated by persona.v1.json schema validation (ajv rejects invalid provenance enum). |

---

## Wave Structure (revised)

| Wave | Plans | Note |
|------|-------|------|
| 1 | 02-01 | Stage 1 gate + discover SKILL.md |
| 2 | 02-02 | Stage 2 gate + structure SKILL.md (after 02-01) |
| 3 | 02-03 | Style-lite + tokens-project + budget-check (after 02-02) |
| 4 | 02-04 | Systematize-lite + stage-5b gate (after **02-03** — F-01 fix) |
| 5 | 02-05 | Dispatch wiring + audit + e2e fixture + triggers + skillgrade (after 02-01, 02-02, 02-03, 02-04) |

**Change from original:** 02-04 moved from Wave 3 (parallel with 02-03) to Wave 4 (serial after 02-03). 02-05 moved from Wave 4 to Wave 5. Net impact: one additional wave, but the critical path is identical since 02-05 already depended on all four predecessors.

---

## Deliberate Deferrals

**F-08 (MEDIUM — MVPA-02 9-atom count):** The discrepancy between MVPA-02's "9 atoms" and the plan's 8 atoms is a MRD §9.1 vs. CONTEXT.md scope conflict. The Phase 2 CONTEXT.md and RESEARCH.md are the authoritative planning inputs and both specify 8 atoms. ATOM-13 (hifi/variants-preview) is present. Resolving MRD §9.1 against Phase scope belongs in Phase 3 planning kickoff, not as a Phase 2 plan edit.

**F-03 partial note:** Full p50 measurement (15 complete e2e runs logged to run-log.jsonl) is a Phase 4 acceptance-suite deliverable per ROADMAP Phase 4 SC-1. Phase 2 ships the fixture harness and budget enforcement mechanism. The budget-p50-measurement.test.ts documents this contract explicitly so Phase 4 planning has a clear handoff.
