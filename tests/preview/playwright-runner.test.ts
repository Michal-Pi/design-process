// tests/preview/playwright-runner.test.ts
// RED: failing tests for playwright-runner.mjs
// Task 1 - PREV-01: spawnAndProbe with Playwright webServer-style readiness probe

import { describe, it, expect } from 'vitest';
import { createServer } from 'node:http';

function startToyServer(port: number): Promise<() => Promise<void>> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
    });
    server.listen(port, '127.0.0.1', () => resolve(() => new Promise(res => server.close(() => res()))));
    server.on('error', reject);
  });
}

describe('playwright-runner: spawnAndProbe', () => {
  it('exports spawnAndProbe as a function', async () => {
    const { spawnAndProbe } = await import('../../assets/scripts/playwright-runner.mjs');
    expect(typeof spawnAndProbe).toBe('function');
  });

  it('returns { ready: true, pid, kill } when server is already up', async () => {
    const { spawnAndProbe } = await import('../../assets/scripts/playwright-runner.mjs');
    const port = 19999;
    const stop = await startToyServer(port);
    try {
      // spawn a no-op process (sleep won't open a port — but readyUrl is already listening)
      const result = await spawnAndProbe({
        command: 'node',
        args: ['-e', 'setTimeout(()=>{},5000)'],
        port,
        readyUrl: `http://127.0.0.1:${port}/`,
        timeoutMs: 5000,
      });
      expect(result.ready).toBe(true);
      expect(typeof result.pid).toBe('number');
      expect(typeof result.kill).toBe('function');
      result.kill();
    } finally {
      await stop();
    }
  }, 10000);

  it('throws when readyUrl never becomes available within timeout', async () => {
    const { spawnAndProbe } = await import('../../assets/scripts/playwright-runner.mjs');
    const port = 19998;
    // No server started — should timeout
    await expect(
      spawnAndProbe({
        command: 'node',
        args: ['-e', 'setTimeout(()=>{},30000)'],
        port,
        readyUrl: `http://127.0.0.1:${port}/`,
        timeoutMs: 1500,
      })
    ).rejects.toThrow();
  }, 10000);

  it('ALLOWED_STATUSES includes 2xx, 3xx, 400, 401, 402, 403', async () => {
    const m = await import('../../assets/scripts/playwright-runner.mjs');
    expect(m.ALLOWED_STATUSES).toEqual(expect.arrayContaining([200, 301, 400, 401, 402, 403]));
  });
});
