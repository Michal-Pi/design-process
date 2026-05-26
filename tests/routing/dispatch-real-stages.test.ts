// tests/routing/dispatch-real-stages.test.ts
// Tests for Phase 2 + Phase 3 real runSubagent wiring in dispatch.mjs
// All tests mock runSubagent to avoid spawning real subagents in CI.
//
// Implements: OF-01, ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-05, ROUTE-06, ROUTE-07, ROUTE-09
// Phase 3 additions (T-03-05-A):
//   Tests 1-5 and 10: new-product, mature-app-refactor, DS-extraction routes + budget fixtures

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

  // === Phase 2 regression tests (Tests 6-9 in plan numbering) ===

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

describe('dispatch: Phase 3 new routes (T-03-05-A)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // === Test 1: new-product returns route_dispatched (not route_not_yet_implemented) ===
  it('Test 1: new-product returns kind route_dispatched (not route_not_yet_implemented)', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'new-product', designDir: '/tmp/design', opts: {} });

    expect(result.kind).not.toBe('route_not_yet_implemented');
    expect(result.kind).toBe('route_dispatched');
  });

  // === Test 2: new-product dispatches 7 stages in order ===
  it('Test 2: new-product dispatches exactly 7 stages in order: ingest, discover, structure, sketch, interact, style, systematize', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'new-product', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_dispatched');
    expect(result.stages).toHaveLength(7);
    expect(result.stages[0]).toBe('ingest');
    expect(result.stages[1]).toBe('discover');
    expect(result.stages[2]).toBe('structure');
    expect(result.stages[3]).toBe('sketch');
    expect(result.stages[4]).toBe('interact');
    expect(result.stages[5]).toBe('style');
    expect(result.stages[6]).toBe('systematize');
  });

  // === Test 3: new-product passes correct budget per stage ===
  it('Test 3: new-product passes correct budget per stage (D-66)', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    // Get the mock AFTER import to inspect calls
    const runSubagent = await import('../../assets/scripts/run-subagent.mjs');
    const mockFn = vi.mocked(runSubagent.dispatchSubagent);

    await dispatchRoute({ routeName: 'new-product', designDir: '/tmp/design', opts: {} });

    // Check budgets passed to dispatchSubagent (7 calls)
    expect(mockFn).toHaveBeenCalledTimes(7);
    const calls = mockFn.mock.calls;

    const expectedBudgets: Record<string, number> = {
      ingest: 5_000,
      discover: 30_000,
      structure: 25_000,
      sketch: 25_000,
      interact: 30_000,
      style: 25_000,
      systematize: 10_000,
    };

    for (const call of calls) {
      const arg = call[0] as Record<string, unknown>;
      const stage = arg['stage'] as string;
      const budget = arg['tokenBudget'] as number;
      expect(budget, `stage ${stage} should have correct budget`).toBe(expectedBudgets[stage]);
    }
  });

  // === Test 4: mature-app-refactor dispatches 3 stages ===
  it('Test 4: mature-app-refactor dispatches 3 stages: audit-stage-2-pr, audit-stage-4-pr, systematize', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = await dispatchRoute({ routeName: 'mature-app-refactor', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_dispatched');
    expect(result.stages).toHaveLength(3);
    // Stage 1: audit --stage 2 --pr
    expect((result.stages as string[])[0]).toContain('audit');
    // Stage 2: audit --stage 4 --pr
    expect((result.stages as string[])[1]).toContain('audit');
    // Stage 3: systematize
    expect((result.stages as string[])[2]).toBe('systematize');
  });

  // === Test 5: DS-extraction dispatches 5 stages, first is audit --reverse-engineer-stages, total budget = 120000 ===
  it('Test 5: DS-extraction dispatches 5 stages, first is audit --reverse-engineer-stages, total budget = 120000', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));
    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const runSubagent = await import('../../assets/scripts/run-subagent.mjs');
    const mockFn = vi.mocked(runSubagent.dispatchSubagent);

    const result = await dispatchRoute({ routeName: 'DS-extraction', designDir: '/tmp/design', opts: {} });

    expect(result.kind).toBe('route_dispatched');
    expect(result.stages).toHaveLength(5);

    // First stage must be audit --reverse-engineer-stages
    expect((result.stages as string[])[0]).toContain('audit');

    // Total budget = sum of all stage budgets = 120000
    const calls = mockFn.mock.calls;
    expect(calls).toHaveLength(5);
    const totalBudget = calls.reduce((sum: number, call) => {
      const arg = call[0] as Record<string, unknown>;
      return sum + ((arg['tokenBudget'] as number) ?? 0);
    }, 0);
    expect(totalBudget).toBe(120_000);
  });

  // === Test 10: Budget fixtures sum correctly ===
  it('Test 10: budget fixtures sum correctly (mature-app-refactor=45000, ds-extraction=120000)', () => {
    const basePath = resolve(process.cwd(), 'evals/fixtures/budget');

    // mature-app-refactor
    const marData = JSON.parse(readFileSync(resolve(basePath, 'mature-app-refactor.fixture.json'), 'utf8')) as {
      budgetTokens: number;
      stageAllocations: Record<string, number>;
    };
    const marSum = Object.values(marData.stageAllocations).reduce((a, b) => a + b, 0);
    expect(marSum).toBe(45_000);
    expect(marData.budgetTokens).toBe(45_000);

    // ds-extraction
    const dsData = JSON.parse(readFileSync(resolve(basePath, 'ds-extraction.fixture.json'), 'utf8')) as {
      budgetTokens: number;
      stageAllocations: Record<string, number>;
    };
    const dsSum = Object.values(dsData.stageAllocations).reduce((a, b) => a + b, 0);
    expect(dsSum).toBe(120_000);
    expect(dsData.budgetTokens).toBe(120_000);
  });
});
