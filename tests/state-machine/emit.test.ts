// tests/state-machine/emit.test.ts
// TDD RED: failing tests for state-machine-emit.mjs + mermaid-render.mjs stateDiagram-v2 extension.
// Plan 03-02 Task A.
//
// Implements: D-57 (XState trigger heuristic), D-58 (Mermaid stateDiagram-v2 canonical),
//             INVARIANT-05 (no LLM imports)

import { describe, it, expect } from 'vitest';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// @ts-ignore TS7016: no declaration for .mjs scripts
const emit = await import('../../assets/scripts/state-machine-emit.mjs');
// @ts-ignore TS7016: no declaration for .mjs scripts
const mermaidRender = await import('../../assets/scripts/mermaid-render.mjs');
// @ts-ignore TS7016: no declaration for .mjs scripts — used for extractStateNames in D-59c regression guard
const stage4m: any = await import('../../assets/scripts/gates/stage-4.mjs');

/** Minimal 3-state async spec (D-57 trigger: all 3 conditions true) */
const ASYNC_3_STATE_SPEC = {
  asyncOperations: true,
  stateCount: 3,
  hasConditionalTransitions: true,
  states: [
    { name: 'idle', type: 'custom' },
    { name: 'loading', type: 'loading' },
    { name: 'error', type: 'error' },
  ],
  transitions: [
    { from: 'idle', to: 'loading', event: 'SUBMIT' },
    { from: 'loading', to: 'error', event: 'ERROR' },
    { from: 'error', to: 'idle', event: 'RETRY' },
  ],
};

/** Spec with asyncOperations:false — XState MUST NOT be emitted. */
const SYNC_SPEC = {
  asyncOperations: false,
  stateCount: 3,
  hasConditionalTransitions: true,
  states: [
    { name: 'idle', type: 'custom' },
    { name: 'active', type: 'success' },
    { name: 'done', type: 'success' },
  ],
  transitions: [
    { from: 'idle', to: 'active', event: 'START' },
    { from: 'active', to: 'done', event: 'COMPLETE' },
  ],
};

/** Spec with stateCount:2 — XState MUST NOT be emitted (< 3 states). */
const TWO_STATE_SPEC = {
  asyncOperations: true,
  stateCount: 2,
  hasConditionalTransitions: true,
  states: [
    { name: 'idle', type: 'custom' },
    { name: 'loading', type: 'loading' },
  ],
  transitions: [
    { from: 'idle', to: 'loading', event: 'SUBMIT' },
  ],
};

describe('emitMermaid', () => {
  it('Test 1: produces stateDiagram-v2 string starting with "stateDiagram-v2"', () => {
    const mmd = emit.emitMermaid(ASYNC_3_STATE_SPEC);
    expect(typeof mmd).toBe('string');
    expect(mmd.trimStart().startsWith('stateDiagram-v2')).toBe(true);
  });

  it('Test 1b: contains all transition arrows from spec', () => {
    const mmd = emit.emitMermaid(ASYNC_3_STATE_SPEC);
    expect(mmd).toContain('idle --> loading');
    expect(mmd).toContain('loading --> error');
    expect(mmd).toContain('error --> idle');
  });

  it('Test 1c: contains entry transition from [*]', () => {
    const mmd = emit.emitMermaid(ASYNC_3_STATE_SPEC);
    expect(mmd).toContain('[*] -->');
  });
});

describe('emitXState', () => {
  it('Test 2: produces TypeScript with "setup(" and "createMachine(" substrings', () => {
    const ts = emit.emitXState(ASYNC_3_STATE_SPEC);
    expect(typeof ts).toBe('string');
    expect(ts).toContain('setup(');
    expect(ts).toContain('createMachine(');
  });
});

describe('emitFromSpec', () => {
  it('Test 3: with D-57 trigger conditions TRUE returns { mermaidSource, xstateSource } (both present)', () => {
    const result = emit.emitFromSpec(ASYNC_3_STATE_SPEC);
    expect(result).toHaveProperty('mermaidSource');
    expect(result).toHaveProperty('xstateSource');
    expect(typeof result.mermaidSource).toBe('string');
    expect(result.mermaidSource.trimStart().startsWith('stateDiagram-v2')).toBe(true);
    expect(typeof result.xstateSource).toBe('string');
    expect(result.xstateSource).toContain('setup(');
  });

  it('Test 4: with asyncOperations:false returns { mermaidSource, xstateSource: null }', () => {
    const result = emit.emitFromSpec(SYNC_SPEC);
    expect(result).toHaveProperty('mermaidSource');
    expect(result.xstateSource).toBeNull();
  });

  it('Test 5: with stateCount:2 returns { mermaidSource, xstateSource: null }', () => {
    const result = emit.emitFromSpec(TWO_STATE_SPEC);
    expect(result).toHaveProperty('mermaidSource');
    expect(result.xstateSource).toBeNull();
  });

  it('Test 6: output is byte-identical on two consecutive runs (determinism)', () => {
    const result1 = emit.emitFromSpec(ASYNC_3_STATE_SPEC);
    const result2 = emit.emitFromSpec(ASYNC_3_STATE_SPEC);
    expect(result1.mermaidSource).toBe(result2.mermaidSource);
    expect(result1.xstateSource).toBe(result2.xstateSource);
  });
});

