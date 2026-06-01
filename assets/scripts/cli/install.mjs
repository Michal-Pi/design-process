// assets/scripts/cli/install.mjs
// CLI subcommand: complete-design install
//
// Copies the bundled skill package from the npm-installed location into
// the user's host skills directory, making it available to Claude Code /
// Codex CLI / Cursor without any manual file copy step.
//
// Installed layout (under <targetBase>/complete-design/):
//   SKILL.md            ← promoted from skills/design/SKILL.md
//   workflows/          ← copied from skills/workflows/
//   atoms/              ← copied from skills/atoms/
//   audit/              ← copied from skills/audit/
//   handoff/            ← copied from skills/handoff/
//   references/         ← copied from references/
//
// This layout satisfies ${CLAUDE_SKILL_DIR} path refs rewritten in SKILL.md
// and all workflow/atom .md files during the P1 fix-pass (04-00).
//
// Usage (via dispatcher):
//   node bin/complete-design.mjs install
//   node bin/complete-design.mjs install --target ~/.claude/skills
//   node bin/complete-design.mjs install --target ./.claude/skills --force
//   node bin/complete-design.mjs install --dry-run
//
// Security (t-04-00-01 / Lesson 7):
//   --target is user-controlled. Resolve via path.resolve(), then confirm the
//   normalized path is contained within one of three permitted sandbox roots:
//     (a) os.homedir()/.claude/skills/
//     (b) os.homedir()/.codex/skills/   (Codex CLI fallback per Phase 1 plan 01-05)
//     (c) <cwd>/.claude/skills/          (project-local override)
//   Absolute paths and '..' traversals that escape these roots are rejected with
//   a clear error. The default target (~/.claude/skills/) needs no validation
//   because it is a constant, not user input.
//
// Idempotency: Running install twice on the same target is safe. The default
//   behaviour (without --force) prints a warning before overwriting an existing
//   install; --force skips the warning.
//
// Source: PLAN.md 04-00 Task 2; CONTEXT.md D-80; Lesson 7 path-traversal rule
// Implements: DIST-07 (install command); t-04-00-01 (path-traversal mitigation)
// Passes lint-determinism.mjs (INVARIANT-05): no LLM imports.

import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve, join, dirname, relative, isAbsolute } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * The npm package root — four levels up from assets/scripts/cli/install.mjs:
 *   <pkg>/assets/scripts/cli/install.mjs
 *   -> <pkg>/assets/scripts/cli/
 *   -> <pkg>/assets/scripts/
 *   -> <pkg>/assets/
 *   -> <pkg>/
 */
const PACKAGE_ROOT = resolve(__dirname, "../../..");

/**
 * The single SKILL.md file to promote to the install root.
 */
const SOURCE_SKILL_FILE = join(PACKAGE_ROOT, "skills", "design", "SKILL.md");

/**
 * Directories to copy recursively into the install directory.
 * Each entry is [sourcePath, destSubdirName].
 *
 * After install, the layout is:
 *   <destDir>/SKILL.md         ← from skills/design/SKILL.md
 *   <destDir>/workflows/       ← from skills/workflows/
 *   <destDir>/atoms/           ← from skills/atoms/
 *   <destDir>/audit/           ← from skills/audit/
 *   <destDir>/handoff/         ← from skills/handoff/
 *   <destDir>/references/      ← from references/
 *
 * ${CLAUDE_SKILL_DIR} resolves to <destDir>, so all path refs in SKILL.md
 * and workflow/atom files resolve correctly post-install.
 */
const SOURCE_DIRS = [
  [join(PACKAGE_ROOT, "skills", "workflows"), "workflows"],
  [join(PACKAGE_ROOT, "skills", "atoms"), "atoms"],
  [join(PACKAGE_ROOT, "skills", "audit"), "audit"],
  [join(PACKAGE_ROOT, "skills", "handoff"), "handoff"],
  [join(PACKAGE_ROOT, "references"), "references"],
];

/**
 * Default install base: ~/.claude/skills/
 * The destination will be: ~/.claude/skills/complete-design/
 */
function defaultTargetBase() {
  return join(homedir(), ".claude", "skills");
}

/**
 * Permitted sandbox roots for --target path containment (Lesson 7).
 * A user-supplied --target must resolve inside one of these.
 * Paths end WITHOUT trailing slash so containment checks work correctly.
 *
 * @returns {string[]}
 */
function sandboxRoots() {
  const home = homedir();
  const cwd = process.cwd();
  return [
    join(home, ".claude", "skills"),
    join(home, ".codex", "skills"),
    join(cwd, ".claude", "skills"),
  ];
}

/**
 * Custom error thrown when --target fails the path-containment check.
 */
export class PathContainmentError extends Error {
  /**
   * @param {string} suppliedTarget - Raw value from --target.
   * @param {string} resolvedTarget - path.resolve(suppliedTarget).
   * @param {string[]} roots - Allowed roots.
   */
  constructor(suppliedTarget, resolvedTarget, roots) {
    super(
      `install: --target path is outside the permitted sandbox roots.\n` +
        `  Supplied: ${suppliedTarget}\n` +
        `  Resolved: ${resolvedTarget}\n` +
        `  Permitted roots (must be inside one of):\n` +
        roots.map((r) => `    - ${r}`).join("\n") +
        `\n` +
        `  Rejected to prevent unintended writes outside the skills directory.\n` +
        `  Use --target ~/.claude/skills (the default) or --target <cwd>/.claude/skills.`
    );
    this.name = "PathContainmentError";
  }
}

