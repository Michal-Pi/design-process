// assets/scripts/cli/manifest-md.mjs
// design-os manifest-md subcommand group — auto-discovered by bin/design-os.mjs.
//
// Subcommand: manifest-md reconcile --design-dir <path>
// Walks the design dir, reconciles artifact frontmatter, writes deterministic MANIFEST.md.
//
// Source: Plan 01 auto-discovery contract; CONTEXT.md ART-07; PLAN.md Task 2
// Implements: ART-07

import { reconcileManifest } from "../manifest-md-reconcile.mjs";
import { resolve } from "node:path";

export const command = {
  name: "manifest-md reconcile",
  describe:
    "Reconcile MANIFEST.md with the design directory filesystem (sorted, deterministic)",

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd.option(
      "--design-dir <dir>",
      "Design directory to reconcile (default: ./design)",
      "./design"
    );
  },

  /**
   * @param {{ designDir?: string }} args
   */
  async handler(args) {
    const designDir = resolve(args.designDir ?? "./design");
    try {
      await reconcileManifest({ designDir });
      console.log(`✓ MANIFEST.md reconciled in ${designDir}`);
    } catch (err) {
      console.error(
        "manifest-md reconcile failed:",
        err instanceof Error ? err.message : err
      );
      process.exitCode = 1;
    }
  },
};
