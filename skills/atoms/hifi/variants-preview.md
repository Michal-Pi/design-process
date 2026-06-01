---
name: "complete-design/hifi/variants-preview"
description: "Spawn 3 hi-fi preview variants via Playwright + stage adapter; capture screenshots; check 6-axis visual diversity ≥0.15"
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

# hifi/variants-preview — ATOM-13: Hi-Fi Preview Variants

Spawns 3 hi-fi preview variants using the Phase 1 preview harness (Playwright + Vite/Next/Astro adapters),
captures screenshots, and checks 6-axis visual diversity between variants.

**Output:** 3 screenshots at `.complete-design/preview/run-<id>/screenshots/variant-{A,B,C}.png`

**Diversity check:** Any variant pair with < 0.15 diversity score logs a WARNING.
This is informational — variants are exploratory, not a production gate.

**Evidence (D-42):** All previews are labeled `stage:5a-lite, evidence:INFERRED`.

---

## Standalone bootstrap

Run this atom directly (no workflow context required).

Before generating previews, ask:

1. "Where is the design/tokens.json file? (or provide adapter-specific CSS file path)"
2. "Which framework adapter to use? (next, vite, or astro)"
3. "Should I generate 3 variants or just 1? (3 for exploration, 1 for quick preview)"

Then proceed to the workflow procedure below.

---

## Workflow procedure

1. **Read tokens from staging area.** Read `design/tokens.json` (or from `.complete-design/preview/run-<id>/tokens.json`
   if the parent workflow staged it there). Extract the `semantic.color.primary.$value` for
   palette variation.

2. **Generate 3 palette variants.** Create 3 variant configurations:
   - **Variant A:** Base palette from tokens (colorPrimary as-is)
   - **Variant B:** colorPrimary lightness +10% (e.g., `oklch(70% 0.2 270)` from `oklch(60% 0.2 270)`)
   - **Variant C:** colorPrimary lightness -10% (e.g., `oklch(50% 0.2 270)`)

   For each variant, call `emitTokens()` from `tokens-project.mjs` with the variant palette
   to generate a separate staging area under `.complete-design/preview/run-<id>/variant-{A,B,C}/`.

3. **Spawn dev server and capture screenshots.** For each of the 3 variants:

   3a. Reserve a port:
   ```
   const { reservePort } = await import('assets/scripts/port-manager.mjs');
   const { port, release } = await reservePort('preview-variant-A');
   ```

   3b. Prepare the dev server:
   ```
   // Select adapter based on detectStack() signals:
   //   nextjs → next-adapter.mjs, vite → vite-adapter.mjs, astro → astro-adapter.mjs
   const { prepare } = await import('assets/scripts/preview/next-adapter.mjs');
   await prepare(designDir, projectRoot);
   ```

   3c. Spawn server and probe with Playwright:
   ```
   const { spawnAndProbe } = await import('assets/scripts/playwright-runner.mjs');
   const { screenshots } = await spawnAndProbe(serverCmd, port, {
     signal: AbortSignal.timeout(30000),
     screenshotPath: '.complete-design/preview/run-<id>/screenshots/variant-A.png',
   });
   ```

   3d. Scrub environment before spawn (T-02-03-03 mitigation):
   ```
   const { scrubEnvForPreview } = await import('assets/scripts/security-sandbox.mjs');
   const safeEnv = scrubEnvForPreview(process.env);
   ```

   3e. Release port after screenshot:
   ```
   await release();
   ```

   If a variant preview fails (server timeout, Playwright error), log a WARNING and skip
   that variant. Do NOT halt the workflow — preview failures are non-blocking (T-02-03-05 accept).

4. **Check 6-axis visual diversity.** Compare all captured screenshots using `variant-distance.mjs`:
   ```
   const { computeVariantDistance } = await import('assets/scripts/preview/variant-distance.mjs');
   const distAB = await computeVariantDistance(screenshotA, screenshotB);
   const distAC = await computeVariantDistance(screenshotA, screenshotC);
   const distBC = await computeVariantDistance(screenshotB, screenshotC);
   ```

   If any pair has diversity < 0.15, log:
   > "WARNING: Variant pair {X}/{Y} diversity score {score} < 0.15 minimum.
   > Variants may appear too similar. Consider increasing lightness variation."

   This is a WARNING, not an error. Continue regardless.

5. **Return screenshot paths.** Return:
   ```json
   {
     "screenshots": ["path/to/variant-A.png", "path/to/variant-B.png", "path/to/variant-C.png"],
     "diversityScores": { "A-B": 0.22, "A-C": 0.31, "B-C": 0.18 },
     "stagingDir": ".complete-design/preview/run-<id>/"
   }
   ```

**Host fallback (D-53):** On Codex CLI or Cursor without Playwright, step 3 is skipped.
Log: "Playwright not available — skipping hi-fi preview. Token emit completed successfully."
The parent style workflow continues to step 8 (budget check) and step 9 (gate invocation).
