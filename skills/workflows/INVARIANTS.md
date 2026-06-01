---
name: "complete-design/invariants"
description: "Cross-cutting invariants that all complete-design workflow authors must uphold. Violating these creates footguns that have already burned 3 of 4 prior workflow contributors."
type: reference
---

# complete-design Workflow Invariants

Invariants every workflow author MUST uphold. These are not conventions — they are hard constraints enforced by the gate layer. Violating them has already burned 3 of 4 prior workflow contributors.

---

## INVARIANT-01: Gate against the staged path, never the live `design/` directory

**Rule:** Every gate check MUST run against `.complete-design/preview/run-<timestamp>/` BEFORE the user runs `--apply`. Gates MUST NOT read from `design/` as their primary evaluation target.

**Why this is a footgun:** If you gate against `design/` directly, you validate what the user already committed — not what the workflow is about to produce. A gate that passes on committed artifacts but fails on staged artifacts provides zero protection. Three prior workflow authors forgot this and shipped gates that silently did nothing.

**Correct pattern:**
```
1. Workflow emits artifacts to .complete-design/preview/run-<id>/
2. Gate runs: node bin/complete-design.mjs gate --stage N --design-dir .complete-design/preview/run-<id>/
3. Gate passes → diff surfaced → user runs --apply → artifacts move to design/
4. Gate fails → diff surfaced → user fixes → re-emit → re-gate
```

**Incorrect pattern (do not do this):**
```
❌ node bin/complete-design.mjs gate --stage N --dir design/   ← gates AFTER the fact; protects nothing
❌ Using a non-existent --staged flag (correct flag is --design-dir)
```

**Enforced by:** `gate-stage-5b.mjs` preview-path assertion (added Plan 02-04, commit 44d7c21). Similar assertions added to gates 1a, 2, 4.

**See also:** CONTEXT.md D-52 (apply.mjs diff-by-default), D-45 (PR audit reads git diff).

---

## INVARIANT-02: `--apply` is required; never auto-write to `design/`

**Rule:** Workflow scripts MUST write to `.complete-design/preview/run-<timestamp>/`. Writing directly to `design/` is forbidden. The user explicitly runs `--apply` to move staged artifacts to `design/`.

**Why:** Trust posture (non-negotiable per project CLAUDE.md). Auto-publishing to the user's git tree without confirmation violates the "diff-by-default" principle. The user must see what will change before it's committed.

**Implementation reference:** `assets/scripts/cli/apply.mjs` — `applyStaging({ stagingPath, designDir })`.

---

## INVARIANT-03: `evidence` field is never auto-set to `validated`

**Rule:** Scripts and workflows MUST NOT emit `evidence: validated` on any artifact. Only a human reviewing the artifact can set `evidence: validated`.

**Allowed automatic values:**
- `evidence: proto` — LLM-generated, not yet reviewed
- `evidence: inferred` — derived algorithmically from other artifacts
- `evidence: missing` — provenance unknown

**Why:** `evidence: validated` is the red line for synthetic persona outputs (MRD P12) and design system contracts (Stage 5b). An LLM claiming its own output is "validated" is circular and trust-breaking.

**Checked by:** `gate-stage-5b.mjs` evidence guard, `gate-stage-1.mjs` persona provenance check.

---

## INVARIANT-04: Skill descriptions ≤ 200 chars

**Rule:** Every `description:` field in a `SKILL.md` frontmatter MUST be ≤ 200 characters.

**Why:** Codex 2% trigger metadata cap. Exceeding the cap causes the skill to be silently dropped from the trigger index. The character count includes all whitespace.

**Enforced by:** `evals/hosts/codex-cli/host-profile.test.ts` (checks description length on every SKILL.md).

**Current usage (as of Phase 2):**
```
complete-design/ingest:      108 chars ✓
complete-design/discover:    106 chars ✓
complete-design/structure:   109 chars ✓
complete-design/style:       108 chars ✓
complete-design/systematize: 106 chars ✓
complete-design/audit:       112 chars ✓
```

---

## INVARIANT-05: No LLM client imports in `assets/scripts/`

**Rule:** Scripts under `assets/scripts/` MUST NOT import from `@anthropic-ai/sdk`, `openai`, or any other LLM client package. These scripts are deterministic emitters — they compute, they do not generate.

**Why:** SKILL.md workflows dispatch to the host agent for LLM work. Scripts compute deterministic transformations (token emit, contrast math, schema validation, regex matching). Importing an LLM client in a deterministic script violates the separation of concerns and adds network dependencies that break CI in offline environments.

**Enforced by:** `assets/scripts/lint-determinism.mjs` (CI gate — blocks on first violation).

---

## INVARIANT-06: `findingId` format for all audit findings

**Rule:** Every finding emitted by audit scripts MUST use the `<stage-prefix>-<category>-<nnn>` format with lowercase stage prefix and zero-padded number. Example: `5a-slop-001`, `5b-evidence-001`.

**Pattern:** `^[A-Za-z0-9][A-Za-z0-9-]*-\d+$`

**Why:** The audit-report.v1.json schema validates findingIds. Non-conforming IDs cause schema validation failures in CI and in the AUDIT-REPORT.md emit gate.

**Schema source:** `schemas/src/audit-report.ts` (pattern propagates to `schemas/dist/audit-report.v1.json` via `npm run schemas:emit`).

---

## When to update this file

Add a new invariant when:
1. A gate check enforces a new structural constraint across all workflows.
2. A footgun is discovered during codex review (MRD §11 GTM hook).
3. A Phase N → Phase N+1 contract changes a cross-cutting requirement.

Do NOT add workflow-specific implementation notes here — use the workflow's own SKILL.md comments. This file documents invariants that apply to ALL workflows.
