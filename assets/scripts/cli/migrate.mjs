// assets/scripts/cli/migrate.mjs
// CLI subcommand: complete-design migrate
//
// Supports two routing modes:
//
//   Mode A (legacy integer chain — existing behavior, back-compat preserved):
//     complete-design migrate --from <int> --to <int> --path <artifact-file>
//     Parses integer versions; routes to migrateArtifact() from schemas/migrate.mjs.
//
//   Mode B (named v2.0a→v2.0b string migration — new in Codex review fix Finding 2):
//     complete-design migrate --from 2.0a --to 2.0b [--design-dir <path>] [--apply]
//     Detects semver-ish string format (e.g. "2.0a", "2.0b") and routes to the
//     runV20aMigration() orchestrator from schemas/migrations/run-v2.0a-to-v2.0b.mjs.
//     Dry-run by default — prints diff without writing. --apply writes in-place.
//
// Version format detection:
//   String versions match /^\d+\.\d+[a-z]*$/ (e.g. "2.0a", "2.0b", "1.5")
//   Integer versions are bare numbers parsed with parseInt.
//   A simple version-pair table routes named pairs to their dedicated runners.
//
// Back-compat guarantee:
//   Existing callers using integer --from/--to + --path still work unchanged.
//   The --path option remains optional so --design-dir mode does not conflict.
//
// Source: Codex review Finding 2 [P1]; PLAN.md T-03-04-B action block; CONTEXT.md D-65
// Implements: PERSIST-03, D-65, complete-design migrate --from 2.0a --to 2.0b
// Auto-discovered by bin/complete-design.mjs.

/**
 * Detect whether a version string looks like a semver-ish named version
 * (e.g. "2.0a", "2.0b", "1.5") rather than a bare integer.
 *
 * @param {unknown} v - The raw parsed value from Commander
 * @returns {boolean}
 */
function isStringVersion(v) {
  return typeof v === 'string' && /^\d+\.\d+[a-z]*$/.test(v.trim());
}

/**
 * Named migration route table.
 * Maps "fromVersion→toVersion" to an async runner factory.
 *
 * @type {Record<string, () => Promise<(opts: { designDir: string, apply: boolean }) => Promise<any>>>}
 */
const NAMED_MIGRATION_TABLE = {
  '2.0a→2.0b': async () => {
    const { runV20aMigration } = await import('../../../schemas/migrations/run-v2.0a-to-v2.0b.mjs');
    return runV20aMigration;
  },
};

export const command = {
  name: "migrate",
  describe: "Migrate design artifacts between schema versions (integer chain or named e.g. --from 2.0a --to 2.0b)",

  builder: (cmd) =>
    cmd
      // --from / --to accept both integers and semver-ish strings.
      // NOTE: The coercion function (previously parseInt) is removed so Commander
      // passes raw strings — the handler decides how to interpret them.
      .requiredOption("--from <version>", "Source schema version (integer or semver-ish, e.g. 2.0a)")
      .requiredOption("--to <version>", "Target schema version (integer or semver-ish, e.g. 2.0b)")
      // --path remains optional (required for integer chain mode, unused in named mode)
      .option("--path <path>", "Path to the artifact file to migrate (integer chain mode)")
      .option("--in-place", "Overwrite the source file in place (integer chain mode)", false)
      // Named migration (v2.0a→v2.0b) options
      .option("--design-dir <path>", "Design directory to migrate (named migration mode)", "design/")
      .option("--apply", "Write changes in-place (default: dry-run that prints diff without writing)", false),

  handler: async (args) => {
    const fromRaw = args.from;
    const toRaw = args.to;

    // ── Mode B: named string-version migration ──────────────────────────────
    if (isStringVersion(fromRaw) && isStringVersion(toRaw)) {
      const fromVersion = fromRaw.trim();
      const toVersion = toRaw.trim();
      const routeKey = `${fromVersion}→${toVersion}`;

      const runnerFactory = NAMED_MIGRATION_TABLE[routeKey];
      if (!runnerFactory) {
        console.error(
          `migrate: no named migration registered for ${fromVersion}→${toVersion}.\n` +
          `  Supported named migrations: ${Object.keys(NAMED_MIGRATION_TABLE).join(', ')}\n` +
          `  For integer chain migrations, use integer --from/--to + --path.`
        );
        process.exit(1);
      }

      const designDir = args.designDir ?? args['design-dir'] ?? 'design/';
      const apply = Boolean(args.apply);

      try {
        const runner = await runnerFactory();
        await runner({ designDir, apply });
      } catch (err) {
        console.error(
          `migrate --from ${fromVersion} --to ${toVersion}: ${err instanceof Error ? err.message : String(err)}`
        );
        process.exit(1);
      }

      return;
    }

    // ── Mode A: legacy integer chain ────────────────────────────────────────
    // Re-apply parseInt here since Commander no longer coerces automatically.
    const fromVersion = parseInt(String(fromRaw), 10);
    const toVersion = parseInt(String(toRaw), 10);

    if (Number.isNaN(fromVersion) || Number.isNaN(toVersion)) {
      console.error(
        `migrate: --from and --to must be either integers (e.g. 0, 1) or semver-ish strings (e.g. 2.0a, 2.0b).\n` +
        `  Got: --from ${fromRaw} --to ${toRaw}`
      );
      process.exit(1);
    }

    const path = args.path;
    if (!path) {
      console.error(
        `migrate: --path <artifact-file> is required for integer version migrations.\n` +
        `  For named migrations (e.g. 2.0a→2.0b), use --design-dir instead of --path.`
      );
      process.exit(1);
    }

    const { migrateArtifact } = await import("../schemas/migrate.mjs");
    await migrateArtifact({
      fromVersion,
      toVersion,
      path,
      inPlace: args["in-place"] ?? false,
    });
  },
};
