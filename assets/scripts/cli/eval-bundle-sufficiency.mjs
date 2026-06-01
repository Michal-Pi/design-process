// assets/scripts/cli/eval-bundle-sufficiency.mjs
// Auto-discovered CLI subcommand for the 'eval bundle-sufficiency' command.
// Registered by bin/complete-design.mjs's auto-discovery dispatcher.
// The dispatcher parses `name` by whitespace and creates nested command groups.
//
// Usage:
//   tsx bin/complete-design.mjs eval bundle-sufficiency
//
// Source: CONTEXT.md D-08; PLAN.md Task 3 action
// Implements: HAND-04 (bundle-sufficiency eval CLI entry point)

/**
 * Auto-discovered command object per the Plan 01 dispatcher contract.
 * `name` contains a space — the dispatcher creates an `eval` subcommand group
 * and registers `bundle-sufficiency` under it.
 *
 * NOTE: The evals/ directory is excluded from the published npm tarball (it is
 * dev-only). The import of sufficiency-structural.mjs is therefore LAZY (inside
 * the handler) so that `complete-design --help` and other commands do not crash in
 * installed (npm) contexts where evals/ is absent. The eval only runs when the
 * user explicitly invokes `complete-design eval bundle-sufficiency` in a dev checkout.
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
    // Lazy import: only load eval module when command is actually invoked.
    // This prevents startup failures in npm-installed contexts where evals/
    // directory is not included in the published package.
    const { runStructuralSufficiencyEval } = await import(
      "../../../evals/bundles/sufficiency-structural.mjs"
    );
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