/**
 * Validate that resolvedTarget is inside one of the sandbox roots.
 *
 * Uses path.relative() — the canonical POSIX-safe and Windows-safe containment
 * idiom. On POSIX, backslash is a valid filename character, so a startsWith check
 * with a backslash separator can be fooled by a directory literally named
 * "skills\evil" (a sibling of the expected root). path.relative() handles
 * separators correctly per the active platform regardless of that edge case.
 *
 * @param {string} suppliedTarget - Raw value from the --target flag.
 * @param {string} resolvedTarget - path.resolve(suppliedTarget) result.
 * @throws {PathContainmentError} If resolvedTarget is not contained within any sandbox root.
 */
export function validateTargetSandbox(suppliedTarget, resolvedTarget) {
  const roots = sandboxRoots();
  const contained = roots.some((root) => {
    if (resolvedTarget === root) return true;
    const rel = relative(root, resolvedTarget);
    // Inside root if rel is non-empty AND doesn't start with '..' AND isn't absolute
    return rel.length > 0 && !rel.startsWith("..") && !isAbsolute(rel);
  });
  if (!contained) {
    throw new PathContainmentError(suppliedTarget, resolvedTarget, roots);
  }
}

/**
 * Verify that a source path exists; throw a clear error if missing.
 *
 * @param {string} sourcePath - Absolute path to check.
 * @param {string} description - Human-readable name for error messages.
 */
async function verifySourceExists(sourcePath, description) {
  try {
    await stat(sourcePath);
  } catch {
    throw new Error(
      `install: ${description} not found at ${sourcePath}.\n` +
        `  This usually means the npm package is corrupt or the files whitelist excluded it.\n` +
        `  Please reinstall complete-design from npm: npm i -g @pm-musketeers/complete-design@beta`
    );
  }
}

/**
 * Install handler — the core logic; exported for programmatic use in tests.
 *
 * @param {object} opts
 * @param {string|undefined} opts.target  - User-supplied --target base dir (may be undefined for default).
 * @param {boolean} [opts.force=false]   - Skip overwrite warning.
 * @param {boolean} [opts.dryRun=false]  - Print what would happen without writing.
 */
export async function runInstall(opts) {
  const { force = false, dryRun = false } = opts;

  // Determine and validate the target base directory.
  let targetBase;

  if (opts.target !== undefined && opts.target !== null) {
    // User supplied --target: resolve and validate containment (Lesson 7).
    targetBase = resolve(opts.target);
    validateTargetSandbox(opts.target, targetBase);
  } else {
    // Default: ~/.claude/skills/ — constant, no validation needed.
    targetBase = defaultTargetBase();
  }

  // The actual destination directory: <targetBase>/complete-design/
  const destDir = join(targetBase, "complete-design");

  // Dry-run: print what would happen without touching the filesystem.
  if (dryRun) {
    console.log(`[DRY RUN] install: would copy`);
    console.log(`  SKILL.md from: ${SOURCE_SKILL_FILE}`);
    for (const [srcDir, destSubdir] of SOURCE_DIRS) {
      console.log(`  ${destSubdir}/ from: ${srcDir}`);
    }
    console.log(`  to:   ${destDir}/`);
    console.log(
      `\nNo changes made. Remove --dry-run to perform the actual install.`
    );
    return;
  }

  // Verify all sources exist (guards against a bad files whitelist).
  await verifySourceExists(SOURCE_SKILL_FILE, "skills/design/SKILL.md");
  for (const [srcDir, destSubdir] of SOURCE_DIRS) {
    await verifySourceExists(srcDir, `skills/${destSubdir} (or references/)`);
  }

  // Check if destination already exists and warn if --force is not set.
  let destExists;
  try {
    await stat(destDir);
    destExists = true;
  } catch {
    destExists = false;
  }

  if (destExists && !force) {
    console.warn(
      `install: ${destDir} already exists. It will be overwritten.\n` +
        `  Press Ctrl+C to abort, or re-run with --force to skip this warning.`
    );
    // Brief pause so the user can abort — not interactive but provides a
    // short window. Tests use --force to bypass.
    await new Promise((res) => setTimeout(res, 3000));
  }

  // Remove existing install and recreate clean.
  if (destExists) {
    await rm(destDir, { recursive: true, force: true });
  }
  await mkdir(destDir, { recursive: true });

  // Copy SKILL.md to install root.
  await cp(SOURCE_SKILL_FILE, join(destDir, "SKILL.md"));

  // Copy each source directory recursively.
  for (const [srcDir, destSubdir] of SOURCE_DIRS) {
    await cp(srcDir, join(destDir, destSubdir), { recursive: true });
  }

  console.log(`Installed complete-design skill to: ${destDir}`);
  console.log(
    `\nRestart your Claude Code session (or run /reload-skills if available) to pick up the new skill.`
  );
}

export const command = {
  name: "install",
  describe:
    "Install the complete-design SKILL.md package into your host skills directory (~/.claude/skills/complete-design by default)",

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd
      .option(
        "--target <path>",
        "Override install target base directory (default: ~/.claude/skills)"
      )
      .option(
        "--force",
        "Skip the overwrite warning if target already exists",
        false
      )
      .option(
        "--dry-run",
        "Show what would be copied without writing any files",
        false
      );
  },

  /**
   * @param {{ target?: string; force?: boolean; dryRun?: boolean }} opts
   */
  async handler(opts) {
    try {
      await runInstall(opts);
    } catch (err) {
      if (err instanceof PathContainmentError) {
        console.error(err.message);
        process.exit(1);
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`install: ${msg}`);
      if (
        err instanceof Error &&
        /** @type {NodeJS.ErrnoException} */ (err).code === "EACCES"
      ) {
        console.error(
          `  Hint: You may need to fix permissions on ${homedir()}.`
        );
      }
      process.exit(1);
    }
  },
};
