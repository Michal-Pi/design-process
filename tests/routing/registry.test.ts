// tests/routing/registry.test.ts
// RED: failing tests for routing/registry.mjs
// Task 2 - D-21, ROUTE-01..07: All 7 routes wired (4 implemented + 3 stubs)

import { describe, it, expect } from 'vitest';

describe('routing/registry: ROUTES', () => {
  it('exports ROUTES as a record with exactly 7 routes', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(Object.keys(ROUTES)).toHaveLength(7);
  });

  it('all 7 route names are present', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['new-product']).toBeDefined();
    expect(ROUTES['new-feature']).toBeDefined();
    expect(ROUTES['mature-app-refactor']).toBeDefined();
    expect(ROUTES['design-bug']).toBeDefined();
    expect(ROUTES['brand-refresh']).toBeDefined();
    expect(ROUTES['DS-extraction']).toBeDefined();
    expect(ROUTES['PR-audit']).toBeDefined();
  });

  it('4 routes are implemented-stub status', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    const implemented = Object.values(ROUTES).filter(r => r.status === 'implemented-stub');
    expect(implemented).toHaveLength(4);
  });

  it('3 routes are not-yet-implemented status', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    const notYet = Object.values(ROUTES).filter(r => r.status === 'not-yet-implemented');
    expect(notYet).toHaveLength(3);
  });

  it('new-feature is implemented-stub', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['new-feature'].status).toBe('implemented-stub');
  });

  it('design-bug is implemented-stub', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['design-bug'].status).toBe('implemented-stub');
  });

  it('brand-refresh is implemented-stub', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['brand-refresh'].status).toBe('implemented-stub');
  });

  it('PR-audit is implemented-stub', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['PR-audit'].status).toBe('implemented-stub');
  });

  it('new-product is not-yet-implemented', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['new-product'].status).toBe('not-yet-implemented');
  });

  it('mature-app-refactor is not-yet-implemented', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['mature-app-refactor'].status).toBe('not-yet-implemented');
  });

  it('DS-extraction is not-yet-implemented', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['DS-extraction'].status).toBe('not-yet-implemented');
  });

  it('every route has requiredStages array', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    for (const route of Object.values(ROUTES)) {
      expect(Array.isArray(route.requiredStages)).toBe(true);
    }
  });

  it('every route has budgetTokensP50', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    for (const route of Object.values(ROUTES)) {
      expect(typeof route.budgetTokensP50).toBe('number');
      expect(route.budgetTokensP50).toBeGreaterThan(0);
    }
  });

  it('new-feature budget is 60000', async () => {
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(ROUTES['new-feature'].budgetTokensP50).toBe(60000);
  });

  it('exports IMPLEMENTED_ROUTES array', async () => {
    const { IMPLEMENTED_ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(Array.isArray(IMPLEMENTED_ROUTES)).toBe(true);
    expect(IMPLEMENTED_ROUTES).toHaveLength(4);
  });

  it('exports NOT_YET_IMPLEMENTED_ROUTES array', async () => {
    const { NOT_YET_IMPLEMENTED_ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    expect(Array.isArray(NOT_YET_IMPLEMENTED_ROUTES)).toBe(true);
    expect(NOT_YET_IMPLEMENTED_ROUTES).toHaveLength(3);
  });
});
