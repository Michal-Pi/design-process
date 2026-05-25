// tests/references/corpus-completeness.test.ts
// RED: failing tests for the references corpus
// Task 2 - REF-01, REF-02, REF-04, D-24, D-25, D-26

import { describe, it, expect } from 'vitest';
import { readFile, stat } from 'node:fs/promises';
import { globby } from 'globby';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const REQUIRED_REFERENCES = [
  'references/garrett-elements.md',
  'references/cooper-goodwin.md',
  'references/torres-ost.md',
  'references/klement-jtbd.md',
  'references/indi-young-thinking-styles.md',
  'references/rosenfeld-ia.md',
  'references/dtcg-v2025-10.md',
  'references/design-md.md',
  'references/wcag-2-2.md',
  'references/radix-step-roles.md',
  'references/shadcn-tailwind-v4.md',
  'references/prd/lenny-one-pager.md',
];

const REQUIRED_GATE_CHECKLISTS = [
  'references/gates/stage-1.md',
  'references/gates/stage-2.md',
  'references/gates/stage-5a.md',
  'references/gates/stage-5b.md',
];

describe('references corpus: required files exist', () => {
  for (const refPath of REQUIRED_REFERENCES) {
    it(`${refPath} exists`, async () => {
      await expect(stat(resolve(ROOT, refPath))).resolves.toBeDefined();
    });
  }
});

describe('references corpus: each file has Citations section', () => {
  for (const refPath of REQUIRED_REFERENCES) {
    it(`${refPath} contains ## Citations`, async () => {
      const content = await readFile(resolve(ROOT, refPath), 'utf-8');
      expect(content).toContain('## Citations');
    });
  }
});

describe('references corpus: each file is ≤ 6000 chars', () => {
  for (const refPath of REQUIRED_REFERENCES) {
    it(`${refPath} is under 6000 characters`, async () => {
      const content = await readFile(resolve(ROOT, refPath), 'utf-8');
      expect(content.length).toBeLessThanOrEqual(6000);
    });
  }
});

describe('references corpus: exactly 4 v1.5 gate checklists', () => {
  it('exactly 4 gate checklists exist (stage-1, 2, 5a, 5b) — Stages 3+4 ship Phase 3', async () => {
    const files = await globby('references/gates/*.md', { cwd: ROOT });
    expect(files).toHaveLength(4);
  });

  for (const checklistPath of REQUIRED_GATE_CHECKLISTS) {
    it(`${checklistPath} exists`, async () => {
      await expect(stat(resolve(ROOT, checklistPath))).resolves.toBeDefined();
    });
  }

  it('stage-3.md does NOT exist in Phase 1 (ships Phase 3)', async () => {
    await expect(stat(resolve(ROOT, 'references/gates/stage-3.md'))).rejects.toThrow();
  });

  it('stage-4.md does NOT exist in Phase 1 (ships Phase 3)', async () => {
    await expect(stat(resolve(ROOT, 'references/gates/stage-4.md'))).rejects.toThrow();
  });

  for (const checklistPath of REQUIRED_GATE_CHECKLISTS) {
    it(`${checklistPath} contains 4-column table header`, async () => {
      const content = await readFile(resolve(ROOT, checklistPath), 'utf-8');
      // D-26: Check | Required for PASS | Required for VALIDATED | Citation
      expect(content).toMatch(/\|\s*Check\s*\|/);
      expect(content).toMatch(/Required for PASS/);
      expect(content).toMatch(/Citation/);
    });
  }
});

describe('references corpus: prd subdirectory', () => {
  it('references/prd/ directory exists', async () => {
    await expect(stat(resolve(ROOT, 'references/prd'))).resolves.toBeDefined();
  });
});
