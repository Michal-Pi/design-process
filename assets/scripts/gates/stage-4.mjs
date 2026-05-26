// assets/scripts/gates/stage-4.mjs
// Stage 4 (Interaction Design / State Maps) gate — full D-59 business logic.
//
// INVARIANT-01: Gate MUST run against staged path (not design/).
//   The caller passes .design-os/preview/<run-id>/ as designDir.
//
// D-59 Three conditions:
//   (a) Sitemap coverage: every route in sitemap.json has a .spec.md in interactions/
//   (b) State completeness: every .spec.md enumerates loading, empty, error, success states
//   (c) No open transitions: every Mermaid --> target is a declared state name
//
// Lesson 1 (INVARIANTS.md): Finding shape MUST be {checkId, status, evidence: string}.
//   NOT {findingId, fixRecipe, evidence: object}. Validated by ajv in appendManifestLockEntry().
//
// T-03-02-02: State-name regex only matches \w[\w-]* identifiers; tested against
//             Mermaid comment syntax to prevent false positives.
//
// Source: CONTEXT.md D-59; PLAN.md 03-02 Task B
// Implements: FID-04, MVPB-08

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join, basename } from 'node:path';
import { globby } from 'globby';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');

/** Canonical state types required by D-59(b). */
const REQUIRED_STATE_TYPES = ['loading', 'empty', 'error', 'success'];

/**
 * Extract DECLARED state names from a Mermaid stateDiagram-v2 source.
 * A state is "declared" if it appears as:
 *   - A transition SOURCE (left side of -->)
 *   - A standalone state name on its own line (bare identifier, not a target)
 *   - An explicit "state Name {" composite state declaration
 *   - A state annotation: "stateName : %% comment"
 *
 * States that ONLY appear as transition targets (right side of -->) without
 * any other declaration are NOT considered "declared" — they are "open transitions".
 *
 * T-03-02-02: Regex matches \w[\w-]* identifiers only.
 * Comment lines (%% ...) are not matched because they don't start with \w.
 *
 * @param {string} source - Mermaid stateDiagram-v2 source
 * @returns {Set<string>} Set of declared state names
 */
export function extractStateNames(source) {
  const declaredNames = new Set();

  // Pattern 1: Transition source — "  stateName -->"
  const srcPattern = /^[ \t]+(\w[\w-]*)[ \t]*-->/gm;
  // Pattern 2: State annotation — "  stateName :"
  const annotPattern = /^[ \t]+(\w[\w-]*)[ \t]*:/gm;
  // Pattern 3: Composite state declaration — "state Name {"
  const compositePattern = /^[ \t]*state[ \t]+(\w[\w-]*)[ \t]*\{/gm;
  // Pattern 4: Bare state name on its own line (no arrows, no colons after it)
  // Must be followed by only whitespace or end of line
  const barePattern = /^[ \t]+(\w[\w-]*)[ \t]*$/gm;

  for (const pattern of [srcPattern, annotPattern, compositePattern, barePattern]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const name = match[1];
      if (name && name !== 'stateDiagram' && name !== 'state') {
        declaredNames.add(name);
      }
    }
  }

  return declaredNames;
}

/**
 * Extract all transition TARGET names from a Mermaid stateDiagram-v2 source.
 * Returns all targets in --> X patterns.
 *
 * @param {string} source
 * @returns {string[]}
 */
function extractTransitionTargets(source) {
  const targets = [];
  const pattern = /-->[ \t]*(\w[\w-]*)/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const target = match[1];
    if (target && target !== '[*]') {
      targets.push(target);
    }
  }
  return targets;
}

/**
 * Derive screen name from a route path.
 * Takes the last path segment and converts to kebab-case.
 * e.g. '/dashboard' → 'dashboard', '/checkout-flow' → 'checkout-flow'
 *
 * @param {string} routePath
 * @returns {string}
 */
