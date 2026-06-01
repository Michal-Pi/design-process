// assets/scripts/cli/override-banner.mjs
// complete-design override-banner subcommand group — auto-discovered by bin/complete-design.mjs.
//
// Subcommand: override-banner propagate --design-dir <path>
// Reads manifest.lock, finds user_overridden entries, adds overrideBanner: to matching artifacts.
//
// Source: Plan 01 auto-discovery contract; CONTEXT.md D-11; PLAN.md Task 3
// Implements: D-11 (downstream overrideBanner frontmatter field)

import { propagateOverrideBanners } from "../override-banner-propagate.mjs";
import { resolve } from "node:path";

export const command = {
  name: "override-banner propagate",
  describe:
    "Propagate override banners from manifest.lock into matching-stage artifact frontmatter",

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd.option(
      "--design-dir <dir>",
      "Design directory to propagate banners in (default: ./design)",
      "./design"
    );
  },

  /**
   * @param {{ designDir?: string }} args
   */
  async handler(args) {
    const designDir = resolve(args.designDir ?? "./design");

    try {
      const result = await propagateOverrideBanners({ designDir });
      console.log(
        `✓ Override banners propagated: ${result.modified.length} modified, ${result.skipped.length} skipped`
      );
      if (result.modified.length > 0) {
        for (const file of result.modified) {
          console.log(`  + ${file}`);
        }
      }
    } catch (err) {
      console.error(
        "override-banner propagate failed:",
        err instanceof Error ? err.message : err
      );
      process.exitCode = 1;
    }
  },
};
