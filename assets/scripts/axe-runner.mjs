// assets/scripts/axe-runner.mjs
// Core axe-runner: WCAG 2.2 AA contrast gate on 15 acceptance fixture outputs.
//
// Loads tokens.json from each fixture's expected/ directory, builds a minimal
// HTML scaffold with OKLCH→hex color tokens via culori, runs axe-core's wcag2aa
// rule set via Playwright headless Chromium, and hard-blocks if ANY fixture fails.
//
// Hard block (D-78): exit 1 if any of the 15 fixtures' generated outputs fail
// WCAG 2.2 AA contrast. No soft tolerance.
//
// INVARIANTS compliance:
//   - Lesson 2: CLI export in assets/scripts/cli/axe-runner.mjs
//   - Lesson 5: axe-results.json includes BOTH passingFixtures AND failingFixtures by fixtureId
//   - Lesson 7: path-traversal containment on opts.fixturesDir
//   - INVARIANT-05: no LLM imports — axe-core + Playwright + culori only
//
// Source: 04-02-PLAN.md Task 2; INVARIANTS.md; CONTEXT.md D-78
// Implements: ACCEPT-09

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parse as culoriParse, formatHex } from 'culori';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../..');

// Lazy-require axe-core to get the browser injection source
const require = createRequire(import.meta.url);

// ─────────────────────────────────────────────────────────────────────────────
// Path-traversal containment (Lesson 7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that the resolved path is inside projectRoot.
 *
 * @param {string} suppliedPath
 * @param {string} resolvedPath
 * @param {string} root
 * @throws {Error} If resolvedPath is outside root
 */