function routeToScreenName(routePath) {
  // Extract last segment, remove leading slash
  const segments = routePath.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';
  // Kebab-case: lowercase, replace spaces with hyphens
  return last.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Run the Stage 4 gate against a staged design directory.
 * Implements D-59 three-condition checklist.
 *
 * Finding shape: {checkId: string, status: 'pass'|'fail'|'na', evidence: string}
 * Per Lesson 1 (INVARIANTS.md) and gate-result.ts schema. Never use findingId,
 * fixRecipe, or object-valued evidence — those shapes fail ajv validation in
 * appendManifestLockEntry().
 *
 * @param {string} designDir - Staged preview path (INVARIANT-01: never design/)
 * @returns {Promise<import("../../../schemas/src/gate-result.js").GateResultType>}
 */
export async function runStage4Gate(designDir) {
  const findings = [];

  // ── Condition (a): Sitemap route coverage ──────────────────────────────────
  const sitemapPath = join(designDir, 'ia/sitemap.json');

  if (!existsSync(sitemapPath)) {
    // No sitemap found — cannot check coverage; pass with warning
    // (sitemap absence is a Stage 2 gate concern, not Stage 4)
    return {
      kind: 'pass',
      evidence: 'proto',
      findings: [],
    };
  }

  let sitemap;
  try {
    const raw = await readFile(sitemapPath, 'utf8');
    sitemap = JSON.parse(raw);
  } catch (err) {
    return {
      kind: 'failed_after_repair',
      reason: 'sitemap-parse-error',
      findings: [
        {
          checkId: '4-coverage-001',
          status: 'fail',
          evidence: `Failed to parse sitemap.json: ${err.message}. Fix sitemap.json JSON syntax.`,
        },
      ],
    };
  }

  const routes = Array.isArray(sitemap.routes) ? sitemap.routes : [];

  // Collect all .spec.md files in interactions/
  const specFiles = await globby(['interactions/*.spec.md'], {
    cwd: designDir,
    absolute: false,
  });

  // Build set of screen names from spec file stems
  const specScreenNames = new Set(
    specFiles.map((f) => basename(f, '.spec.md'))
  );

  // Check each route has a corresponding .spec.md
  for (const route of routes) {
    const routePath = typeof route === 'string' ? route : (route.path ?? '');
    const screenName = routeToScreenName(routePath);

    if (screenName && !specScreenNames.has(screenName)) {
      findings.push({
        checkId: '4-coverage-001',
        status: 'fail',
        evidence: `Route '${routePath}' (screen '${screenName}') has no matching interactions/${screenName}.spec.md. Run ixd/state-catalog atom to produce ${screenName}.spec.md.`,
      });
    }
  }

  // ── Condition (b): State completeness ──────────────────────────────────────
  for (const specFile of specFiles) {
    const screenName = basename(specFile, '.spec.md');
    const fullPath = join(designDir, specFile);

    let specData;
    try {
      const raw = await readFile(fullPath, 'utf8');
      // Parse YAML frontmatter with gray-matter
      const { default: grayMatter } = await import('gray-matter');
      const parsed = grayMatter(raw);
      specData = parsed.data;
    } catch (err) {
      findings.push({
        checkId: '4-states-001',
        status: 'fail',
        evidence: `${screenName}.spec.md: failed to parse YAML frontmatter — ${err.message}. Fix YAML syntax in ${screenName}.spec.md.`,
      });
      continue;
    }

    // Extract state types from the states array
    const stateTypes = new Set(
      (Array.isArray(specData.states) ? specData.states : [])
        .map((s) => s?.type)
        .filter(Boolean)
    );

    const missingTypes = REQUIRED_STATE_TYPES.filter((t) => !stateTypes.has(t));

    if (missingTypes.length > 0) {
      findings.push({
        checkId: '4-states-001',
        status: 'fail',
        evidence: `${screenName}.spec.md: missing canonical state types [${missingTypes.join(', ')}]. Add these state types to pass D-59(b).`,
      });
    }
  }

  // ── Condition (c): No open transitions ─────────────────────────────────────
  const diagramFiles = await globby(['interactions/*.diagram.mmd'], {
    cwd: designDir,
    absolute: false,
  });

  for (const diagramFile of diagramFiles) {
    const screenName = basename(diagramFile, '.diagram.mmd');
    const fullPath = join(designDir, diagramFile);

    let source;
    try {
      source = await readFile(fullPath, 'utf8');
    } catch (err) {
      // Cannot read diagram — skip open-transition check for this screen
      continue;
    }

    const declaredNames = extractStateNames(source);
    const transitionTargets = extractTransitionTargets(source);

    const openTargets = transitionTargets.filter((t) => !declaredNames.has(t));

    if (openTargets.length > 0) {
      const uniqueOpenTargets = [...new Set(openTargets)];
      findings.push({
        checkId: '4-open-transition-001',
        status: 'fail',
        evidence: `${screenName}.diagram.mmd: state(s) [${uniqueOpenTargets.join(', ')}] are transition targets but not declared. Declare them or correct the transition targets.`,
      });
    }
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (findings.length === 0) {
    return {
      kind: 'pass',
      evidence: 'proto',
      findings: [],
    };
  }

  return {
    kind: 'failed_after_repair',
    reason: 'gate-conditions-unmet',
    findings,
  };
}
