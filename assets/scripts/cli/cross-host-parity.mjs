// assets/scripts/cli/cross-host-parity.mjs
// CLI wrapper for cross-host-parity sampled driver (D-77, DIST-05/06).
//
// Registers as: node bin/complete-design.mjs cross-host-parity
//
// Flags:
//   --host <codex-cli|cursor>  Target host to test (required)
//   --sample <number>          Sample size, default 5 (escalates to 15 on regression)
//   --baseline <path>          Path to claude-code baseline parity-results.json
//   --fixtures-dir <path>      Path to acceptance fixtures directory (default: evals/acceptance)
//   --output <path>            Path to write parity-results.json
//
// INVARIANTS.md compliance:
//   Lesson 2: command = { name, describe, builder, handler }; lazy handler import.
//   Lesson 6: flags verified via node bin/complete-design.mjs cross-host-parity --help before commit.
//   Lesson 7: fixturesDir, baseline, output paths are containment-checked in the core module.
//
// Source: 04-03-PLAN.md Task 2 action block; INVARIANTS.md Lesson 2; D-77
// Implements: DIST-05, DIST-06

export const command = {
  name: 'cross-host-parity',
  describe: 'Run sampled fixture suite against Codex CLI or Cursor and compare pass-rate to Claude Code baseline.',

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd
      .option(
        '--host <host>',
        'Target host to test: codex-cli or cursor (required)',
      )
      .option(
        '--sample <number>',
        'Sample size per host (escalates to 15 on regression)',
        '5',
      )
      .option(
        '--baseline <path>',
        'Path to claude-code baseline parity-results.json',
      )
      .option(
        '--fixtures-dir <path>',
        'Path to acceptance fixtures directory',
        'evals/acceptance',
      )
      .option(
        '--output <path>',
        'Path to write parity-results.json',
      );
  },

  /**
   * @param {{ host?: string; sample?: string; baseline?: string; fixturesDir?: string; output?: string }} opts
   */
  async handler(opts) {
    // Lazy import — Lesson 2: handler imports the core module at invocation time.
    const { runCrossHostParity } = await import('../cross-host-parity.mjs');

    // Validate --host is provided and is a valid choice.
    const host = opts.host;
    if (!host || (host !== 'codex-cli' && host !== 'cursor')) {
      console.error('cross-host-parity: --host is required and must be codex-cli or cursor.');
      console.error('  Example: node bin/complete-design.mjs cross-host-parity --host codex-cli');
      process.exit(1);
    }

    // Parse --sample as number.
    const sampleNum = opts.sample !== undefined ? parseInt(opts.sample, 10) : 5;
    if (isNaN(sampleNum) || sampleNum < 1) {
      console.error(`cross-host-parity: --sample must be a positive integer; got: ${opts.sample}`);
      process.exit(1);
    }

    await runCrossHostParity({
      host,
      sample: sampleNum,
      baseline: opts.baseline,
      fixturesDir: opts.fixturesDir,
      output: opts.output,
    });
  },
};
