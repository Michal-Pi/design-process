# Copy Review Checklist

Use this checklist before publishing any copy: SKILL.md descriptions, README sections,
release notes, blog posts, landing page copy, or any text a user will read about complete-design.

---

## Before publishing any copy

- [ ] Read every sentence aloud and ask: "Does this promise something a one-shot tool does?"
  If yes, rewrite to emphasize the structured, staged, validated workflow.
- [ ] Run `tests/governance/trust-posture.test.ts` against the draft to scan for forbidden phrases.
- [ ] Confirm no WCAG conformance claims appear (see Forbidden Phrases below).
- [ ] Confirm no "AI design" framing appears (see Forbidden Phrases below).
- [ ] Check that every contrast/accessibility claim uses measured numbers, not compliance labels.

---

## Forbidden Phrases

These phrases are **never** allowed in shipping copy:

| Forbidden | Why forbidden | Correct alternative |
|-----------|---------------|---------------------|
| `AI design` | Implies one-shot hi-fi generation — wrong positioning | "5-stage design process" |
| `AI-powered design` | Same as above | "design scaffolding for your agent" |
| `AI-driven design` | Same as above | "structured design workflow" |
| `intelligent design` | Confusing and has unintended connotations | "5-stage design process" |
| `automatically design` | Design is not automatic — it requires validation | "scaffolds and validates" |
| `AI design tool` | Wrong category | "agent-native design workflow" |
| `AI design assistant` | Same as above | "5-stage design orchestrator" |
| `WCAG compliant` | Legal conformance claim — not defensible | "WCAG 2.2 AA contrast 4.7:1 (pass)" |
| `WCAG-compliant` | Same as above | (same — use measured numbers) |
| `WCAG conformant` | Same as above | (same — use measured numbers) |
| `WCAG-conformant` | Same as above | (same — use measured numbers) |
| `accessibility-certified` | Same as above | (same — use measured numbers) |
| `meets WCAG` | Implied conformance claim | "contrast 4.7:1 exceeds WCAG 2.2 AA minimum" |

---

## Required substitutions

For accessibility-related copy, always use this format:

> `WCAG 2.2 AA contrast 4.7:1 (pass)` — measured, not certified.

For product description copy, use:

> "complete-design walks the 5-stage Garrett design process — research, IA, low-fi, interaction,
> hi-fi/tokens — with validation gates between stages, inside the coding agent you already use."

---

## Correct framing examples

**Elevator pitch:**
> "Design-os scaffolds the 5-stage design process inside your coding agent — each stage validated
> before the next begins, so prototypes don't break at production scale."

**Feature description:**
> "Stage-1 research produces validated personas (not synthetic guesses). Stage-2 IA maps
> navigation before any wireframes exist. Each gate persists decisions so you can resume
> any time."

**Contrast metric:**
> "The contrast checker reports measured ratios: `WCAG 2.2 AA 4.7:1 (pass)`. It never
> claims WCAG conformance — that requires a full manual audit."

---

## Sign-off

Before any copy ships:

- [ ] Reviewed by: _______________
- [ ] Date: _______________
- [ ] Trust-posture test: PASS
- [ ] No forbidden phrases found: YES
