// assets/scripts/cli/state-machine-emit.mjs
// Commander CLI wrapper for state-machine-emit.mjs.
// Registered by bin/design-os.mjs auto-discovery (subcommand: state-machine-emit).
//
// Dispatcher contract (bin/design-os.mjs): export const command = { name, describe, builder?, handler }
// NOT { name, description, options, action } — those keys are silently ignored by the dispatcher.
//
// Lesson 2 (INVARIANTS.md): CLI modules MUST use the shape bin/design-os.mjs consumes.
// Read the dispatcher source before writing any CLI module.
//
// INVARIANT-05: No LLM imports. Deterministic CLI wrapper only.
//
// Usage (via dispatcher):
//   node bin/design-os.mjs state-machine-emit --spec <path>.spec.md --output <dir> [--screen <name>]
//
// Source: PLAN.md 03-02 Task A; INVARIANTS.md Lesson 2
// Implements: ATOM-10 CLI surface

import { resolve } from 'node:path';

export const command = {
  name: 'state-machine-emit',
  describe: 'Emit Mermaid stateDiagram-v2 and conditional XState v5 machine from a .spec.md file.',

  /** @param {import("commander").Command} cmd */
  builder(cmd) {
    cmd
      .option('--spec <path>', 'Path to the .spec.md interaction spec file (required)')
      .option('--output <dir>', 'Output directory for .diagram.mmd and .machine.ts (required)')
      .option('--screen <name>', 'Override screen name (defaults to spec file stem)');
  },

  /** @param {Record<string, unknown>} opts */
  async handler(opts) {
    const spec = /** @type {string|undefined} */ (opts.spec);
    const output = /** @type {string|undefined} */ (opts.output);
    const screen = /** @type {string|undefined} */ (opts.screen);

    if (!spec) {
      console.error('Error: --spec <path> is required.');
      process.exit(1);
    }
    if (!output) {
      console.error('Error: --output <dir> is required.');
      process.exit(1);
    }

    // Security: validate --spec path (T-03-02-01)
    if (spec.includes('..')) {
      console.error('Security error: --spec path must not contain ".."');
      process.exit(1);
    }

    // Ensure absolute path containment via resolve
    const resolvedSpec = resolve(spec);

    const { emitToFiles } = await import('../state-machine-emit.mjs');

    try {
      const result = await emitToFiles(resolvedSpec, output, screen);

      if (result.repairNeeded) {
        console.error(`[REPAIR-NEEDED] Mermaid validation failed: ${result.repairError}`);
        console.error('Run the repair loop: correct state transitions and re-run state-machine-emit.');
        process.exit(2); // exit code 2 = repair needed (distinct from error)
      }

      console.log(`[OK] Diagram written: ${result.diagramPath}`);
      if (result.machinePath) {
        console.log(`[OK] XState machine written: ${result.machinePath}`);
      } else {
        console.log('[SKIP] XState machine: D-57 conditions not met (asyncOperations/stateCount/hasConditionalTransitions)');
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  },
};
