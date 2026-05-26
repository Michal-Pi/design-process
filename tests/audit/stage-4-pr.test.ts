// tests/audit/stage-4-pr.test.ts
// TDD RED: failing tests for assets/scripts/audit/stage-4-pr.mjs
// Plan 03-02 Task B.
//
// Implements: 4-pr-states-001, 4-pr-hax18-001 findingIds (INVARIANT-06)

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-ignore TS7016: no declaration for .mjs script
const stage4prm: any = await import('../../assets/scripts/audit/stage-4-pr.mjs');
const { detectStage4PrIssues } = stage4prm;

/** Build a .spec.md with given states and asyncOperations. */
function buildSpecMd(
  screen: string,
  states: { name: string; type: string }[],
  asyncOps: boolean,
  body: string = ''
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
sourceHash: sha256:${'b'.repeat(64)}
generated: "2026-05-26T10:00:00.000Z"
provenance: generated
owner: design-os
lastReviewedAt: "2026-05-26T10:00:00.000Z"
mermaidStateDiagram: "placeholder"
states:
${statesYaml}
---

${body || `# ${screen} interaction spec`}
`;
}

describe('stage-4-pr.mjs: async ops without loading/error state', () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('Test 7: detects async .spec.md missing loading state — returns 4-pr-states-001', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stage4pr-test7-'));
    tmpDirs.push(dir);

    const interactionsDir = join(dir, 'interactions');
    await mkdir(interactionsDir, { recursive: true });

    // Async screen but missing 'loading' state type
    const states = [
      { name: 'success', type: 'success' },
      { name: 'error', type: 'error' },
    ];
    await writeFile(
      join(interactionsDir, 'checkout.spec.md'),
      buildSpecMd('checkout', states, true /* asyncOperations: true */)
    );

    const findings = await detectStage4PrIssues({ designDir: dir });
    expect(Array.isArray(findings)).toBe(true);
    const statesFinding = findings.find((f: any) => f.findingId === '4-pr-states-001');
    expect(statesFinding).toBeDefined();
  });

  it('Test 8: detects async .spec.md without hax-18 citation — returns 4-pr-hax18-001', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stage4pr-test8-'));
    tmpDirs.push(dir);

    const interactionsDir = join(dir, 'interactions');
    await mkdir(interactionsDir, { recursive: true });

    // Async screen with all state types but no hax-18 reference in body
    const states = [
      { name: 'loading', type: 'loading' },
      { name: 'empty', type: 'empty' },
      { name: 'error', type: 'error' },
      { name: 'success', type: 'success' },
    ];
    const body = `# AI Search Screen
This screen provides AI-powered search functionality. No hax guidelines cited here.`;
    await writeFile(
      join(interactionsDir, 'ai-search.spec.md'),
      buildSpecMd('ai-search', states, true, body)
    );

    const findings = await detectStage4PrIssues({ designDir: dir });
    expect(Array.isArray(findings)).toBe(true);
    const haxFinding = findings.find((f: any) => f.findingId === '4-pr-hax18-001');
    expect(haxFinding).toBeDefined();
    expect(haxFinding?.fixRecipe).toContain('hax-18');
  });

  it('Test 9: returns empty findings for clean async fixtures (all states present + hax-18 cited)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'stage4pr-clean-'));
    tmpDirs.push(dir);

    const interactionsDir = join(dir, 'interactions');
    await mkdir(interactionsDir, { recursive: true });

    const states = [
      { name: 'loading', type: 'loading' },
      { name: 'empty', type: 'empty' },
      { name: 'error', type: 'error' },
      { name: 'success', type: 'success' },
    ];
    const body = `# Dashboard Screen
Async data loading. See references/hax-18.md for AI interaction guidelines (Amershi et al. CHI 2019).
HAX-18 guideline G7 applied: support efficient invocation.`;
    await writeFile(
      join(interactionsDir, 'dashboard.spec.md'),
      buildSpecMd('dashboard', states, true, body)
    );

    const findings = await detectStage4PrIssues({ designDir: dir });
    // Async + all states + hax-18 cited → no pr-states or pr-hax18 findings
    const prStatesFindings = findings.filter((f: any) => f.findingId === '4-pr-states-001');
    const prHaxFindings = findings.filter((f: any) => f.findingId === '4-pr-hax18-001');
    expect(prStatesFindings).toHaveLength(0);
    expect(prHaxFindings).toHaveLength(0);
  });
});
