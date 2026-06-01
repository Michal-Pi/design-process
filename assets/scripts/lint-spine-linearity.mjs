// assets/scripts/lint-spine-linearity.mjs
// SPINE linearity check: asserts that no canonical artifact in a design dir
// references artifacts from a higher stage in the Garrett spine.
//
// Source: CONTEXT.md SPINE-04; PLAN.md Task 1 interfaces_introduced_here
// Implements: SPINE-04 (static frontmatter dependsOn check)

import { globby } from "globby";
import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import { resolve, relative, join, dirname } from "node:path";

// Inline the stage order (cannot import TS from MJS without tsx in production)
const STAGE_ORDER = ["0", "1", "2", "3", "4", "5a", "5b"];

/**
 * Return the numeric index of a stage, or -1 if unknown.
 * @param {string} s
 * @returns {number}
 */
function stageIndex(s) {
  return STAGE_ORDER.indexOf(s);
}

/**
 * Assert that a stage `from` is allowed to depend on stage `to`.
 * Returns true when stageIndex(to) <= stageIndex(from).
 *
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
function canDependOn(from, to) {
  const fi = stageIndex(from);
  const ti = stageIndex(to);
  if (fi === -1 || ti === -1) return true; // Unknown stages → skip check
  return ti <= fi;
}

/**
 * Walk a design directory, parse each Markdown artifact's frontmatter,
 * and check that any `dependsOn:` paths reference only same-stage or
 * earlier-stage artifacts.
 *
 * @param {string} designDir - Absolute (or resolvable) path to the design directory.
 * @returns {Promise<{ valid: boolean, violations: Array<{artifact: string, stage: string, dependsOn: string, violatingStage: string}> }>}
 */
export async function lintSpineLinearity(designDir) {
  const absDir = resolve(designDir);

  // Discover all Markdown files (exclude .complete-design/ and .handoff/)
  const files = await globby(["**/*.md"], {
    cwd: absDir,
    absolute: true,
    ignore: [".complete-design/**", ".handoff/**", "node_modules/**"],
  });

  // First pass: build a map from relative path → stage
  /** @type {Map<string, string>} */
  const stageMap = new Map();
  /** @type {Map<string, { stage: string, dependsOn: string[] }>} */
  const artifactMeta = new Map();

  for (const file of files) {
    let raw;
    try {
      raw = await readFile(file, "utf8");
    } catch {
      continue;
    }

    const { data } = matter(raw);

    // Only process canonical artifacts that have a `stage:` field
    if (typeof data.stage !== "string") continue;

    const relPath = relative(absDir, file);
    stageMap.set(relPath, data.stage);

    const dependsOn = Array.isArray(data.dependsOn)
      ? (data.dependsOn).filter((d) => typeof d === "string")
      : [];

    artifactMeta.set(relPath, { stage: data.stage, dependsOn });
  }

  // Second pass: check all dependsOn references
  const violations = [];

  for (const [relPath, meta] of artifactMeta.entries()) {
    const fromStage = meta.stage;

    for (const dep of meta.dependsOn) {
      // Resolve the dependsOn path relative to the design directory root
      // (not relative to the artifact's own directory — paths in dependsOn are
      // design-root-relative by convention, e.g. "stage3/wireframe.md")
      const depAbsPath = resolve(absDir, dep);
      const depRelPath = relative(absDir, depAbsPath);

      // Look up the stage of the referenced artifact
      const toStage = stageMap.get(depRelPath);

      if (toStage === undefined) {
        // Referenced artifact not found — skip (path may be external or non-canonical)
        continue;
      }

      if (!canDependOn(fromStage, toStage)) {
        violations.push({
          artifact: relPath,
          stage: fromStage,
          dependsOn: dep,
          violatingStage: toStage,
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
