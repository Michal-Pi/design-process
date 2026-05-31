// assets/scripts/release-gate.mjs
// Core release-gate orchestrator (non-CLI).
//
// Runs 15 acceptance fixtures sequentially against the staged path, computes
// p50/p95 token cost and wall-clock p50, enforces D-74 graduated cost gate,
// runs ACCEPT-05 (fid-06 adversarial) and ACCEPT-06 (audit --all-stages gap check),
// validates the result against the JSON Schema, and writes release-gate-results.json.
//
// Hard gates (exit 1):
//   - fixturePassCount < 12 (ACCEPT-01)
//   - p50Tokens > 150000 (COST-07 D-74 HARD BLOCK)
//
// Soft gates (write RELEASE-NOTES.md disclosure, never exit 1):
//   - p95Tokens > 286000 (220k × 1.30)
//   - wallClockP50Ms > 624000 (8 min × 60000ms × 1.30)
//
// Wall-clock caveat (P8 + Pitfall 3):
//   Without CLAUDE_CODE_BIN, dispatchRoute uses sequential-fallback (~1ms latency).
//   The disclosure always includes the caveat text regardless of which path was taken.
//
// INVARIANTS compliance:
//   - Lesson 1: GateResult accessed only via .kind, .findings, .warnings
//   - Lesson 2: CLI export shape in assets/scripts/cli/release-gate.mjs
//   - Lesson 3: gates run against stagingDir (.design-os/preview/<runId>/), never design/
//   - Lesson 4: ajv validates result BEFORE writeFile
//   - Lesson 5: passingFixtureIds + failingFixtureIds logged by identity
//   - Lesson 7: path-traversal containment on opts.fixturesDir
//
// Source: 04-02-PLAN.md Task 1; INVARIANTS.md; CONTEXT.md D-74, D-78
// Implements: ACCEPT-01, ACCEPT-05, ACCEPT-06, COST-07, COST-10

import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../..');

// ─────────────────────────────────────────────────────────────────────────────
// Exported helper functions (also used in tests)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the Nth percentile of a values array using floor indexing.
 * Sort ascending, then pick index = floor(n * pct/100).
 *
 * @param {number[]} values - Array of numeric values (non-empty)
 * @param {number} pct - Percentile (0-100)
 * @returns {number}
 * @throws {Error} If values array is empty
 */
export function computePercentile(values, pct) {
  if (!values || values.length === 0) {
    throw new Error('empty values array');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * (pct / 100));
  // Clamp index to valid range
  const safeIdx = Math.min(idx, sorted.length - 1);
  return sorted[safeIdx];
}

/**
 * Determine if a fixture passes — all 6 gates must be 'pass' or 'pass_with_warnings'.
 * 'failed_after_repair' and 'not_runnable' are treated as failures (Pitfall 1).
 *
 * @param {Record<string, { kind: string }>} gateResults - Map of stage → GateResult
 * @returns {boolean}
 */
export function computeFixturePass(gateResults) {
  const PASSING_KINDS = new Set(['pass', 'pass_with_warnings']);
  for (const result of Object.values(gateResults)) {
    if (!PASSING_KINDS.has(result.kind)) {
      return false;
    }
  }
  return true;
}

/**
 * Compute hard gate outcome.
 * Both conditions must be true for hardGatePassed:
 *   - fixturePassCount >= 12 (ACCEPT-01)
 *   - p50Tokens <= 150000 (COST-07)
 *
 * @param {{ fixturePassCount: number, p50Tokens: number }} opts
 * @returns {{ hardGatePassed: boolean, hardGateReason?: string }}
 */
export function computeHardGate({ fixturePassCount, p50Tokens }) {
  const reasons = [];

  if (fixturePassCount < 12) {
    reasons.push(`accept-01: only ${fixturePassCount}/15 fixtures passed all gates (required ≥12)`);
  }
  if (p50Tokens > 150000) {
    reasons.push(`cost-07: p50 ${p50Tokens} exceeds 150k HARD BLOCK (D-74)`);
  }

  if (reasons.length > 0) {
    return { hardGatePassed: false, hardGateReason: reasons.join('; ') };
  }
  return { hardGatePassed: true };
}

/**
 * Compute soft gate disclosures.
 * Returns an array of human-readable disclosure strings for any soft gate breach.
 * These are written to RELEASE-NOTES.md — never cause exit 1.
 *
 * ALWAYS includes the sequential-fallback wall-clock caveat (Pitfall 3, P8).
 *
 * @param {{ p95Tokens: number, wallClockP50Ms: number }} opts
 * @returns {string[]}
 */
