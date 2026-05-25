// tests/routing/route-08-default.test.ts
// RED: ROUTE-08 default-not-all-5-stages behavior

import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const execFileAsync = promisify(execFile);
const BIN = resolve(process.cwd(), 'bin/design-os.mjs');

describe('ROUTE-08: default behavior (no --route given)', () => {
  it('suggestRoute with empty signals returns default-fallback reasoning', async () => {
    const { suggestRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = suggestRoute({});
    expect(result.reasoning).toContain('default-fallback');
  });

  it('suggestRoute alternatives exclude the suggestion itself', async () => {
    const { suggestRoute } = await import('../../assets/scripts/routing/dispatch.mjs');
    const result = suggestRoute({});
    expect(result.alternatives).not.toContain(result.suggestion);
  });

  it('CLI: design --route design-bug prints route_dispatched (Phase 2)', async () => {
    const result = await execFileAsync('node', [BIN, 'design', '--route', 'design-bug', '--design-dir', '/tmp']);
    // Phase 2: real runSubagent wiring — kind changes from route_stub_dispatched to route_dispatched
    expect(result.stdout).toContain('route_dispatched');
  });

  it('CLI: design --route new-product prints route_not_yet_implemented', async () => {
    const result = await execFileAsync('node', [BIN, 'design', '--route', 'new-product', '--design-dir', '/tmp']);
    expect(result.stdout).toContain('route_not_yet_implemented');
  });

  it('CLI: design --route invalid-route prints unknown_route', async () => {
    const result = await execFileAsync('node', [BIN, 'design', '--route', 'invalid-route', '--design-dir', '/tmp']);
    expect(result.stdout).toContain('unknown_route');
  });

  it('CLI: design without --route prints Which route prompt and exits 0', async () => {
    const result = await execFileAsync('node', [BIN, 'design', '--design-dir', '/tmp']);
    expect(result.stdout).toMatch(/Which route/i);
    expect(result.stdout).toMatch(/design-os design --route/i);
  });
});
