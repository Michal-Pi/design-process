// assets/scripts/cross-host-parity.mjs
// Cross-host parity sampled driver (D-77, DIST-05/06).
//
// Runs a deterministic sample of fixtures against a target host (Codex CLI or Cursor)
// and compares the pass-rate against the Claude Code host-first baseline.
//
// Algorithm (D-77):
//   1. Load fixtures.manifest.json from opts.fixturesDir (default: evals/acceptance).
//   2. Select deterministic sample of N=5 fixtures (1 per use-case category + 1 route-mandatory).
//   3. For each sampled fixture: set host env vars, run dispatchRoute + all 6 gates.
//   4. Compute host pass-rate; load baseline from opts.baseline.
//   5. Compute delta = |hostPassRate - baselinePassRate| (absolute, not signed).
//   6. If delta > 0.10 AND sampleSize < 15: escalate to full N=15 re-run.
//   7. Write parity-results.json with count (pass-rate) AND identity (sampledFixtures[]).
//   8. process.exit(delta <= 0.10 ? 0 : 1)
//
// Lesson 5 (count + identity): parity-results.json includes BOTH:
//   - hostPassRate (count — fraction of fixtures passing)
//   - sampledFixtures (identity — list of fixture IDs in the run that produced exit code)
//
// Lesson 6 (real CLI flags): HOST_PROFILE env var is NOT read by detectHost() in
//   run-subagent.mjs. The actual dispatch path depends on CODEX_CLI_SESSION / CURSOR_SESSION /
//   CLAUDE_CODE_SESSION env vars. cross-host-parity sets these env vars when running sampled
//   fixtures, but without real host CLI binaries installed (CLAUDE_CODE_BIN / CODEX_CLI_BIN /
//   CURSOR_BIN), dispatch returns sequential-fallback (~1ms, schema+gate checks only, no LLM).
//   P8 trust-posture: warn clearly rather than produce vacuous comparison.
//
// Lesson 7 (path-traversal): opts.fixturesDir, opts.baseline, opts.output are all
//   user-controlled. Resolve each via path.resolve() + containment check against projectRoot.
//
// Source: 04-CONTEXT.md D-77; 04-RESEARCH.md §Group D; INVARIANTS.md Lessons 5, 6, 7
// Implements: DIST-05 (Codex CLI parity), DIST-06 (Cursor parity)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dispatchRoute } from './routing/dispatch.mjs';
import { runGate } from './gates/base.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');

/** Escalation threshold (D-77). */
const DELTA_THRESHOLD = 0.10;

/** Default sample size per host (D-77). */
const DEFAULT_SAMPLE_SIZE = 5;

/** Full escalation sample size (D-77). */
const ESCALATION_SAMPLE_SIZE = 15;

/** Use-case categories to sample from (D-77). */
const USE_CASE_CATEGORIES = ['b2b-saas', 'consumer', 'dashboard', 'marketing'];

/** Route-mandatory routes for the 5th fixture slot (D-77). */
const ROUTE_MANDATORY = ['mature-app-refactor', 'DS-extraction'];

/**
 * Validate that a user-supplied path resolves inside the project root sandbox.
 * Prevents path-traversal attacks via user-controlled CLI flags (Lesson 7).
 *
 * @param {string} suppliedPath - Raw user-supplied path value.
 * @param {string} label - Human-readable label for error messages.
 * @returns {string} The resolved absolute path (safe to use).
 * @throws {Error} If the resolved path escapes the project root sandbox.
 */
function validatePathSandbox(suppliedPath, label) {
  const resolved = resolve(suppliedPath);
  const rel = relative(PROJECT_ROOT, resolved);

  // Reject if the relative path starts with '..' (escapes project root) or is absolute.
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(
      `cross-host-parity: ${label} path is outside the project root sandbox.\n` +
      `  Supplied: ${suppliedPath}\n` +
      `  Resolved: ${resolved}\n` +
      `  Project root: ${PROJECT_ROOT}\n` +
      `  Rejected to prevent path-traversal. Use a path inside the project root.`
    );
  }

  return resolved;
}

