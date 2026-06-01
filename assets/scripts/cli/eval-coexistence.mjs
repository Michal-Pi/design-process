// assets/scripts/cli/eval-coexistence.mjs
// CLI subcommand: complete-design eval coexistence
// Auto-discovered by bin/complete-design.mjs dispatcher (Plan 01 contract).
// Plan 03 does NOT modify bin/complete-design.mjs.
//
// Note: whitespace in `name` ('eval coexistence') triggers nested-group
// registration: first segment = parent command 'eval',
// remaining = subcommand 'coexistence'.
//
// Source: PLAN.md Task 2 action; bin/complete-design.mjs dispatcher contract
// Implements: D-15, D-16 (CLI entry point for aggregate coexistence eval)

/**
 * @type {{ name: string, describe: string, builder: (cmd: import('commander').Command) => void, handler: (opts: Record<string, unknown>) => Promise<void> }}
 */
export const command = {
  name: "eval coexistence",
  describe:
    "Aggregate 6-package coexistence trigger eval (complete-design + GSD + Superpowers + frontend-design + shadcn + Notion MCP)",

  builder(cmd) {
    // No additional options — runs the full aggregate eval
  },

  async handler(_opts) {
    const { runAggregateCoexistenceEval } = await import(
      "../../../evals/coexistence/aggregate-eval.mjs"
    );

    console.log("Running aggregate coexistence eval...");
    const result = await runAggregateCoexistenceEval();

    console.log("\nAggregate Coexistence Eval Results:");
    console.log(
      `  complete-design recall: ${result.recall.toFixed(3)} (${result.designOsHits}/${result.designOsTotal})`
    );
    console.log(
      `  complete-design false-fire rate: ${result.falseFireRate.toFixed(3)} (${result.designOsFalseFires}/${result.peerTotal})`
    );
    console.log(`  pass: ${result.pass}`);

    if (result.calibrationNote) {
      console.log(`\n  Calibration note: ${result.calibrationNote}`);
    }
  },
};
