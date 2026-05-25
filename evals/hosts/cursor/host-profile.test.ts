// evals/hosts/cursor/host-profile.test.ts
// Host-profile fixture suite for the Cursor host (D-22).
// Phase 1: scaffold + sequential-fallback shim.
// Phase 2 (D-53): verify Phase 2 workflow SKILL.md presence and parsability.
//
// Sources: CONTEXT.md D-22, D-23, D-53, PLAN.md T-02-05-B action block.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import matter from 'gray-matter';

describe('cursor: host-profile', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  it('HOST_PROFILE env is set to cursor by vitest.config', () => {
    expect(process.env.HOST_PROFILE).toBe('cursor');
  });

  it('detectHost returns cursor when CURSOR_SESSION is set', async () => {
    delete process.env.CLAUDE_CODE_SESSION;
    delete process.env.CLAUDE_CODE_BIN;
    delete process.env.CODEX_SESSION;
    process.env.CURSOR_SESSION = '1';
    const { detectHost } = await import('../../../assets/scripts/run-subagent.mjs');
    expect(detectHost()).toBe('cursor');
  });

  it('dispatchSubagent returns sequential-fallback shape for cursor', async () => {
    delete process.env.CLAUDE_CODE_SESSION;
    delete process.env.CLAUDE_CODE_BIN;
    delete process.env.CODEX_SESSION;
    process.env.CURSOR_SESSION = '1';
    const { dispatchSubagent } = await import('../../../assets/scripts/run-subagent.mjs');
    const result = await dispatchSubagent({ prompt: 'echo test', tools: ['Read'], context: 'test context' });
    expect(result.kind).toBe('sequential-fallback');
    expect(result.host).toBe('cursor');
    expect(result.prompt).toBe('echo test');
  });
});

// Phase 2 (D-53): verify Phase 2 workflow SKILL.md presence and parsability on Cursor path
describe('cursor: Phase 2 workflow SKILL.md cross-host scaffold (D-53)', () => {
  const PHASE2_WORKFLOWS = [
    'skills/workflows/discover.md',
    'skills/workflows/structure.md',
    'skills/workflows/style.md',
    'skills/workflows/systematize.md',
    'skills/workflows/audit.md',
    'skills/workflows/ingest.md',
  ];

  for (const wfPath of PHASE2_WORKFLOWS) {
    it(`${wfPath} exists and has parseable frontmatter`, async () => {
      const fullPath = resolve(process.cwd(), wfPath);
      expect(existsSync(fullPath), `Missing workflow: ${wfPath}`).toBe(true);

      const content = await readFile(fullPath, 'utf8');
      const { data } = matter(content);

      expect(data.name, `name missing in ${wfPath}`).toBeDefined();
      expect(typeof data.description, `description must be string in ${wfPath}`).toBe('string');

      // Cursor compatibility check (D-53): skill must list cursor in compatibility
      if (Array.isArray(data.compatibility)) {
        expect(data.compatibility, `${wfPath} should list cursor`).toContain('cursor');
      }
    });
  }
});