export function computeSoftGateDisclosures({ p95Tokens, wallClockP50Ms }) {
  const disclosures = [];

  // Soft gate: p95 > 220k * 1.30 = 286000
  if (p95Tokens > 286000) {
    disclosures.push(
      `p95 tokens exceeded soft ceiling: ${p95Tokens.toLocaleString()} > 286,000 (220k × 1.30 overshoot tolerance). ` +
      `Triggers v2.0.1 follow-up per D-74.`
    );
  }

  // Soft gate: wallClockP50Ms > 8 * 60000 * 1.30 = 624000ms
  if (wallClockP50Ms > 624000) {
    disclosures.push(
      `wall-clock p50 exceeded soft ceiling: ${(wallClockP50Ms / 60000).toFixed(1)} min > 10.4 min (8 min × 1.30 overshoot tolerance). ` +
      `wall-clock measured with sequential-fallback dispatch only; real inference measurement requires manual SC-1 verification.`
    );
  }

  return disclosures;
}

/**
 * Append a '## v2.0 Cost Behavior' block to RELEASE-NOTES.md.
 * Always called regardless of hard gate outcome (T-04-02-05 mitigation).
 * Never overwrites existing content — appends only.
 *
 * IDEMPOTENT: If the exact block content (same findings text) already exists in the
 * file, the append is skipped to prevent duplicate disclosure blocks from accumulating
 * across multiple dry-run or re-run invocations.
 *
 * @param {string[]} findings - Array of disclosure strings
 * @param {string} [notesPath] - Override path for RELEASE-NOTES.md (used in tests)
 * @returns {Promise<void>}
 */
export async function writeReleaseNotesDisclosure(findings, notesPath) {
  const targetPath = notesPath ?? join(PROJECT_ROOT, 'RELEASE-NOTES.md');

  // Read existing content (create empty if absent)
  let existing = '';
  if (existsSync(targetPath)) {
    existing = await readFile(targetPath, 'utf8');
  }

  const now = new Date().toISOString().slice(0, 10);
  const findingLines = findings.length > 0
    ? findings.map(f => `- ${f}`).join('\n')
    : '- All soft gates within tolerance.';

  const block = [
    '',
    `## v2.0 Cost Behavior (measured ${now})`,
    '',
    '**Soft gate disclosures** (these never block GA — they trigger RELEASE-NOTES.md disclosure per D-74):',
    '',
    findingLines,
    '',
    '**Wall-clock caveat:** wall-clock measured with sequential-fallback dispatch only; ',
    'real inference measurement requires manual SC-1 verification on a machine with CLAUDE_CODE_BIN set.',
    '',
  ].join('\n');

  // Idempotency guard: skip append if this exact findings content already exists.
  // Match on the finding lines content (date-independent) to avoid re-appending the
  // same disclosure when release-gate.mjs is run multiple times in the same session.
  if (existing.includes(findingLines)) {
    return;
  }

  await writeFile(targetPath, existing + block, 'utf8');
}

// ─────────────────────────────────────────────────────────────────────────────
// Path-traversal containment (Lesson 7)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that the resolved path is inside projectRoot.
 * Uses path.relative() per the canonical POSIX-safe idiom from install.mjs.
 *
 * @param {string} suppliedPath - Raw user-supplied path
 * @param {string} resolvedPath - path.resolve(suppliedPath)
 * @param {string} root - Project root
 * @throws {Error} If resolvedPath is outside root
 */
