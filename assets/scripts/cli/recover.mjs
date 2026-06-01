// assets/scripts/cli/recover.mjs
// CLI subcommand: complete-design recover
// Inspects .complete-design/manifest.lock and reports the resume point.
//
// Registered automatically by bin/complete-design.mjs (Plan 01 auto-discovery dispatcher).
// Plan 03 does NOT modify bin/complete-design.mjs.
//
// Implements: RECOV-01..03 (machinery); interactive UX in Plan 04.
// Source: PLAN.md Task 3

import { recover } from "../recover.mjs";

export const command = {
  name: "recover",
  describe:
    "Inspect .complete-design/manifest.lock and report the resume point or confirm-before-regenerate gate",

  builder(cmd) {
    cmd
      .requiredOption(
        "--design-dir <path>",
        "Path to the design directory containing .complete-design/manifest.lock"
      )
      .option(
        "--resume",
        "Enable resume mode — read the last gate and propose the next stage",
        false
      )
      .option(
        "--allow-confirm",
        "If set, requiresConfirmation results exit with code 2 (caller must prompt user)",
        false
      );
    return cmd;
  },

  async handler(args) {
    const designDir = args.designDir;
    const resume = args.resume ?? false;
    const allowConfirm = args.allowConfirm ?? false;

    const result = await recover({ designDir, resume, allowConfirm });

    console.log(JSON.stringify(result, null, 2));

    if (result.requiresConfirmation && allowConfirm) {
      process.exit(2);
    }
  },
};