describe('lint-determinism', () => {
  it('Test 7: lint-determinism scan of state-machine-emit.mjs reports zero violations', async () => {
    const scriptPath = join(ROOT, 'assets/scripts/state-machine-emit.mjs');
    const { stdout, stderr } = await execAsync(
      `node "${join(ROOT, 'assets/scripts/lint-determinism.mjs')}" "${scriptPath}"`,
      { cwd: ROOT }
    );
    const combined = stdout + stderr;
    // Should report CLEAN or 0 violations
    const hasViolation = combined.toLowerCase().includes('violation') && !combined.includes('0 violation');
    expect(hasViolation).toBe(false);
  });
});

describe('mermaid-render stateDiagram-v2 extension', () => {
  it('Test 8: validateMermaidSource() with stateDiagram-v2 input does not throw', async () => {
    const mmdSource = `stateDiagram-v2
  [*] --> idle
  idle --> loading : SUBMIT
  loading --> success : DONE
  loading --> error : ERROR
`;
    await expect(mermaidRender.validateMermaidSource(mmdSource)).resolves.not.toThrow();
  }, 15000 /* mermaid-cli headless: allow 15s */);

  it('Test 9: validateMermaidSource() with composite state syntax does not throw', async () => {
    // Pitfall B: composite state (state name { ... }) — must handle
    const mmdSource = `stateDiagram-v2
  [*] --> Active
  state Active {
    [*] --> Loading
    Loading --> Success : DONE
    Loading --> Error : ERROR
  }
  Active --> [*] : DONE
`;
    await expect(mermaidRender.validateMermaidSource(mmdSource)).resolves.not.toThrow();
  }, 15000 /* mermaid-cli headless: allow 15s */);
});

describe('verify-golden', () => {
  it('Test 10: state-machine-emit.golden.json exists', () => {
    const goldenPath = join(ROOT, 'evals/golden/state-machine-emit.golden.json');
    expect(existsSync(goldenPath)).toBe(true);
  });
});

describe('custom-state bare declaration (Finding 2 — D-59c regression guard)', () => {
  // Spec where 'permission-denied' is a custom type state, used ONLY as a transition target
  // from 'running'. If emitMermaid() skips custom states with no annotation, the diagram
  // will have 'permission-denied' only on the right side of an arrow — triggering D-59c.
  const CUSTOM_TARGET_ONLY_SPEC = {
    asyncOperations: true,
    stateCount: 4,
    hasConditionalTransitions: true,
    states: [
      { name: 'idle', type: 'custom' },
      { name: 'running', type: 'loading' },
      { name: 'done', type: 'success' },
      { name: 'permission-denied', type: 'custom' },
    ],
    transitions: [
      { from: 'idle', to: 'running', event: 'START' },
      { from: 'running', to: 'done', event: 'COMPLETE' },
      { from: 'running', to: 'permission-denied', event: 'NO_PERMS' },
    ],
  };

  it('Test 11: emitMermaid() emits a bare declaration line for every custom-type state', () => {
    const mmd = emit.emitMermaid(CUSTOM_TARGET_ONLY_SPEC);
    // 'idle' is custom — must appear as a bare declaration (exactly "  idle" on its own line)
    expect(mmd).toMatch(/^\s+idle\s*$/m);
    // 'permission-denied' is custom — must appear as a bare declaration
    expect(mmd).toMatch(/^\s+permission-denied\s*$/m);
    // Typed states still get annotations
    expect(mmd).toContain('running : %% loading');
    expect(mmd).toContain('done : %% success');
  });

  it('Test 12: emitMermaid() output passes D-59c open-transition check for custom-target states', () => {
    const mmd = emit.emitMermaid(CUSTOM_TARGET_ONLY_SPEC);
    // Verify using the extractStateNames + extractTransitionTargets helpers from stage-4.mjs
    // (imported at top of test file via the stage4m import)
    // We use the gate module's extractStateNames to simulate what the gate does
    const { extractStateNames } = stage4m;
    const declared = extractStateNames(mmd);
    // All transition targets must be in the declared set
    const targets = ['idle', 'running', 'done', 'permission-denied'];
    for (const target of targets) {
      expect(declared.has(target)).toBe(true);
    }
  });
});
