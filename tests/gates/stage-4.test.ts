// tests/gates/stage-4.test.ts
// TDD RED: failing tests for gate-stage-4.mjs full business logic.
// Plan 03-02 Task B.
//
// D-59: Three conditions: (a) sitemap coverage, (b) state completeness, (c) no open transitions
// INVARIANT-01: gate runs against staged path (not design/)

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-ignore TS7016: no declaration for .mjs script
const stage4m: any = await import('../../assets/scripts/gates/stage-4.mjs');
const { runStage4Gate } = stage4m;

/** Build a valid interaction spec YAML frontmatter string with all 4 canonical state types. */
function buildSpecMd(
  screen: string,
  states: { name: string; type: string }[],
  asyncOps: boolean = true
): string {
  const statesYaml = states
    .map((s) => `  - name: ${s.name}\n    type: ${s.type}`)
    .join('\n');
  return `---
artifact: interaction-spec
stage: "4"
schemaVersion: 1
screen: ${screen}
asyncOperations: ${asyncOps}
stateCount: ${states.length}
hasConditionalTransitions: true
sourceHash: sha256:${'a'.repeat(64)}
generated: "2026-05-26T10:00:00.000Z"
provenance: generated
owner: design-os
lastReviewedAt: "2026-05-26T10:00:00.000Z"
mermaidStateDiagram: "placeholder"
states:
${statesYaml}
---

# ${screen} Interaction Spec

State catalog for ${screen}.
`;
}

/** Build a valid Mermaid stateDiagram-v2 string for a screen. */
function buildDiagramMmd(states: string[], transitions: Array<[string, string, string]>): string {
  const stateLines = states.map((s) => `  ${s}`).join('\n');
  const transitionLines = transitions.map(([f, t, e]) => `  ${f} --> ${t} : ${e}`).join('\n');
  return `stateDiagram-v2
  [*] --> ${states[0] || 'idle'}
${stateLines}
${transitionLines}
`;
}

/** Build a minimal sitemap.json with a list of route paths. */
function buildSitemapJson(routes: string[]): string {
  return JSON.stringify({
    artifact: 'sitemap',
    schemaVersion: 1,
    routes: routes.map((r) => ({ path: r, title: r.split('/').pop(), jtbds: [] })),
  }, null, 2);
}

describe('gate-stage-4.mjs: sitemap coverage (D-59a)', () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('Test 1: returns failed_after_repair with 4-coverage-001 when a sitemap route has no .spec.md', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gate4-test1-'));
    tmpDirs.push(dir);

    // Create ia/sitemap.json with 2 routes
    await mkdir(join(dir, 'ia'), { recursive: true });
    await writeFile(join(dir, 'ia/sitemap.json'), buildSitemapJson(['/dashboard', '/profile']));

    // Create interactions/ with only dashboard.spec.md (missing profile.spec.md)
    await mkdir(join(dir, 'interactions'), { recursive: true });
    const dashboardStates = [
      { name: 'loading', type: 'loading' },
      { name: 'empty', type: 'empty' },
      { name: 'error', type: 'error' },
      { name: 'success', type: 'success' },
    ];
    await writeFile(
      join(dir, 'interactions/dashboard.spec.md'),
      buildSpecMd('dashboard', dashboardStates)
    );
    // Also create the diagram file
    await writeFile(
      join(dir, 'interactions/dashboard.diagram.mmd'),
      buildDiagramMmd(
        ['loading', 'empty', 'error', 'success'],
        [['loading', 'success', 'DONE'], ['loading', 'error', 'ERROR'], ['error', 'loading', 'RETRY'], ['success', 'empty', 'CLEAR']]
      )
    );

    const result = await runStage4Gate(dir);

    expect(result.kind).toBe('failed_after_repair');
    expect(Array.isArray(result.findings)).toBe(true);
    const coverageFinding = result.findings.find((f: any) => f.findingId === '4-coverage-001');
    expect(coverageFinding).toBeDefined();
  });

  it('Test 4: returns pass when all routes have spec files, all specs have 4 state types, no open transitions', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gate4-test4-'));
    tmpDirs.push(dir);

    // Create ia/sitemap.json
    await mkdir(join(dir, 'ia'), { recursive: true });
    await writeFile(join(dir, 'ia/sitemap.json'), buildSitemapJson(['/dashboard']));

    // Create interactions/ with all required files
    await mkdir(join(dir, 'interactions'), { recursive: true });
    const states = [
      { name: 'loading', type: 'loading' },
      { name: 'empty', type: 'empty' },
      { name: 'error', type: 'error' },
      { name: 'success', type: 'success' },
    ];
    await writeFile(join(dir, 'interactions/dashboard.spec.md'), buildSpecMd('dashboard', states));
    await writeFile(
      join(dir, 'interactions/dashboard.diagram.mmd'),
      buildDiagramMmd(
        ['loading', 'empty', 'error', 'success'],
        [
          ['loading', 'success', 'DONE'],
          ['loading', 'error', 'ERROR'],
          ['error', 'loading', 'RETRY'],
          ['success', 'empty', 'CLEAR'],
        ]
      )
    );

    const result = await runStage4Gate(dir);
    expect(result.kind).toBe('pass');
  });

  it('Test 5: gate runs against --staged path, not design/ (INVARIANT-01)', async () => {
    // Create two dirs: staged (complete) and design (incomplete)
    const stagedDir = await mkdtemp(join(tmpdir(), 'gate4-staged-'));
    tmpDirs.push(stagedDir);

    // staged dir: complete
    await mkdir(join(stagedDir, 'ia'), { recursive: true });
    await writeFile(join(stagedDir, 'ia/sitemap.json'), buildSitemapJson(['/checkout']));
    await mkdir(join(stagedDir, 'interactions'), { recursive: true });
    const states = [
      { name: 'loading', type: 'loading' },
      { name: 'empty', type: 'empty' },
      { name: 'error', type: 'error' },
      { name: 'success', type: 'success' },
    ];
    await writeFile(join(stagedDir, 'interactions/checkout.spec.md'), buildSpecMd('checkout', states));
    await writeFile(
      join(stagedDir, 'interactions/checkout.diagram.mmd'),
      buildDiagramMmd(
        ['loading', 'empty', 'error', 'success'],
        [['loading', 'success', 'DONE'], ['loading', 'error', 'ERROR']]
      )
    );

    // Gate the staged path — should pass
    const result = await runStage4Gate(stagedDir);
    expect(result.kind).toBe('pass');
  });
});

