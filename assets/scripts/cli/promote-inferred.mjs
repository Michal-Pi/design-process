// assets/scripts/cli/promote-inferred.mjs
// CLI: complete-design promote-inferred — validates + moves design/inferred/<X> → design/<X>
//
// Blocks if:
//   - frontmatter contains provenance:'inferred'
//   - body contains the INFERRED banner (> **INFERRED** ...)
// Both must be removed by the user before promotion is allowed (D-64).
//
// On success: copies file to design/<corresponding-path>, calls appendManifestLockEntry().
//
// Dispatcher contract: export const command = { name, describe, builder, handler }
// (Lesson 2: same shape as state-machine-emit.mjs)
//
// Also exports promoteInferredFile() for testing (programmatic API).
//
// No LLM imports (INVARIANT-05 + lint-determinism.mjs).
//
// Source: PLAN.md T-03-04-A action block; CONTEXT.md D-64
// Implements: D-64, MVPB-06

import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { resolve, relative, join, dirname } from "node:path";
import matter from "gray-matter";

/**
 * Check whether a file still has provenance:inferred or the INFERRED banner.
 * Both must be removed before promotion is allowed (D-64).
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<{ hasProvenanceInferred: boolean, hasInferredBanner: boolean }>}
 */
async function checkInferredBlocks(filePath) {
  const content = await readFile(filePath, "utf8");

  // Check frontmatter for provenance:inferred
  let hasProvenanceInferred = false;
  try {
    const parsed = matter(content);
    hasProvenanceInferred = parsed.data?.provenance === "inferred";
  } catch {
    // If gray-matter can't parse, check raw string
    hasProvenanceInferred = content.includes("provenance: inferred") ||
      content.includes('provenance: "inferred"');
  }

  // Check body for INFERRED banner (> **INFERRED** ...)
  const hasInferredBanner = />\s*\*\*INFERRED\*\*/i.test(content);

  return { hasProvenanceInferred, hasInferredBanner };
}

/**
 * Compute the target path in design/ from a source path in design/inferred/.
 *
 * Example:
 *   design/inferred/research/personas/persona.md → design/research/personas/persona.md
 *
 * @param {string} filePath - Absolute path to the file in design/inferred/
 * @param {string} designDir - Absolute path to the design/ directory
 * @returns {string} Absolute path to the target in design/
 */
function computePromotionTarget(filePath, designDir) {
  const absFilePath = resolve(filePath);
  const absDesignDir = resolve(designDir);

  // Strip the design/inferred/ prefix
  const inferredDir = join(absDesignDir, "inferred");
  const relFromInferred = relative(inferredDir, absFilePath);

  return join(absDesignDir, relFromInferred);
}

/**
 * Promote a single file from design/inferred/ to design/.
 *
 * Blocks if:
 *   - provenance:inferred still present in frontmatter
 *   - INFERRED banner still present in body
 *
 * On success: copies to design/<path>, calls appendManifestLockEntry().
 *
 * @param {object} opts
 * @param {string} opts.filePath - Path to the file in design/inferred/
 * @param {string} opts.designDir - Path to the design/ directory (for computing target)
 * @returns {Promise<{ blocked: boolean, reason?: string, promoted?: boolean, targetPath?: string }>}
 */
