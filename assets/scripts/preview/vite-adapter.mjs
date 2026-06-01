// assets/scripts/preview/vite-adapter.mjs
// Vite 6 preview adapter for the complete-design preview harness.
// Implements PREV-02: prepare(repoRoot) → { command, args, env, port, readyUrl }
//
// Sources: CONTEXT.md PREV-02, PLAN.md Task 1 behavior block,
//          STACK.md (Vite 6.x), complete-design-mrd-v2.md §3.11

import { allocatePort } from '../port-manager.mjs';
import { scrubEnvForPreview } from '../security-sandbox.mjs';

/**
 * Prepare a Vite 6 dev server spawn configuration.
 *
 * @param repoRoot  Absolute path to the user's repo root
 * @param options   { runId? } — defaults to current timestamp
 * @returns { command, args, env, port, readyUrl, runId, releasePort }
 */
export async function prepare(repoRoot, { runId = Date.now().toString() } = {}) {
  const { port, release: releasePort } = await allocatePort(runId, repoRoot + '/.complete-design');

  const command = 'npx';
  const args = ['vite', 'dev', '--port', String(port), '--host', '127.0.0.1'];
  const env = scrubEnvForPreview(process.env);
  const readyUrl = `http://127.0.0.1:${port}/`;

  return { command, args, env, port, readyUrl, runId, releasePort };
}
