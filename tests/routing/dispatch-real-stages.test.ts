// tests/routing/dispatch-real-stages.test.ts
// Tests for Phase 2 real runSubagent wiring in dispatch.mjs
// All tests mock runSubagent to avoid spawning real subagents in CI.
//
// Implements: OF-01, ROUTE-02, ROUTE-04, ROUTE-05, ROUTE-07, ROUTE-09

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the run-subagent module to avoid real subagent spawning
vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
  dispatchSubagent: vi.fn().mockResolvedValue({
    kind: 'sequential-fallback',
    host: 'unknown',
    prompt: 'mock-prompt',
  }),
  detectHost: vi.fn().mockReturnValue('unknown'),
}));

describe('dispatch: Phase 2 real stage wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('new-feature calls stages: discover, structure, style-5a, systematize-5b', async () => {
    // Force re-import to pick up mocks
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'new-feature', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_dispatched');
    expect(result.name).toBe('new-feature');
    expect(result.stages).toEqual(['discover', 'structure', 'style-5a', 'systematize-5b']);
  });

  it('design-bug calls stages: style-5a only', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'design-bug', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_dispatched');
    expect(result.stages).toEqual(['style-5a']);
  });

  it('brand-refresh calls stages: style-5a, systematize-5b', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'brand-refresh', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_dispatched');
    expect(result.stages).toEqual(['style-5a', 'systematize-5b']);
  });

  it('PR-audit calls stages: audit-pr', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'PR-audit', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_dispatched');
    expect(result.stages).toEqual(['audit-pr']);
  });

  it('new-product still returns route_not_yet_implemented', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn(),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'new-product', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_not_yet_implemented');
  });

  it('mature-app-refactor still returns route_not_yet_implemented', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn(),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'mature-app-refactor', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_not_yet_implemented');
  });

  it('DS-extraction still returns route_not_yet_implemented', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn(),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'DS-extraction', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_not_yet_implemented');
  });

  it('route_dispatched result has results array with one entry per stage', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'brand-refresh', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_dispatched');
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results).toHaveLength(2); // style-5a + systematize-5b
  });
});
