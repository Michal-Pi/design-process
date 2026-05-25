// tests/routing/dispatch.test.ts
// RED: failing tests for routing/dispatch.mjs
// Task 2 - ROUTE-08: Dispatcher + suggestRoute

import { describe, it, expect } from 'vitest';

describe('routing/dispatch: dispatchRoute', () => {
  it('exports dispatchRoute as a function', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    expect(typeof dispatchRoute).toBe('function');
  });

  it('implemented-stub route returns route_stub_dispatched', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'new-feature', designDir: '/tmp', opts: {} });
    expect(result.kind).toBe('route_stub_dispatched');
    expect(result.name).toBe('new-feature');
  });

  it('route_stub_dispatched includes requiredStages and budgetTokensP50', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'design-bug', designDir: '/tmp', opts: {} });
    expect(Array.isArray(result.requiredStages)).toBe(true);
    expect(typeof result.budgetTokensP50).toBe('number');
  });

  it('not-yet-implemented route returns route_not_yet_implemented', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'new-product', designDir: '/tmp', opts: {} });
    expect(result.kind).toBe('route_not_yet_implemented');
    expect(result.name).toBe('new-product');
  });

  it('route_not_yet_implemented includes shipsIn field', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'mature-app-refactor', designDir: '/tmp', opts: {} });
    expect(result.kind).toBe('route_not_yet_implemented');
    expect(result.shipsIn).toBeDefined();
  });

  it('unknown route name returns unknown_route', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'invalid-route', designDir: '/tmp', opts: {} });
    expect(result.kind).toBe('unknown_route');
    expect(result.name).toBe('invalid-route');
    expect(Array.isArray(result.available)).toBe(true);
  });

  it('unknown_route lists all 7 available routes', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'bad-route', designDir: '/tmp', opts: {} });
    expect(result.kind).toBe('unknown_route');
    expect(result.available).toHaveLength(7);
  });

  it('brand-refresh returns route_stub_dispatched', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'brand-refresh', designDir: '/tmp', opts: {} });
    expect(result.kind).toBe('route_stub_dispatched');
  });

  it('PR-audit returns route_stub_dispatched', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'PR-audit', designDir: '/tmp', opts: {} });
    expect(result.kind).toBe('route_stub_dispatched');
  });

  it('DS-extraction returns route_not_yet_implemented', async () => {
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'DS-extraction', designDir: '/tmp', opts: {} });
    expect(result.kind).toBe('route_not_yet_implemented');
  });
});

describe('routing/dispatch: suggestRoute', () => {
  it('exports suggestRoute as a function', async () => {
    const { suggestRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    expect(typeof suggestRoute).toBe('function');
  });

  it('returns a suggestion with confidence and reasoning', async () => {
    const { suggestRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = suggestRoute({});
    expect(typeof result.suggestion).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(Array.isArray(result.reasoning)).toBe(true);
    expect(Array.isArray(result.alternatives)).toBe(true);
  });

  it('default fallback has confidence < 0.6 when no signals', async () => {
    const { suggestRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = suggestRoute({});
    expect(result.confidence).toBeLessThan(0.6);
  });

  it('default suggestion is a valid route name', async () => {
    const { suggestRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const { ROUTES } = await import('../../assets/scripts/routing/registry.mjs');
    const result = suggestRoute({});
    expect(ROUTES[result.suggestion]).toBeDefined();
  });
});
