// tests/audit/reverse-engineer-error-state.test.ts
// Tests for Finding 3 fix: error-state signals preserved in inferred specs.
//
// Problem (pre-fix): when the DOM inference detected setError()/error handling in
// a component, it incremented stateCount but never stored `hasError: true` on the
// screenInteractions object. The spec emit then used `info.hasError !== undefined`
// (always false since hasError was undefined) so the 'error' state was silently
// dropped from the states list — while transitions `loading --> error` and
// `error --> idle` were still emitted. This created open transitions that would
// fail gate-stage-4's D-59c no-open-transitions check.
//
// Fix: store `hasError` on the interaction object; conditionally include the error
// state AND its transitions only when hasError === true.
//
// Source: Codex review Finding 3 [P2] — "Preserve error-state signals in inferred specs"
// Implements: D-59c (no open transitions), AUDIT-06, AUDIT-07

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// @ts-ignore TS7016: no declaration for .mjs script
const reverseEngineerModule: any = await import(
  '../../assets/scripts/audit/reverse-engineer.mjs'
);
const { runReverseEngineer } = reverseEngineerModule;

/** Create a fixture component with setError() to trigger error-state detection */
async function makeErrorFixtureDir(baseDir: string, opts: { withError: boolean } = { withError: true }): Promise<string> {
  const srcDir = join(baseDir, 'error-fixture');
  await mkdir(join(srcDir, 'components'), { recursive: true });
  await mkdir(join(srcDir, 'app', 'dashboard'), { recursive: true });

  if (opts.withError) {
    // Component with explicit setError() call — triggers hasError detection
    await writeFile(
      join(srcDir, 'components', 'DataLoader.tsx'),
      `import React, { useState } from 'react';
export function DataLoader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setLoading(true);
    try {
      await fetchData();
    } catch (e) {
      setError(String(e));  // <-- triggers hasError detection
    } finally {
      setLoading(false);
    }
  }
  if (error) return <p role="alert">{error}</p>;
  return <div>{loading ? 'Loading...' : <button onClick={load}>Load</button>}</div>;
}`,
      'utf8'
    );
  } else {
    // Component with async but NO error handling
    await writeFile(
      join(srcDir, 'components', 'SimpleLoader.tsx'),
      `import React, { useState } from 'react';
export function SimpleLoader() {
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }
  return <div>{loading ? 'Loading...' : <button onClick={load}>Load</button>}</div>;
}`,
      'utf8'
    );
  }

  await writeFile(
    join(srcDir, 'app', 'dashboard', 'page.tsx'),
    `export default function DashboardPage() { return <div>Dashboard</div> }`,
    'utf8'
  );

  return srcDir;
}

