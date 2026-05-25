// assets/scripts/preview/next-adapter.mjs
// Next.js 15 App Router preview adapter for the design-os preview harness.
// Implements PREV-02: prepare(repoRoot) → { command, args, env, port, readyUrl }
//
// Note: App Router only — no Pages Router support per STACK.md constraint.
//
// Sources: CONTEXT.md PREV-02, PLAN.md Task 1 behavior block,
//          STACK.md (Next 15.x), design-os-mrd-v2.md §3.11

import { allocatePort } from '../port-manager.mjs';
import { scrubEnvForPreview } from '../security-sandbox.mjs';

/**
 * Prepare a Next.js 15 dev server spawn configuration.
 * Uses Turbopack by default (Next 15 default).
 *
 * @param repoRoot  Absolute path to the user's repo root
 * @param options   { runId? } — defaults to current timestamp
 * @returns { command, args, env, port, readyUrl, runId, releasePort }
 */
export async function prepare(repoRoot, { runId = Date.now().toString() } = {}) {
  const { port, release: releasePort } = await allocatePort(runId, repoRoot + '/.design-os');

  const command = 'npx';
  const args = ['next', 'dev', '-p', String(port)];
  const env = scrubEnvForPreview(process.env);
  const readyUrl = `http://127.0.0.1:${port}/`;

  return { command, args, env, port, readyUrl, runId, releasePort };
}
