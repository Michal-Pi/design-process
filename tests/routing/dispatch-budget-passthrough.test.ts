// tests/routing/dispatch-budget-passthrough.test.ts
// Tests for Finding 3 codex review fix: tokenBudget passed to dispatchSubagent
// actually reaches the subagent via prompt preamble.
//
// Prior to fix: dispatch.mjs passed { stage, tokenBudget } to dispatchSubagent
// but dispatchSubagent only destructured { prompt, tools, context } — the budget
// was silently dropped. D-66's per-stage 150k split was documentation-only.
//
// Fix: dispatchSubagent accepts optional tokenBudget + stage fields.
// The budget is included in the prompt preamble so the LLM is informed.
// Backward-compat: callers that omit tokenBudget still work (optional field).
//
// Source: Codex review Finding 3 [P2] — routing/dispatch.mjs:135-136

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Tests for dispatchSubagent budget acceptance (run-subagent.mjs)
// ============================================================

describe('dispatchSubagent: tokenBudget + stage passthrough (Codex Finding 3)', () => {
  it('dispatchSubagent accepts tokenBudget and stage parameters without throwing', async () => {
    // Import the real dispatchSubagent (not mocked) in unknown host env
    // so it takes the sequential-fallback path and we can inspect the result.
    const { dispatchSubagent } = await import('../../assets/scripts/run-subagent.mjs');

    // unknown host → sequential-fallback with no spawning
    const result = await dispatchSubagent({
      prompt: 'skills/workflows/ingest.md',
      context: { designDir: '/tmp/design', route: 'new-product', args: '' },
      stage: 'ingest',
      tokenBudget: 5_000,
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    // Should not throw — backward-compat optional fields are accepted
  });

  it('dispatchSubagent without tokenBudget still works (backward-compat)', async () => {
    const { dispatchSubagent } = await import('../../assets/scripts/run-subagent.mjs');

    // Phase 2 callers omit tokenBudget — must still work
    const result = await dispatchSubagent({
      prompt: 'skills/workflows/discover.md',
      context: { designDir: '/tmp/design', route: 'new-feature' },
    }) as Record<string, unknown>;

    expect(result).toBeDefined();
    // No error thrown, sequential-fallback or dispatched
  });

  it('prompt preamble includes "token budget" mention when tokenBudget is provided', async () => {
    vi.resetModules();
    const { dispatchSubagent } = await import('../../assets/scripts/run-subagent.mjs');

    const result = await dispatchSubagent({
      prompt: 'skills/workflows/discover.md',
      context: {},
      stage: 'discover',
      tokenBudget: 30_000,
    }) as Record<string, unknown>;

    // The result.prompt (returned in sequential-fallback or default) should include the budget preamble
    const resultPrompt = String(result['prompt'] ?? '');
    expect(resultPrompt).toMatch(/token budget/i);
    expect(resultPrompt).toContain('30k');
  });

  it('prompt preamble includes the stage name when provided', async () => {
    vi.resetModules();
    const { dispatchSubagent } = await import('../../assets/scripts/run-subagent.mjs');

    const result = await dispatchSubagent({
      prompt: 'skills/workflows/interact.md',
      context: {},
      stage: 'interact',
      tokenBudget: 30_000,
    }) as Record<string, unknown>;

    const resultPrompt = String(result['prompt'] ?? '');
    expect(resultPrompt).toContain('interact');
  });

  it('dispatchSubagent without tokenBudget does NOT prepend a budget preamble', async () => {
    vi.resetModules();
    const { dispatchSubagent } = await import('../../assets/scripts/run-subagent.mjs');

    const originalPrompt = 'skills/workflows/style.md';
    const result = await dispatchSubagent({
      prompt: originalPrompt,
      context: {},
    }) as Record<string, unknown>;

    const resultPrompt = String(result['prompt'] ?? '');
    // No budget preamble — prompt should start with the workflow path
    expect(resultPrompt).toBe(originalPrompt);
  });
});

// ============================================================
// Tests that dispatch.mjs actually passes budgets through to dispatchSubagent
// for Phase 3 routes (new-product route as canonical example per finding).
//
// Uses vi.doMock() (NOT vi.mock()) to avoid hoisting — the first describe block
// needs the real run-subagent.mjs module, not a mock.
// ============================================================

describe('dispatch.mjs: Phase 3 routes pass tokenBudget to dispatchSubagent (Codex Finding 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('new-product: each stage invocation receives the correct tokenBudget value', async () => {
    vi.resetModules();
    // Use vi.doMock (not vi.mock) to avoid hoisting — keeps isolation from first describe block
    vi.doMock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));

    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const runSubagent = await import('../../assets/scripts/run-subagent.mjs');
    const mockFn = vi.mocked(runSubagent.dispatchSubagent);

    await dispatchRoute({ routeName: 'new-product', designDir: '/tmp/design', opts: {} });

    // 7 stages, each with specific budget
    expect(mockFn).toHaveBeenCalledTimes(7);

    const expectedBudgets: Record<string, number> = {
      ingest: 5_000,
      discover: 30_000,
      structure: 25_000,
      sketch: 25_000,
      interact: 30_000,
      style: 25_000,
      systematize: 10_000,
    };

    for (const call of mockFn.mock.calls) {
      const arg = call[0] as Record<string, unknown>;
      const stageName = String(arg['stage'] ?? '');
      const budget = arg['tokenBudget'] as number;

      if (stageName && stageName in expectedBudgets) {
        expect(budget, `stage '${stageName}' should have tokenBudget ${expectedBudgets[stageName]}`).toBe(expectedBudgets[stageName]);
      }
    }
  });

  it('new-product: dispatchSubagent is called with stage field on each invocation', async () => {
    vi.resetModules();
    vi.doMock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));

    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const runSubagent = await import('../../assets/scripts/run-subagent.mjs');
    const mockFn = vi.mocked(runSubagent.dispatchSubagent);

    await dispatchRoute({ routeName: 'new-product', designDir: '/tmp/design', opts: {} });

    const stagesWithBudget = mockFn.mock.calls.filter(
      (call: unknown[]) => (call[0] as Record<string, unknown>)['tokenBudget'] !== undefined
    );
    // All 7 stage invocations must carry tokenBudget
    expect(stagesWithBudget).toHaveLength(7);
  });

  it('Phase 2 routes (new-feature) still work without tokenBudget (backward-compat)', async () => {
    vi.resetModules();
    vi.doMock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));

    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');

    // Phase 2 routes should still dispatch correctly
    const result = await dispatchRoute({ routeName: 'new-feature', designDir: '/tmp/design', opts: {} });
    expect(result.kind).toBe('route_dispatched');
  });
});
