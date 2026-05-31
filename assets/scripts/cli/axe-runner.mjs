// assets/scripts/cli/axe-runner.mjs
// CLI wrapper for the axe-runner WCAG 2.2 AA contrast gate.
// Auto-discovered by bin/design-os.mjs via glob of assets/scripts/cli/*.mjs.
//
// Usage:
//   node bin/design-os.mjs axe-runner [options]
//   node bin/design-os.mjs axe-runner --help
//   node bin/design-os.mjs axe-runner --fixtures-dir evals/acceptance --output axe-results.json
//
// Passes lint-determinism.mjs (INVARIANT-05): no LLM imports — handler lazy-imports
// the core runner which uses axe-core + Playwright + culori only.
//
// INVARIANT-02: exports command = { name, describe, builder, handler } exactly.
// INVARIANT-06: Commander flag syntax ('--flag-name <val>', desc, default).
//
// Source: 04-02-PLAN.md Task 2; INVARIANTS.md Lessons 2, 6
// Implements: ACCEPT-09, D-78 (CLI surface)

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
      'Path to write axe-results.json'
    )
    .option(
      '--fail-fast',
      'Stop after first fixture failure',
      false
    );
}

export const command = {
  name: 'axe-runner',
  describe:
    'Run WCAG 2.2 AA contrast checks on 15-fixture acceptance outputs via axe-core. Exits 1 if any fixture fails.',

  builder,

  /**
   * @param {{ fixturesDir: string, output?: string, failFast: boolean }} opts
   */
  async handler(opts) {
    const { runAxeRunner } = await import('../axe-runner.mjs');
    await runAxeRunner(opts);
  },
};
