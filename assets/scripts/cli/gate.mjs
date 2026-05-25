// assets/scripts/cli/gate.mjs
// Auto-discovered CLI subcommand for the 'gate' command.
// Registered by bin/design-os.mjs's auto-discovery dispatcher.
//
// Usage:
//   tsx bin/design-os.mjs gate --stage <N> --design-dir <path> [--override-reason <text>] [--ci]
//
// Source: CONTEXT.md D-09, D-11; PLAN.md Task 1 action
// Implements: GATE-01..07 (CLI entry point)

import { runGate } from "../gates/base.mjs";

/**
 * Auto-discovered command object per the Plan 01 dispatcher contract.
 * bin/design-os.mjs globs cli/*.mjs and registers each module's `command` export.
 */
export const command = {
  name: "gate",
  describe: "Run a stage gate against a design directory",

  /** @param {import("commander").Command} cmd */
  builder: (cmd) => {
    cmd
      .option("--stage <stage>", "Gate stage to run (1, 2, 3, 4, 5a, 5b)")
      .option("--design-dir <path>", "Path to the design directory")
      .option("--override-reason <reason>", "Override reason (sets result to user_overridden)")
      .option("--ci", "CI mode: exit 1 if any finding has severity BLOCKER");
  },

  /** @param {Record<string, unknown>} args */
  handler: async (args) => {
    const stage = args.stage;
    const designDir = args.designDir;
    const overrideReason = args.overrideReason;
    const ci = args.ci;

    if (!stage) {
      console.error("Error: --stage is required");
      process.exit(1);
    }
    if (!designDir) {
      console.error("Error: --design-dir is required");
      process.exit(1);
    }

    const result = await runGate(stage, designDir, {
      overrideReason: overrideReason || undefined,
    });

    console.log(JSON.stringify(result, null, 2));

    // CI mode: exit 1 on any BLOCKER finding
    if (ci && result.findings && result.findings.some((f) => f.severity === "BLOCKER")) {
      process.exit(1);
    }
  },
};
