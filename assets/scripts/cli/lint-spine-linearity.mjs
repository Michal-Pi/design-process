// assets/scripts/cli/lint-spine-linearity.mjs
// design-os lint:spine-linearity subcommand — auto-discovered by bin/design-os.mjs.
//
// Checks that no canonical artifact in a design dir references artifacts
// from a higher stage in the Garrett spine (SPINE-04 enforcement).
//
// Source: Plan 01 auto-discovery contract; CONTEXT.md SPINE-04; PLAN.md Task 1
// Implements: SPINE-04

import { lintSpineLinearity } from "../lint-spine-linearity.mjs";
import { resolve } from "node:path";

export const command = {
  name: "lint:spine-linearity",
  describe:
    "Check that no artifact depends on a higher-stage artifact (SPINE-04 linear data flow)",

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd.option(
      "--design-dir <dir>",
      "Design directory to lint (default: ./design)",
      "./design"
    );
  },

  /**
   * @param {{ designDir?: string }} args
   */
  async handler(args) {
    const designDir = resolve(args.designDir ?? "./design");

    try {
      const result = await lintSpineLinearity(designDir);

      if (result.valid) {
        console.log(`✓ SPINE linearity: clean (0 violations in ${designDir})`);
        process.exitCode = 0;
      } else {
        console.error(`✗ SPINE linearity: ${result.violations.length} violation(s) found`);
        for (const v of result.violations) {
          console.error(
            `  ${v.artifact} (stage ${v.stage}) → ${v.dependsOn} (stage ${v.violatingStage}) — forward dependency rejected`
          );
        }
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(
        "lint:spine-linearity failed:",
        err instanceof Error ? err.message : err
      );
      process.exitCode = 1;
    }
  },
};
