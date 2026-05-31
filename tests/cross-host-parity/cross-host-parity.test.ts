// tests/cross-host-parity/cross-host-parity.test.ts
// Unit tests for cross-host-parity.mjs: selectDeterministicSample and computeParityDelta.
// TDD RED phase: tests committed before implementation exists.
//
// These tests verify:
//   1. selectDeterministicSample — deterministic (same input → same output), correct size
//   2. selectDeterministicSample — groups by useCase, 1 per category + 1 route-mandatory
//   3. selectDeterministicSample — sorts within each group by fixtureId for stability
//   4. selectDeterministicSample — handles missing categories gracefully
//   5. computeParityDelta — absolute value (not signed), edge cases
//   6. computeParityDelta — delta > 0.10 detection for escalation trigger
//
// Source: 04-03-PLAN.md Task 2; INVARIANTS.md Lesson 5; D-77 deterministic sample
// Implements: DIST-05, DIST-06

import { describe, it, expect } from 'vitest';

// Fixture data for tests — mirrors fixtures.manifest.json shape
const SAMPLE_FIXTURES = [
  // b2b-saas (5 fixtures)
  { fixtureId: 'fixture-01-b2b-taskflow',   useCase: 'b2b-saas',  route: 'new-feature',       budgetCeiling: 60000  },
  { fixtureId: 'fixture-02-b2b-crm',        useCase: 'b2b-saas',  route: 'new-product',        budgetCeiling: 150000 },
  { fixtureId: 'fixture-03-b2b-devtools',   useCase: 'b2b-saas',  route: 'new-product',        budgetCeiling: 150000 },
  { fixtureId: 'fixture-04-b2b-analytics',  useCase: 'b2b-saas',  route: 'new-product',        budgetCeiling: 150000 },
  { fixtureId: 'fixture-05-b2b-onboarding', useCase: 'b2b-saas',  route: 'new-feature',       budgetCeiling: 60000  },
  // consumer (5 fixtures)
  { fixtureId: 'fixture-06-consumer-fitness', useCase: 'consumer', route: 'new-product',      budgetCeiling: 150000 },
  { fixtureId: 'fixture-07-consumer-recipe',  useCase: 'consumer', route: 'new-product',      budgetCeiling: 150000 },
  { fixtureId: 'fixture-08-consumer-lovable', useCase: 'consumer', route: 'mature-app-refactor', budgetCeiling: 45000 },
  { fixtureId: 'fixture-09-consumer-finance', useCase: 'consumer', route: 'new-product',      budgetCeiling: 150000 },
  { fixtureId: 'fixture-10-consumer-social',  useCase: 'consumer', route: 'new-feature',      budgetCeiling: 60000  },
  // dashboard (3 fixtures)
  { fixtureId: 'fixture-11-dashboard-ds-extraction', useCase: 'dashboard', route: 'DS-extraction', budgetCeiling: 120000 },
  { fixtureId: 'fixture-12-dashboard-admin',         useCase: 'dashboard', route: 'new-product',   budgetCeiling: 150000 },
  { fixtureId: 'fixture-13-dashboard-reporting',     useCase: 'dashboard', route: 'new-product',   budgetCeiling: 150000 },
  // marketing (2 fixtures)
  { fixtureId: 'fixture-14-marketing-landing', useCase: 'marketing', route: 'new-product',   budgetCeiling: 150000 },
  { fixtureId: 'fixture-15-marketing-rebrand', useCase: 'marketing', route: 'brand-refresh', budgetCeiling: 55000  },
];

// ============================================================
// selectDeterministicSample tests
// ============================================================

