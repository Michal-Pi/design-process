// assets/scripts/cli/migrate.mjs
// CLI subcommand: design-os migrate --from <v> --to <v> --path <p>
// Handler stub — filled in by Task 3.
// Auto-discovered by bin/design-os.mjs.

export const command = {
  name: "migrate",
  describe: "Migrate an artifact from one schema version to another",

  builder: (cmd) =>
    cmd
      .requiredOption("--from <version>", "Source schema version (integer)", parseInt)
      .requiredOption("--to <version>", "Target schema version (integer)", parseInt)
      .requiredOption("--path <path>", "Path to the artifact file to migrate")
      .option("--in-place", "Overwrite the source file in place instead of writing a new file", false),

  handler: async (args) => {
    // Task 3 fills in the real implementation.
    // Importing here so Task 3 can replace this stub without touching the CLI module.
    const { migrateArtifact } = await import("../schemas/migrate.mjs");
    await migrateArtifact({
      fromVersion: args.from,
      toVersion: args.to,
      path: args.path,
      inPlace: args["in-place"] ?? false,
    });
  },
};
