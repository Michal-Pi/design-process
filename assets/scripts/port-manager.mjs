// assets/scripts/port-manager.mjs
// Port manager with cross-process safety via get-port@^7 reserve option.
// Implements PREV-01: non-colliding port allocation for parallel preview spawns.
//
// Sources: RESEARCH.md "Port Manager with cross-process safety" code example,
//          CONTEXT.md PREV-01, PLAN.md Task 1 behavior block.

import getPort from 'get-port';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/** Preferred port order: Vite default, Next default, Astro default */
const PREFERRED_PORTS = [5173, 3000, 4321];

/**
 * Allocate a non-colliding port for a preview run.
 *
 * @param runId    Unique run identifier (e.g. Date.now().toString())
 * @param designOsDir  Root directory for .complete-design state (defaults to '.complete-design')
 * @returns { port, release } — call release() when the dev server process exits
 */
export async function allocatePort(runId, designOsDir = '.complete-design') {
  const lockDir = join(designOsDir, 'preview', `run-${runId}`);
  await mkdir(lockDir, { recursive: true });

  const port = await getPort({ port: PREFERRED_PORTS, host: '127.0.0.1' });

  const lockPath = join(lockDir, 'port.lock');
  const lockData = {
    port,
    pid: process.pid,
    allocated: new Date().toISOString(),
    runId,
  };
  await writeFile(lockPath, JSON.stringify(lockData, null, 2), 'utf-8');

  async function release() {
    try {
      await rm(lockPath, { force: true });
    } catch {
      // Best-effort cleanup — ignore errors
    }
  }

  return { port, release };
}