/**
 * FixtureManifestEntry — shape of each fixture in fixtures.manifest.json.
 * @typedef {{
 *   fixtureId: string,
 *   dir: string,
 *   route: string,
 *   useCase: string,
 *   stack: string,
 *   budgetCeiling: number
 * }} FixtureManifestEntry
 */

/**
 * Select a deterministic sample of fixtures for cross-host parity testing (D-77).
 *
 * Algorithm:
 *   1. Stable-sort all fixtures by fixtureId (locale 'en', no Math.random()).
 *   2. If sampleSize >= fixtures.length: return ALL fixtures in sorted order (full corpus).
 *   3. Otherwise build base sample (5 slots):
 *      a. For each use-case category (b2b-saas, consumer, dashboard, marketing):
 *         - Filter fixtures by that category.
 *         - Sort by fixtureId for stability.
 *         - Take fixture[0] (first after sort).
 *      b. 5th slot: first fixture NOT already selected where
 *         route === 'mature-app-refactor' || route === 'DS-extraction'.
 *         (Sorted by fixtureId for stability. If none exist, skip the 5th slot.)
 *   4. For sampleSize between 6 and (fixtures.length-1): extend base sample monotonically
 *      by appending fixtures from the sorted list (skipping already-selected ones) until
 *      the requested sampleSize is reached. This makes the function monotone:
 *      selectDeterministicSample(f, N+1) ⊇ selectDeterministicSample(f, N).
 *   5. Return deduplicated array of exactly sampleSize fixtures (or all if fewer available).
 *
 * No Math.random(), no Date.now(), no locale-sensitive sort.
 * Same inputs → same output (required by D-77 determinism guarantee).
 *
 * @param {FixtureManifestEntry[]} fixtures - All fixtures from the manifest.
 * @param {number} [sampleSize=5] - Target sample size.
 * @returns {FixtureManifestEntry[]} Deterministic sample (up to sampleSize fixtures).
 */
export function selectDeterministicSample(fixtures, sampleSize = DEFAULT_SAMPLE_SIZE) {
  // Stable sort all fixtures by fixtureId for deterministic ordering.
  const sorted = [...fixtures].sort(
    (a, b) => a.fixtureId.localeCompare(b.fixtureId, 'en', { sensitivity: 'variant' })
  );

  // If caller wants the full corpus (or more), return all fixtures in deterministic order.
  if (sampleSize >= sorted.length) {
    return sorted.map(f => ({ ...f }));
  }

  // Build base sample: 4 category slots + 1 route-mandatory slot.
  const selected = [];
  const selectedIds = new Set();

  // Step 1: 1 fixture per use-case category, sorted by fixtureId for stability.
  for (const category of USE_CASE_CATEGORIES) {
    if (selected.length >= sampleSize) break;

    const categoryFixtures = sorted.filter(f => f.useCase === category);
    if (categoryFixtures.length > 0 && categoryFixtures[0] !== undefined) {
      const first = categoryFixtures[0];
      selected.push(first);
      selectedIds.add(first.fixtureId);
    }
  }

  // Step 2: 5th slot — first route-mandatory fixture NOT already selected.
  // This slot ensures at least one route-mandatory (mature-app-refactor or DS-extraction)
  // appears in the sample for route-coverage purposes (D-77).
  //
  // Note: The dashboard category slot already picks fixture-11-dashboard-ds-extraction
  // (DS-extraction route) with the actual acceptance fixtures, so the route-mandatory
  // requirement is often already satisfied. The 5th slot adds another fixture when
  // a not-yet-selected route-mandatory exists, which may share a useCase with a
  // category-slot fixture (e.g., fixture-08-consumer-lovable shares 'consumer').
  // This is acceptable: the 5-fixture mandate (D-77) takes priority over strict
  // useCase-per-slot uniqueness.
  if (selected.length < sampleSize) {
    const routeMandatoryFixtures = sorted.filter(
      f => ROUTE_MANDATORY.includes(f.route) && !selectedIds.has(f.fixtureId)
    );

    if (routeMandatoryFixtures.length > 0 && routeMandatoryFixtures[0] !== undefined) {
      const first = routeMandatoryFixtures[0];
      selected.push(first);
      selectedIds.add(first.fixtureId);
    }
    // If all route-mandatory fixtures are already in the selected set (e.g., because
    // a category-slot fixture has a route-mandatory route), the sample size stays < 5.
    // This is correct: we never add duplicate fixtures to pad the sample.
  }

  // Step 3 (extension): For sampleSize > base sample, extend monotonically from sorted list.
  // This ensures selectDeterministicSample(f, N+1) ⊇ selectDeterministicSample(f, N).
  if (selected.length < sampleSize) {
    for (const fx of sorted) {
      if (selected.length >= sampleSize) break;
      if (!selectedIds.has(fx.fixtureId)) {
        selected.push(fx);
        selectedIds.add(fx.fixtureId);
      }
    }
  }

  // Return shallow copies of the selected fixtures to prevent mutation aliasing.
  return selected.map(f => ({ ...f }));
}