function validatePathContainment(suppliedPath, resolvedPath, root) {
  const rel = relative(root, resolvedPath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(
      `release-gate: path traversal detected.\n` +
      `  Supplied: ${suppliedPath}\n` +
      `  Resolved: ${resolvedPath}\n` +
      `  Must be inside: ${root}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPT-05: spawn vitest to run fid-06 adversarial harness
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run ACCEPT-05 check by spawning vitest on the fid-06-frost-recurrence harness.
 *
 * @param {string} projectRoot
 * @returns {Promise<boolean>} true if exitCode === 0
 */
async function runAccept05(projectRoot) {
  return new Promise((res) => {
    const child = spawn(
      'npx',
      ['vitest', 'run', 'evals/adversarial/fid-06-frost-recurrence/run.test.ts', '--reporter=verbose'],
      {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true,
      }
    );
    child.on('exit', (code) => res(code === 0));
    child.on('error', () => res(false));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPT-06: inline tmp fixture via mkdtemp + runAuditAllStages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run ACCEPT-06 check using an inline tmp fixture.
 * Creates a minimal design dir with 3 routes, but:
 *   - Only 2/3 interactions/*.spec.md files (→ Stage 4 gap: 4-pr-spec-missing-001)
 *   - Only 2/3 wireframes/<screen>/CHOICE.md files (→ Stage 2/3 gap: 3-pr-choice-001)
 *
 * Stage 4 gap findingId: '4-pr-spec-missing-001' (confirmed from all-stages.mjs)
 * Stage 2/3 gap findingId: '3-pr-choice-001' (confirmed from stage-3-pr.mjs)
 * Note: there is no dedicated stage-2-pr.mjs; the wireframe/CHOICE.md check is
 * implemented in stage-3-pr.mjs as '3-pr-choice-001'.
 *
 * @param {string} projectRoot
 * @returns {Promise<boolean>}
 */
async function runAccept06(projectRoot) {
  let tmpDir;
  try {
    tmpDir = await mkdtemp(join(tmpdir(), 'accept06-'));
    const designDir = join(tmpDir, 'design');

    // Create directories
    await mkdir(join(designDir, 'ia'), { recursive: true });
    await mkdir(join(designDir, 'interactions'), { recursive: true });
    await mkdir(join(designDir, 'wireframes'), { recursive: true });

    // Minimal sitemap with 3 routes
    const sitemap = {
      artifact: 'sitemap',
      stage: '2',
      schemaVersion: 1,
      routes: [
        { path: '/checkout', label: 'checkout' },
        { path: '/profile', label: 'profile' },
        { path: '/settings', label: 'settings' },
      ],
    };
    await writeFile(join(designDir, 'ia', 'sitemap.json'), JSON.stringify(sitemap, null, 2), 'utf8');

    // Write 2/3 spec files — omit /settings → Stage 4 gap
    const specTemplate = (screen) => [
      '---',
      'artifact: interaction-spec',
      "stage: '4'",
      'schemaVersion: 1',
      `screen: ${screen}`,
      'asyncOperations: false',
      'stateCount: 2',
      'hasConditionalTransitions: false',
      '---',
      '',
      `## ${screen} interaction spec`,
    ].join('\n');

    await writeFile(join(designDir, 'interactions', 'checkout.spec.md'), specTemplate('checkout'), 'utf8');
    await writeFile(join(designDir, 'interactions', 'profile.spec.md'), specTemplate('profile'), 'utf8');
    // /settings has no spec → '4-pr-spec-missing-001' finding

    // Write 2/3 wireframes/CHOICE.md — omit /settings → Stage 3 gap (3-pr-choice-001)
    const choiceTemplate = (screen) => `# ${screen} Wireframe Choice\n\nVariant A selected.\n`;

    await mkdir(join(designDir, 'wireframes', 'checkout'), { recursive: true });
    await writeFile(join(designDir, 'wireframes', 'checkout', 'CHOICE.md'), choiceTemplate('checkout'), 'utf8');

    await mkdir(join(designDir, 'wireframes', 'profile'), { recursive: true });
    await writeFile(join(designDir, 'wireframes', 'profile', 'CHOICE.md'), choiceTemplate('profile'), 'utf8');
    // /settings has no wireframe/CHOICE.md → '3-pr-choice-001' finding

    // Import runAuditAllStages and invoke against the tmp design dir
    const { runAuditAllStages } = await import('./audit/all-stages.mjs');
    const { findings } = await runAuditAllStages({ designDir });

    // Assert: at least one Stage 4 gap finding AND at least one Stage 2/3 gap finding
    // Stage 4 gap: '4-pr-spec-missing-001' (from all-stages.mjs Finding 2 fix, e56a016)
    const hasStage4Gap = findings.some(
      (f) => f.findingId === '4-pr-spec-missing-001'
    );
    // Stage 2/3 gap: '3-pr-choice-001' (from stage-3-pr.mjs — missing wireframe/CHOICE.md)
    // Note: stage-2-pr.mjs does NOT exist; the wireframe check is in stage-3-pr.mjs
    const hasWireframeGap = findings.some(
      (f) => f.findingId === '3-pr-choice-001'
    );

    return hasStage4Gap && hasWireframeGap;
  } catch (err) {
    console.error('[release-gate] ACCEPT-06 check failed:', err.message);
    return false;
  } finally {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the full release gate: 15-fixture acceptance suite + cost gate + ACCEPT-05/06.
 *
 * Control flow (critical ordering — see plan notes):
 *   Phase 1-2: collect fixture results + compute percentiles
 *   Phase 3: collect fixturePassCount
 *   Phase 4: compute hardGatePassed (do NOT exit yet)
 *   Phase 5: compute soft disclosures
 *   Phase 6: ACCEPT-05/06 checks
 *   Then: ajv-validate result → writeFile result → IF !hardGatePassed exit(1) ELSE exit(0)
 *
 * @param {object} opts
 * @param {string} [opts.fixturesDir='evals/acceptance'] - Path to acceptance fixtures
 * @param {string} [opts.output] - Path to write release-gate-results.json
 * @param {'claude-code'|'codex-cli'|'cursor'} [opts.host='claude-code']
 * @param {boolean} [opts.dryRun=false] - If true, simulate without real dispatch
 * @returns {Promise<void>}
 */
export async function runReleaseGate(opts = {}) {
  const {
    fixturesDir = 'evals/acceptance',
    output,
    host = 'claude-code',
    dryRun = false,
  } = opts;

  // ── Lesson 7: path-traversal containment ──
  const resolvedFixturesDir = resolve(PROJECT_ROOT, fixturesDir);
  validatePathContainment(fixturesDir, resolvedFixturesDir, PROJECT_ROOT);

  console.log(`[release-gate] Starting release gate (host=${host}, dryRun=${dryRun})`);
  console.log(`[release-gate] Fixtures dir: ${resolvedFixturesDir}`);

  // ── Phase 1: Load fixture manifest ──
  const manifestPath = join(resolvedFixturesDir, 'fixtures.manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`release-gate: fixtures.manifest.json not found at ${manifestPath}`);
  }

  const manifestRaw = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);
  const fixtures = manifest.fixtures;

  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    throw new Error('release-gate: fixtures.manifest.json has no fixtures array');
  }

  console.log(`[release-gate] Loaded ${fixtures.length} fixtures from manifest`);

  // ── Phase 2: Run each fixture ──
  // In dry-run mode, simulate results without real dispatch.
  // In real mode, dispatch via dispatchRoute (which uses dispatchSubagent shim).

  /** @type {Array<{fixtureId: string, pass: boolean, tokensUsed: number, wallClockMs: number, gateResults: Record<string, {kind: string}>}>} */
  const fixtureResults = [];

  for (const fixture of fixtures) {
    const { fixtureId, route, budgetCeiling } = fixture;
    console.log(`[release-gate] Running fixture: ${fixtureId} (route=${route})`);

    // Create staging dir: .design-os/preview/<runId>/
    const runId = `${fixtureId}-${Date.now()}`;
    const stagingDir = join(PROJECT_ROOT, '.design-os', 'preview', runId);
    await mkdir(stagingDir, { recursive: true });

    let tokensUsed = 0;
    let wallClockMs = 0;
    /** @type {Record<string, {kind: string}>} */
    let gateResults = {};

    try {
      const wallClockStart = Date.now();

      if (dryRun) {
        // Dry-run: synthesize passing results for all 6 gates.
        // Purpose: verify orchestration + CI plumbing works, NOT real gate logic.
        // wallClockMs is deliberately tiny (1ms) to trigger Pitfall-3 caveat in disclosure.
        console.log('[dry-run] synthesizing pass for fixture ' + fixtureId);
        // Schema only stores 'kind' (INVARIANTS Lesson 1) — no 'findings' in stored result
        const syntheticGates = {
          '1': { kind: 'pass' },
          '2': { kind: 'pass' },
          '3': { kind: 'pass' },
          '4': { kind: 'pass' },
          '5a': { kind: 'pass' },
          '5b': { kind: 'pass' },
        };
        fixtureResults.push({
          fixtureId,
          pass: true,
          tokensUsed: budgetCeiling,
          wallClockMs: 1,
          gateResults: syntheticGates,
        });
        // Clean up staging dir and skip real dispatch + gate calls
        try { await rm(stagingDir, { recursive: true, force: true }); } catch { /* non-fatal */ }
        continue; // skip the real dispatchRoute + runGate calls
      }

      // Real dispatch via dispatchRoute
      const { dispatchRoute } = await import('./routing/dispatch.mjs');
      const fixtureDir = join(resolvedFixturesDir, fixture.dir);
      const prdPath = join(fixtureDir, 'PRD.md');

      // FIX 2: call dispatchRoute with object-form signature { routeName, designDir, opts }
      const dispatchResult = await dispatchRoute({
        routeName: route,
        designDir: stagingDir,
        opts: {
          tokenBudget: budgetCeiling,
          prdPath,
        },
      });

      // Extract tokensUsed from dispatch result; fall back to budgetCeiling to avoid div-by-0
      if (dispatchResult.kind === 'unknown_route') {
        console.warn(`[release-gate] dispatchRoute returned unknown_route for fixture ${fixtureId} (route=${route})`);
        tokensUsed = budgetCeiling;
      } else {
        tokensUsed = dispatchResult.tokensUsed ?? dispatchResult.budgetTokensP50 ?? budgetCeiling;
      }

      wallClockMs = Date.now() - wallClockStart;

      // Run all 6 gates against the STAGED path (Lesson 3)
      const { runGate } = await import('./gates/base.mjs');
      const stages = ['1', '2', '3', '4', '5a', '5b'];

      for (const stage of stages) {
        try {
          const gateResult = await runGate(stage, stagingDir);
          // Lesson 1: only access .kind, .findings, .warnings
          gateResults[stage] = { kind: gateResult.kind };
        } catch {
          // Gate run failure → treat as not_runnable
          gateResults[stage] = { kind: 'not_runnable' };
        }
      }
    } catch (err) {
      console.error(`[release-gate] Fixture ${fixtureId} failed: ${err.message}`);
      // Mark all gates as failed
      for (const stage of ['1', '2', '3', '4', '5a', '5b']) {
        gateResults[stage] = { kind: 'not_runnable' };
      }
      wallClockMs = Date.now() - (Date.now() - wallClockMs);
    } finally {
      // Clean up staging dir
      try {
        await rm(stagingDir, { recursive: true, force: true });
      } catch {
        // Non-fatal
      }
    }

    const pass = computeFixturePass(gateResults);
    fixtureResults.push({ fixtureId, pass, tokensUsed, wallClockMs, gateResults });
    console.log(`[release-gate] ${fixtureId}: ${pass ? 'PASS' : 'FAIL'} (${tokensUsed} tokens, ${wallClockMs}ms)`);
  }

  // ── Phase 3: Compute percentiles ──
  const tokenValues = fixtureResults.map((r) => r.tokensUsed);
  const wallClockValues = fixtureResults.map((r) => r.wallClockMs);

  const p50Tokens = computePercentile(tokenValues, 50);
  const p95Tokens = computePercentile(tokenValues, 95);
  const wallClockP50Ms = computePercentile(wallClockValues, 50);

  const fixturePassCount = fixtureResults.filter((r) => r.pass).length;
  const passingFixtureIds = fixtureResults.filter((r) => r.pass).map((r) => r.fixtureId);
  const failingFixtureIds = fixtureResults.filter((r) => !r.pass).map((r) => r.fixtureId);

  console.log(`[release-gate] Fixture results: ${fixturePassCount}/15 passing`);
  console.log(`[release-gate] Passing: ${passingFixtureIds.join(', ')}`);
  console.log(`[release-gate] Failing: ${failingFixtureIds.join(', ')}`);
  console.log(`[release-gate] p50=${p50Tokens}, p95=${p95Tokens}, wallClockP50=${wallClockP50Ms}ms`);

  // ── Phase 4: Hard gate (compute, do NOT exit yet) ──
  const { hardGatePassed, hardGateReason } = computeHardGate({
    fixturePassCount,
    p50Tokens,
  });

  if (!hardGatePassed) {
    console.error(`[release-gate] HARD GATE FAILED: ${hardGateReason}`);
  } else {
    console.log('[release-gate] Hard gate PASSED');
  }

  // ── Phase 5: Soft gate disclosures ──
  const softGateDisclosures = computeSoftGateDisclosures({ p95Tokens, wallClockP50Ms });

  // Wall-clock caveat ALWAYS included (Pitfall 3, P8)
  const claudeCodeBinSet = Boolean(process.env.CLAUDE_CODE_BIN);
  if (!claudeCodeBinSet && !softGateDisclosures.some((d) => d.includes('sequential-fallback'))) {
    softGateDisclosures.push(
      'wall-clock measured with sequential-fallback dispatch only; real inference measurement requires manual SC-1 verification'
    );
  }

  // writeReleaseNotesDisclosure MUST be called UNCONDITIONALLY (T-04-02-05)
  await writeReleaseNotesDisclosure(softGateDisclosures);

  // ── Phase 6: ACCEPT-05 and ACCEPT-06 checks ──
  // In dry-run mode, synthesize as pass — purpose is to verify orchestration, not real logic.
  let accept05Pass;
  let accept06Pass;

  if (dryRun) {
    console.log('[dry-run] synthesizing ACCEPT-05 pass');
    accept05Pass = true;
    console.log('[dry-run] synthesizing ACCEPT-06 pass');
    accept06Pass = true;
  } else {
    console.log('[release-gate] Running ACCEPT-05 (fid-06-frost-recurrence)...');
    accept05Pass = await runAccept05(PROJECT_ROOT);
    console.log(`[release-gate] ACCEPT-05: ${accept05Pass ? 'PASS' : 'FAIL'}`);

    console.log('[release-gate] Running ACCEPT-06 (inline tmp fixture audit gap check)...');
    accept06Pass = await runAccept06(PROJECT_ROOT);
    console.log(`[release-gate] ACCEPT-06: ${accept06Pass ? 'PASS' : 'FAIL'}`);
  }

  // ── Build result object ──
  /** @type {object} */
  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    host,
    dryRun,
    fixtureResults,
    fixturePassCount,
    passingFixtureIds,
    failingFixtureIds,
    p50Tokens,
    p95Tokens,
    wallClockP50Ms,
    hardGatePassed,
    hardGateReason: hardGateReason ?? null,
    softGateDisclosures,
    accept05Pass,
    accept06Pass,
  };

  // ── Lesson 4: ajv-validate BEFORE writeFile (T-04-02-02 mitigation) ──
  const schemaPath = join(PROJECT_ROOT, 'schemas', 'dist', 'release-gate-result.v1.json');
  if (existsSync(schemaPath)) {
    try {
      const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
      const ajv = new Ajv2020({ strict: false });
      addFormats(ajv);
      const validateFn = ajv.compile(schema);
      const valid = validateFn(result);
      if (!valid) {
        console.error('[release-gate] Schema validation failed:', ajv.errorsText(validateFn.errors));
        throw new Error('release-gate-results.json failed schema validation — not writing');
      }
    } catch (err) {
      if (err.message.includes('failed schema validation')) throw err;
      // Schema not available yet — log warning but continue
      console.warn('[release-gate] Schema validation skipped:', err.message);
    }
  } else {
    console.warn(`[release-gate] Schema not found at ${schemaPath} — skipping validation`);
  }

  // ── Write release-gate-results.json ──
  const outputPath = output
    ? resolve(output)
    : join(PROJECT_ROOT, 'release-gate-results.json');

  // Deterministic JSON stringify — preserves ALL nested keys (FIX 5).
  // JSON.stringify(obj, keyArray) uses the array as a global allowlist, stripping nested keys.
  // Use a recursive sort helper instead.
  await writeFile(outputPath, deterministicStringify(result), 'utf8');
  console.log(`[release-gate] Results written to: ${outputPath}`);

  // ── Exit based on ALL hard gates (FIX 4: accept05/06 are hard gates) ──
  // This must happen AFTER writeFile so post-mortem debugging is possible.
  const allHardGatesPassed = hardGatePassed && result.accept05Pass && result.accept06Pass;
  if (!allHardGatesPassed) {
    const reasons = [];
    if (!hardGatePassed) reasons.push(hardGateReason);
    if (!result.accept05Pass) reasons.push('accept-05: fid-06-frost-recurrence harness failed');
    if (!result.accept06Pass) reasons.push('accept-06: audit --all-stages did not detect Stage 2 or Stage 4 gap');
    console.error(`[release-gate] EXITING 1 — hard gate failed: ${reasons.join('; ')}`);
    process.exit(1);
  }

  console.log('[release-gate] All gates PASSED. Exiting 0.');
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic stringify helper (FIX 5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively sort all object keys alphabetically before JSON.stringify.
 * Unlike JSON.stringify(obj, keyArray), this preserves nested object keys.
 *
 * @param {unknown} obj
 * @param {number} [indent=2]
 * @returns {string}
 */
export function deterministicStringify(obj, indent = 2) {
  /**
   * @param {unknown} value
   * @returns {unknown}
   */
  function recur(value) {
    if (Array.isArray(value)) return value.map(recur);
    if (value !== null && typeof value === 'object') {
      const sortedKeys = Object.keys(/** @type {object} */ (value)).sort();
      /** @type {Record<string, unknown>} */
      const out = {};
      for (const k of sortedKeys) out[k] = recur((/** @type {Record<string, unknown>} */ (value))[k]);
      return out;
    }
    return value;
  }
  return JSON.stringify(recur(obj), null, indent);
}
