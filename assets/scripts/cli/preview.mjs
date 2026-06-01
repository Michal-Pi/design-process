// assets/scripts/cli/preview.mjs
// CLI module for the `preview` command group.
// Auto-discovered by bin/complete-design.mjs; no modification to bin/ required.
//
// Subcommands:
//   complete-design preview spawn --framework <vite|next|astro> --repo-root <path>
//   complete-design preview release-port --run-id <id>
//
// Sources: PLAN.md Task 1 action + notes (Plan 05 contributes this module;
//          bin/complete-design.mjs auto-discovers it via globby).
//          CONTEXT.md PREV-01, PREV-02.

import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const FRAMEWORK_ADAPTERS = {
  vite: '../preview/vite-adapter.mjs',
  next: '../preview/next-adapter.mjs',
  astro: '../preview/astro-adapter.mjs',
};

export const command = {
  name: 'preview',
  describe: 'Preview-harness CLI — spawn/release dev servers',

  builder(cmd) {
    cmd
      .command(
        'spawn',
        'Spawn a dev server and probe for readiness',
        (y) =>
          y
            .option('framework', {
              type: 'string',
              choices: ['vite', 'next', 'astro'],
              demandOption: true,
              describe: 'Framework to spawn (vite | next | astro)',
            })
            .option('repo-root', {
              type: 'string',
              demandOption: true,
              describe: 'Absolute or relative path to the user repo root',
            })
            .option('run-id', {
              type: 'string',
              describe: 'Unique run identifier (defaults to timestamp)',
            }),
        async (args) => {
          const adapterPath = FRAMEWORK_ADAPTERS[args.framework];
          if (!adapterPath) {
            console.error(`Unknown framework: ${args.framework}`);
            process.exit(1);
          }

          const { fileURLToPath, pathToFileURL } = await import('node:url');
          const { dirname, join } = await import('node:path');
          const __dirname = dirname(fileURLToPath(import.meta.url));
          const absoluteAdapterPath = pathToFileURL(join(__dirname, adapterPath)).href;

          const adapter = await import(absoluteAdapterPath);
          const repoRoot = resolve(args['repo-root']);
          const runId = args['run-id'] || Date.now().toString();

          const config = await adapter.prepare(repoRoot, { runId });
          console.log(JSON.stringify({ ...config, releasePort: undefined }, null, 2));
        }
      )
      .command(
        'release-port',
        'Release a port reservation by run ID',
        (y) =>
          y.option('run-id', {
            type: 'string',
            demandOption: true,
            describe: 'Run ID whose port.lock to delete',
          }),
        async (args) => {
          const { allocatePort } = await import('../port-manager.mjs');
          // release-port is idempotent — just ensure the lock is gone
          const runId = args['run-id'];
          const lockDir = resolve(`.complete-design/preview/run-${runId}`);
          const { rm } = await import('node:fs/promises');
          try {
            await rm(`${lockDir}/port.lock`, { force: true });
            console.log(JSON.stringify({ released: true, runId }));
          } catch (err) {
            console.error(JSON.stringify({ released: false, runId, error: err.message }));
            process.exit(1);
          }
        }
      );
  },

  // Top-level handler — shows help if no subcommand given
  handler() {},
};
