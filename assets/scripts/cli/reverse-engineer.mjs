// assets/scripts/cli/reverse-engineer.mjs
// CLI wrapper for reverse-engineer.mjs orchestrator.
// Registered by bin/complete-design.mjs auto-discovery.
//
// Usage:
//   complete-design audit --reverse-engineer-stages --source <path|url> [--apply]
//
// Dry-run by default. --apply writes artifacts to design/inferred/.
//
// Dispatcher contract: export const command = { name, describe, builder, handler }
// (Lesson 2: verified against state-machine-emit.mjs canonical shape)
//
// No LLM imports (INVARIANT-05 + lint-determinism.mjs).
//
// Source: PLAN.md T-03-04-A action block; CONTEXT.md D-62
// Implements: AUDIT-06, D-62, OQ-5

export const command = {
  name: "reverse-engineer",
  describe:
    "Infer design artifacts (Stage 4→3→2→1) from an existing prototype — local path or live URL",

  /** @param {import("commander").Command} cmd */
  builder(cmd) {
    cmd
      .option(
        "--source <path-or-url>",
        "Local path to cloned repo or live URL (https://...) to crawl"
      )
      .option(
        "--output-dir <path>",
        "Output directory for inferred artifacts",
        "design/inferred/"
      )
      .option(
        "--apply",
        "Write artifacts to outputDir (default: dry-run, shows what would be created)",
        false
      );
  },

  /** @param {Record<string, unknown>} opts */
  async handler(opts) {
    const source = /** @type {string|undefined} */ (
      opts.source ?? opts["source"]
    );
    const outputDir = /** @type {string} */ (
      opts.outputDir ?? opts["output-dir"] ?? "design/inferred/"
    );
    const apply = Boolean(opts.apply);

    if (!source) {
      console.error(
        "Error: --source <path-or-url> is required.\n" +
          "  Local: complete-design reverse-engineer --source ./my-app\n" +
          "  URL:   complete-design reverse-engineer --source https://my-app.vercel.app"
      );
      process.exit(1);
    }

    const { runReverseEngineer } = await import(
      "../audit/reverse-engineer.mjs"
    );

    if (!apply) {
      console.log(
        `[DRY RUN] complete-design reverse-engineer --source ${source} --output-dir ${outputDir}`
      );
      console.log(
        "  Would create artifacts in design/inferred/ with two-layer INFERRED enforcement:"
      );
      console.log("    1. YAML frontmatter: provenance:inferred + inferredDisclaimer + evidence:INFERRED");
      console.log(
        '    2. Body banner: > **INFERRED** — This artifact was reverse-engineered...'
      );
      console.log("");
      console.log("  Inference order (Stage 4 → 3 → 2 → 1):");
      console.log("    Stage 4: Interaction state catalog (from component async patterns)");
      console.log("    Stage 3: Wireframe structure (from component tree shape)");
      console.log("    Stage 2: IA/Sitemap (from routing structure)");
      console.log("    Stage 1: Personas/JTBDs (from copy, onboarding text)");
      console.log("");
      console.log("  Use --apply to write artifacts.");
      console.log(
        "  After reviewing, use: complete-design promote-inferred --file <path>"
      );
      console.log(
        "  Dry run: use --apply to write changes"
      );
      return;
    }

    try {
      console.log(`[reverse-engineer] Starting inference pipeline...`);
      console.log(`  Source: ${source}`);
      console.log(`  Output: ${outputDir}`);
      console.log(`  Mode: ${source.startsWith("http") ? "URL (Playwright crawl, depth=1)" : "Local path"}`);
      console.log("");

      const result = await runReverseEngineer({
        source,
        outputDir,
        dryRun: false,
      });

      console.log(
        `[reverse-engineer] Pipeline complete: ${result.artifactsCreated.length} artifact(s) created`
      );
      console.log("");
      console.log("Inference log:");
      for (const entry of result.inferenceLog) {
        console.log(
          `  Stage ${entry.stage}: confidence=${entry.confidence}`
        );
      }
      console.log("");
      console.log("Artifacts created:");
      for (const path of result.artifactsCreated) {
        console.log(`  ${path}`);
      }
      console.log("");
      console.log(
        "IMPORTANT: Review each artifact in design/inferred/ and remove the"
      );
      console.log(
        "  'provenance: inferred' frontmatter AND the > **INFERRED** banner before promoting."
      );
      console.log(
        "  Then use: complete-design promote-inferred --file <path>"
      );
    } catch (err) {
      console.error(
        `[reverse-engineer] Error: ${err instanceof Error ? err.message : String(err)}`
      );
      process.exit(1);
    }
  },
};
