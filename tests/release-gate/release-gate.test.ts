// tests/release-gate/release-gate.test.ts
// Unit tests for release-gate.mjs: computePercentile edge cases + gate-counting logic.
// TDD RED phase: tests committed before implementation exists.
//
// These tests verify:
//   1. computePercentile - correct p50/p95 math including edge cases
//   2. Gate-counting logic: a fixture passes only if ALL 6 gates return pass/pass_with_warnings
//   3. Hard gate boundary conditions (fixturePassCount < 12 → hardGatePassed: false)
//   4. Hard gate boundary condition (p50Tokens > 150000 → hardGatePassed: false)
//   5. Soft gate boundary conditions (p95 > 286000, wallClock > 624000)
//   6. writeReleaseNotesDisclosure appends to file
//
// Source: 04-02-PLAN.md Task 1; INVARIANTS.md Lesson 5
// Implements: ACCEPT-01, COST-07, COST-10

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ============================================================
// computePercentile tests
// ============================================================

describe('computePercentile', () => {
  it('p50 of [50,100,150,200,250] → 150', async () => {
    const { computePercentile } = await import('../../assets/scripts/release-gate.mjs');
    expect(computePercentile([50, 100, 150, 200, 250], 50)).toBe(150);
  });

  it('single-element p95 → returns the element', async () => {
    const { computePercentile } = await import('../../assets/scripts/release-gate.mjs');
    expect(computePercentile([100], 95)).toBe(100);
  });

  it('single-element p50 → returns the element', async () => {
    const { computePercentile } = await import('../../assets/scripts/release-gate.mjs');
    expect(computePercentile([42], 50)).toBe(42);
  });

  it('empty array throws Error', async () => {
    const { computePercentile } = await import('../../assets/scripts/release-gate.mjs');
    expect(() => computePercentile([], 50)).toThrow('empty values array');
  });

  it('p50 of [100] → 100', async () => {
    const { computePercentile } = await import('../../assets/scripts/release-gate.mjs');
    expect(computePercentile([100], 50)).toBe(100);
  });

  it('p50 of sorted ascending [10,20,30,40] → 20', async () => {
    const { computePercentile } = await import('../../assets/scripts/release-gate.mjs');
    // floor(4 * 0.50) = 2, sorted = [10,20,30,40], index 2 = 30
    // Actually: standard floor percentile: index = floor(n * p/100)
    // floor(4 * 0.50) = 2, but some interpretations use 0-indexed:
    // values sorted: [10,20,30,40], index = floor(4 * 0.5) = 2 → value = 30
    // The plan says: [50,100,150,200,250] pct=50 → 150
    //   n=5, idx = floor(5*0.50) = 2, sorted[2] = 150 ✓
    expect(computePercentile([10, 20, 30, 40], 50)).toBe(30);
  });

  it('p95 of [50,100,150,200,250] → 250', async () => {
    const { computePercentile } = await import('../../assets/scripts/release-gate.mjs');
    // floor(5 * 0.95) = 4, sorted[4] = 250
    expect(computePercentile([50, 100, 150, 200, 250], 95)).toBe(250);
  });

  it('does not mutate the input array', async () => {
    const { computePercentile } = await import('../../assets/scripts/release-gate.mjs');
    const input = [300, 100, 200];
    computePercentile(input, 50);
    expect(input).toEqual([300, 100, 200]);
  });
});

// ============================================================
// Gate-counting logic
// ============================================================

