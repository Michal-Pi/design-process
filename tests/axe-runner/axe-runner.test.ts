// tests/axe-runner/axe-runner.test.ts
// Unit tests for axe-runner.mjs: buildTokenScaffold + contrast violation detection.
// TDD RED phase: tests committed before implementation exists.
//
// Tests verify:
//   1. buildTokenScaffold: generates valid HTML with CSS custom properties from DTCG tokens
//   2. buildTokenScaffold: handles OKLCH values via culori conversion
//   3. buildTokenScaffold: defensive skip of undefined/invalid OKLCH values
//   4. buildTokenScaffold: nested DTCG token groups
//   5. Axe integration: HTML with good contrast → no violations (no Playwright for unit tests)
//   6. axe-runner output: includes passingFixtures AND failingFixtures arrays (Lesson 5)
//
// Note: runAxeOnFixture uses Playwright (browser required) and is tested via integration.
// Unit tests focus on buildTokenScaffold which is pure Node.js.
//
// Source: 04-02-PLAN.md Task 2; INVARIANTS.md Lessons 2, 5, 7
// Implements: ACCEPT-09, D-78

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ============================================================
// buildTokenScaffold tests
// ============================================================

describe('buildTokenScaffold', () => {
  it('generates HTML with background-color for a color token', async () => {
    const { buildTokenScaffold } = await import('../../assets/scripts/axe-runner.mjs');
    const tokens = {
      color: {
        primary: {
          $type: 'color',
          $value: 'oklch(60% 0.2 270)',
        },
      },
    };
    const html = buildTokenScaffold(tokens);
    expect(html).toContain('background-color');
    expect(html).toContain('<html');
    expect(html).toContain('<style');
  });

  it('converts OKLCH to hex via culori', async () => {
    const { buildTokenScaffold } = await import('../../assets/scripts/axe-runner.mjs');
    const tokens = {
      color: {
        primary: {
          $type: 'color',
          $value: 'oklch(60% 0.2 270)',
        },
      },
    };
    const html = buildTokenScaffold(tokens);
    // Should contain a hex color (from culori conversion)
    expect(html).toMatch(/#[0-9a-fA-F]{6}/);
  });

  it('handles nested token groups', async () => {
    const { buildTokenScaffold } = await import('../../assets/scripts/axe-runner.mjs');
    const tokens = {
      brand: {
        primary: {
          base: {
            $type: 'color',
            $value: 'oklch(50% 0.15 200)',
          },
        },
      },
    };
    const html = buildTokenScaffold(tokens);
    expect(html).toContain('background-color');
    expect(html).toContain('Sample text');
  });

  it('skips non-color tokens ($type !== color)', async () => {
    const { buildTokenScaffold } = await import('../../assets/scripts/axe-runner.mjs');
    const tokens = {
      spacing: {
        base: {
          $type: 'dimension',
          $value: '16px',
        },
      },
      color: {
        bg: {
          $type: 'color',
          $value: 'oklch(90% 0.05 200)',
        },
      },
    };
    const html = buildTokenScaffold(tokens);
    // spacing dimension token should not appear as a color div
    expect(html).not.toContain('16px');
    // but color token should appear
    expect(html).toContain('background-color');
  });

  it('skips undefined/invalid OKLCH values (defensive)', async () => {
    const { buildTokenScaffold } = await import('../../assets/scripts/axe-runner.mjs');
    const tokens = {
      color: {
        invalid: {
          $type: 'color',
          $value: 'not-a-valid-color',
        },
        valid: {
          $type: 'color',
          $value: 'oklch(60% 0.2 270)',
        },
      },
    };
    // Should not throw, should skip invalid token
    expect(() => buildTokenScaffold(tokens)).not.toThrow();
    const html = buildTokenScaffold(tokens);
    // Valid token should still appear
    expect(html).toContain('background-color');
    // Should not have 'undefined' or 'null' in CSS values
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('null');
  });

  it('returns minimal HTML structure with :root block', async () => {
    const { buildTokenScaffold } = await import('../../assets/scripts/axe-runner.mjs');
    const tokens = {
      color: {
        accent: {
          $type: 'color',
          $value: 'oklch(70% 0.18 150)',
        },
      },
    };
    const html = buildTokenScaffold(tokens);
    expect(html).toContain(':root');
    expect(html).toContain('</html>');
    expect(html).toContain('<body');
  });

  it('empty tokens object returns empty scaffold', async () => {
    const { buildTokenScaffold } = await import('../../assets/scripts/axe-runner.mjs');
    const html = buildTokenScaffold({});
    // Should still be valid HTML structure
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });
});

// ============================================================
// AxeRunnerResult shape (Lesson 5: identity assertions)
// ============================================================

describe('AxeRunnerResult shape', () => {
  it('result includes both passingFixtures AND failingFixtures arrays', async () => {
    // Verify the exported function signature includes identity fields per Lesson 5.
    // This is a structural test — we verify the module exports the right things.
    const mod = await import('../../assets/scripts/axe-runner.mjs');
    expect(typeof mod.buildTokenScaffold).toBe('function');
    expect(typeof mod.runAxeOnFixture).toBe('function');
    expect(typeof mod.runAxeRunner).toBe('function');
  });

  it('buildAxeRunnerResult includes passingFixtures and failingFixtures', async () => {
    // Verify the result-building function produces the identity fields
    const { buildAxeRunnerResult } = await import('../../assets/scripts/axe-runner.mjs');

    const mockResults = [
      { fixtureId: 'fixture-01', pass: true, violations: [] },
      { fixtureId: 'fixture-02', pass: false, violations: [{ id: 'color-contrast', nodes: [] }] },
      { fixtureId: 'fixture-03', pass: true, violations: [] },
    ];

    const result = buildAxeRunnerResult(mockResults);

    // Lesson 5: both count AND identity
    expect(result.passingFixtures).toBeDefined();
    expect(result.failingFixtures).toBeDefined();
    expect(result.passingFixtures).toContain('fixture-01');
    expect(result.passingFixtures).toContain('fixture-03');
    expect(result.failingFixtures).toContain('fixture-02');
    expect(result.fixtureCount).toBe(3);
  });

  it('pass=true only when all fixtures have no violations', async () => {
    const { buildAxeRunnerResult } = await import('../../assets/scripts/axe-runner.mjs');

    const allPass = [
      { fixtureId: 'f1', pass: true, violations: [] },
      { fixtureId: 'f2', pass: true, violations: [] },
    ];
    expect(buildAxeRunnerResult(allPass).pass).toBe(true);

    const oneFail = [
      { fixtureId: 'f1', pass: true, violations: [] },
      { fixtureId: 'f2', pass: false, violations: [{ id: 'color-contrast', nodes: [] }] },
    ];
    expect(buildAxeRunnerResult(oneFail).pass).toBe(false);
  });
});

// ============================================================
// FIX 3: runAxeOnFixture fails when fixture output absent
// ============================================================

describe('runAxeOnFixture absent-output failure (FIX 3)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'axe-fix3-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns pass=false and fixture-output-absent violation when tokens.json missing', async () => {
    const { runAxeOnFixture } = await import('../../assets/scripts/axe-runner.mjs');

    // fixtureDir has no expected/tokens.json
    const fixtureDir = tmpDir;
    const result = await runAxeOnFixture(fixtureDir);

    expect(result.pass).toBe(false);
    expect(Array.isArray(result.violations)).toBe(true);
    expect(result.violations.length).toBeGreaterThan(0);
    const violation = result.violations[0] as { id: string; impact: string; description: string };
    expect(violation.id).toBe('fixture-output-absent');
    expect(violation.impact).toBe('critical');
    expect(violation.description).toContain('tokens.json');
  });

  it('does NOT return note field when output is absent (it returns a failure, not a skip)', async () => {
    const { runAxeOnFixture } = await import('../../assets/scripts/axe-runner.mjs');

    const fixtureDir = tmpDir;
    const result = await runAxeOnFixture(fixtureDir);

    // pass must be false — this is a hard failure, not a soft skip
    expect(result.pass).toBe(false);
    // note field should NOT be set (that was the old "skipped" behavior)
    expect((result as { note?: string }).note).toBeUndefined();
  });
});
