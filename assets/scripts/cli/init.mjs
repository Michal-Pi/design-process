// assets/scripts/cli/init.mjs
// design-os init subcommand — auto-discovered by bin/design-os.mjs dispatcher.
//
// Writes gitignore/gitattributes templates and creates design/ + .design-os/
// skeleton directories in the target repo.
//
// Source: Plan 01 auto-discovery contract; CONTEXT.md D-29; PLAN.md Task 1
// Implements: D-29, ART-04, TRUST-02

import { runInit } from "../init.mjs";
import { resolve } from "node:path";

export const command = {
  name: "init",
  describe:
    "Initialize design-os in a target directory (writes .gitignore, .gitattributes, design/ skeleton)",

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd
      .option(
        "--target <dir>",
        "Target directory to initialize (default: cwd)",
        process.cwd()
      )
      .option(
        "--apply",
        "Write changes to disk (omit for dry-run diff preview)",
        false
      );
  },

  /**
   * @param {{ target?: string, apply?: boolean }} args
   */
  async handler(args) {
    try {
      await runInit({
        target: args.target ?? process.cwd(),
        apply: args.apply ?? false,
      });
    } catch (err) {
      console.error("design-os init failed:", err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  },
};
