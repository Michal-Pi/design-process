// assets/scripts/routing/registry.mjs
// Route registry for all 7 design-os routes.
// Implements D-21: all 7 routes wired; 4 implemented-stub (v2.0a) + 3 not-yet-implemented (v2.0b).
//
// RouteDefinition shape:
//   name: string
//   status: 'implemented-stub' | 'not-yet-implemented'
//   shipsIn?: 'v2.0a' | 'v2.0b'  — present on not-yet-implemented
//   requiredStages: string[]
//   skipWithWarning: string[]
//   optionalStages: string[]
//   budgetTokensP50: number
//
// Sources: CONTEXT.md D-21, PLAN.md Task 2 behavior block, REQUIREMENTS.md ROUTE-01..07.

/** All 7 routes with their v1.5 / v2.0a / v2.0b status. */
export const ROUTES = {
  'new-product': {
    name: 'new-product',
    status: 'not-yet-implemented',
    shipsIn: 'v2.0b',
    requiredStages: ['0', '1', '2', '5a', '5b'],
    optionalStages: ['3', '4'],
    skipWithWarning: [],
    budgetTokensP50: 150000,
    description: 'Full 5-stage workflow for a greenfield product',
  },
  'new-feature': {
    name: 'new-feature',
    status: 'implemented-stub',
    shipsIn: 'v2.0a',
    requiredStages: ['2', '4', '5a'],
    skipWithWarning: ['1'],
    optionalStages: [],
    budgetTokensP50: 60000,
    description: 'Feature-scoped design starting from IA (Stages 2, 4, 5a)',
  },
  'mature-app-refactor': {
    name: 'mature-app-refactor',
    status: 'not-yet-implemented',
    shipsIn: 'v2.0b',
    requiredStages: ['2', '4', '5b'],
    skipWithWarning: ['1', '3', '5a'],
    optionalStages: [],
    budgetTokensP50: 45000,
    description: 'Design-system extraction + refactor for an existing app',
  },
  'design-bug': {
    name: 'design-bug',
    status: 'implemented-stub',
    shipsIn: 'v2.0a',
    requiredStages: ['4', '5a'],
    skipWithWarning: ['1', '2', '3', '5b'],
    optionalStages: [],
    budgetTokensP50: 20000,
    description: 'Single-stage interaction or visual regression fix',
  },
  'brand-refresh': {
    name: 'brand-refresh',
    status: 'implemented-stub',
    shipsIn: 'v2.0a',
    requiredStages: ['5a', '5b'],
    skipWithWarning: ['1', '2', '3', '4'],
    optionalStages: [],
    budgetTokensP50: 55000,
    description: 'Token + surface refresh starting from Stage 5b',
  },
  'DS-extraction': {
    name: 'DS-extraction',
    status: 'not-yet-implemented',
    shipsIn: 'v2.0b',
    requiredStages: ['audit-reverse', '1', '2', '4', '5b'],
    skipWithWarning: ['0'],
    optionalStages: [],
    budgetTokensP50: 120000,
    description: 'Reverse-engineer design stages from an existing Lovable/v0 prototype',
  },
  'PR-audit': {
    name: 'PR-audit',
    status: 'implemented-stub',
    shipsIn: 'v2.0a',
    requiredStages: ['audit-pr'],
    skipWithWarning: [],
    optionalStages: [],
    budgetTokensP50: 15000,
    description: 'Audit a PR for design regression and gate-compliance',
  },
};

/** Routes that are implemented as stubs and usable in v2.0a. */
export const IMPLEMENTED_ROUTES = Object.entries(ROUTES)
  .filter(([, r]) => r.status === 'implemented-stub')
  .map(([name]) => name);

/** Routes that are stubbed as ROUTE_NOT_YET_IMPLEMENTED and ship in v2.0b. */
export const NOT_YET_IMPLEMENTED_ROUTES = Object.entries(ROUTES)
  .filter(([, r]) => r.status === 'not-yet-implemented')
  .map(([name]) => name);

/** Marker string emitted by not-yet-implemented dispatchers. */
export const ROUTE_NOT_YET_IMPLEMENTED = 'ROUTE_NOT_YET_IMPLEMENTED — ships in v2.0b';