function validatePathContainment(suppliedPath, resolvedPath, root) {
  const rel = relative(root, resolvedPath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(
      `axe-runner: path traversal detected.\n` +
      `  Supplied: ${suppliedPath}\n` +
      `  Resolved: ${resolvedPath}\n` +
      `  Must be inside: ${root}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Token scaffold builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively walk DTCG tokens object and collect color tokens.
 * Returns an array of { path: string, hexValue: string }.
 *
 * DTCG format: { $type: 'color', $value: 'oklch(...)' }
 * Uses culori.parse + formatHex for OKLCH → hex conversion.
 * Skips tokens with invalid/undefined values (defensive per Pitfall 4).
 *
 * @param {object} tokens - DTCG tokens object
 * @param {string} [prefix=''] - Current token path prefix
 * @returns {Array<{path: string, hexValue: string}>}
 */
function collectColorTokens(tokens, prefix = '') {
  /** @type {Array<{path: string, hexValue: string}>} */
  const result = [];

  if (!tokens || typeof tokens !== 'object') return result;

  for (const [key, value] of Object.entries(tokens)) {
    if (!value || typeof value !== 'object') continue;

    const tokenPath = prefix ? `${prefix}-${key}` : key;

    if (value.$type === 'color' && typeof value.$value === 'string') {
      // OKLCH → hex via culori
      const parsed = culoriParse(value.$value);
      if (parsed) {
        const hex = formatHex(parsed);
        if (hex && hex !== 'undefined' && !hex.includes('undefined')) {
          result.push({ path: tokenPath, hexValue: hex });
        }
      }
      // If parse returns undefined, skip token (defensive per plan)
    } else if (!('$type' in value) && !('$value' in value)) {
      // Nested token group — recurse
      result.push(...collectColorTokens(value, tokenPath));
    }
    // Non-color $type tokens are skipped
  }

  return result;
}

/**
 * Build a minimal HTML scaffold from DTCG tokens for axe-core contrast checking.
 *
 * Takes parsed tokens.json (DTCG format) and returns an HTML string with:
 *   - :root { <CSS custom properties> } block
 *   - A colored div per color token for contrast checking
 *   Each div has: background-color from the token, black text, padding, font-size:16px
 *
 * @param {object} tokens - Parsed DTCG tokens.json content
 * @returns {string} Minimal HTML string
 */
export function buildTokenScaffold(tokens) {
  const colorTokens = collectColorTokens(tokens);

  const cssVars = colorTokens
    .map(({ path, hexValue }) => `    --token-${path}: ${hexValue};`)
    .join('\n');

  const divs = colorTokens
    .map(({ path }) =>
      `  <div style="background-color: var(--token-${path}); color: #000; padding: 0.5rem; font-size: 1rem;">` +
      `Sample text for ${path}</div>`
    )
    .join('\n');

  return [
    '<html>',
    '<head>',
    '<style>',
    ':root {',
    cssVars || '  /* no color tokens */',
    '}',
    '</style>',
    '</head>',
    `<body>`,
    divs || '<!-- no color tokens to check -->',
    '</body>',
    '</html>',
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Result builder (exported for testability — Lesson 5 identity assertion)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the axe-results.json result object with BOTH count AND identity (Lesson 5).
 * Includes passingFixtures AND failingFixtures arrays with fixtureId strings.
 *
 * @param {Array<{fixtureId: string, pass: boolean, violations: unknown[]}>} results
 * @returns {{ pass: boolean, fixtureCount: number, passingFixtures: string[], failingFixtures: string[] }}
 */
export function buildAxeRunnerResult(results) {
  const passingFixtures = results
    .filter((r) => r.pass || (Array.isArray(r.violations) && r.violations.length === 0))
    .map((r) => r.fixtureId);
  const failingFixtures = results
    .filter((r) => !r.pass && Array.isArray(r.violations) && r.violations.length > 0)
    .map((r) => r.fixtureId);

  const pass = failingFixtures.length === 0;

  return {
    pass,
    fixtureCount: results.length,
    passingFixtures,
    failingFixtures,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-fixture axe runner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run axe-core WCAG 2.2 AA contrast check on a single fixture.
 *
 * 1. Load tokens.json from tokensPath (defaults to fixtureDir/expected/tokens.json,
 *    overridable via outputDir — see runAxeRunner opts.outputDir)
 * 2. FAIL the fixture if tokens.json is absent (D-78 hard block — absent output IS a failure)
 * 3. Build HTML scaffold via buildTokenScaffold
 * 4. Launch Playwright chromium headless browser
 * 5. Set page content to scaffold HTML
 * 6. Inject axe-core via page.addScriptTag({ content: axeSource })
 * 7. Run axe.run({ runOnly: { type: 'tag', values: ['wcag2aa'] } })
 * 8. Filter for 'color-contrast' violations
 * 9. Close browser after each fixture (no shared instance — avoid test isolation bleed)
 *
 * @param {string} fixtureDir - Absolute path to the fixture directory
 * @param {string} [tokensOverridePath] - Optional override path for tokens.json
 * @returns {Promise<{fixtureId: string, pass: boolean, violations: unknown[], contrastValues: Record<string, string>, note?: string}>}
 */
export async function runAxeOnFixture(fixtureDir, tokensOverridePath) {
  const fixtureId = fixtureDir.split('/').pop() ?? fixtureDir;
  const tokensPath = tokensOverridePath ?? join(fixtureDir, 'expected', 'tokens.json');

  if (!existsSync(tokensPath)) {
    // FIX 3: absent output is a FAILURE, not a skip.
    // D-78: axe-runner gate hard block; no soft tolerance.
    // axe-runner requires generated output — run release-gate first, or this fixture is not ready.
    return {
      fixtureId,
      pass: false,
      violations: [{
        id: 'fixture-output-absent',
        impact: 'critical',
        description: `No tokens.json found at ${tokensPath}. axe-runner requires generated output to check contrast. Run \`design-os design --route <route> --apply\` first, or this fixture is not yet ready for the accessibility gate.`,
      }],
      contrastValues: {},
    };
  }

  let tokens;
  try {
    const raw = await readFile(tokensPath, 'utf8');
    tokens = JSON.parse(raw);
  } catch (err) {
    // FIX 3: unparsable tokens.json is also a failure
    return {
      fixtureId,
      pass: false,
      violations: [{
        id: 'fixture-output-unparsable',
        impact: 'critical',
        description: `tokens.json at ${tokensPath} could not be parsed: ${err.message}`,
      }],
      contrastValues: {},
    };
  }

  const htmlScaffold = buildTokenScaffold(tokens);

  // Load axe-core source for injection
  let axeSource;
  try {
    const axeCorePath = require.resolve('axe-core');
    axeSource = require('node:fs').readFileSync(axeCorePath, 'utf8');
  } catch (err) {
    throw new Error(`axe-runner: cannot load axe-core source: ${err.message}`);
  }

  // Launch Playwright headless Chromium
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlScaffold);

    // Inject axe-core into the page
    await page.addScriptTag({ content: axeSource });

    // Run axe.run with wcag2aa tag — await the inner Promise
    const axeResults = await page.evaluate(async () => {
      // @ts-ignore — window.axe injected by addScriptTag
      return await window.axe.run({ runOnly: { type: 'tag', values: ['wcag2aa'] } });
    });

    // Filter for color-contrast violations only
    const contrastViolations = (axeResults.violations ?? []).filter(
      (/** @type {{id: string}} */ v) => v.id === 'color-contrast'
    );

    return {
      fixtureId,
      pass: contrastViolations.length === 0,
      violations: contrastViolations,
      contrastValues: {},
    };
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main axe-runner orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run axe-core WCAG 2.2 AA contrast checks on all 15 acceptance fixture outputs.
 * Exits 1 if any fixture fails (D-78 hard block, no soft tolerance).
 *
 * @param {object} opts
 * @param {string} [opts.fixturesDir='evals/acceptance'] - Path to acceptance fixtures
 * @param {string} [opts.output] - Path to write axe-results.json
 * @param {string} [opts.outputDir] - If set, read tokens.json from <outputDir>/<fixtureId>/tokens.json
 *   instead of <fixtureDir>/expected/tokens.json. Use after release-gate produces staged outputs.
 * @param {boolean} [opts.failFast=false] - Stop after first failure
 * @returns {Promise<void>}
 */