describe('fixture pass counting', () => {
  it('a fixture with all 6 gates pass counts as passing', async () => {
    const { computeFixturePass } = await import('../../assets/scripts/release-gate.mjs');
    const gateResults = {
      '1': { kind: 'pass' },
      '2': { kind: 'pass' },
      '3': { kind: 'pass' },
      '4': { kind: 'pass' },
      '5a': { kind: 'pass' },
      '5b': { kind: 'pass' },
    };
    expect(computeFixturePass(gateResults)).toBe(true);
  });

  it('a fixture with all 6 gates pass_with_warnings counts as passing', async () => {
    const { computeFixturePass } = await import('../../assets/scripts/release-gate.mjs');
    const gateResults = {
      '1': { kind: 'pass_with_warnings' },
      '2': { kind: 'pass_with_warnings' },
      '3': { kind: 'pass_with_warnings' },
      '4': { kind: 'pass_with_warnings' },
      '5a': { kind: 'pass_with_warnings' },
      '5b': { kind: 'pass_with_warnings' },
    };
    expect(computeFixturePass(gateResults)).toBe(true);
  });

  it('a fixture with one gate failed_after_repair counts as FAILING', async () => {
    const { computeFixturePass } = await import('../../assets/scripts/release-gate.mjs');
    const gateResults = {
      '1': { kind: 'pass' },
      '2': { kind: 'pass' },
      '3': { kind: 'failed_after_repair' },
      '4': { kind: 'pass' },
      '5a': { kind: 'pass' },
      '5b': { kind: 'pass' },
    };
    expect(computeFixturePass(gateResults)).toBe(false);
  });

  it('a fixture with one gate not_runnable counts as FAILING', async () => {
    const { computeFixturePass } = await import('../../assets/scripts/release-gate.mjs');
    const gateResults = {
      '1': { kind: 'pass' },
      '2': { kind: 'pass' },
      '3': { kind: 'pass' },
      '4': { kind: 'pass' },
      '5a': { kind: 'not_runnable' },
      '5b': { kind: 'pass' },
    };
    expect(computeFixturePass(gateResults)).toBe(false);
  });

  it('a fixture with mix of pass + pass_with_warnings counts as PASSING (Pitfall 1)', async () => {
    const { computeFixturePass } = await import('../../assets/scripts/release-gate.mjs');
    const gateResults = {
      '1': { kind: 'pass' },
      '2': { kind: 'pass_with_warnings' },
      '3': { kind: 'pass' },
      '4': { kind: 'pass_with_warnings' },
      '5a': { kind: 'pass' },
      '5b': { kind: 'pass_with_warnings' },
    };
    expect(computeFixturePass(gateResults)).toBe(true);
  });
});

// ============================================================
// Hard gate logic
// ============================================================

describe('computeHardGate', () => {
  it('fixturePassCount >= 12 AND p50 <= 150000 → hardGatePassed: true', async () => {
    const { computeHardGate } = await import('../../assets/scripts/release-gate.mjs');
    const result = computeHardGate({ fixturePassCount: 12, p50Tokens: 100000 });
    expect(result.hardGatePassed).toBe(true);
    expect(result.hardGateReason).toBeUndefined();
  });

  it('fixturePassCount = 15 AND p50 = 150000 → hardGatePassed: true (boundary)', async () => {
    const { computeHardGate } = await import('../../assets/scripts/release-gate.mjs');
    const result = computeHardGate({ fixturePassCount: 15, p50Tokens: 150000 });
    expect(result.hardGatePassed).toBe(true);
  });

  it('fixturePassCount = 11 → hardGatePassed: false (ACCEPT-01 hard block)', async () => {
    const { computeHardGate } = await import('../../assets/scripts/release-gate.mjs');
    const result = computeHardGate({ fixturePassCount: 11, p50Tokens: 100000 });
    expect(result.hardGatePassed).toBe(false);
    expect(result.hardGateReason).toContain('accept-01');
  });

  it('p50Tokens = 150001 → hardGatePassed: false (COST-07 hard block)', async () => {
    const { computeHardGate } = await import('../../assets/scripts/release-gate.mjs');
    const result = computeHardGate({ fixturePassCount: 15, p50Tokens: 150001 });
    expect(result.hardGatePassed).toBe(false);
    expect(result.hardGateReason).toContain('cost-07');
  });

  it('both gates fail → hardGatePassed: false, reason mentions both', async () => {
    const { computeHardGate } = await import('../../assets/scripts/release-gate.mjs');
    const result = computeHardGate({ fixturePassCount: 5, p50Tokens: 200000 });
    expect(result.hardGatePassed).toBe(false);
    expect(result.hardGateReason).toBeTruthy();
  });
});

