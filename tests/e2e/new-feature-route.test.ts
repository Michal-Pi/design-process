// tests/e2e/new-feature-route.test.ts
// E2E fixture test: verifies the Next15 + Tailwind v4 + shadcn fixture is
// detectable and dispatchable (script-level, no LLM).
//
// Implements: SC-1, D-53, DIST-04, ROUTE-02

import { describe, it, expect, vi } from 'vitest';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import matter from 'gray-matter';
import { readFile } from 'node:fs/promises';

const FIXTURE_ROOT = resolve(process.cwd(), 'evals/fixtures/e2e/next15-tailwind4-shadcn');

describe('e2e fixture: Next15 + Tailwind v4 + shadcn', () => {
  it('fixture root exists', () => {
    expect(existsSync(FIXTURE_ROOT)).toBe(true);
  });

  it('detectStack identifies nextjs:true for fixture', async () => {
    const { detectStack } = await import('../../assets/scripts/routing/registry.mjs');
    const signals = detectStack(FIXTURE_ROOT);
    expect(signals.nextjs).toBe(true);
  });

  it('detectStack identifies tailwindV4:true for fixture', async () => {
    const { detectStack } = await import('../../assets/scripts/routing/registry.mjs');
    const signals = detectStack(FIXTURE_ROOT);
    expect(signals.tailwindV4).toBe(true);
  });

  it('detectStack identifies shadcn:true for fixture', async () => {
    const { detectStack } = await import('../../assets/scripts/routing/registry.mjs');
    const signals = detectStack(FIXTURE_ROOT);
    expect(signals.shadcn).toBe(true);
  });

  it('fixture PRD.md has valid artifact frontmatter', async () => {
    const prdPath = resolve(FIXTURE_ROOT, 'PRD.md');
    expect(existsSync(prdPath)).toBe(true);
    const content = await readFile(prdPath, 'utf8');
    const { data } = matter(content);
    expect(data.artifact).toBe('prd');
    expect(data.stage).toBe(0);
    expect(data.provenance).toBe('validated');
    expect(data.schemaVersion).toBe(1);
  });

  it('fixture globals.css has @import tailwindcss (v4 detection)', async () => {
    const cssPath = resolve(FIXTURE_ROOT, 'app/globals.css');
    expect(existsSync(cssPath)).toBe(true);
    const content = await readFile(cssPath, 'utf8');
    expect(content).toMatch(/@import\s+["']tailwindcss["']/);
    expect(content).toMatch(/@theme\s*\{/);
  });

  it('fixture has components/ui/ directory (shadcn detection)', () => {
    const uiDir = resolve(FIXTURE_ROOT, 'components/ui');
    expect(existsSync(uiDir)).toBe(true);
  });
});

describe('e2e dispatch: new-feature route (mocked runSubagent)', () => {
  it('dispatchRoute new-feature calls 4 stage workflows', async () => {
    vi.resetModules();
    vi.mock('../../assets/scripts/run-subagent.mjs', () => ({
      dispatchSubagent: vi.fn().mockResolvedValue({ kind: 'sequential-fallback', host: 'unknown', prompt: 'mock' }),
      detectHost: vi.fn().mockReturnValue('unknown'),
    }));

    const { dispatchRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const fixtureDesignDir = resolve(FIXTURE_ROOT, 'design');

    const result = await dispatchRoute({
      routeName: 'new-feature',
      designDir: fixtureDesignDir,
      opts: {},
    });

    expect(result.kind).toBe('route_dispatched');
    expect(result.stages).toEqual(['discover', 'structure', 'style-5a', 'systematize-5b']);
    expect(result.results).toHaveLength(4);
  });

  it('all 5 Phase 2 workflow SKILL.md files exist and have parseable frontmatter', async () => {
    const workflows = [
      'skills/workflows/discover.md',
      'skills/workflows/structure.md',
      'skills/workflows/style.md',
      'skills/workflows/systematize.md',
      'skills/workflows/ingest.md',
      'skills/workflows/audit.md',
    ];

    for (const wfPath of workflows) {
      const fullPath = resolve(process.cwd(), wfPath);
      expect(existsSync(fullPath), `Missing: ${wfPath}`).toBe(true);

      const content = await readFile(fullPath, 'utf8');
      const { data } = matter(content);
      expect(data.name, `Missing name in ${wfPath}`).toBeDefined();
      expect(typeof data.description, `description must be string in ${wfPath}`).toBe('string');
      if (data.description) {
        expect(data.description.length, `Description >200 chars in ${wfPath}: ${data.description.length}`).toBeLessThanOrEqual(200);
      }
    }
  });

  it('all Phase 2 atom SKILL.md files exist and are parseable', async () => {
    const atoms = [
      'skills/atoms/research/personas-proto.md',
      'skills/atoms/research/synthesize.md',
      'skills/atoms/research/build-ost.md',
      'skills/atoms/ia/sitemap-variants.md',
      'skills/atoms/ia/flows-from-jobs.md',
      'skills/atoms/prd/parse-or-interview.md',
    ];

    for (const atomPath of atoms) {
      const fullPath = resolve(process.cwd(), atomPath);
      expect(existsSync(fullPath), `Missing atom: ${atomPath}`).toBe(true);

      const content = await readFile(fullPath, 'utf8');
      const { data } = matter(content);
      expect(data.name, `Missing name in ${atomPath}`).toBeDefined();
    }
  });
});
