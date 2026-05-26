// assets/scripts/cli/state-machine-emit.mjs
// Commander CLI wrapper for state-machine-emit.mjs.
// Registered by bin/design-os.mjs auto-discovery (subcommand: state-machine-emit).
//
// Lesson 2: MUST use `node bin/design-os.mjs state-machine-emit` — NOT this file directly.
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
  description: 'Emit Mermaid stateDiagram-v2 and conditional XState v5 machine from a .spec.md file.',
  options: [
    { flags: '--spec <path>', description: 'Path to the .spec.md interaction spec file (required)' },
    { flags: '--output <dir>', description: 'Output directory for .diagram.mmd and .machine.ts (required)' },
    { flags: '--screen <name>', description: 'Override screen name (defaults to spec file stem)' },
  ],
  action: async (opts) => {
    if (!opts.spec) {
      console.error('Error: --spec <path> is required.');
      process.exit(1);
    }
    if (!opts.output) {
      console.error('Error: --output <dir> is required.');
      process.exit(1);
    }

    // Security: validate --spec path (T-03-02-01)
    if (opts.spec.includes('..')) {
      console.error('Security error: --spec path must not contain ".."');
      process.exit(1);
    }

    // Ensure absolute path containment via resolve
    const resolvedSpec = resolve(opts.spec);

    const { emitToFiles } = await import('../state-machine-emit.mjs');

    try {
      const result = await emitToFiles(resolvedSpec, opts.output, opts.screen);

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
