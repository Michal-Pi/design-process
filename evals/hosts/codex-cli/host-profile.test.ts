// evals/hosts/codex-cli/host-profile.test.ts
// Host-profile fixture suite for the Codex CLI host (D-22).
// Phase 1: scaffold only — sequential-fallback shim is minimum-viable.
//
// Sources: CONTEXT.md D-22, D-23, PLAN.md Task 3 behavior block.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('codex-cli: host-profile', () => {
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

  it('HOST_PROFILE env is set to codex-cli by vitest.config', () => {
    expect(process.env.HOST_PROFILE).toBe('codex-cli');
  });

  it('detectHost returns codex-cli when CODEX_SESSION is set', async () => {
    delete process.env.CLAUDE_CODE_SESSION;
    delete process.env.CLAUDE_CODE_BIN;
    process.env.CODEX_SESSION = '1';
    const { detectHost } = await import('../../../assets/scripts/run-subagent.mjs');
    expect(detectHost()).toBe('codex-cli');
  });

  it('dispatchSubagent returns sequential-fallback shape for codex-cli', async () => {
    delete process.env.CLAUDE_CODE_SESSION;
    delete process.env.CLAUDE_CODE_BIN;
    process.env.CODEX_SESSION = '1';
    const { dispatchSubagent } = await import('../../../assets/scripts/run-subagent.mjs');
    const result = await dispatchSubagent({ prompt: 'echo test', tools: ['Read'], context: 'test context' });
    expect(result.kind).toBe('sequential-fallback');
    expect(result.host).toBe('codex-cli');
    expect(result.prompt).toBe('echo test');
  });
});
