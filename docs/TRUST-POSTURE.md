# Trust Posture — design-os

This document records the five binding TRUST commitments for the design-os package.
These are non-negotiable constraints that apply to every release, every output,
every SKILL.md description, and every piece of marketing copy or README text.

---

## TRUST-01 — Never claim WCAG conformance

**Commitment:** design-os outputs report measured contrast numbers only.
The forbidden claim words are listed under **Forbidden forms** below.
Never use them in any output, description, or copy.

**Correct form:** `WCAG 2.2 AA contrast 4.7:1 (pass)`

**Forbidden forms (never use):**

- `WCAG compliant`
- `WCAG-compliant`
- `WCAG conformant`
- `WCAG-conformant`
- `accessibility-certified`
- `meets WCAG`

**Rationale:** Conformance claims are legal assertions that require full accessibility
audits by accredited evaluators. Scripts that measure contrast are NOT conformance
audits. Overstating produces false confidence and potential liability (MRD §3.18, P8).

**Verification:** `docs/COPY-REVIEW-CHECKLIST.md` lists the conformance claim phrases as
forbidden. The trust-posture test in `tests/governance/trust-posture.test.ts`
scans all SKILL.md descriptions and shipping docs for forbidden phrases on every CI run.

---

## TRUST-02 — Diff-by-default; --apply required to write

**Commitment:** design-os never auto-publishes to the user's git tree.
All scripts that would write to user files must:
1. Default to a dry-run diff preview (exits 0, prints what would change).
2. Require an explicit `--apply` flag to actually write files.

**Rationale:** Per CLAUDE.md universal "never do" — trust requires the user to
review proposed changes before they land. Auto-write creates surprise, breaking
trust in AI-assisted tooling (MRD §3.18 trust posture commitment).

**Implementation:** `assets/scripts/init.mjs` → `runInit({ apply: false })` prints
diff and exits; `runInit({ apply: true })` writes. All future write-to-user-repo
scripts follow this pattern.

**Verification:** `tests/governance/init.test.ts` asserts that running without
`--apply` does NOT create `.gitignore` in the target directory.

---

## TRUST-03 — Every rule cites canon or a labeled house heuristic

**Commitment:** Every gate checklist item, every fidelity-cap check, every
accessibility assertion in design-os output MUST cite:
- A canonical source (Garrett §X, NN/g article URL, WCAG SC number, Radix step-role,
  W3C spec), OR
- An explicitly labeled `house heuristic: <name>` with the rationale documented.

**Rationale:** If a rule cannot be traced to a canonical source, it is an opinion.
Users must be able to distinguish proven practice from design-os's house opinions
to apply their own judgment (MRD §3.5 editorial standards).

**Verification:** Gate checklist files in `references/gates/` include a `Citation`
column in every row. CI gate checks (Phase 2) will warn on rows with empty citations.

---

## TRUST-04 — Avoid "AI design" framing in all copy

**Commitment:** Never use the following phrases in any shipping copy, README, SKILL.md
description, release note, or marketing material:

- `AI design`
- `AI-powered design`
- `AI-driven design`
- `intelligent design`
- `automatically design`
- `AI design assistant`
- `AI design tool`

**Correct framing:** "5-stage design process facilitated by an AI agent",
"design scaffolding for your agent workflow", "structured design process inside
your coding agent".

**Rationale:** "AI design" framing invites comparison with Figma Make, Lovable,
v0, and Claude Design — tools that generate hi-fi UIs in one shot. design-os's
value is the opposite: structured validation at each stage. Leading with "AI design"
miscommunicates the product and attracts users who want one-shot output (MRD §12).

**Verification:** `docs/COPY-REVIEW-CHECKLIST.md` maintains the complete forbidden
phrase list. `tests/governance/trust-posture.test.ts` scans all SKILL.md descriptions,
docs/*.md (except the checklist itself), and README.md for forbidden phrases on CI.

---

## TRUST-05 — 3-5 question intake per stage; no silent defaults

**Commitment:** Every stage workflow in design-os MUST open with a 3-5 question
intake sequence that clarifies scope, constraints, and user intent before proceeding.
No stage may silently assume defaults and begin artifact generation without explicit
user acknowledgment.

**Required intake topics by stage:**
- Stage 0/1 (Research): product type, audience, known constraints, prior research
- Stage 2 (IA/Structure): target platforms, navigation patterns, content priorities
- Stage 3 (Low-fi): wireframe fidelity level, annotate-for-dev requirements
- Stage 4 (Interaction): async vs sync states, ≥3 states threshold for XState
- Stage 5a/5b (Hi-Fi/DS): token tier depth, shadcn vs custom, brand tokens

**Rationale:** Silent defaults cause "wrong route" errors that are expensive to reverse
after 2+ stage's artifacts are generated. Intake costs < 1k tokens; reset costs
5-15k tokens. The ROI is unambiguous (MRD §3.5, TRUST-05 commitment).

**Verification:** Phase 2 stage workflow implementations MUST include the intake
sequence as the first action. Code review and route tests check for `intake()`
invocations in every stage entry point.

---

## Cross-references

| Requirement | Document | Test |
|-------------|----------|------|
| TRUST-01 | COPY-REVIEW-CHECKLIST.md | trust-posture.test.ts |
| TRUST-02 | CLAUDE.md (universal) | init.test.ts |
| TRUST-03 | references/gates/*.md | Phase 2 citation check |
| TRUST-04 | COPY-REVIEW-CHECKLIST.md | trust-posture.test.ts |
| TRUST-05 | This document | Phase 2 intake tests |
