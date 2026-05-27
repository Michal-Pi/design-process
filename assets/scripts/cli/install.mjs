// assets/scripts/cli/install.mjs
// CLI subcommand: design-os install
//
// Copies the bundled SKILL.md package from the npm-installed location into
// the user's host skills directory, making it available to Claude Code /
// Codex CLI / Cursor without any manual file copy step.
//
// Usage (via dispatcher):
//   node bin/design-os.mjs install
//   node bin/design-os.mjs install --target ~/.claude/skills
//   node bin/design-os.mjs install --target ./.claude/skills --force
//   node bin/design-os.mjs install --dry-run
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
import { resolve, join, dirname } from "node:path";
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
 * The skills/design directory inside the package (what gets installed).
 */
const SOURCE = join(PACKAGE_ROOT, "skills", "design");

/**
 * Default install base: ~/.claude/skills/
 * The destination will be: ~/.claude/skills/design-os/
 */
function defaultTargetBase() {
  return join(homedir(), ".claude", "skills");
}

/**
 * Permitted sandbox roots for --target path containment (Lesson 7).
 * A user-supplied --target must resolve inside one of these.
 * Paths end WITHOUT trailing slash so startsWith() boundary checks work correctly.
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
 * Uses path.resolve() normalisation + exact-boundary startsWith() check
 * (NOT lexical String.includes('..'): per Lesson 7, the containment check must
 * use resolved paths, not raw string inspection — a path like './foo/../../../etc'
 * looks safe lexically but resolves outside the sandbox).
 *
 * @param {string} suppliedTarget - Raw value from the --target flag.
 * @param {string} resolvedTarget - path.resolve(suppliedTarget) result.
 * @throws {PathContainmentError} If resolvedTarget is not contained within any sandbox root.
 */
export function validateTargetSandbox(suppliedTarget, resolvedTarget) {
  const roots = sandboxRoots();
  const contained = roots.some(
    (root) =>
      resolvedTarget === root ||
      resolvedTarget.startsWith(root + "/") ||
      resolvedTarget.startsWith(root + "\\") // Windows path separator guard
  );
  if (!contained) {
    throw new PathContainmentError(suppliedTarget, resolvedTarget, roots);
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

  // The actual destination directory: <targetBase>/design-os/
  const destDir = join(targetBase, "design-os");

  // Dry-run: print what would happen without touching the filesystem.
  if (dryRun) {
    console.log(`[DRY RUN] install: would copy`);
    console.log(`  from: ${SOURCE}`);
    console.log(`  to:   ${destDir}`);
    console.log(
      `\nNo changes made. Remove --dry-run to perform the actual install.`
    );
    return;
  }

  // Verify the source exists (guards against a bad files whitelist).
  let sourceOk;
  try {
    await stat(SOURCE);
    sourceOk = true;
  } catch {
    sourceOk = false;
  }

  if (!sourceOk) {
    throw new Error(
      `install: skills/design not found at ${SOURCE}.\n` +
        `  This usually means the npm package is corrupt or the files whitelist excluded it.\n` +
        `  Please reinstall design-os from npm: npm i -g design-os@beta`
    );
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

  // Copy skills/design → <targetBase>/design-os
  await cp(SOURCE, destDir, { recursive: true });

  console.log(`Installed design-os skill to: ${destDir}`);
  console.log(
    `\nRestart your Claude Code session (or run /reload-skills if available) to pick up the new skill.`
  );
}

export const command = {
  name: "install",
  describe:
    "Install the design-os SKILL.md package into your host skills directory (~/.claude/skills/design-os by default)",

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
