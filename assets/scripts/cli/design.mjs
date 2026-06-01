// assets/scripts/cli/design.mjs
// CLI module for the `design` command.
// Auto-discovered by bin/complete-design.mjs; no modification to bin/ required.
//
// Usage:
//   complete-design design --route <name> --design-dir <path>
//   complete-design design --design-dir <path>  [no --route → ROUTE-08 prompt + exit 0]
//
// Sources: PLAN.md Task 2 action + notes, CONTEXT.md D-21, ROUTE-08.

import { dispatchRoute, suggestRoute, formatRoute08Prompt } from '../routing/dispatch.mjs';

export const command = {
  name: 'design',
  describe: 'Run a design route (see `complete-design design --help` for routes)',

  /** @param {import("commander").Command} cmd */
  builder(cmd) {
    cmd
      .option('--route <name>', 'Route name: new-product, new-feature, mature-app-refactor, design-bug, brand-refresh, DS-extraction, PR-audit')
      .option('--design-dir <path>', 'Path to the design directory (e.g. ./design or /project/design)');
  },

  async handler(args) {
    const designDir = args.designDir ?? args['design-dir'];

    if (!args.route) {
      // ROUTE-08: no --route given → suggest and exit 0 (never silently run all 5 stages)
      const suggestion = suggestRoute({});
      const prompt = formatRoute08Prompt(suggestion);
      console.log(prompt);
      process.exit(0);
    }

    const result = await dispatchRoute({
      routeName: args.route,
      designDir: designDir ?? '/tmp',
      opts: {},
    });

    console.log(JSON.stringify(result));
  },
};
