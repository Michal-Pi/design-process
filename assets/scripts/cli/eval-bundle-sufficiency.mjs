// assets/scripts/cli/eval-bundle-sufficiency.mjs
// Auto-discovered CLI subcommand for the 'eval bundle-sufficiency' command.
// Registered by bin/design-os.mjs's auto-discovery dispatcher.
// The dispatcher parses `name` by whitespace and creates nested command groups.
//
// Usage:
//   tsx bin/design-os.mjs eval bundle-sufficiency
//
// Source: CONTEXT.md D-08; PLAN.md Task 3 action
// Implements: HAND-04 (bundle-sufficiency eval CLI entry point)

import { runStructuralSufficiencyEval } from "../../../evals/bundles/sufficiency-structural.mjs";

/**
 * Auto-discovered command object per the Plan 01 dispatcher contract.
 * `name` contains a space — the dispatcher creates an `eval` subcommand group
 * and registers `bundle-sufficiency` under it.
 */
export const command = {
  name: "eval bundle-sufficiency",
  describe: "Bundle-sufficiency structural eval across 5 stage-transition fixtures",

  /** @param {import("commander").Command} cmd */
  builder: (cmd) => {
    // No additional options needed for the structural eval
    return cmd;
  },

  /** @param {Record<string, unknown>} _args */
  handler: async (_args) => {
    const report = await runStructuralSufficiencyEval();

    console.log(
      JSON.stringify(
        {
          pass: report.pass,
          reportPath: "evals/bundles/last-run.json",
        },
        null,
        2
      )
    );

    if (!report.pass) {
      console.error(
        "Bundle-sufficiency eval FAILED — divergences found in one or more fixtures."
      );
      process.exit(1);
    }
  },
};
