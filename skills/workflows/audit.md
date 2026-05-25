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
on each file. Patterns loaded from `references/slop-tells/heuristics.md`:

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
