// tests/watcher/keyword-filter.test.ts
// RED: failing tests for keyword-filter.mjs
// Task 3 - D-30, GTM-06: Anthropic-Labs watcher keyword filter

import { describe, it, expect } from 'vitest';

describe('keyword-filter: matchesWatcherCriteria', () => {
  it('exports matchesWatcherCriteria as a function', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(typeof matchesWatcherCriteria).toBe('function');
  });

  it('exports KEYWORDS array with 6 keywords', async () => {
    const { KEYWORDS } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(KEYWORDS).toHaveLength(6);
    expect(KEYWORDS).toContain('5-stage');
    expect(KEYWORDS).toContain('design process');
    expect(KEYWORDS).toContain('wireframe');
    expect(KEYWORDS).toContain('state machine');
    expect(KEYWORDS).toContain('audit');
  });

  // Known-positive titles (should match)
  it('matches title containing "5-stage design process"', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(matchesWatcherCriteria('Introducing our 5-stage design process for AI', '')).toBe(true);
  });

  it('matches title containing "wireframe AI" with body mentioning design', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(matchesWatcherCriteria('New wireframe AI tool released', 'This design tool helps designers create better wireframes')).toBe(true);
  });

  it('matches title with 2 keywords (≥2 keyword heuristic)', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    // "wireframe" + "state machine" = 2 keywords → match regardless of body
    expect(matchesWatcherCriteria('Wireframe to state machine generator ships', '')).toBe(true);
  });

  it('matches title with "design process" and body with "design"', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(matchesWatcherCriteria('New design process feature', 'Helping designers with their workflow')).toBe(true);
  });

  // Known-negative titles (should NOT match — false-positive rejection)
  it('rejects "audit" alone without design context in title', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(matchesWatcherCriteria('Security audit report Q1 2026', 'The security team completed an audit of our systems')).toBe(false);
  });

  it('rejects title with no keywords', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(matchesWatcherCriteria('New API rate limits announced', 'We are updating our pricing structure')).toBe(false);
  });

  it('rejects title with only unrelated content', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(matchesWatcherCriteria('Claude 4 performance benchmarks', 'Speed and accuracy improvements')).toBe(false);
  });

  it('rejects "audit" keyword alone with non-design body', async () => {
    const { matchesWatcherCriteria } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(matchesWatcherCriteria('Model audit results', 'The safety audit shows improvement in alignment metrics')).toBe(false);
  });
});

describe('keyword-filter: countKeywords', () => {
  it('exports countKeywords as a function', async () => {
    const { countKeywords } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(typeof countKeywords).toBe('function');
  });

  it('counts 0 for no keywords', async () => {
    const { countKeywords } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(countKeywords('Something completely unrelated')).toBe(0);
  });

  it('counts 1 for one keyword', async () => {
    const { countKeywords } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(countKeywords('New wireframe tool')).toBe(1);
  });

  it('counts 2 for two keywords', async () => {
    const { countKeywords } = await import('../../evals/watcher/keyword-filter.mjs');
    expect(countKeywords('Wireframe and design process automation')).toBe(2);
  });
});
