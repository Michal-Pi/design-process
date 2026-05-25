// assets/scripts/routing/dispatch.mjs
// Route dispatcher + ROUTE-08 default-not-all-5-stages suggester.
// Phase 2: real runSubagent wiring for 4 implemented routes (OF-01 resolved).
//
// dispatchRoute({ routeName, designDir, opts }):
//   → { kind: 'route_dispatched', ... } for 4 implemented routes (Phase 2)
//   → { kind: 'route_not_yet_implemented', ... } for 3 v2.0b routes
//   → { kind: 'unknown_route', ... } for unrecognized route names
//
// suggestRoute(repoSignals):
//   → { suggestion, confidence, reasoning, alternatives }
//   When confidence < 0.6, the CLI prints a suggestion prompt and exits 0
//   (never silently runs all 5 stages — ROUTE-08).
//
// Phase 2 stage workflow map (OF-01):
//   discover     → skills/workflows/discover.md
//   structure    → skills/workflows/structure.md
//   style-5a     → skills/workflows/style.md
//   systematize-5b → skills/workflows/systematize.md
//   audit-pr     → skills/workflows/audit.md
//
// Sources: CONTEXT.md D-21, OF-01, PLAN.md T-02-05-B behavior block, REQUIREMENTS.md ROUTE-02/04/05/07/09.

import { ROUTES } from './registry.mjs';
import { dispatchSubagent } from '../run-subagent.mjs';

/**
 * Map from internal stage key → SKILL.md workflow path.
 * @type {Record<string, string>}
 */
const STAGE_WORKFLOW_MAP = {
  discover: 'skills/workflows/discover.md',
  structure: 'skills/workflows/structure.md',
  'style-5a': 'skills/workflows/style.md',
  'systematize-5b': 'skills/workflows/systematize.md',
  'audit-pr': 'skills/workflows/audit.md',
};

/**
 * Required stages per Phase 2 implemented route.
 * @type {Record<string, string[]>}
 */
const ROUTE_STAGES = {
  'new-feature': ['discover', 'structure', 'style-5a', 'systematize-5b'],
  'design-bug': ['style-5a'],
  'brand-refresh': ['style-5a', 'systematize-5b'],
  'PR-audit': ['audit-pr'],
};

/**
 * Dispatch a named route.
 * Phase 2: implemented routes call runSubagent for each required stage.
 *
 * @param options.routeName   Route name to dispatch
 * @param options.designDir   Absolute path to the design directory
 * @param options.opts        Additional options for the route
 * @returns Dispatch result discriminated union
 */
export async function dispatchRoute({ routeName, designDir, opts = {} }) {
  const route = ROUTES[routeName];

  if (!route) {
    return {
      kind: 'unknown_route',
      name: routeName,
      available: Object.keys(ROUTES),
    };
  }

  if (route.status === 'not-yet-implemented') {
    return {
      kind: 'route_not_yet_implemented',
      name: routeName,
      shipsIn: route.shipsIn,
      message: `ROUTE_NOT_YET_IMPLEMENTED — ships in ${route.shipsIn}`,
    };
  }

  // Phase 2: real runSubagent wiring for 4 implemented routes (OF-01).
  const stages = ROUTE_STAGES[routeName];
  if (!stages) {
    // Should never happen — all implemented routes have stage definitions
    return {
      kind: 'unknown_route',
      name: routeName,
      available: Object.keys(ROUTES),
    };
  }

  /** @type {Array<{stage: string, workflowPath: string, result: unknown}>} */
  const results = [];

  for (const stage of stages) {
    const workflowPath = STAGE_WORKFLOW_MAP[stage];
    const context = { designDir, route: routeName };

    // Call runSubagent for each stage in sequence (D-34: one-per-stage sequential dispatch).
    // The sequential-fallback shim in run-subagent.mjs handles Codex/Cursor (D-53).
    const result = await dispatchSubagent({
      prompt: workflowPath ?? stage,
      context,
    });

    results.push({ stage, workflowPath: workflowPath ?? '', result });
  }

  return {
    kind: 'route_dispatched',
    name: routeName,
    stages,
    budgetTokensP50: route.budgetTokensP50,
    results,
    designDir,
  };
}

/**
 * Suggest a route based on lightweight repo signals.
 * Implements ROUTE-08: when confidence < 0.6, the caller should prompt the user.
 *
 * @param repoSignals  Lightweight heuristic flags about the repo
 * @returns { suggestion, confidence, reasoning, alternatives }
 */
export function suggestRoute(repoSignals = {}) {
  const reasoning = [];
  let suggestion = 'new-feature';
  let confidence = 0.3;

  // Heuristic: `audit --pr` invocation → PR-audit
  if (repoSignals.auditPr) {
    suggestion = 'PR-audit';
    confidence = 0.9;
    reasoning.push('audit-pr-invocation');
    return { suggestion, confidence, reasoning, alternatives: ['design-bug', 'brand-refresh', 'new-feature'] };
  }

  // Heuristic: existing package.json with framework detected → new-feature
  if (repoSignals.hasPackageJson && repoSignals.framework) {
    suggestion = 'new-feature';
    confidence = 0.65;
    reasoning.push(`detected-framework:${repoSignals.framework}`);
    return { suggestion, confidence, reasoning, alternatives: ['design-bug', 'brand-refresh', 'PR-audit'] };
  }

  // Heuristic: design/sketch/ exists without design/research/ → mature-app-refactor
  if (repoSignals.hasSketch && !repoSignals.hasResearch) {
    // mature-app-refactor is not-yet-implemented — suggest new-feature as proxy
    suggestion = 'new-feature';
    confidence = 0.45;
    reasoning.push('sketch-without-research');
    return { suggestion, confidence, reasoning, alternatives: ['design-bug', 'brand-refresh', 'PR-audit'] };
  }

  // Heuristic: Lovable-style prototype (pnpm-lock.yaml, no design/ dir) → DS-extraction
  if (repoSignals.lovableHint && !repoSignals.hasDesignDir) {
    // DS-extraction is not-yet-implemented — fall through to default
    suggestion = 'new-feature';
    confidence = 0.35;
    reasoning.push('lovable-hint-no-design-dir');
    return { suggestion, confidence, reasoning, alternatives: ['design-bug', 'brand-refresh', 'PR-audit'] };
  }

  // Default fallback — low confidence, asks the user
  reasoning.push('default-fallback');
  return {
    suggestion,
    confidence,
    reasoning,
    alternatives: ['design-bug', 'brand-refresh', 'PR-audit'],
  };
}

/**
 * Format a ROUTE-08 prompt for the CLI (default-not-all-5-stages message).
 *
 * @param suggestResult  Return value of suggestRoute()
 * @returns Prompt string to print and exit 0
 */
export function formatRoute08Prompt(suggestResult) {
  const { suggestion, alternatives } = suggestResult;
  const all = [suggestion, ...alternatives].join(', ');
  return (
    `Which route? Suggestions: ${all}.\n` +
    `Run \`design-os design --route <name>\` to choose. (Default is NOT all 5 stages.)`
  );
}