describe('gate-stage-4.mjs: state completeness (D-59b)', () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('Test 2: returns failed_after_repair with 4-states-001 when spec is missing canonical state types', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gate4-test2-'));
    tmpDirs.push(dir);

    await mkdir(join(dir, 'ia'), { recursive: true });
    await writeFile(join(dir, 'ia/sitemap.json'), buildSitemapJson(['/profile']));

    await mkdir(join(dir, 'interactions'), { recursive: true });
    // Only 2 states — missing 'empty' and 'error'
    const incompleteStates = [
      { name: 'loading', type: 'loading' },
      { name: 'success', type: 'success' },
    ];
    await writeFile(
      join(dir, 'interactions/profile.spec.md'),
      buildSpecMd('profile', incompleteStates)
    );
    await writeFile(
      join(dir, 'interactions/profile.diagram.mmd'),
      buildDiagramMmd(
        ['loading', 'success'],
        [['loading', 'success', 'DONE']]
      )
    );

    const result = await runStage4Gate(dir);
    expect(result.kind).toBe('failed_after_repair');
    const statesFinding = result.findings.find((f: any) => f.findingId === '4-states-001');
    expect(statesFinding).toBeDefined();
    expect(statesFinding?.evidence?.missing).toBeDefined();
  });
});

describe('gate-stage-4.mjs: no open transitions (D-59c)', () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('Test 3: returns failed_after_repair with 4-open-transition-001 when diagram has undefined target state', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gate4-test3-'));
    tmpDirs.push(dir);

    await mkdir(join(dir, 'ia'), { recursive: true });
    await writeFile(join(dir, 'ia/sitemap.json'), buildSitemapJson(['/search']));

    await mkdir(join(dir, 'interactions'), { recursive: true });
    const states = [
      { name: 'loading', type: 'loading' },
      { name: 'empty', type: 'empty' },
      { name: 'error', type: 'error' },
      { name: 'success', type: 'success' },
    ];
    await writeFile(join(dir, 'interactions/search.spec.md'), buildSpecMd('search', states));

    // Diagram with open transition to undefined state 'unknownState'
    const mmdWithOpenTransition = `stateDiagram-v2
  [*] --> loading
  loading --> success : DONE
  loading --> error : ERROR
  loading --> unknownState : WHOOPS
`;
    await writeFile(join(dir, 'interactions/search.diagram.mmd'), mmdWithOpenTransition);

    const result = await runStage4Gate(dir);
    expect(result.kind).toBe('failed_after_repair');
    const openFinding = result.findings.find((f: any) => f.findingId === '4-open-transition-001');
    expect(openFinding).toBeDefined();
    expect(openFinding?.evidence?.openTargets).toContain('unknownState');
  });
});