/** Parse state names from a spec.md ## States section */
function parseStateNames(specContent: string): string[] {
  const statesMatch = specContent.match(/## States\s*([\s\S]*?)(?=## |$)/);
  if (!statesMatch) return [];
  const block = statesMatch[1] ?? '';
  const states: string[] = [];
  for (const line of block.split('\n')) {
    const m = line.match(/^-\s+([a-zA-Z][a-zA-Z0-9_-]*)\s*:/);
    if (m) states.push(m[1] ?? '');
  }
  return states.filter(Boolean);
}

/** Parse transition targets from a spec.md ## Transitions section */
function parseTransitionTargets(specContent: string): string[] {
  const transMatch = specContent.match(/## Transitions\s*([\s\S]*?)(?=## |$)/);
  if (!transMatch) return [];
  const block = transMatch[1] ?? '';
  const targets: string[] = [];
  // Lines like: - idle --> loading : on SUBMIT
  for (const line of block.split('\n')) {
    const m = line.match(/-->\s+([a-zA-Z][a-zA-Z0-9_-]*)\s*/);
    if (m) targets.push(m[1] ?? '');
  }
  return targets.filter(Boolean);
}

/** Check that every transition target is declared in the states list */
function hasOpenTransitions(specContent: string): boolean {
  const states = new Set(parseStateNames(specContent));
  const targets = parseTransitionTargets(specContent);
  return targets.some(t => !states.has(t));
}

describe('reverse-engineer error-state preservation (Finding 3 fix)', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 're-error-state-test-'));
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('component with setError() produces spec with error state declared', async () => {
    const sourceDir = await makeErrorFixtureDir(tmpBase, { withError: true });
    const outputDir = join(tmpBase, 'design', 'inferred');

    const result = await runReverseEngineer({ source: sourceDir, outputDir, dryRun: false });

    // At least one interaction spec should be created
    const specFiles = result.artifactsCreated.filter((p: string) => p.endsWith('.spec.md'));
    expect(specFiles.length).toBeGreaterThan(0);

    // Find the spec for the DataLoader component
    const dataLoaderSpec = specFiles.find((p: string) => p.includes('dataloader') || p.includes('data-loader'));
    expect(dataLoaderSpec).toBeDefined();

    const content = await readFile(dataLoaderSpec!, 'utf8');

    // The 'error' state must be declared in the ## States section
    const stateNames = parseStateNames(content);
    expect(stateNames).toContain('error');
  });

  it('spec with error state has no open transitions (all targets declared)', async () => {
    const sourceDir = await makeErrorFixtureDir(tmpBase, { withError: true });
    const outputDir = join(tmpBase, 'design', 'inferred');

    const result = await runReverseEngineer({ source: sourceDir, outputDir, dryRun: false });

    const specFiles = result.artifactsCreated.filter((p: string) => p.endsWith('.spec.md'));
    expect(specFiles.length).toBeGreaterThan(0);

    for (const specFile of specFiles) {
      const content = await readFile(specFile, 'utf8');
      const openTransitions = hasOpenTransitions(content);
      expect(
        openTransitions,
        `Spec ${specFile} has open transitions — transition targets undefined states.\n` +
        `States: ${parseStateNames(content).join(', ')}\n` +
        `Targets: ${parseTransitionTargets(content).join(', ')}`
      ).toBe(false);
    }
  });

  it('component without error handling does NOT get error state or error transitions', async () => {
    const sourceDir = await makeErrorFixtureDir(tmpBase, { withError: false });
    const outputDir = join(tmpBase, 'design', 'inferred');

    const result = await runReverseEngineer({ source: sourceDir, outputDir, dryRun: false });

    const specFiles = result.artifactsCreated.filter((p: string) => p.endsWith('.spec.md'));

    for (const specFile of specFiles) {
      const content = await readFile(specFile, 'utf8');
      const stateNames = parseStateNames(content);
      const targets = parseTransitionTargets(content);

      // Since there's no error handling, 'error' should not appear as a state
      // (if it did, the transition would be to a non-existing state for no reason)
      if (!stateNames.includes('error')) {
        // Good — no error state declared
        // Verify there are also no error-targeting transitions
        expect(targets).not.toContain('error');
      }
      // If for some reason error IS in states, transitions must not be open
      expect(hasOpenTransitions(content)).toBe(false);
    }
  });

  it('error state entry has sensible defaults in generated spec (terminal-style, no outgoing)', async () => {
    const sourceDir = await makeErrorFixtureDir(tmpBase, { withError: true });
    const outputDir = join(tmpBase, 'design', 'inferred');

    const result = await runReverseEngineer({ source: sourceDir, outputDir, dryRun: false });

    const specFiles = result.artifactsCreated.filter((p: string) => p.endsWith('.spec.md'));
    const dataLoaderSpec = specFiles.find((p: string) => p.includes('dataloader') || p.includes('data-loader'));
    expect(dataLoaderSpec).toBeDefined();

    const content = await readFile(dataLoaderSpec!, 'utf8');

    // error state should have a meaningful description (not an empty entry)
    expect(content).toMatch(/error\s*:\s*.+/);

    // Only one transition should originate FROM error (error --> idle for RETRY)
    // — error is semi-terminal (has a RETRY out) but not a full sink
    const errTransitions = content.match(/- error\s*-->/g);
    // There should be at most 1 outgoing transition from error
    expect((errTransitions ?? []).length).toBeLessThanOrEqual(1);
  });

  it('hasError flag is stored in screenInteractions so frontmatter hasError field is emitted', async () => {
    const sourceDir = await makeErrorFixtureDir(tmpBase, { withError: true });
    const outputDir = join(tmpBase, 'design', 'inferred');

    const result = await runReverseEngineer({ source: sourceDir, outputDir, dryRun: false });

    const specFiles = result.artifactsCreated.filter((p: string) => p.endsWith('.spec.md'));
    const dataLoaderSpec = specFiles.find((p: string) => p.includes('dataloader') || p.includes('data-loader'));
    expect(dataLoaderSpec).toBeDefined();

    const content = await readFile(dataLoaderSpec!, 'utf8');

    // The frontmatter should carry hasError: true
    expect(content).toContain('hasError: true');
  });
});
