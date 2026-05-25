// assets/scripts/init.mjs
// design-os init: writes/appends gitignore + gitattributes templates into
// a target repo using guarded blocks, creates design/ + .design-os/ dirs,
// and writes a minimal design/MANIFEST.md.
//
// Requires --apply to actually write (TRUST-02: diff-by-default per CLAUDE.md).
// Without --apply, prints a diff preview and exits 0.
//
// Source: CONTEXT.md D-29; CLAUDE.md universal "never auto-publish"; PLAN.md Task 1
// Implements: D-29, ART-04, TRUST-02, PERSIST-01

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, "../templates");

const GUARD_OPEN = "# >>> design-os defaults";
const GUARD_CLOSE = "# <<< design-os defaults";

/**
 * Read a template file from assets/templates/.
 * @param {string} name - Filename without extension.
 * @returns {Promise<string>}
 */
async function readTemplate(name) {
  return readFile(join(TEMPLATES_DIR, name), "utf8");
}

/**
 * Compute the "after" content for a file given the template's guarded block.
 * - If the file already has a guarded block, replace it.
 * - Otherwise, append the entire template (which includes guard markers).
 *
 * @param {string} existing - Current file content (empty string if file doesn't exist).
 * @param {string} template - Template content (already includes guard markers).
 * @returns {string} New file content.
 */
function computeNewContent(existing, template) {
  const openIdx = existing.indexOf(GUARD_OPEN);
  const closeIdx = existing.indexOf(GUARD_CLOSE);

  if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
    // Replace the existing guarded block with the template content
    const before = existing.slice(0, openIdx);
    const after = existing.slice(closeIdx + GUARD_CLOSE.length);
    // Ensure the template ends with a newline before the suffix
    const templateNormalized = template.trimEnd() + "\n";
    return before + templateNormalized + after;
  }

  // No existing block — append
  const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  return existing + separator + template;
}

/**
 * Simple line-level diff for display purposes.
 * @param {string} before
 * @param {string} after
 * @returns {string}
 */
function simpleDiff(before, after) {
  if (before === after) return "(no changes)";
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const lines = [];

  // Show added lines only (simple approach)
  const oldSet = new Set(oldLines);
  for (const line of newLines) {
    if (!oldSet.has(line)) {
      lines.push(`+ ${line}`);
    }
  }
  return lines.join("\n") || "(no changes)";
}

/**
 * Run design-os init.
 *
 * @param {{ target?: string, apply?: boolean }} opts
 * @returns {Promise<void>}
 */
export async function runInit({ target = process.cwd(), apply = false } = {}) {
  const targetDir = resolve(target);

  // Load templates
  const gitignoreTemplate = await readTemplate("gitignore-design-os.txt");
  const gitattributesTemplate = await readTemplate("gitattributes-design-os.txt");

  // Compute new content for .gitignore
  const gitignorePath = join(targetDir, ".gitignore");
  const existingGitignore = existsSync(gitignorePath)
    ? await readFile(gitignorePath, "utf8")
    : "";
  const newGitignore = computeNewContent(existingGitignore, gitignoreTemplate);

  // Compute new content for .gitattributes
  const gitattributesPath = join(targetDir, ".gitattributes");
  const existingGitattributes = existsSync(gitattributesPath)
    ? await readFile(gitattributesPath, "utf8")
    : "";
  const newGitattributes = computeNewContent(
    existingGitattributes,
    gitattributesTemplate
  );

  if (!apply) {
    // Dry-run: print diff preview
    console.log("=== .gitignore diff ===");
    console.log(simpleDiff(existingGitignore, newGitignore));
    console.log("\n=== .gitattributes diff ===");
    console.log(simpleDiff(existingGitattributes, newGitattributes));
    console.log("\nRun with --apply to write changes.");
    return;
  }

  // Ensure target directory exists before writing
  await mkdir(targetDir, { recursive: true });

  // Write .gitignore
  await writeFile(gitignorePath, newGitignore, "utf8");

  // Write .gitattributes
  await writeFile(gitattributesPath, newGitattributes, "utf8");

  // Create design/ directory
  await mkdir(join(targetDir, "design"), { recursive: true });

  // Create .design-os/ directory
  await mkdir(join(targetDir, ".design-os"), { recursive: true });

  // Write minimal design/MANIFEST.md if it doesn't exist
  const manifestPath = join(targetDir, "design", "MANIFEST.md");
  if (!existsSync(manifestPath)) {
    await writeFile(
      manifestPath,
      "# MANIFEST\n\n_No entries yet._\n",
      "utf8"
    );
  }

  console.log(`✓ Initialized design-os in ${targetDir}`);
  console.log("  - .gitignore updated with design-os defaults");
  console.log("  - .gitattributes updated with design-os defaults");
  console.log("  - design/ directory created");
  console.log("  - .design-os/ directory created");
  console.log("  - design/MANIFEST.md created");
}
