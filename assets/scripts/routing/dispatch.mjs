// assets/scripts/routing/dispatch.mjs
// Route dispatcher + ROUTE-08 default-not-all-5-stages suggester.
// Phase 2: real runSubagent wiring for 4 implemented routes (OF-01 resolved).
// Phase 3: promotes 3 v2.0b routes (new-product, mature-app-refactor, DS-extraction).
//
// dispatchRoute({ routeName, designDir, opts }):
//   → { kind: 'route_dispatched', ... } for 7 implemented routes (Phase 2 + Phase 3)
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
// Phase 3 new routes (D-66, D-67, ROUTE-06, OQ-3):
//   new-product:          7 stages (ingest→discover→structure→sketch→interact→style→systematize), ≤150k
//   mature-app-refactor:  3 stages (audit stage-2 pr + audit stage-4 pr + systematize), ≤45k
//   DS-extraction:        5 stages (reverse-engineer + backfill 4 stages), ≤120k
//
// Sources: CONTEXT.md D-21, D-66, D-67, ROUTE-06, OQ-3, OF-01,
//          PLAN.md T-02-05-B, T-03-05-A behavior blocks, REQUIREMENTS.md ROUTE-01..07.

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
 * Phase 3 route stage specs with per-stage workflow + args + budget (D-66, D-67, ROUTE-06/OQ-3).
 * Each entry: { stage: string, workflow: string, args: string, tokenBudget: number }
 *
 * Budget hint note (D-66): "Stages that complete under budget do NOT donate headroom to later
 * stages — each ceiling is independent." The run-subagent.mjs 2× soft-stop (Phase 2 D-49) is
 * preserved; if a stage exceeds 2× its ceiling, the workflow halts for user confirmation.
 *
 * @type {Record<string, Array<{stage: string, workflow: string, args: string, tokenBudget: number}>>}
 */
const PHASE3_ROUTE_SPECS = {
  // D-66: new-product — full 5-stage design workflow, ≤150k total
  'new-product': [
    { stage: 'ingest',       workflow: 'skills/workflows/ingest.md',      args: '',                    tokenBudget: 5_000  },
    { stage: 'discover',     workflow: 'skills/workflows/discover.md',     args: '',                    tokenBudget: 30_000 },
    { stage: 'structure',    workflow: 'skills/workflows/structure.md',    args: '',                    tokenBudget: 25_000 },
    { stage: 'sketch',       workflow: 'skills/workflows/sketch.md',       args: '',                    tokenBudget: 25_000 },
    { stage: 'interact',     workflow: 'skills/workflows/interact.md',     args: '',                    tokenBudget: 30_000 },
    { stage: 'style',        workflow: 'skills/workflows/style.md',        args: '',                    tokenBudget: 25_000 },
    { stage: 'systematize',  workflow: 'skills/workflows/systematize.md',  args: '',                    tokenBudget: 10_000 },
  ],

  // D-67: mature-app-refactor — Stage 2 audit + Stage 4 audit + Stage 5b, ≤45k
  // Skips stages 1, 3, 5a (appropriate for existing apps with established IA)
  'mature-app-refactor': [
    { stage: 'audit-stage-2-pr',  workflow: 'skills/workflows/audit.md',      args: '--stage 2 --pr',  tokenBudget: 15_000 },
    { stage: 'audit-stage-4-pr',  workflow: 'skills/workflows/audit.md',      args: '--stage 4 --pr',  tokenBudget: 15_000 },
    { stage: 'systematize',        workflow: 'skills/workflows/systematize.md', args: '',               tokenBudget: 15_000 },
  ],

  // ROUTE-06 + OQ-3 (resolved at 120k — 60k was Stage 5b sub-step only, not full route):
  // DS-extraction — reverse-engineer + backfill stages, ≤120k
  'DS-extraction': [
    { stage: 'audit-reverse-engineer-stages', workflow: 'skills/workflows/audit.md',      args: '--reverse-engineer-stages', tokenBudget: 60_000 },
    { stage: 'discover-from-inferred',        workflow: 'skills/workflows/discover.md',    args: '--from-inferred',           tokenBudget: 15_000 },
    { stage: 'structure-from-inferred',       workflow: 'skills/workflows/structure.md',   args: '--from-inferred',           tokenBudget: 15_000 },
    { stage: 'interact-from-inferred',        workflow: 'skills/workflows/interact.md',    args: '--from-inferred',           tokenBudget: 15_000 },
    { stage: 'systematize-from-inferred',     workflow: 'skills/workflows/systematize.md', args: '--from-inferred',           tokenBudget: 15_000 },
  ],
};

/**
 * Dispatch a named route.
 * Phase 2: implemented routes call runSubagent for each required stage.
 * Phase 3: new routes (new-product, mature-app-refactor, DS-extraction) use PHASE3_ROUTE_SPECS
 *          with per-stage tokenBudget hints (D-66).
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

  // === Phase 3 routes with per-stage tokenBudget dispatch (D-66, D-67, ROUTE-06/OQ-3) ===
  const phase3Specs = PHASE3_ROUTE_SPECS[routeName];
  if (phase3Specs) {
    /** @type {string[]} */
    const stages = phase3Specs.map(s => s.stage);
    /** @type {Array<{stage: string, workflowPath: string, result: unknown}>} */
    const results = [];

    for (const spec of phase3Specs) {
      const context = { designDir, route: routeName, args: spec.args };

      // D-66: each sub-agent receives a tokenBudget hint in the handoff bundle preamble.
      // Stages do NOT donate unused budget to later stages — each ceiling is independent.
      const result = await dispatchSubagent({
        prompt: spec.workflow,
        context,
        stage: spec.stage,
        tokenBudget: spec.tokenBudget,
      });

      results.push({ stage: spec.stage, workflowPath: spec.workflow, result });
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

  // === Phase 2 not-yet-implemented check (no longer needed for Phase 3 routes) ===
  if (route.status === 'not-yet-implemented') {
    return {
      kind: 'route_not_yet_implemented',
      name: routeName,
      shipsIn: route.shipsIn,
      message: `ROUTE_NOT_YET_IMPLEMENTED — ships in ${route.shipsIn}`,
    };
  }

  // === Phase 2 routes: real runSubagent wiring (OF-01) ===
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
    // Phase 3: mature-app-refactor is now implemented
    suggestion = 'mature-app-refactor';
    confidence = 0.55;
    reasoning.push('sketch-without-research');
    return { suggestion, confidence, reasoning, alternatives: ['new-feature', 'design-bug', 'brand-refresh'] };
  }

  // Heuristic: Lovable-style prototype (pnpm-lock.yaml, no design/ dir) → DS-extraction
  if (repoSignals.lovableHint && !repoSignals.hasDesignDir) {
    // Phase 3: DS-extraction is now implemented
    suggestion = 'DS-extraction';
    confidence = 0.55;
    reasoning.push('lovable-hint-no-design-dir');
    return { suggestion, confidence, reasoning, alternatives: ['new-product', 'new-feature', 'brand-refresh'] };
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
    `Run \`complete-design design --route <name>\` to choose. (Default is NOT all 5 stages.)`
  );
}
