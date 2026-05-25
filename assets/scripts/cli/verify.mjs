// assets/scripts/cli/verify.mjs
// CLI subcommand: design-os verify --golden
// Auto-discovered by bin/design-os.mjs dispatcher (Plan 01 contract).
// Plan 03 does NOT modify bin/design-os.mjs.
//
// Source: PLAN.md Task 1 action; bin/design-os.mjs dispatcher contract
// Implements: PREV-03 (CLI entry point for golden CI gate)

/**
 * @type {{ name: string, describe: string, builder: (cmd: import('commander').Command) => void, handler: (opts: Record<string, unknown>) => Promise<void> }}
 */
export const command = {
  name: "verify",
  describe: "Determinism + golden CI gate",

  builder(cmd) {
    cmd.option("--golden", "Run the 5× byte-identical golden fixture verification");
  },

  async handler({ golden }) {
    if (golden) {
      const { runGolden } = await import("../verify-golden.mjs");
      const ok = await runGolden();
      if (!ok) process.exit(1);
    } else {
      console.log("design-os verify: specify --golden to run determinism gate");
      console.log("  design-os verify --golden");
    }
  },
};
