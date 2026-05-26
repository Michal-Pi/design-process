// tests/audit/all-stages-missing-spec-coverage.test.ts
// Tests for Finding 2 codex review fix: audit --all-stages flags missing Stage 4
// .spec.md files by identity (Lesson 5: coverage by count AND identity).
//
// Prior to fix: detectStage4PrIssues only globbed existing .spec.md files.
// A route in sitemap.json with no corresponding spec produced ZERO findings —
// a partially-built project looked clean.
//
// Fix: runAuditAllStages enumerates expected spec files from sitemap and emits
// a '4-pr-spec-missing-001' finding for each missing spec, identified by screen name.
//
// Implements: Lesson 5 — coverage by identity not just count.
// Source: Codex review Finding 2 [P2] — all-stages.mjs:193-195

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ============================================================
// Fixture helpers
// ============================================================

/**
 * Create a design directory with N routes in sitemap but only some with .spec.md files.
 * routesWithSpecs: array of route paths that HAVE a corresponding spec file.
 * allRoutes: array of all route paths in sitemap (includes ones without specs).
 */
async function createPartialSpecDesignDir(
  baseDir: string,
  allRoutes: string[],
  routesWithSpecs: string[]
): Promise<string> {
  const designDir = join(baseDir, 'design');

  await mkdir(join(designDir, 'ia'), { recursive: true });
  await mkdir(join(designDir, 'interactions'), { recursive: true });
  await mkdir(join(designDir, 'wireframes'), { recursive: true });

  // sitemap with all routes
  const sitemap = {
    artifact: 'sitemap',
    stage: '2',
    schemaVersion: 1,
    routes: allRoutes.map(p => ({ path: p, label: p.replace(/^\//, '') })),
  };
  await writeFile(join(designDir, 'ia', 'sitemap.json'), JSON.stringify(sitemap, null, 2), 'utf8');

  // Write spec files only for the specified subset
  for (const routePath of routesWithSpecs) {
    const segments = routePath.split('/').filter(Boolean);
    const screenName = (segments[segments.length - 1] ?? '').toLowerCase().replace(/\s+/g, '-');
    if (!screenName) continue;

    const spec = [
      '---',
      'artifact: interaction-spec',
      "stage: '4'",
      'schemaVersion: 1',
      `screen: ${screenName}`,
      'asyncOperations: false',
      'stateCount: 2',
      'hasConditionalTransitions: false',
      '---',
      '',
      `## ${screenName} spec`,
    ].join('\n');
    await writeFile(join(designDir, 'interactions', `${screenName}.spec.md`), spec, 'utf8');
  }

  return designDir;
}

// ============================================================
// Tests
// ============================================================

describe('audit --all-stages: missing Stage 4 spec coverage (Codex Finding 2)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'missing-spec-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('sitemap with 3 screens, 2 have .spec.md: produces exactly 1 missing-spec finding', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    // 3 routes in sitemap, only /checkout and /profile have specs; /settings is missing
    const designDir = await createPartialSpecDesignDir(
      tmpDir,
      ['/checkout', '/profile', '/settings'],
      ['/checkout', '/profile']
    );

    const result = await runAuditAllStages({ designDir });

    expect(Array.isArray(result.findings)).toBe(true);

    const missingSpecFindings = result.findings.filter(
      (f: Record<string, unknown>) => f.findingId === '4-pr-spec-missing-001'
    );

    // Exactly one missing-spec finding (for /settings)
    expect(missingSpecFindings).toHaveLength(1);
    // The finding evidence should reference the missing screen name
    const evidence = String(missingSpecFindings[0].evidence);
    expect(evidence.toLowerCase()).toContain('settings');
  });

  it('missing-spec finding uses checkId 4-pr-spec-missing-001 and references screen name', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createPartialSpecDesignDir(
      tmpDir,
      ['/dashboard', '/missing-screen'],
      ['/dashboard']
    );

    const result = await runAuditAllStages({ designDir });

    const missingSpecFindings = result.findings.filter(
      (f: Record<string, unknown>) => f.findingId === '4-pr-spec-missing-001'
    );

    expect(missingSpecFindings.length).toBeGreaterThan(0);

    const finding = missingSpecFindings[0] as Record<string, unknown>;
    // findingId must match the canonical ID
    expect(finding.findingId).toBe('4-pr-spec-missing-001');
    // Evidence must name the missing screen
    const evidence = String(finding.evidence);
    expect(evidence.toLowerCase()).toContain('missing-screen');
    // Stage must be 4
    expect(finding.stage).toBe(4);
    // Severity must be ERROR (as defined in the fix)
    expect(finding.severity).toMatch(/BLOCKER|ERROR/); // normalizeSeverity maps ERROR→BLOCKER
  });

  it('INVERSE: all 3 specs present → no missing-spec finding', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    // All 3 routes have corresponding .spec.md files
    const designDir = await createPartialSpecDesignDir(
      tmpDir,
      ['/checkout', '/profile', '/settings'],
      ['/checkout', '/profile', '/settings']
    );

    const result = await runAuditAllStages({ designDir });

    const missingSpecFindings = result.findings.filter(
      (f: Record<string, unknown>) => f.findingId === '4-pr-spec-missing-001'
    );

    // No missing-spec findings when all specs are present
    expect(missingSpecFindings).toHaveLength(0);
  });

  it('sitemap with 1 route, missing spec: produces 1 finding naming that screen', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createPartialSpecDesignDir(
      tmpDir,
      ['/onboarding'],
      [] // no specs at all
    );

    const result = await runAuditAllStages({ designDir });

    const missingSpecFindings = result.findings.filter(
      (f: Record<string, unknown>) => f.findingId === '4-pr-spec-missing-001'
    );

    expect(missingSpecFindings).toHaveLength(1);
    const evidence = String(missingSpecFindings[0].evidence);
    expect(evidence.toLowerCase()).toContain('onboarding');
    expect(evidence).toContain('interactions/onboarding.spec.md');
  });
});
