// assets/scripts/routing/dispatch.mjs
// Route dispatcher + ROUTE-08 default-not-all-5-stages suggester.
// Implements ROUTE-08: orchestrator suggests route based on repo signals or asks.
//
// dispatchRoute({ routeName, designDir, opts }):
//   → { kind: 'route_stub_dispatched', ... } for implemented-stub routes
//   → { kind: 'route_not_yet_implemented', ... } for not-yet-implemented routes
//   → { kind: 'unknown_route', ... } for unrecognized route names
//
// suggestRoute(repoSignals):
//   → { suggestion, confidence, reasoning, alternatives }
//   When confidence < 0.6, the CLI prints a suggestion prompt and exits 0
//   (never silently runs all 5 stages — ROUTE-08).
//
// Sources: CONTEXT.md D-21, PLAN.md Task 2 behavior block, REQUIREMENTS.md ROUTE-08.

import { ROUTES } from './registry.mjs';

/**
 * Dispatch a named route.
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

  // implemented-stub: Phase 1 ships the dispatcher shape only.
  // Phase 2 plugs in the real stage workflows.
  return {
    kind: 'route_stub_dispatched',
    name: routeName,
    requiredStages: route.requiredStages,
    skipWithWarning: route.skipWithWarning,
    optionalStages: route.optionalStages,
    budgetTokensP50: route.budgetTokensP50,
    status: 'implemented-stub',
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
