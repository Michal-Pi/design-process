// tests/audit/stage-3-pr.test.ts
// TDD RED: failing tests for assets/scripts/audit/stage-3-pr.mjs
// Plan 03-02 Task B.
//
// Implements: 3-pr-choice-001, 3-pr-layout-001 findingIds (INVARIANT-06)

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-ignore TS7016: no declaration for .mjs script
const stage3prm: any = await import('../../assets/scripts/audit/stage-3-pr.mjs');
const { detectStage3PrIssues } = stage3prm;

/** Build a minimal sitemap.json. */
function buildSitemapJson(routes: string[]): string {
  return JSON.stringify({
    artifact: 'sitemap',
    schemaVersion: 1,
    routes: routes.map((r) => ({ path: r, title: r.split('/').pop(), jtbds: [] })),
  }, null, 2);
}

describe('stage-3-pr.mjs: screen without CHOICE.md', () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('Test 6: detects new screen in sitemap with no CHOICE.md — returns 3-pr-choice-001', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stage3pr-test6-'));
    tmpDirs.push(dir);

    // Sitemap with 2 screens
    const sitemapPath = join(dir, 'sitemap.json');
    await writeFile(sitemapPath, buildSitemapJson(['/dashboard', '/profile']));

    // wireframes/ only has dashboard/CHOICE.md (profile missing CHOICE.md)
    const wireframesDir = join(dir, 'wireframes');
    await mkdir(join(wireframesDir, 'dashboard'), { recursive: true });
    await writeFile(join(wireframesDir, 'dashboard/CHOICE.md'), '# Choice\nSelected: v1.excalidraw\n');
    // profile dir exists but no CHOICE.md
    await mkdir(join(wireframesDir, 'profile'), { recursive: true });

    const findings = await detectStage3PrIssues({ sitemapPath, wireframesDir });
    expect(Array.isArray(findings)).toBe(true);
    const choiceFinding = findings.find((f: any) => f.findingId === '3-pr-choice-001');
    expect(choiceFinding).toBeDefined();
    expect(choiceFinding?.evidence?.screen).toContain('profile');
  });

  it('Test 9a: returns empty findings for clean fixtures (all screens have CHOICE.md)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stage3pr-clean-'));
    tmpDirs.push(dir);

    const sitemapPath = join(dir, 'sitemap.json');
    await writeFile(sitemapPath, buildSitemapJson(['/dashboard']));

    const wireframesDir = join(dir, 'wireframes');
    await mkdir(join(wireframesDir, 'dashboard'), { recursive: true });
    await writeFile(join(wireframesDir, 'dashboard/CHOICE.md'), '# Choice\nSelected: v1.excalidraw\n');

    const findings = await detectStage3PrIssues({ sitemapPath, wireframesDir });
    // Should have no 3-pr-choice-001 findings
    const choiceFindings = findings.filter((f: any) => f.findingId === '3-pr-choice-001');
    expect(choiceFindings).toHaveLength(0);
  });
});
