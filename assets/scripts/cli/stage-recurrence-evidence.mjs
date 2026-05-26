// assets/scripts/cli/stage-recurrence-evidence.mjs
// CLI helper: copy wireframes/ and interactions/ directories from the source design
// directory into the staged preview path so that gate-stage-5b.mjs can run the
// Frost recurrence scan (countComponentRecurrences) against the staged path.
//
// Without this step, the staged preview dir only contains tokens.json + DESIGN.md
// (the artifacts emitted by the systematize workflow). The Frost scan globs
// wireframes/**/*.excalidraw and interactions/*.spec.md under the staged path,
// finds nothing, and returns a false-positive frost-recurrence-not-met BLOCKER.
//
// Called by the systematize workflow (step 9.5) BEFORE the gate invocation (step 10):
//   node bin/design-os.mjs stage-recurrence-evidence \
//     --source-design-dir design/ \
//     --staged-dir .design-os/preview/run-<timestamp>/
//
// This preserves INVARIANT-01 (gate against staged path — no direct design/ reads by gate).
//
// No LLM imports — deterministic copy only (INVARIANT-05 + lint-determinism.mjs).
//
// Source: CONTEXT.md D-61, D-70; INVARIANTS.md INVARIANT-01, INVARIANT-05
// Implements: Finding 1 (P1) Codex review fix — staged path missing wireframes/interactions

import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import { globby } from "globby";

/**
 * Copy wireframes/ and interactions/ from sourceDesignDir into stagedDir so that
 * gate-stage-5b.mjs Frost recurrence scan finds the upstream evidence files.
 *
 * This is a one-way copy: source → staged. It does NOT write to design/ directly
 * (preserving INVARIANT-02: --apply is required for design/ writes).
 *
 * Only copies .excalidraw files (under wireframes/) and .spec.md files (under
 * interactions/) — the two file types consumed by countComponentRecurrences().
 * Other files are not copied to keep the staged dir minimal.
 *
 * @param {object} opts
 * @param {string} opts.sourceDesignDir - Source design directory (e.g., 'design/')
 * @param {string} opts.stagedDir - Staged preview directory (e.g., '.design-os/preview/run-<id>/')
 * @returns {Promise<{ copiedFiles: string[], skippedDirs: string[] }>}
 */
export async function stageRecurrenceEvidence({ sourceDesignDir, stagedDir }) {
  const absSource = resolve(sourceDesignDir);
  const absStaged = resolve(stagedDir);

  if (!existsSync(absSource)) {
    throw new Error(`stage-recurrence-evidence: sourceDesignDir not found: ${absSource}`);
  }
  if (!existsSync(absStaged)) {
    throw new Error(`stage-recurrence-evidence: stagedDir not found: ${absStaged}`);
  }

  const copiedFiles = [];
  const skippedDirs = [];

  // ── Copy wireframes/**/*.excalidraw ──────────────────────────────────────────
  const wireframesSource = join(absSource, "wireframes");
  if (existsSync(wireframesSource)) {
    const excalidrawFiles = await globby(["wireframes/**/*.excalidraw"], {
      cwd: absSource,
      absolute: false,
    });

    for (const relPath of excalidrawFiles) {
      const srcFile = join(absSource, relPath);
      const destFile = join(absStaged, relPath);
      await mkdir(resolve(destFile, ".."), { recursive: true });
      await copyFile(srcFile, destFile);
      copiedFiles.push(relPath);
    }
  } else {
    skippedDirs.push("wireframes");
  }

  // ── Copy interactions/*.spec.md ──────────────────────────────────────────────
  const interactionsSource = join(absSource, "interactions");
  if (existsSync(interactionsSource)) {
    const specFiles = await globby(["interactions/*.spec.md"], {
      cwd: absSource,
      absolute: false,
    });

    for (const relPath of specFiles) {
      const srcFile = join(absSource, relPath);
      const destFile = join(absStaged, relPath);
      await mkdir(resolve(destFile, ".."), { recursive: true });
      await copyFile(srcFile, destFile);
      copiedFiles.push(relPath);
    }
  } else {
    skippedDirs.push("interactions");
  }

  return { copiedFiles, skippedDirs };
}

/**
 * CLI module descriptor for auto-discovery by bin/design-os.mjs.
 *
 * Exports: { name, describe, builder, handler } per Lesson 2.
 */
export const command = {
  name: "stage-recurrence-evidence",
  describe: "Copy wireframes/ and interactions/ into the staged preview dir for Frost scan",

  /** @param {import("commander").Command} cmd */
  builder(cmd) {
    cmd
      .option(
        "--source-design-dir <path>",
        "Source design directory containing wireframes/ and interactions/",
        "design/"
      )
      .option(
        "--staged-dir <path>",
        "Staged preview directory to copy into (e.g., .design-os/preview/run-<id>/)"
      );
  },

  async handler(args) {
    const sourceDesignDir = args.sourceDesignDir ?? args["source-design-dir"] ?? "design/";
    const stagedDir = args.stagedDir ?? args["staged-dir"];

    if (!stagedDir) {
      console.error("stage-recurrence-evidence: --staged-dir is required");
      process.exit(1);
    }

    try {
      const result = await stageRecurrenceEvidence({ sourceDesignDir, stagedDir });
      console.log(
        JSON.stringify({
          copiedFiles: result.copiedFiles,
          skippedDirs: result.skippedDirs,
          count: result.copiedFiles.length,
        })
      );
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};
