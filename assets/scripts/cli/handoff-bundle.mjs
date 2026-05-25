// assets/scripts/cli/handoff-bundle.mjs
// Auto-discovered CLI subcommand for the 'handoff-bundle' command.
// Registered by bin/design-os.mjs's auto-discovery dispatcher.
//
// Usage:
//   tsx bin/design-os.mjs handoff-bundle --from 1 --to 2 --design-dir <path> --body-file <path>
//
// Source: CONTEXT.md D-05, D-06, D-07; PLAN.md Task 2 action
// Implements: HAND-01..03 (CLI entry point)

import { readFile } from "node:fs/promises";
import { buildHandoffBundle } from "../handoff-bundle-build.mjs";

/**
 * Auto-discovered command object per the Plan 01 dispatcher contract.
 */
export const command = {
  name: "handoff-bundle",
  describe: "Build a stage handoff bundle from an LLM-summarized body",

  /** @param {import("commander").Command} cmd */
  builder: (cmd) => {
    cmd
      .option("--from <stage>", "Source stage (e.g., 1)")
      .option("--to <stage>", "Target stage (e.g., 2)")
      .option("--design-dir <path>", "Path to the design directory")
      .option("--body-file <path>", "Path to the LLM-summarized body file");
  },

  /** @param {Record<string, unknown>} args */
  handler: async (args) => {
    const { from, to, designDir, bodyFile } = args;

    if (!from) { console.error("Error: --from is required"); process.exit(1); }
    if (!to) { console.error("Error: --to is required"); process.exit(1); }
    if (!designDir) { console.error("Error: --design-dir is required"); process.exit(1); }
    if (!bodyFile) { console.error("Error: --body-file is required"); process.exit(1); }

    const body = await readFile(bodyFile, "utf8");
    const res = await buildHandoffBundle({
      stageFrom: String(from),
      stageTo: String(to),
      designDir: String(designDir),
      llmSummaryBody: body,
    });

    if (res.error) {
      console.error(JSON.stringify(res));
      process.exit(1);
    }

    console.log(JSON.stringify({
      tokenCount: res.tokenCount,
      tokens: res.tokens,
      truncationWarning: res.truncationWarning,
      path: res.path,
    }));
  },
};
