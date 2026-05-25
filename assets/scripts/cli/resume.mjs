// assets/scripts/cli/resume.mjs
// design-os resume subcommand — auto-discovered by bin/design-os.mjs dispatcher.
//
// Reads manifest.lock via recover.mjs; if requiresConfirmation, prompts user
// before proceeding. Use --yes for CI / batch mode.
//
// Source: Plan 01 auto-discovery contract; CONTEXT.md PERSIST-04; PLAN.md Task 3
// Implements: PERSIST-04, RECOV-01

import { interactiveResume } from "../recover-prompt.mjs";
import { resolve } from "node:path";

export const command = {
  name: "resume",
  describe:
    "Resume from last gate — prompts before re-running if artifacts are missing",

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd
      .option(
        "--design-dir <dir>",
        "Design directory to resume from (default: ./design)",
        "./design"
      )
      .option("--yes", "Auto-confirm regeneration prompts (CI / batch mode)", false);
  },

  /**
   * @param {{ designDir?: string, yes?: boolean }} args
   */
  async handler(args) {
    const designDir = resolve(args.designDir ?? "./design");

    try {
      const result = await interactiveResume({
        designDir,
        autoConfirm: args.yes ?? false,
      });

      if ("aborted" in result && result.aborted) {
        console.log("Resume aborted by user.");
        return;
      }

      console.log(`Resume from stage: ${result.resumeFrom}`);
      if (result.lastGate) {
        console.log(`Last gate: ${result.lastGate}`);
      }
    } catch (err) {
      console.error(
        "resume failed:",
        err instanceof Error ? err.message : err
      );
      process.exitCode = 1;
    }
  },
};
