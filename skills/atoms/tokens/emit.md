---
name: "design-os/tokens/emit"
description: "Emit DTCG v2025.10 design tokens JSON + adapter projection (Tailwind v4 @theme / shadcn CSS vars / plain :root); all evidence:INFERRED"
stage: "5a"
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

# tokens/emit — ATOM-14: DTCG Token Emission

Emits `design/tokens.json` (DTCG v2025.10 three-tier format) plus an adapter-specific
projection file. All output is labeled `stage:5a-lite, evidence:INFERRED`.

**DTCG tiers (D-41):**
- `primitive` — raw OKLCH color values, spacing scale, typography
- `semantic` — role-mapped aliases (background, foreground, primary, border, muted)
- `component` — component-specific tokens (button, input, card)

**Adapters (D-48):**
- `shadcn` — CSS variables using shadcn/ui naming (`--background`, `--primary`, etc.)
- `tailwind-v4` — Tailwind v4 `@theme {}` block (merges into existing globals.css; additive only)
- `plain-css` — `:root {}` CSS custom properties (OKLCH values — CSS Color 4)

---

## Standalone bootstrap

Run this atom without a full workflow context (no `design/.handoff/stage-2-bundle.md` required).

Before generating tokens, ask:

1. "Which adapter does your project use? (`shadcn` for Next.js + Tailwind v4 + shadcn/ui,
   `tailwind-v4` for Tailwind v4 only, or `plain-css` for everything else)"
2. "What is your primary brand color? (oklch, hex, or 'choose for me')"
3. "What is your background color preference? (light/dark/auto)"

Then proceed to the workflow procedure below.

---

## Workflow procedure

1. **Detect adapter.** Use `detectStack(projectRoot)` from `assets/scripts/routing/registry.mjs`:
   - `nextjs && tailwindV4 && shadcn` → adapter: `shadcn`
   - `tailwindV4` (no shadcn) → adapter: `tailwind-v4`
   - otherwise → adapter: `plain-css`

   Override with `--adapter <name>` flag if provided by the parent workflow.

2. **Invoke tokens-project.mjs.** Emit tokens with LLM-provided color/scale values:
   ```
   Bash: node assets/scripts/tokens-project.mjs \
     --design-dir design/ \
     --adapter <detected> \
     --color-primary '<oklch()>' \
     --color-background '<oklch()>' \
     --color-foreground '<oklch()>' \
     --border-radius '<rem>' \
     --font-family-base '<font stack>'
   ```

   **Input validation (T-02-03-01 mitigated in script):** All color values must be OKLCH
   format. The script rejects non-OKLCH values with a descriptive error.

3. **Validate emitted tokens.json.** Verify the DTCG structure is valid:
   - Every token node must have `$type` and `$value`
   - `$type` must be a DTCG v2025.10 allowed type
   - Frontmatter must contain `evidence: INFERRED`

4. **Return result.** The script returns:
   ```json
   {
     "tokensPath": "design/tokens.json",
     "projectionPath": ".design-os/preview/run-<id>/design-os-tokens.css",
     "adapterUsed": "shadcn|tailwind-v4|plain-css"
   }
   ```

   Pass `projectionPath` and `adapterUsed` to the parent workflow for the preview step.

**Note on evidence (D-51):** `INFERRED` is the only schema-valid evidence value for Stage 5a/5b
artifacts in v2.0a. The frontmatter validator rejects any `evidence: validated` on these artifacts.
