// assets/scripts/cli/verify.mjs
// CLI subcommand: design-os verify --golden
// Auto-discovered by bin/design-os.mjs dispatcher (Plan 01 contract).
// Plan 03 does NOT modify bin/design-os.mjs.
//
// Source: PLAN.md Task 1 action; bin/design-os.mjs dispatcher contract
// Implements: PREV-03 (CLI entry point for golden CI gate)
//
// Gap-closure note (Phase 1 re-verification):
// bin/design-os.mjs runs under plain node (no tsx loader). verify-golden.mjs
// calls emitSchemas() which dynamically imports schemas/src/*.ts files — those
// require tsx to resolve. Without the loader, node looks for the .js equivalent
// and fails with ERR_MODULE_NOT_FOUND. Fix: spawn verify-golden.mjs as a child
// process via the tsx loader so the TypeScript dynamic imports resolve correctly.
// The npm run verify:golden path (tsx directly) is unaffected.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

/**
 * Resolve the path to tsx — prefer the local node_modules/.bin/tsx so the
 * invocation does not depend on tsx being installed globally.
 * @returns {string}
 */
function resolveTsx() {
  return resolve(ROOT, "node_modules/.bin/tsx");
}

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
      // verify-golden.mjs dynamically imports schemas/src/*.ts files via emit.mjs.
      // Plain node cannot resolve .ts extensions — spawn as a tsx child process so
      // the tsx loader is active for the entire verify-golden execution tree.
      const verifyScript = resolve(ROOT, "assets/scripts/verify-golden.mjs");
      const tsx = resolveTsx();

      const result = spawnSync(tsx, [verifyScript], {
        stdio: "inherit",
        cwd: ROOT,
      });

      // Surface the child exit code as the CLI's exit code.
      const code = result.status ?? 1;
      if (code !== 0) process.exit(code);
    } else {
      console.log("design-os verify: specify --golden to run determinism gate");
      console.log("  design-os verify --golden");
    }
  },
};