export async function promoteInferredFile({ filePath, designDir }) {
  const absFilePath = resolve(filePath);

  if (!existsSync(absFilePath)) {
    return {
      blocked: true,
      reason: `File not found: ${absFilePath}`,
    };
  }

  // Check if file is actually in design/inferred/
  const absDesignDir = resolve(designDir);
  const inferredDir = join(absDesignDir, "inferred");
  if (!absFilePath.startsWith(inferredDir + "/") && absFilePath !== inferredDir) {
    return {
      blocked: true,
      reason: `File must be inside design/inferred/ to be promoted. Got: ${absFilePath}`,
    };
  }

  // Check blocking conditions (D-64)
  const { hasProvenanceInferred, hasInferredBanner } = await checkInferredBlocks(absFilePath);

  if (hasProvenanceInferred || hasInferredBanner) {
    const reasons = [];
    if (hasProvenanceInferred) reasons.push("provenance:inferred is still present in frontmatter");
    if (hasInferredBanner) reasons.push("INFERRED banner is still present in body");

    return {
      blocked: true,
      reason: `Cannot promote: ${reasons.join(" AND ")}. Review and remove both before promoting.`,
      hasProvenanceInferred,
      hasInferredBanner,
    };
  }

  // Compute target path in design/
  const targetPath = computePromotionTarget(absFilePath, absDesignDir);

  // Ensure target directory exists
  await mkdir(dirname(targetPath), { recursive: true });

  // Copy file to design/<path>
  await copyFile(absFilePath, targetPath);

  // Call appendManifestLockEntry() to record in hash chain
  try {
    const { appendManifestLockEntry } = await import(
      "../manifest-lock-append.mjs"
    );
    const designOsDir = join(absDesignDir, "..", ".complete-design");
    await appendManifestLockEntry(designOsDir, {
      stage: "promote-inferred",
      gate: "promote-inferred",
      result: {
        kind: "pass",
        evidence: "promotion-complete",
        findings: [],
        sourceFile: absFilePath,
        targetFile: targetPath,
      },
      sourceHash:
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    });
  } catch {
    // Non-fatal: manifest.lock append failure does not block promotion
  }

  return {
    blocked: false,
    promoted: true,
    targetPath,
  };
}

/**
 * Collect all files under a directory (recursively).
 *
 * @param {string} dir - Directory to walk
 * @returns {Promise<string[]>} Absolute file paths
 */
async function collectAllFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectAllFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

/** CLI module descriptor for auto-discovery by bin/complete-design.mjs. */
export const command = {
  name: "promote-inferred",
  describe:
    "Promote reviewed design/inferred/ artifacts to design/ after removing INFERRED markers",

  /** @param {import("commander").Command} cmd */
  builder(cmd) {
    cmd
      .option(
        "--file <path>",
        "Specific file in design/inferred/ to promote"
      )
      .option(
        "--all",
        "Promote all files in design/inferred/ (that are ready)",
        false
      )
      .option(
        "--design-dir <path>",
        "Design directory root",
        "design/"
      );
  },

  /** @param {Record<string, unknown>} opts */
  async handler(opts) {
    const filePath = /** @type {string|undefined} */ (opts.file);
    const allMode = Boolean(opts.all);
    const designDir = /** @type {string} */ (
      opts.designDir ?? opts["design-dir"] ?? "design/"
    );

    if (!filePath && !allMode) {
      console.error(
        "Error: specify --file <path> or --all\n" +
          "  complete-design promote-inferred --file design/inferred/research/personas/persona.md\n" +
          "  complete-design promote-inferred --all"
      );
      process.exit(1);
    }

    const filesToProcess = [];

    if (filePath) {
      filesToProcess.push(resolve(filePath));
    } else if (allMode) {
      const absDesignDir = resolve(designDir);
      const inferredDir = join(absDesignDir, "inferred");
      if (!existsSync(inferredDir)) {
        console.log(
          `[promote-inferred] design/inferred/ directory not found: ${inferredDir}`
        );
        return;
      }
      try {
        const allFiles = await collectAllFiles(inferredDir);
        filesToProcess.push(...allFiles);
      } catch (err) {
        console.error(`[promote-inferred] Error reading design/inferred/: ${err}`);
        process.exit(1);
      }
    }

    let promoted = 0;
    let blocked = 0;

    for (const fp of filesToProcess) {
      const result = await promoteInferredFile({
        filePath: fp,
        designDir,
      });

      if (result.blocked) {
        console.log(`[BLOCKED] ${fp}`);
        console.log(`  ${result.reason}`);
        blocked++;
      } else if (result.promoted) {
        console.log(`[PROMOTED] ${fp}`);
        console.log(`  → ${result.targetPath}`);
        promoted++;
      }
    }

    console.log(
      `\n[promote-inferred] Done: ${promoted} promoted, ${blocked} blocked`
    );

    if (blocked > 0) {
      process.exit(1);
    }
  },
};