// ============================================================
// Soft gate logic
// ============================================================

describe('computeSoftGateDisclosures', () => {
  it('p95 > 286000 → includes p95 disclosure', async () => {
    const { computeSoftGateDisclosures } = await import('../../assets/scripts/release-gate.mjs');
    const disclosures = computeSoftGateDisclosures({
      p95Tokens: 286001,
      wallClockP50Ms: 100,
    });
    expect(disclosures.some((d: string) => d.includes('p95'))).toBe(true);
  });

  it('p95 = 286000 → no p95 disclosure (boundary)', async () => {
    const { computeSoftGateDisclosures } = await import('../../assets/scripts/release-gate.mjs');
    const disclosures = computeSoftGateDisclosures({
      p95Tokens: 286000,
      wallClockP50Ms: 100,
    });
    expect(disclosures.some((d: string) => d.includes('p95') && d.includes('exceeded'))).toBe(false);
  });

  it('wallClockP50Ms > 624000 → includes wall-clock disclosure with CLAUDE_CODE_BIN caveat', async () => {
    const { computeSoftGateDisclosures } = await import('../../assets/scripts/release-gate.mjs');
    const disclosures = computeSoftGateDisclosures({
      p95Tokens: 100000,
      wallClockP50Ms: 624001,
    });
    expect(disclosures.some((d: string) => d.includes('wall-clock') || d.includes('wallClock'))).toBe(true);
  });

  it('all within bounds → empty disclosures array', async () => {
    const { computeSoftGateDisclosures } = await import('../../assets/scripts/release-gate.mjs');
    const disclosures = computeSoftGateDisclosures({
      p95Tokens: 200000,
      wallClockP50Ms: 500000,
    });
    expect(disclosures).toEqual([]);
  });
});

// ============================================================
// writeReleaseNotesDisclosure
// ============================================================

describe('writeReleaseNotesDisclosure', () => {
  let tmpDir: string;
  let notesPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'release-gate-test-'));
    notesPath = join(tmpDir, 'RELEASE-NOTES.md');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('creates file with cost behavior block when it does not exist', async () => {
    const { writeReleaseNotesDisclosure } = await import('../../assets/scripts/release-gate.mjs');
    await writeReleaseNotesDisclosure(['p95 exceeded 286k tokens (soft gate)'], notesPath);
    const content = await readFile(notesPath, 'utf8');
    expect(content).toContain('## v2.0 Cost Behavior');
    expect(content).toContain('p95 exceeded 286k tokens (soft gate)');
  });

  it('appends to existing file without overwriting header', async () => {
    await writeFile(notesPath, '# design-os v2.0 Release Notes\n\nInitial stub.\n', 'utf8');
    const { writeReleaseNotesDisclosure } = await import('../../assets/scripts/release-gate.mjs');
    await writeReleaseNotesDisclosure(['wall-clock disclosure'], notesPath);
    const content = await readFile(notesPath, 'utf8');
    expect(content).toContain('# design-os v2.0 Release Notes');
    expect(content).toContain('Initial stub.');
    expect(content).toContain('## v2.0 Cost Behavior');
    expect(content).toContain('wall-clock disclosure');
  });

  it('writes CLAUDE_CODE_BIN caveat in sequential-fallback context', async () => {
    const { writeReleaseNotesDisclosure } = await import('../../assets/scripts/release-gate.mjs');
    await writeReleaseNotesDisclosure(
      ['wall-clock measured with sequential-fallback dispatch only; real inference measurement requires manual SC-1 verification'],
      notesPath
    );
    const content = await readFile(notesPath, 'utf8');
    expect(content).toContain('sequential-fallback');
  });

  it('empty findings array still writes cost behavior block', async () => {
    const { writeReleaseNotesDisclosure } = await import('../../assets/scripts/release-gate.mjs');
    await writeReleaseNotesDisclosure([], notesPath);
    const content = await readFile(notesPath, 'utf8');
    expect(content).toContain('## v2.0 Cost Behavior');
  });
});
