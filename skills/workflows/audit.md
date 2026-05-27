---
name: "design-os/audit"
description: "Audit design artifacts: --slop-tells (regex linters) or --pr (Stage 5a/5b diff detectors); emits AUDIT-REPORT.md"
stage: "cross-stage"
gate: null
artifacts:
  reads:
    - "design/.handoff/stage-5b-bundle.md"
  writes:
    - "design/AUDIT-REPORT.md"
composition:
  atoms: []
mvp: true
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
  - Bash
---

# audit — W8-basic Cross-Stage Audit Workflow

Audits design artifacts for design-system violations, slop patterns, and PR regressions.
Emits a severity-ranked `AUDIT-REPORT.md` validated against `audit-report.v1.json`.

**v2.0a scope (W8-basic):** `--slop-tells` + `--pr` modes only.
`--reverse-engineer-stages` ships in Phase 3 (v2.0b). Do not invoke in v2.0a.

**Depth dispatch (F-07):**
- `--depth lightweight` — slop-tells only, no PR diff.
- `--depth standard` (default) — both modes when relevant flags are set.
- `--depth full` — both modes plus extended AUDIT-REPORT rationale context.

---

## Mode A: `--slop-tells`

Runs deterministic regex linters against CSS and TSX files.

### Step 1: Scan CSS and TSX files

```bash
node bin/design-os.mjs audit --slop-tells --scan-dir . --output .design-os/private/audit-findings.jsonl
```

Glob pattern: `{src,components,app}/**/*.{css,tsx,ts}` (excludes `node_modules`).

### Step 2: Collect findings

Run `detectSlopTells(content, filePath)` from `assets/scripts/audit/slop-tells.mjs`
on each file. Patterns loaded from `${CLAUDE_SKILL_DIR}/references/slop-tells/heuristics.md`:

| Pattern | FindingId | Severity |
| --- | --- | --- |
| Rainbow gradient (3+ named colors) | 5a-slop-001 | ERROR |
| Inter font hard-coded | 5a-slop-002 | WARNING |
| Glass-stack `backdrop-filter: blur()` | 5a-slop-003 | WARNING |
| Three-column equal grid | 5a-slop-004 | INFO |
| Linear gradient 3+ stops | 5a-slop-005 | WARNING |

### Step 3: Apply suppressions

Load `.design-os/audit-suppressions.json` if it exists.
Remove suppressed `findingId` entries from findings list.

### Step 4: Emit AUDIT-REPORT.md

Sort findings: BLOCKER → ERROR → WARNING → INFO.

Emit `design/AUDIT-REPORT.md` with YAML frontmatter:

```yaml
artifact: audit-report
stage: cross-stage
schemaVersion: 1
auditType: slop-tells
generated: <ISO timestamp>
sourceHash: sha256:<hash>
provenance: generated
owner: design-os/audit
lastReviewedAt: <ISO timestamp>
findings: [...]
```

Validate against `schemas/dist/audit-report.v1.json`:

```bash
node bin/design-os.mjs validate --artifact audit-report --file design/AUDIT-REPORT.md
```

### Step 5: Exit code

Exit 1 if any BLOCKER findings (unless `--continue-anyway` is set).
Exit 0 otherwise.

---

## Mode B: `--pr`

Runs Stage 5a and Stage 5b diff detectors against PR-changed files.

### Step 1: Identify changed files

```bash
git diff --name-only HEAD~1
```

In CI with `$GITHUB_BASE_REF` set:

```bash
git diff --name-only origin/$GITHUB_BASE_REF
```

### Step 2: Load handoff bundle context

```bash
# Read design/.handoff/stage-5b-bundle.md for context
```

If bundle is absent, continue without context (log INFO finding).

### Step 3: Route each changed file

- CSS/TSX files → `detectStage5aPrIssues(filePath, content)` from `stage-5a-pr.mjs`
- `design/tokens.json` → `detectStage5bPrIssues(filePath, content)` from `stage-5b-pr.mjs`
- Also run slop-tells on CSS/TSX changed files

### Step 4: Aggregate and emit

Follow Steps 3-5 from Mode A (apply suppressions, emit AUDIT-REPORT.md, exit code).

---

## CI integration

For CI use:

```bash
node bin/design-os.mjs audit --pr --block-on-severity BLOCKER
```

Only BLOCKER findings block CI by default. Configure via `.design-os/ci.yaml`:

```yaml
audit:
  blockOnSeverity: BLOCKER   # or ERROR, WARNING
```