export async function runAxeRunner(opts = {}) {
  const {
    fixturesDir = 'evals/acceptance',
    output,
    outputDir,
    failFast = false,
  } = opts;

  // ── Lesson 7: path-traversal containment ──
  const resolvedFixturesDir = resolve(PROJECT_ROOT, fixturesDir);
  validatePathContainment(fixturesDir, resolvedFixturesDir, PROJECT_ROOT);

  console.log(`[axe-runner] Starting WCAG 2.2 AA contrast gate (D-78)`);
  console.log(`[axe-runner] Fixtures dir: ${resolvedFixturesDir}`);

  // Load fixture manifest
  const manifestPath = join(resolvedFixturesDir, 'fixtures.manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`axe-runner: fixtures.manifest.json not found at ${manifestPath}`);
  }

  const manifestRaw = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);
  const fixtures = manifest.fixtures;

  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    throw new Error('axe-runner: fixtures.manifest.json has no fixtures array');
  }

  console.log(`[axe-runner] Running contrast checks on ${fixtures.length} fixtures`);

  /** @type {Array<{fixtureId: string, pass: boolean, violations: unknown[]}>} */
  const results = [];

  for (const fixture of fixtures) {
    const fixtureDir = join(resolvedFixturesDir, fixture.dir);
    console.log(`[axe-runner] Checking: ${fixture.fixtureId}`);

    // If --output-dir provided, read staged tokens from there instead of expected/
    const tokensOverridePath = outputDir
      ? join(resolve(outputDir), fixture.fixtureId, 'tokens.json')
      : undefined;

    const result = await runAxeOnFixture(fixtureDir, tokensOverridePath);
    results.push(result);

    if (result.note) {
      console.log(`[axe-runner] ${fixture.fixtureId}: SKIPPED (${result.note})`);
    } else if (result.pass) {
      console.log(`[axe-runner] ${fixture.fixtureId}: PASS`);
    } else {
      console.error(`[axe-runner] ${fixture.fixtureId}: FAIL (${result.violations.length} contrast violation(s))`);
      if (failFast) {
        console.error('[axe-runner] --fail-fast: stopping after first failure');
        break;
      }
    }
  }

  // ── Build result with BOTH passingFixtures AND failingFixtures (Lesson 5) ──
  const axeRunnerResult = buildAxeRunnerResult(results);

  // Extend with full detail
  const fullResult = {
    ...axeRunnerResult,
    generatedAt: new Date().toISOString(),
    results: results.map((r) => ({
      fixtureId: r.fixtureId,
      pass: r.pass,
      violationCount: Array.isArray(r.violations) ? r.violations.length : 0,
      note: (r).note ?? null,
    })),
  };

  console.log(
    `[axe-runner] Summary: ${axeRunnerResult.passingFixtures.length} passing, ` +
    `${axeRunnerResult.failingFixtures.length} failing`
  );

  // Write axe-results.json if output path provided
  if (output) {
    const outputPath = resolve(output);
    await writeFile(outputPath, JSON.stringify(fullResult, null, 2), 'utf8');
    console.log(`[axe-runner] Results written to: ${outputPath}`);
  }

  // ── Exit: hard block on ANY failure (D-78) ──
  if (!axeRunnerResult.pass) {
    console.error(
      `[axe-runner] EXITING 1 — WCAG 2.2 AA contrast violations detected in: ` +
      axeRunnerResult.failingFixtures.join(', ')
    );
    process.exit(1);
  }

  console.log('[axe-runner] All fixtures PASS WCAG 2.2 AA contrast. Exiting 0.');
  process.exit(0);
}