/**
 * Compute the parity delta between host and baseline pass-rates.
 *
 * Delta is absolute (not signed) — a host outperforming the baseline by more
 * than 0.10 is also flagged for investigation (per D-77 symmetric parity check).
 *
 * @param {number} hostPassRate - Measured pass-rate for the target host (0.0-1.0).
 * @param {number} baselinePassRate - Baseline pass-rate from Claude Code (0.0-1.0).
 * @returns {number} Absolute delta |hostPassRate - baselinePassRate|.
 */
export function computeParityDelta(hostPassRate, baselinePassRate) {
  return Math.abs(hostPassRate - baselinePassRate);
}

/**
 * Per-host BIN environment variable that gates REAL host CLI dispatch.
 * Session env vars (CODEX_SESSION, CURSOR_SESSION, etc.) indicate WHERE we are running,
 * NOT whether real dispatch will happen. Only BIN vars actually wire real dispatch to
 * a host CLI binary. (Lesson 6 / Codex P2 finding)
 *
 * Exported for testing: allows tests to verify the correct BIN var is keyed per host.
 */
export const HOST_BIN_VAR = /** @type {Record<string, string>} */ ({
  'claude-code': 'CLAUDE_CODE_BIN',
  'codex-cli': 'CODEX_CLI_BIN',
  'cursor': 'CURSOR_BIN',
});

/**
 * Check whether real host dispatch is configured for the given host.
 * Returns true only when the per-host BIN env var is set (i.e., a real CLI binary
 * has been wired). Session env vars (CODEX_SESSION etc.) are NOT checked here —
 * they indicate the running environment, not whether real dispatch will happen.
 *
 * Lesson 6: HOST_PROFILE is NOT read by detectHost(). The actual dispatch path
 * depends on BIN env vars (CLAUDE_CODE_BIN / CODEX_CLI_BIN / CURSOR_BIN).
 * Without a BIN var, dispatch returns sequential-fallback (~1ms, no real LLM).
 *
 * Exported for testing.
 *
 * @param {string} host - Target host identifier ('claude-code' | 'codex-cli' | 'cursor').
 * @returns {boolean} True if the host BIN env var is set (real dispatch configured).
 */
export function isRealHostDispatchConfigured(host) {
  const binVar = HOST_BIN_VAR[host];
  return Boolean(binVar && process.env[binVar]);
}

/**
 * Set host-simulation env vars for the target host during fixture dispatch.
 * This triggers the correct branch in detectHost() for the dispatch shim.
 *
 * Lesson 6: HOST_PROFILE is a test-only label (vitest.config.ts) — it is NOT
 * read by detectHost(). We must set CODEX_CLI_SESSION or CURSOR_SESSION instead.
 *
 * @param {'codex-cli' | 'cursor'} host - Target host identifier.
 * @returns {() => void} Cleanup function to restore original env vars.
 */