describe('selectDeterministicSample', () => {
  it('returns exactly sampleSize=5 fixtures from the 15-fixture manifest', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    const sample = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    expect(sample).toHaveLength(5);
  });

  it('is deterministic: same inputs always return same output', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    const sample1 = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    const sample2 = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    expect(JSON.stringify(sample1)).toBe(JSON.stringify(sample2));
  });

  it('does not use Math.random() — returns same result across multiple calls', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    const results = Array.from({ length: 5 }, () =>
      selectDeterministicSample(SAMPLE_FIXTURES, 5).map(f => f.fixtureId)
    );
    const first = JSON.stringify(results[0]);
    for (const r of results) {
      expect(JSON.stringify(r)).toBe(first);
    }
  });

  it('includes exactly 1 fixture per use-case category (b2b-saas, consumer, dashboard, marketing)', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    const sample = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    const useCaseCounts: Record<string, number> = {};
    for (const f of sample) {
      useCaseCounts[f.useCase] = (useCaseCounts[f.useCase] ?? 0) + 1;
    }
    expect(useCaseCounts['b2b-saas']).toBe(1);
    expect(useCaseCounts['consumer']).toBe(1);
    expect(useCaseCounts['dashboard']).toBe(1);
    expect(useCaseCounts['marketing']).toBe(1);
  });

  it('selects the first fixture per category after sorting by fixtureId (stable sort)', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    const sample = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    // First b2b-saas fixture sorted by fixtureId = fixture-01-b2b-taskflow
    expect(sample.find(f => f.useCase === 'b2b-saas')?.fixtureId).toBe('fixture-01-b2b-taskflow');
    // First consumer fixture sorted by fixtureId = fixture-06-consumer-fitness
    expect(sample.find(f => f.useCase === 'consumer')?.fixtureId).toBe('fixture-06-consumer-fitness');
    // First dashboard fixture sorted by fixtureId = fixture-11-dashboard-ds-extraction
    expect(sample.find(f => f.useCase === 'dashboard')?.fixtureId).toBe('fixture-11-dashboard-ds-extraction');
    // First marketing fixture sorted by fixtureId = fixture-14-marketing-landing
    expect(sample.find(f => f.useCase === 'marketing')?.fixtureId).toBe('fixture-14-marketing-landing');
  });

  it('5th fixture is the route-mandatory (mature-app-refactor or DS-extraction)', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    const sample = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    const routeMandatory = sample.find(
      f => f.route === 'mature-app-refactor' || f.route === 'DS-extraction'
    );
    expect(routeMandatory).toBeDefined();
  });

  it('route-mandatory is first fixture matching mature-app-refactor or DS-extraction', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    const sample = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    // fixture-08-consumer-lovable has mature-app-refactor; fixture-11-dashboard-ds-extraction has DS-extraction.
    // fixture-08 comes first alphabetically if consumer group doesn't already occupy the slot.
    // The route-mandatory slot finds the FIRST fixture with the route (sorted by fixtureId)
    // among those NOT already selected by category logic.
    const routeMandatory = sample.find(
      f => f.route === 'mature-app-refactor' || f.route === 'DS-extraction'
    );
    expect(['fixture-08-consumer-lovable', 'fixture-11-dashboard-ds-extraction']).toContain(
      routeMandatory?.fixtureId
    );
  });

  it('handles a fixture set with fewer than 4 categories by using available ones', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    // Subset with only 3 categories
    const subset = SAMPLE_FIXTURES.filter(f => f.useCase !== 'marketing');
    const sample = selectDeterministicSample(subset, 5);
    // Should still return up to 5 (or however many available without duplication)
    expect(sample.length).toBeGreaterThan(0);
    expect(sample.length).toBeLessThanOrEqual(5);
    // Should have no duplicates
    const ids = sample.map(f => f.fixtureId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns a copy — mutating result does not affect subsequent calls', async () => {
    const { selectDeterministicSample } = await import('../../assets/scripts/cross-host-parity.mjs');
    const sample1 = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    // Mutate the returned array
    (sample1[0] as Record<string, unknown>)['_mutated'] = true;
    const sample2 = selectDeterministicSample(SAMPLE_FIXTURES, 5);
    // Second call should not reflect mutation
    expect((sample2[0] as Record<string, unknown>)['_mutated']).toBeUndefined();
  });
});

// ============================================================
// computeParityDelta tests
// ============================================================

describe('computeParityDelta', () => {
  it('0.6 host vs 0.8 baseline → delta = 0.2 (absolute, not signed)', async () => {
    const { computeParityDelta } = await import('../../assets/scripts/cross-host-parity.mjs');
    expect(computeParityDelta(0.6, 0.8)).toBeCloseTo(0.2, 5);
  });

  it('0.8 host vs 0.8 baseline → delta = 0.0', async () => {
    const { computeParityDelta } = await import('../../assets/scripts/cross-host-parity.mjs');
    expect(computeParityDelta(0.8, 0.8)).toBeCloseTo(0.0, 5);
  });

  it('1.0 host vs 0.9 baseline → delta = 0.1 (host outperforming baseline is also detected)', async () => {
    const { computeParityDelta } = await import('../../assets/scripts/cross-host-parity.mjs');
    expect(computeParityDelta(1.0, 0.9)).toBeCloseTo(0.1, 5);
  });

  it('result is always non-negative (absolute value)', async () => {
    const { computeParityDelta } = await import('../../assets/scripts/cross-host-parity.mjs');
    expect(computeParityDelta(0.3, 0.9)).toBeGreaterThanOrEqual(0);
    expect(computeParityDelta(0.9, 0.3)).toBeGreaterThanOrEqual(0);
    // And symmetric
    expect(computeParityDelta(0.3, 0.9)).toBeCloseTo(computeParityDelta(0.9, 0.3), 5);
  });

  it('delta > 0.10 indicates escalation needed', async () => {
    const { computeParityDelta } = await import('../../assets/scripts/cross-host-parity.mjs');
    const delta = computeParityDelta(0.5, 0.9);
    expect(delta).toBeGreaterThan(0.10);
  });

  it('delta <= 0.10 indicates parity within threshold', async () => {
    const { computeParityDelta } = await import('../../assets/scripts/cross-host-parity.mjs');
    const delta = computeParityDelta(0.85, 0.9);
    expect(delta).toBeLessThanOrEqual(0.10);
  });

  it('handles edge cases: both 0', async () => {
    const { computeParityDelta } = await import('../../assets/scripts/cross-host-parity.mjs');
    expect(computeParityDelta(0, 0)).toBe(0);
  });

  it('handles edge cases: both 1', async () => {
    const { computeParityDelta } = await import('../../assets/scripts/cross-host-parity.mjs');
    expect(computeParityDelta(1, 1)).toBe(0);
  });
});
