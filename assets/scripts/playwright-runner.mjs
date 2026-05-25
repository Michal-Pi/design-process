// assets/scripts/playwright-runner.mjs
// Playwright webServer-style readiness probe for spawned dev servers.
// Implements PREV-01: spawn + probe with allowed-status check.
//
// Sources: RESEARCH.md "Playwright Readiness Probe" code example,
//          CONTEXT.md PREV-01, PLAN.md Task 1 behavior block.
//
// ALLOWED_STATUSES follows Playwright's webServer convention:
//   2xx (success), 3xx (redirect), 400-403 (auth/not-found pre-ready states)
// The server is considered "ready" on any of these status codes.

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

/** Status codes that indicate the server is ready per Playwright webServer convention. */
export const ALLOWED_STATUSES = [
  200, 201, 202, 203, 204, 205, 206,
  301, 302, 303, 304, 307, 308,
  400, 401, 402, 403,
];

function isAllowedStatus(status) {
  if (status >= 200 && status < 400) return true;
  return [400, 401, 402, 403].includes(status);
}

/**
 * Spawn a dev server process and probe for readiness.
 *
 * @param options.command     Executable to spawn
 * @param options.args        Arguments for the executable
 * @param options.cwd         Working directory (optional)
 * @param options.env         Environment variables (optional; defaults to process.env)
 * @param options.port        Port number (informational — used in diagnostics)
 * @param options.readyUrl    URL to poll for readiness
 * @param options.timeoutMs   Maximum wait time in milliseconds (default: 30000)
 * @returns { ready: true, pid, kill } on success
 * @throws on timeout (also kills the child process)
 */
export async function spawnAndProbe({
  command,
  args = [],
  cwd,
  env,
  port,
  readyUrl,
  timeoutMs = 30_000,
}) {
  const child = spawn(command, args, {
    cwd,
    env: env ?? process.env,
    stdio: 'pipe',
    detached: false,
  });

  function kill() {
    try {
      child.kill('SIGTERM');
    } catch {
      // Process may have already exited
    }
  }

  const deadline = Date.now() + timeoutMs;
  const pollIntervalMs = 200;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(readyUrl, {
        signal: AbortSignal.timeout(1000),
      });
      if (isAllowedStatus(response.status)) {
        return { ready: true, pid: child.pid, kill };
      }
    } catch {
      // Not ready yet — network error, ECONNREFUSED, timeout
    }
    await sleep(pollIntervalMs);
  }

  // Timed out — kill the child and throw a diagnostic error
  kill();
  throw new Error(
    `spawnAndProbe: server at ${readyUrl} did not become ready within ${timeoutMs}ms` +
    (port ? ` (port ${port})` : '')
  );
}
