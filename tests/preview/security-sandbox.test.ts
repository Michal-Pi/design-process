// tests/preview/security-sandbox.test.ts
// RED: failing tests for security-sandbox.mjs
// Task 1 - PREV-01: Permission boundary (path allowlist + env scrub)

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';

describe('security-sandbox: isPathAllowed', () => {
  it('exports isPathAllowed and scrubEnvForPreview', async () => {
    const m = await import('../../assets/scripts/security-sandbox.mjs');
    expect(typeof m.isPathAllowed).toBe('function');
    expect(typeof m.scrubEnvForPreview).toBe('function');
  });

  it('allows reads from design/ subdirectory', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed(join(root, 'design/persona.json'), 'read', root)).toBe(true);
  });

  it('allows writes to design/ subdirectory', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed(join(root, 'design/stage-1/output.md'), 'write', root)).toBe(true);
  });

  it('allows reads from .complete-design/ subdirectory', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed(join(root, '.complete-design/manifest.lock'), 'read', root)).toBe(true);
  });

  it('allows writes to .complete-design/ subdirectory', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed(join(root, '.complete-design/preview/run-1/port.lock'), 'write', root)).toBe(true);
  });

  it('rejects path-traversal outside projectRoot', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed('/etc/passwd', 'read', root)).toBe(false);
  });

  it('rejects paths outside projectRoot that look safe', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed('/project/other-dir/file.md', 'read', root)).toBe(false);
  });

  it('rejects random path inside projectRoot not in allowlist', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed(join(root, 'some/random/path/file.txt'), 'read', root)).toBe(false);
  });

  it('allows reads from PRD.md at project root', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed(join(root, 'PRD.md'), 'read', root)).toBe(true);
  });

  it('rejects writes to arbitrary paths even inside root', async () => {
    const { isPathAllowed } = await import('../../assets/scripts/security-sandbox.mjs');
    const root = '/project/root';
    expect(isPathAllowed(join(root, 'src/component.tsx'), 'write', root)).toBe(false);
  });
});

describe('security-sandbox: scrubEnvForPreview', () => {
  it('strips API_KEY', async () => {
    const { scrubEnvForPreview } = await import('../../assets/scripts/security-sandbox.mjs');
    const env = { API_KEY: 'secret', PATH: '/usr/bin' };
    const result = scrubEnvForPreview(env);
    expect(result.API_KEY).toBeUndefined();
  });

  it('strips MY_SECRET', async () => {
    const { scrubEnvForPreview } = await import('../../assets/scripts/security-sandbox.mjs');
    const env = { MY_SECRET: 'secret123', PATH: '/usr/bin' };
    const result = scrubEnvForPreview(env);
    expect(result.MY_SECRET).toBeUndefined();
  });

  it('strips GH_TOKEN', async () => {
    const { scrubEnvForPreview } = await import('../../assets/scripts/security-sandbox.mjs');
    const env = { GH_TOKEN: 'ghp_abc', PATH: '/usr/bin' };
    const result = scrubEnvForPreview(env);
    expect(result.GH_TOKEN).toBeUndefined();
  });

  it('strips DB_PASSWORD', async () => {
    const { scrubEnvForPreview } = await import('../../assets/scripts/security-sandbox.mjs');
    const env = { DB_PASSWORD: 'hunter2', PATH: '/usr/bin' };
    const result = scrubEnvForPreview(env);
    expect(result.DB_PASSWORD).toBeUndefined();
  });

  it('preserves NODE_ENV', async () => {
    const { scrubEnvForPreview } = await import('../../assets/scripts/security-sandbox.mjs');
    const env = { NODE_ENV: 'development', API_KEY: 'secret' };
    const result = scrubEnvForPreview(env);
    expect(result.NODE_ENV).toBe('development');
  });

  it('preserves PATH', async () => {
    const { scrubEnvForPreview } = await import('../../assets/scripts/security-sandbox.mjs');
    const env = { PATH: '/usr/bin:/bin', API_KEY: 'secret' };
    const result = scrubEnvForPreview(env);
    expect(result.PATH).toBe('/usr/bin:/bin');
  });

  it('does not mutate the original env', async () => {
    const { scrubEnvForPreview } = await import('../../assets/scripts/security-sandbox.mjs');
    const env = { API_KEY: 'secret', PATH: '/usr/bin' };
    scrubEnvForPreview(env);
    expect(env.API_KEY).toBe('secret');
  });
});
