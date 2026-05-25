// evals/hosts/claude-code/host-profile.test.ts
// Host-profile fixture suite for the Claude Code host (D-22).
// Phase 1: scaffold only — passes when sequential-fallback activates.
//
// Sources: CONTEXT.md D-22, D-23, PLAN.md Task 3 behavior block.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('claude-code: host-profile', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env before each test
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

  it('HOST_PROFILE env is set to claude-code by vitest.config', () => {
    expect(process.env.HOST_PROFILE).toBe('claude-code');
  });

  it('detectHost returns claude-code when CLAUDE_CODE_SESSION is set', async () => {
    process.env.CLAUDE_CODE_SESSION = '1';
    const { detectHost } = await import('../../../assets/scripts/run-subagent.mjs');
    expect(detectHost()).toBe('claude-code');
  });

  it('dispatchSubagent does not throw with claude-code session set (no CLAUDE_CODE_BIN)', async () => {
    process.env.CLAUDE_CODE_SESSION = '1';
    delete process.env.CLAUDE_CODE_BIN;
    const { dispatchSubagent } = await import('../../../assets/scripts/run-subagent.mjs');
    const result = await dispatchSubagent({ prompt: 'echo test', tools: [], context: '' });
    // Phase 1: no CLAUDE_CODE_BIN set → sequential-fallback marker
    // Acceptable: { kind: 'sequential-fallback', host: 'claude-code', ... } OR { kind: 'dispatched', ... }
    expect(['sequential-fallback', 'dispatched', 'dispatch-error']).toContain(result.kind);
  });

  it('dispatchSubagent returns sequential-fallback when no CLAUDE_CODE_BIN', async () => {
    process.env.CLAUDE_CODE_SESSION = '1';
    delete process.env.CLAUDE_CODE_BIN;
    const { dispatchSubagent } = await import('../../../assets/scripts/run-subagent.mjs');
    const result = await dispatchSubagent({ prompt: 'echo test', tools: [], context: '' });
    expect(result.kind).toBe('sequential-fallback');
    expect(result.host).toBe('claude-code');
  });
});
