// assets/scripts/routing/registry.mjs
// Route registry for all 7 design-os routes + stack detection.
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
// StackSignals shape (from detectStack):
//   nextjs: boolean
//   tailwindV4: boolean
//   shadcn: boolean
//   vite: boolean
//   astro: boolean
//   hasPackageJson: boolean
//
// Sources: CONTEXT.md D-21, PLAN.md Task 2 behavior block, REQUIREMENTS.md ROUTE-01..07.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** All 7 routes with their v1.5 / v2.0a / v2.0b status. */
export const ROUTES = {
  'new-product': {
    name: 'new-product',
    status: 'v2.0b-implemented',
    shipsIn: 'v2.0b',
    requiredStages: ['0', '1', '2', '3', '4', '5a', '5b'],
    optionalStages: [],
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
    status: 'v2.0b-implemented',
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
    status: 'v2.0b-implemented',
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

/**
 * Detect the tech stack in a project root directory.
 * Used for adapter selection in tokens-project.mjs and e2e fixture detection.
 *
 * Detects:
 *   - Next.js: presence of next.config.mjs / next.config.js or "next" in package.json dependencies
 *   - Tailwind v4: @import "tailwindcss" or @theme { in CSS files (v4 CSS-first config)
 *   - shadcn: presence of components/ui/ directory
 *   - Vite: presence of vite.config.ts / vite.config.mjs
 *   - Astro: presence of astro.config.mjs / astro.config.ts
 *
 * @param {string} projectRoot - Absolute or relative path to project root
 * @returns {{ nextjs: boolean, tailwindV4: boolean, shadcn: boolean, vite: boolean, astro: boolean, hasPackageJson: boolean }}
 */
export function detectStack(projectRoot) {
  const signals = {
    nextjs: false,
    tailwindV4: false,
    shadcn: false,
    vite: false,
    astro: false,
    hasPackageJson: false,
  };

  // Next.js: config file presence
  if (
    existsSync(join(projectRoot, 'next.config.mjs')) ||
    existsSync(join(projectRoot, 'next.config.js')) ||
    existsSync(join(projectRoot, 'next.config.ts'))
  ) {
    signals.nextjs = true;
  }

  // Vite: config file presence
  if (
    existsSync(join(projectRoot, 'vite.config.ts')) ||
    existsSync(join(projectRoot, 'vite.config.mjs')) ||
    existsSync(join(projectRoot, 'vite.config.js'))
  ) {
    signals.vite = true;
  }

  // Astro: config file presence
  if (
    existsSync(join(projectRoot, 'astro.config.mjs')) ||
    existsSync(join(projectRoot, 'astro.config.ts'))
  ) {
    signals.astro = true;
  }

  // shadcn: components/ui/ directory presence
  if (existsSync(join(projectRoot, 'components', 'ui'))) {
    signals.shadcn = true;
  }

  // package.json: check for framework dependencies
  const pkgPath = join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    signals.hasPackageJson = true;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (!signals.nextjs && deps['next']) signals.nextjs = true;
      if (!signals.vite && deps['vite']) signals.vite = true;
      if (!signals.astro && deps['astro']) signals.astro = true;
    } catch {
      // ignore parse errors
    }
  }

  // Tailwind v4: CSS-first config detected via @import "tailwindcss" or @theme
  // Check common CSS entry points
  const cssEntryPoints = [
    join(projectRoot, 'app', 'globals.css'),
    join(projectRoot, 'src', 'app', 'globals.css'),
    join(projectRoot, 'src', 'index.css'),
    join(projectRoot, 'src', 'styles', 'globals.css'),
    join(projectRoot, 'styles', 'globals.css'),
  ];

  for (const cssPath of cssEntryPoints) {
    if (existsSync(cssPath)) {
      try {
        const css = readFileSync(cssPath, 'utf8');
        // Tailwind v4 signatures: @import "tailwindcss" or @theme { block
        if (/@import\s+["']tailwindcss["']/.test(css) || /@theme\s*\{/.test(css)) {
          signals.tailwindV4 = true;
          break;
        }
      } catch {
        // ignore read errors
      }
    }
  }

  return signals;
}
