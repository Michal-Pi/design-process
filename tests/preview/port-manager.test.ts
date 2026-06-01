// tests/preview/port-manager.test.ts
// RED: failing tests for port-manager.mjs
// Task 1 - PREV-01: allocatePort uses get-port@^7 with reserve + writes port.lock

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

describe('port-manager: allocatePort', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `complete-design-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('exports allocatePort as a function', async () => {
    const { allocatePort } = await import('../../assets/scripts/port-manager.mjs');
    expect(typeof allocatePort).toBe('function');
  });

  it('allocates a port and returns { port, release }', async () => {
    const { allocatePort } = await import('../../assets/scripts/port-manager.mjs');
    const result = await allocatePort('test-run-1', testDir);
    expect(typeof result.port).toBe('number');
    expect(result.port).toBeGreaterThan(0);
    expect(result.port).toBeLessThanOrEqual(65535);
    expect(typeof result.release).toBe('function');
    await result.release();
  });

  it('writes a port.lock file', async () => {
    const { allocatePort } = await import('../../assets/scripts/port-manager.mjs');
    const result = await allocatePort('test-run-lock', testDir);
    const lockPath = join(testDir, 'preview', 'run-test-run-lock', 'port.lock');
    const lockData = JSON.parse(await readFile(lockPath, 'utf-8'));
    expect(lockData.port).toBe(result.port);
    expect(typeof lockData.pid).toBe('number');
    expect(typeof lockData.allocated).toBe('string');
    await result.release();
  });

  it('release() deletes the port.lock file', async () => {
    const { allocatePort } = await import('../../assets/scripts/port-manager.mjs');
    const result = await allocatePort('test-run-release', testDir);
    const lockPath = join(testDir, 'preview', 'run-test-run-release', 'port.lock');
    // file exists before release
    await stat(lockPath); // throws if not found
    await result.release();
    // file gone after release
    await expect(stat(lockPath)).rejects.toThrow();
  });

  it('allocates distinct ports for two parallel runs', async () => {
    const { allocatePort } = await import('../../assets/scripts/port-manager.mjs');
    const [r1, r2] = await Promise.all([
      allocatePort('parallel-1', testDir),
      allocatePort('parallel-2', testDir),
    ]);
    expect(r1.port).not.toBe(r2.port);
    await r1.release();
    await r2.release();
  });
});
