---
name: "complete-design/style"
description: "Style-lite: emit provisional DTCG tokens (3 variants), run hi-fi preview with Playwright; gate returns not_runnable (v2.0b needed for full pass)"
stage: "5a"
gate: "gate/stage-5a-complete"
artifacts:
  reads:
    - "design/.handoff/stage-2-bundle.md"
  writes:
    - "design/tokens.json"
    - "design/.handoff/stage-5a-bundle.md"
composition:
  atoms:
    - "tokens/emit"
    - "hifi/variants-preview"
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

# style — Stage 5a-lite Style Workflow

Runs the Stage 5a-lite style workflow: TRUST-05 brand intake, DTCG token generation
with three adapter paths, hi-fi Playwright preview with 3 palette variants, and the
Stage 5a gate (which returns `not_runnable` in v2.0a — this is expected behavior).

**Fidelity contract (D-42):** All output is labeled `stage: 5a-lite, evidence: INFERRED`.
These are provisional artifacts. Full Stage 5a/5b completion requires Stage 4 interaction
specs (v2.0b). Do not treat `not_runnable` from the gate as an error.

**D-43 gate behavior:** `gate/stage-5a-complete` is hard-coded to return `not_runnable`
in v2.0a (codex §16 BLOCKER fix). This will not change until Phase 3 ships Stage 4
interaction artifacts. See step 9 for explicit user messaging.

**Trust posture (T-02-03-04):** This workflow REPORTS measured WCAG 2.2 AA contrast
ratios — it never CLAIMS WCAG conformance. All design decisions remain the user's.

---

## Procedure

1. **Read stage-2 handoff bundle.** Read `design/.handoff/stage-2-bundle.md`. If absent,
   halt: "Run the `structure` workflow first to generate the stage-2 handoff bundle."

2. **Pre-check token budget.** Inform the user of the style stage budget before starting:
   ```
   Bash: node bin/complete-design.mjs budget-check --stage style --check pre
   ```

3. **Load references.** Read the following reference files to inform token decisions:
   - `${CLAUDE_SKILL_DIR}/references/dtcg-v2025-10.md` — DTCG v2025.10 token spec
   - `${CLAUDE_SKILL_DIR}/references/shadcn-tailwind-v4.md` — shadcn/ui CSS variable naming
   - `${CLAUDE_SKILL_DIR}/references/wcag-2-2.md` — WCAG 2.2 AA contrast requirements

3a. **--depth dispatch (F-07):**
   - If `--depth lightweight`: skip TRUST-05 intake, use defaults (brand: professional/calm,
     primary: `oklch(60% 0.15 260)`, font: system-ui), generate 1 token variant only.
   - If `--depth full`: expand to 5 brand questions + 5 preview variants + extended contrast report.
   - Default (`--depth standard`): 3 questions, 3 variants (this procedure).

4. **TRUST-05 intake (standard/full only).** Ask the user EXACTLY these 3 questions before
   generating any tokens. Do NOT generate tokens until the user responds:

   (a) "What is the brand personality? Examples: professional/calm, playful/energetic,
       technical/minimal, warm/approachable"
   (b) "What is your primary brand color? (provide hex, oklch, or type 'choose for me')"
   (c) "What font family do you prefer? (or type 'default to system-ui stack')"

   Wait for user response. Parse answers before proceeding.

5. **Select palette.** Based on user answers, derive 3 OKLCH values:
   - `colorPrimary` — primary hue (from user or auto-selected from personality)
   - `colorBackground` — page background (light mode default: `oklch(98% 0.0 0)`)
   - `colorForeground` — default text (light mode default: `oklch(15% 0.0 0)`)
   - `borderRadius` — from personality (tight: `0.25rem`, balanced: `0.5rem`, rounded: `1rem`)

   **Contrast check:** Report measured WCAG 2.2 AA contrast ratios (do NOT claim compliance;
   report measurements only). Minimum recommended: 4.5:1 for normal text, 3:1 for large text.

6. **Inline ATOM-14 (tokens/emit).** Detect adapter from registry.mjs, then emit tokens:
   ```
   Bash: node assets/scripts/tokens-project.mjs \
     --design-dir design/ \
     --adapter <detected: shadcn|tailwind-v4|plain-css> \
     --color-primary '<oklch value>' \
     --color-background '<oklch value>' \
     --color-foreground '<oklch value>' \
     --border-radius '<rem value>' \
     --font-family-base '<font stack>'
   ```
   This writes `design/tokens.json` (DTCG v2025.10) to the staging area. The tokens are
   labeled `stage:5a-lite, evidence:INFERRED`. The adapter is determined by `detectStack()`
   from `assets/scripts/routing/registry.mjs`:
   - Next.js + Tailwind v4 + shadcn → `shadcn`
   - Tailwind v4 only → `tailwind-v4`
   - Otherwise → `plain-css`

