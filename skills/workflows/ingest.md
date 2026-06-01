---
name: "complete-design/ingest"
description: "Ingest PRD or launch Lenny 1-pager interview; emit design/PRD.md with frontmatter and stage-0 handoff bundle"
stage: 0
gate: null
artifacts:
  reads: []
  writes:
    - "design/PRD.md"
    - "design/.handoff/stage-0-bundle.md"
composition:
  atoms:
    - "prd/parse-or-interview"
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

# ingest — Stage 0 PRD Ingestion Workflow

Ingests an existing PRD or launches a Lenny 1-pager interview when no PRD is found.
Emits `design/PRD.md` with YAML frontmatter and a stage-0 handoff bundle for the
`discover` workflow to consume.

**Auto-detect (D-35):** Scans project root and `design/` for `PRD*.md` files.
If found with ≥50 tokens of structured content, parses it. Otherwise, launches
a 5-7 question interview.

**Depth dispatch (F-07):**
- `--depth lightweight` — use available PRD hints, skip extended intake.
- `--depth standard` (default) — standard 5-7 question interview if no PRD.
- `--depth full` — 9-question Lenny interview plus competitive analysis intake.

---

## Procedure

### Step 1: Initialise design directory

```bash
node bin/complete-design.mjs init --design-dir design/
```

Creates `design/` and `.complete-design/` structure if absent.

### Step 2: Auto-detect PRD (D-35)

Scan for `PRD*.md` in the project root and `design/` directory.

**If PRD found with ≥50 tokens of structured content:**
Proceed to Step 3 (parse).

**If no PRD found or content < 50 tokens:**
Proceed to Step 4 (interview).

### Step 3: Parse existing PRD

Read the PRD file. Extract:
- `product_name`
- `problem_statement`
- `target_users`
- `success_metrics`
- `constraints`
- `out_of_scope`

Surface: "Found PRD: `<product_name>`. Parsed `<N>` requirements."

Skip to Step 5.

### Step 4: Lenny 1-pager interview (ATOM-01)

Launch `prd/parse-or-interview` atom inline.

Ask the user 5-7 questions:

1. "What product are you building?"
2. "Who is the primary user?"
3. "What problem does it solve for them?"
4. "What does success look like in 6 months? (metric or milestone)"
5. "What are the biggest constraints? (time, team, budget, tech)"
6. "What is explicitly out of scope for v1?"
7. *(Optional)* "Are there existing solutions the user already has access to?"

Write interview output to `.complete-design/preview/run-<timestamp>/PRD.md` with YAML frontmatter:

```yaml
artifact: prd
stage: 0
provenance: generated
evidence: proto
schemaVersion: 1
generated: <ISO timestamp>
```

### Step 5: Stage and validate

Write staged PRD to `.complete-design/preview/run-<timestamp>/PRD.md`.

Validate frontmatter:

```bash
node bin/complete-design.mjs validate --artifact prd --file .complete-design/preview/run-<timestamp>/PRD.md
```

### Step 6: Handoff bundle

```bash
node bin/complete-design.mjs handoff-bundle --stage 0 --design-dir design/
```

### Step 7: Present diff and await --apply

Show the user the staged `PRD.md`. Await explicit `--apply` confirmation before
writing to `design/PRD.md`.

```bash
node bin/complete-design.mjs apply --run-id <timestamp> --design-dir design/
```

Surface: "PRD staged at `.complete-design/preview/run-<timestamp>/PRD.md`. Run `--apply` to commit. Next step: `design --route <suggested-route>`."

---

## Host fallback

**Codex CLI / Cursor (sequential path, D-53):**
- Step 1–7 execute inline in sequence.
- No parallel subagent spawning.
- If Playwright is unavailable, skip screenshot steps.
- The interview in Step 4 runs as a synchronous Q&A in the active context.
- The handoff bundle (Step 6) falls back to a simplified text summary if
  `handoff-bundle-build.mjs` is unavailable.
