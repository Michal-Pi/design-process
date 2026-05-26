// tests/audit/all-stages-new-feature-scope.test.ts
// Tests for Finding 1 codex review fix: --new-feature --feature <name> restricts audits
// to the matched sitemap route only (not the full design dir).
//
// Fix: audit --new-feature --feature checkout should include checkout issues and
// EXCLUDE /dashboard issues. Prior to fix, full designDir was passed to all detectors.
//
// Implements: D-69 (audit --new-feature scoped to single sitemap node)
// Source: Codex review Finding 1 [P2] — all-stages.mjs:183-186

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ============================================================
// Fixture helpers
// ============================================================

/**
 * Create a design directory with two routes (/checkout and /dashboard),
 * each with intentional Stage 4 issues in their spec files so we can
 * verify scope filtering by checking which issues appear in the audit.
 */
async function createMultiRouteDesignDir(baseDir: string): Promise<string> {
  const designDir = join(baseDir, 'design');

  // ia/sitemap.json with two routes
  await mkdir(join(designDir, 'ia'), { recursive: true });
  const sitemap = {
    artifact: 'sitemap',
    stage: '2',
    schemaVersion: 1,
    routes: [
      { path: '/checkout', label: 'Checkout' },
      { path: '/dashboard', label: 'Dashboard' },
    ],
  };
  await writeFile(join(designDir, 'ia', 'sitemap.json'), JSON.stringify(sitemap, null, 2), 'utf8');

  // interactions/ — both screens have asyncOperations:true but are MISSING loading+error states
  // This ensures Stage 4 detector finds issues for both screens.
  await mkdir(join(designDir, 'interactions'), { recursive: true });

  // checkout.spec.md — async, missing error state intentionally (creates 4-pr-states-001)
  const checkoutSpec = [
    '---',
    'artifact: interaction-spec',
    "stage: '4'",
    'schemaVersion: 1',
    'screen: checkout',
    'asyncOperations: true',
    'stateCount: 3',
    'hasConditionalTransitions: true',
    'states:',
    '  - type: loading',
    '  - type: success',
    '---',
    '',
    '## Checkout interaction spec',
    '',
    'Missing error state intentionally — triggers 4-pr-states-001.',
  ].join('\n');
  await writeFile(join(designDir, 'interactions', 'checkout.spec.md'), checkoutSpec, 'utf8');

  // dashboard.spec.md — async, missing loading+error states (creates 4-pr-states-001 for dashboard)
  const dashboardSpec = [
    '---',
    'artifact: interaction-spec',
    "stage: '4'",
    'schemaVersion: 1',
    'screen: dashboard',
    'asyncOperations: true',
    'stateCount: 2',
    'hasConditionalTransitions: true',
    'states:',
    '  - type: success',
    '---',
    '',
    '## Dashboard interaction spec',
    '',
    'Missing loading AND error states — triggers 4-pr-states-001 for dashboard.',
  ].join('\n');
  await writeFile(join(designDir, 'interactions', 'dashboard.spec.md'), dashboardSpec, 'utf8');

  // wireframes/ — no CHOICE.md for either screen (creates 3-pr-choice-001 for both)
  await mkdir(join(designDir, 'wireframes'), { recursive: true });

  return designDir;
}

// ============================================================
// Tests
// ============================================================

describe('audit --new-feature scope enforcement (Codex Finding 1)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'new-feature-scope-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('--new-feature --feature checkout: findings include checkout issues', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createMultiRouteDesignDir(tmpDir);

    const result = await runAuditAllStages({
      designDir,
      featureName: 'checkout',
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.auditType).toContain('feature-audit');
    expect(result.auditType).toContain('checkout');

    // Stage 4 issue for checkout (missing error state) should appear
    const checkoutFindings = result.findings.filter(
      (f: Record<string, unknown>) =>
        typeof f.evidence === 'string' && f.evidence.includes('checkout')
    );
    expect(checkoutFindings.length).toBeGreaterThan(0);
  });

  it('--new-feature --feature checkout: findings EXCLUDE dashboard issues (scope enforcement)', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createMultiRouteDesignDir(tmpDir);

    const result = await runAuditAllStages({
      designDir,
      featureName: 'checkout',
    });

    expect(Array.isArray(result.findings)).toBe(true);

    // Dashboard findings should NOT appear — they belong to a different route
    const dashboardFindings = result.findings.filter(
      (f: Record<string, unknown>) =>
        typeof f.evidence === 'string' && f.evidence.toLowerCase().includes('dashboard')
    );
    expect(dashboardFindings).toHaveLength(0);
  });

  it('--all-stages (no featureName): findings include BOTH checkout and dashboard issues', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createMultiRouteDesignDir(tmpDir);

    // Run without featureName — should see issues from both routes
    const result = await runAuditAllStages({ designDir });

    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.auditType).toBe('all-stages');

    // Stage 4 issues should exist for at least one of the screens
    const stage4Findings = result.findings.filter(
      (f: Record<string, unknown>) => f.stage === 4
    );
    expect(stage4Findings.length).toBeGreaterThan(0);
  });

  it('--new-feature --feature dashboard: scopes to dashboard, excludes checkout', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createMultiRouteDesignDir(tmpDir);

    const result = await runAuditAllStages({
      designDir,
      featureName: 'dashboard',
    });

    expect(result.auditType).toContain('feature-audit');
    expect(result.auditType).toContain('dashboard');

    // Checkout findings should NOT appear
    const checkoutFindings = result.findings.filter(
      (f: Record<string, unknown>) =>
        typeof f.evidence === 'string' && f.evidence.toLowerCase().includes('checkout')
    );
    expect(checkoutFindings).toHaveLength(0);
  });
});