---

## Host fallback

**Codex CLI / Cursor (sequential path, D-53):**
- Steps 1–5 execute inline in sequence.
- `git diff` for PR mode must be available in the shell environment.
- AUDIT-REPORT.md is written to `design/` directly (no staging area for audit reports).
- If `git` is unavailable, Mode B falls back to Mode A (slop-tells only).

---

## audit --reverse-engineer-stages (v2.0b, D-62..D-64)

Reverse-engineers Stage 4→3→2→1 artifacts from an existing prototype.
Primary use case: Lovable / v0 / Bolt / Subframe refugee who has a working prototype
but no design/ artifacts.

**When to use:**
- User has an existing live URL or cloned repo and wants to build a design/ foundation
- Migrating from a prototyping tool to the full 5-stage design-os workflow
- Auditing what design decisions were implicitly made in an existing app

### Two input modes

**Mode (a) — Local cloned repo:**
```bash
node bin/design-os.mjs reverse-engineer --source ./path/to/my-app --apply
```

**Mode (b) — Live URL (Playwright crawler, depth=1 — OQ-5):**
```bash
node bin/design-os.mjs reverse-engineer --source https://my-app.vercel.app --apply
```

Dry-run by default (shows what would be created). Use `--apply` to write artifacts.

### Inference order (D-63): Stage 4 → Stage 3 → Stage 2 → Stage 1

The pipeline runs in reverse-topological order — deepest structural signals first:

| Stage | Infers From | Confidence |
| ----- | ----------- | ---------- |
| Stage 4 (IxD) | Component async patterns, useState, error handlers | Low |
| Stage 3 (Wireframe) | Component tree shape, page files | Low |
| Stage 2 (IA/Sitemap) | File-based routing (Next.js App Router, React Router) | Medium |
| Stage 1 (Personas) | Landing page copy, onboarding text, README | Low |

### INFERRED trust posture (D-64) — non-negotiable

Every artifact emitted carries **two-layer INFERRED enforcement**:

1. **YAML frontmatter fields:**
   ```yaml
   provenance: inferred
   inferredDisclaimer: "INFERRED — validate before treating as ground truth"
   evidence: INFERRED
   ```

2. **Markdown body banner (first paragraph):**
   ```
   > **INFERRED** — This artifact was reverse-engineered from an existing prototype.
   > Treat all content as a starting hypothesis requiring validation. Do not merge
   > into `design/` without reviewing and amending each section.
   ```

Both layers are required. `frontmatter-validate.mjs` (Rule A) rejects any file in
`design/inferred/` that has `provenance:inferred` but is missing the body banner.

**Why two layers?** A frontmatter-only flag is invisible to LLM readers who quote
body text. A body-only banner can be stripped by careless copy-paste. Both layers
protect the trust posture (P12 + P15: synthetic-as-primary red line).

### Output structure (OQ-2 — mirrors design/ directory)

```
design/inferred/
  ia/sitemap.json              ← Stage 2
  research/personas/           ← Stage 1
  wireframes/<screen>/         ← Stage 3
  interactions/<screen>.spec.md ← Stage 4
```

### Token budget

Reverse-engineer pipeline: ≤120k tokens (D-62 DS-extraction route ceiling).
Each stage inference is bounded. URL crawl (Mode b): depth=1 only (OQ-5).

### After inference — promote-inferred workflow

1. Review all artifacts in `design/inferred/`
2. Remove `provenance: inferred` from frontmatter
3. Remove the `> **INFERRED** — ...` banner from the body
4. Amend each section with your actual design decisions
5. Promote: `node bin/design-os.mjs promote-inferred --file <path>`

`promote-inferred` blocks if either the frontmatter field or the body banner is
still present — you must explicitly clean both (Pitfall 12: refugee fidelity).

### Reference

- Pitfall 12 (Lovable refugee fidelity — `provenance:inferred` required on all artifacts)
- D-64 INFERRED trust posture
- OQ-2 (mirror structure confirmed)
- OQ-5 (URL crawler depth=1 confirmed)

---

## audit --new-feature (stub — Phase 4)

Post-hoc validator for an existing named feature against all 5 stages.

```bash
node bin/design-os.mjs audit --new-feature --feature <feature-name>
```

Takes an existing feature name (matching a route in `design/ia/sitemap.json`)
and verifies that all 5 stage artifacts exist and are internally consistent.
Does NOT generate new artifacts — use `design --route new-feature` for that.

**Status:** Implemented in design-os 03-05 (next plan).
