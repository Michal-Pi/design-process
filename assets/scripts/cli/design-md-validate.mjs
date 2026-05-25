// assets/scripts/cli/design-md-validate.mjs
// CLI subcommand: design-os design-md-validate --file <path> [--design-md-version <ver>]
// Handler stub — filled in by Task 3.
// Auto-discovered by bin/design-os.mjs.

export const command = {
  name: "design-md-validate",
  describe: "Validate a DESIGN.md file against the pinned Google DESIGN.md schema",

  builder: (cmd) =>
    cmd
      .requiredOption("--file <path>", "Path to the DESIGN.md file to validate")
      .option("--design-md-version <version>", "DESIGN.md schema version to validate against", "2026.04"),

  handler: async (args) => {
    // Task 3 fills in the real implementation.
    const { validateDesignMd } = await import("../design-md-validate.mjs");
    await validateDesignMd(args.file, {
      version: args["design-md-version"] ?? "2026.04",
    });
  },
};