7. **Inline ATOM-13 (hifi/variants-preview).** Spawn 3 hi-fi preview variants with slight
   palette variations (±10% lightness on primary):
   - Variant A: base palette from step 5
   - Variant B: primary lightness +10%
   - Variant C: primary lightness -10%

   For each variant:

   **7a. Emit variant tokens** (re-run tokens-project with adjusted palette):
   ```
   Bash: node assets/scripts/tokens-project.mjs \
     --design-dir design/ \
     --adapter <detected: shadcn|tailwind-v4|plain-css> \
     --color-primary '<variant oklch value>' \
     --color-background '<oklch value>' \
     --color-foreground '<oklch value>' \
     --border-radius '<rem value>' \
     --font-family-base '<font stack>'
   ```

   **7b. Spawn the dev server** (detect framework from registry.mjs):
   ```
   Bash: node bin/complete-design.mjs preview spawn \
     --framework <vite|next|astro> \
     --repo-root <absolute path to user repo root>
   ```
   This outputs JSON: `{ command, args, env, port, readyUrl, runId }`.
   Note the `readyUrl` (e.g., `http://127.0.0.1:<port>/`) for the screenshot step.

   **7c. Screenshot the running server** using Playwright (requires Playwright installed):
   ```
   Bash: npx playwright screenshot --browser chromium '<readyUrl>' \
     .complete-design/preview/run-<runId>/variant-<A|B|C>.png
   ```
   If Playwright is unavailable, skip screenshots and log a WARNING (see Host fallback below).

   **7d. Release the port** when done with each variant:
   ```
   Bash: node bin/complete-design.mjs preview release-port --run-id <runId>
   ```

   After generating all 3 variants, run the 6-axis visual diversity check. Minimum
   diversity score ≥0.15 between any pair of variants. If diversity < 0.15, log a
   WARNING but do not halt — variants are exploratory, not production selections.

   **Note (variant-screenshot gap):** `preview spawn` launches a dev server and returns
   its URL — it does not take screenshots automatically. The Playwright step (7c) is a
   manual invocation. Plan 02-05 (e2e fixture) owns adding automated per-variant screenshot
   capture to the preview harness CLI.

8. **Post-check token budget.** Check usage after tokens + preview:
   ```
   Bash: node bin/complete-design.mjs budget-check --stage style --check post
   ```
   If this exits 1 (hard-stop), inform the user: "Token usage exceeded 110k (2× p50).
   Re-run with --continue-anyway to proceed."

9. **Gate invocation (D-43 — CRITICAL).** Run the Stage 5a gate:
   ```
   Bash: node bin/complete-design.mjs gate --stage 5a --design-dir design/
   ```

   **Expected result: `not_runnable`**. This is CORRECT and EXPECTED in v2.0a.

   Surface to user:
   > "Stage 5a gate returns `not_runnable` — this is the expected v2.0a behavior.
   > Stage 4 interaction artifacts (Mermaid `stateDiagram-v2` + XState state machines)
   > are required for the full gate pass, which ships in v2.0b. Your `tokens.json` and
   > preview screenshots are labeled `evidence:INFERRED`. They are provisional artifacts
   > suitable for design review but not for a production release gate."

   Do NOT treat `not_runnable` as a workflow failure. Continue to step 10.

10. **Build handoff bundle.** Write the stage-5a handoff bundle. First, prepare a body file
    containing the LLM summary of what was produced (tokens, adapter, palette rationale):
    ```
    # Create body file with summary text (LLM fills in the content)
    Bash: echo "<summary of stage-5a tokens and palette decisions>" > /tmp/stage-5a-body.md
    ```
    Then build the bundle:
    ```
    Bash: node bin/complete-design.mjs handoff-bundle \
      --from 2 \
      --to 5a \
      --design-dir design/ \
      --body-file /tmp/stage-5a-body.md
    ```
    The `--body-file` argument must point to a Markdown file whose content becomes the
    bundle body. Typical content: palette choices, adapter used, contrast measurements,
    DTCG tier summary, and any provisional assumptions (D-42). The command outputs JSON
    with `{ tokenCount, tokens, truncationWarning, path }` — `path` is the written bundle.

11. **Present staged artifacts and await --apply.**
    Read the staged artifacts from `.complete-design/preview/run-<id>/`:
    - `tokens.json` (DTCG body)
    - Adapter projection file (CSS or tsx)
    - Preview screenshots (3 variants)

    Show a summary diff. If user approves with `--apply`:
    ```
    Bash: node bin/complete-design.mjs apply --design-dir design/
    ```
    This copies staged artifacts to `design/` and writes `design/.handoff/stage-5a-bundle.md`.

---

## Host fallback

For **Codex CLI** and **Cursor** (no subagent dispatch — sequential path):

Run each step above as a direct Bash command. The `node bin/complete-design.mjs` dispatcher
handles all subcommands. The preview harness (`step 7`) uses the sequential adapter path
from `assets/scripts/run-subagent.mjs` — this means preview runs one variant at a time.

If Playwright is unavailable in the host environment, step 7 is skipped and a WARNING
is logged: "Hi-fi preview requires Playwright. Install with: npm exec playwright install."
Token emit (step 6) and gate assertion (step 9) still run as normal.

**Codex CLI note:** Use `--depth lightweight` to stay well under the style budget if
context is limited. This skips TRUST-05 intake and uses safe defaults.