function setHostEnv(host) {
  const originalEnv = {
    CODEX_CLI_SESSION: process.env.CODEX_CLI_SESSION,
    CODEX_SESSION: process.env.CODEX_SESSION,
    CURSOR_SESSION: process.env.CURSOR_SESSION,
    CURSOR_AGENT_SESSION: process.env.CURSOR_AGENT_SESSION,
    CLAUDE_CODE_SESSION: process.env.CLAUDE_CODE_SESSION,
    CLAUDE_CODE_BIN: process.env.CLAUDE_CODE_BIN,
    HOST_PROFILE: process.env.HOST_PROFILE,
  };

  // Clear Claude Code session to prevent it from taking precedence
  delete process.env.CLAUDE_CODE_SESSION;
  // Also clear CLAUDE_CODE_BIN to force sequential-fallback path for host simulation
  // (unless the user explicitly has CODEX_CLI_BIN / CURSOR_BIN set for real dispatch)
  if (!isRealHostDispatchConfigured(host)) {
    delete process.env.CLAUDE_CODE_BIN;
  }

  if (host === 'codex-cli') {
    process.env.CODEX_CLI_SESSION = process.env.CODEX_CLI_SESSION || 'cross-host-parity-sim';
    process.env.HOST_PROFILE = 'codex-cli';
  } else if (host === 'cursor') {
    process.env.CURSOR_SESSION = process.env.CURSOR_SESSION || 'cross-host-parity-sim';
    process.env.HOST_PROFILE = 'cursor';
  }

  return () => {
    // Restore original env vars
    for (const [key, val] of Object.entries(originalEnv)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
  };
}

/**
 * Run all 6 stage gates against a staged directory and count passes.
 * A fixture passes if ALL gate results have kind 'pass' or 'pass_with_warnings'.
 *
 * INVARIANTS.md Lesson 1: access only result.kind, result.findings, result.warnings.
 *
 * @param {string} stagingDir - Staged design directory to gate.
 * @returns {Promise<boolean>} True if all 6 gates pass (or pass_with_warnings).
 */
async function runAllGates(stagingDir) {
  const PASS_KINDS = new Set(['pass', 'pass_with_warnings']);
  const STAGES = ['1', '2', '3', '4', '5a', '5b'];

  for (const stage of STAGES) {
    try {
      const result = await runGate(stage, stagingDir);
      if (!PASS_KINDS.has(result.kind)) {
        return false;
      }
    } catch {
      // Gate threw (e.g., missing artifacts) → fixture fails
      return false;
    }
  }
  return true;
}

/**
 * Run parity fixtures for a given sample and count passes.
 *
 * @param {FixtureManifestEntry[]} sample - Fixtures to run.
 * @param {string} host - Target host identifier.
 * @param {string} fixturesDir - Base directory for acceptance fixtures.
 * @returns {Promise<{ passCount: number, sampledFixtureIds: string[] }>}
 */
async function runSample(sample, host, fixturesDir) {
  const restoreEnv = setHostEnv(host);
  let passCount = 0;

  try {
    for (const fixture of sample) {
      const stagingDir = join(fixturesDir, fixture.dir);
      const prdPath = join(stagingDir, 'PRD.md');

      try {
        // Dispatch the route (object-form per 04-02 fix-pass — Lesson 2 / post-04-02 contract)
        await dispatchRoute({
          routeName: fixture.route,
          designDir: stagingDir,
          opts: {
            tokenBudget: fixture.budgetCeiling,
            prdPath,
          },
        });

        // Gate all 6 stages against the staged directory (Lesson 3: staged path, not live design/)
        const passes = await runAllGates(stagingDir);
        if (passes) {
          passCount++;
        }
      } catch {
        // Dispatch or gate error → fixture fails; continue to next
      }
    }
  } finally {
    restoreEnv();
  }

  return {
    passCount,
    sampledFixtureIds: sample.map(f => f.fixtureId),
  };
}

/**
 * Cross-host parity options.
 * @typedef {{
 *   host: 'codex-cli' | 'cursor',
 *   sample?: number,
 *   baseline?: string,
 *   fixturesDir?: string,
 *   output?: string
 * }} CrossHostParityOpts
 */

/**
 * Parity result written to parity-results.json.
 * @typedef {{
 *   host: string,
 *   sampleSize: number,
 *   sampledFixtures: string[],
 *   hostPassRate: number,
 *   baselinePassRate: number,
 *   delta: number,
 *   escalated: boolean,
 *   pass: boolean,
 *   warningVacuousComparison: boolean,
 *   warningMessage?: string
 * }} ParityResult
 */

/**
 * Run cross-host parity check for a target host (DIST-05/06).
 *
 * @param {CrossHostParityOpts} opts
 * @returns {Promise<ParityResult>}
 */
export async function runCrossHostParity(opts) {
  const {
    host,
    sample: sampleSize = DEFAULT_SAMPLE_SIZE,
    baseline,
    fixturesDir: fixturesDirRaw,
    output: outputRaw,
  } = opts;

  // P8 trust-posture + Lesson 6: vacuous comparison is keyed on BIN env var presence,
  // NOT session env vars. Session vars (CODEX_SESSION etc.) indicate WHERE we are running,
  // not whether real dispatch will happen. Only the BIN var wires a real CLI binary.
  // Without a BIN var, dispatch returns sequential-fallback (~1ms, no real LLM).
  // (Codex P2 finding: session vars made vacuousComparison false inside Codex/Cursor sessions
  //  even though no real LLM dispatch occurred.)
  const vacuousComparison = !isRealHostDispatchConfigured(host);
  const binVar = HOST_BIN_VAR[host] ?? `${host.toUpperCase().replace(/-/g, '_')}_BIN`;

  if (vacuousComparison) {
    console.warn(
      `\n[cross-host-parity] WARNING: ${binVar} not set. ` +
      `dispatchSubagent will use sequential-fallback (no real ${host} CLI invocation).`
    );
    console.warn(
      `  Parity-results.json will be marked warningVacuousComparison=true.`
    );
    console.warn(
      `  For a real cross-host measurement, set ${binVar} to a path to the host binary.`
    );
    console.warn(`  Per D-77: true parity testing requires manual invocation with host CLI installed.\n`);
  }

  // Resolve and validate fixturesDir (Lesson 7: path-traversal containment).
  const fixturesDirResolved = fixturesDirRaw
    ? validatePathSandbox(fixturesDirRaw, '--fixtures-dir')
    : join(PROJECT_ROOT, 'evals/acceptance');

  // Resolve and validate output path (Lesson 7).
  const outputResolved = outputRaw
    ? validatePathSandbox(outputRaw, '--output')
    : join(PROJECT_ROOT, 'evals/hosts', host, 'parity-results.json');

  // Resolve and validate baseline path (Lesson 7: read-only, still containment-checked).
  let baselinePassRate = 0.0;  // Pessimistic default: will trigger escalation
  if (baseline) {
    const baselineResolved = validatePathSandbox(baseline, '--baseline');
    if (existsSync(baselineResolved)) {
      const baselineData = JSON.parse(await readFile(baselineResolved, 'utf8'));
      // Baseline JSON shape: { passRate: 0.87, ... } or { "claude-code": { passRate: 0.87 } }
      baselinePassRate = baselineData.passRate
        ?? baselineData['claude-code']?.passRate
        ?? 0.0;
    } else {
      console.warn(`[cross-host-parity] WARNING: baseline file not found at ${baselineResolved}. Using 0.0 (pessimistic).`);
    }
  } else {
    console.warn(`[cross-host-parity] WARNING: no --baseline provided. Using 0.0 (pessimistic — will trigger escalation).`);
  }

  // Load fixtures manifest.
  const manifestPath = join(fixturesDirResolved, 'fixtures.manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(
      `cross-host-parity: fixtures.manifest.json not found at ${manifestPath}.\n` +
      `  Run 04-01 acceptance corpus setup first.`
    );
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  /** @type {FixtureManifestEntry[]} */
  const allFixtures = manifest.fixtures;

  // Select deterministic sample for initial run (D-77).
  const initialSample = selectDeterministicSample(allFixtures, Math.min(sampleSize, allFixtures.length));

  // Run initial sample.
  const { passCount: initialPassCount, sampledFixtureIds: initialFixtureIds } =
    await runSample(initialSample, host, fixturesDirResolved);

  let hostPassRate = initialSample.length > 0 ? initialPassCount / initialSample.length : 0;
  let delta = computeParityDelta(hostPassRate, baselinePassRate);
  let escalated = false;
  let finalSampleSize = initialSample.length;
  let finalSampledFixtureIds = initialFixtureIds;

  // Escalation: if delta > 0.10 and initial sample < full corpus, re-run with all fixtures (D-77).
  // Use allFixtures.length (not hardcoded 15) so this future-proofs against 16+ fixture corpora.
  if (delta > DELTA_THRESHOLD && sampleSize < allFixtures.length) {
    console.log(`[cross-host-parity] Delta ${delta.toFixed(3)} > ${DELTA_THRESHOLD}. Escalating to full N=${allFixtures.length} run...`);
    escalated = true;

    const fullSample = selectDeterministicSample(allFixtures, allFixtures.length);
    const { passCount: fullPassCount, sampledFixtureIds: fullFixtureIds } =
      await runSample(fullSample, host, fixturesDirResolved);

    // Full run REPLACES sampled run (not concatenation — no duplicates per D-77).
    hostPassRate = fullSample.length > 0 ? fullPassCount / fullSample.length : 0;
    delta = computeParityDelta(hostPassRate, baselinePassRate);
    finalSampleSize = fullSample.length;
    finalSampledFixtureIds = fullFixtureIds;

    console.log(`[cross-host-parity] Escalated result: hostPassRate=${hostPassRate.toFixed(3)}, delta=${delta.toFixed(3)}`);
  }

  const pass = delta <= DELTA_THRESHOLD;

  // Build parity result — Lesson 5: both count (hostPassRate) AND identity (sampledFixtures).
  // warningVacuousComparison is ALWAYS present (true/false) so downstream consumers can
  // filter parity-results.json by trustworthiness without parsing prose warnings.
  /** @type {ParityResult} */
  const parityResult = {
    host,
    sampleSize: finalSampleSize,
    sampledFixtures: finalSampledFixtureIds,
    hostPassRate,
    baselinePassRate,
    delta,
    escalated,
    pass,
    warningVacuousComparison: vacuousComparison,
    ...(vacuousComparison ? {
      warningMessage: `${binVar} not set — dispatchSubagent uses sequential-fallback. ` +
        `Schema/gate checks run but LLM trigger recall NOT measured. ` +
        `Per D-77: true parity requires manual invocation with ${host} CLI installed.`,
    } : {}),
  };

  // Write parity-results.json.
  const outputDir = dirname(outputResolved);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputResolved, JSON.stringify(parityResult, null, 2) + '\n');

  console.log(`\n[cross-host-parity] Results:`);
  console.log(`  host: ${host}`);
  console.log(`  sampleSize: ${finalSampleSize}${escalated ? ' (escalated)' : ''}`);
  console.log(`  hostPassRate: ${hostPassRate.toFixed(3)}`);
  console.log(`  baselinePassRate: ${baselinePassRate.toFixed(3)}`);
  console.log(`  delta: ${delta.toFixed(3)} (threshold: ${DELTA_THRESHOLD})`);
  console.log(`  pass: ${pass}`);
  if (vacuousComparison) {
    console.log(`  WARNING: vacuous comparison (no real dispatch configured)`);
  }
  console.log(`\nResults written to: ${outputResolved}`);

  // Exit 1 if delta > 0.10 after all escalation (DIST-05/06 failure).
  process.exit(pass ? 0 : 1);
}
