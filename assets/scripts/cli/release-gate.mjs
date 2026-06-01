// assets/scripts/cli/release-gate.mjs
// CLI wrapper for the release-gate orchestrator.
// Auto-discovered by bin/complete-design.mjs via glob of assets/scripts/cli/*.mjs.
//
// Usage:
//   node bin/complete-design.mjs release-gate [options]
//   node bin/complete-design.mjs release-gate --help
//   node bin/complete-design.mjs release-gate --dry-run --fixtures-dir evals/acceptance
//
// Passes lint-determinism.mjs (INVARIANT-05): no LLM imports — handler lazy-imports
// the core orchestrator which itself uses dispatchSubagent shim only.
//
// INVARIANT-02: exports command = { name, describe, builder, handler } exactly.
// INVARIANT-06: real Commander flag syntax ('--flag-name <val>', desc, default).
//
// Source: 04-02-PLAN.md Task 1; INVARIANTS.md Lessons 2, 6, 7
// Implements: ACCEPT-01, COST-07, COST-10 (CLI surface)

/**
 * @param {import("commander").Command} cmd
 */
function builder(cmd) {
  cmd
    .option(
      '--fixtures-dir <path>',
      'Path to acceptance fixtures directory',
      'evals/acceptance'
    )
    .option(
      '--output <path>',
      'Path to write release-gate-results.json'
    )
    .option(
      '--host <host>',
      'Target host (claude-code | codex-cli | cursor)',
      'claude-code'
    )
    .option(
      '--dry-run',
      'Simulate fixture run without real LLM dispatch (useful in CI)',
      false
    );
}

export const command = {
  name: 'release-gate',
  describe:
    'Run 15-fixture acceptance suite, cost gate, axe-runner, and coexistence eval. Exits 0 only if all hard gates pass.',

  builder,

  /**
   * @param {{ fixturesDir: string, output?: string, host: string, dryRun: boolean }} opts
   */
  async handler(opts) {
    const { runReleaseGate } = await import('../release-gate.mjs');
    await runReleaseGate(opts);
  },
};
