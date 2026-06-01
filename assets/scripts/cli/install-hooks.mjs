// assets/scripts/cli/install-hooks.mjs
// complete-design install-hooks subcommand — auto-discovered by bin/complete-design.mjs.
//
// Installs the complete-design pre-commit hook that scans staged files for PII.
// Creates tools/install-hooks.sh and symlinks .git/hooks/pre-commit.
//
// Source: Plan 01 auto-discovery contract; CONTEXT.md D-19; PLAN.md Task 2
// Implements: D-19

import { installHooks } from "../install-hooks.mjs";
import { resolve } from "node:path";

export const command = {
  name: "install-hooks",
  describe:
    "Install git pre-commit hook that scans staged files for PII before commit",

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd.option(
      "--repo-dir <dir>",
      "Git repository root (default: cwd)",
      process.cwd()
    );
  },

  /**
   * @param {{ repoDir?: string }} args
   */
  async handler(args) {
    try {
      const result = await installHooks({
        repoDir: resolve(args.repoDir ?? process.cwd()),
      });
      if (result.installed) {
        console.log(`✓ Pre-commit hook installed: ${result.hookPath}`);
        console.log(
          "  Staged files matching design/research/** and **/transcript*.md will be scanned for PII."
        );
      }
    } catch (err) {
      console.error(
        "install-hooks failed:",
        err instanceof Error ? err.message : err
      );
      process.exitCode = 1;
    }
  },
};
