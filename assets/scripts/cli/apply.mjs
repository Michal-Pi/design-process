// assets/scripts/cli/apply.mjs
// CLI module for the `apply` command.
// Auto-discovered by bin/complete-design.mjs; no modification to bin/ required.
//
// Usage:
//   complete-design apply --run-id <id> --design-dir <path> [--no-overwrite]
//
// Copies staging artifacts from .complete-design/preview/run-<id>/ to design/.
// Default: overwrite existing files with WARNING logged.
// --no-overwrite: abort on conflict (exit 1, no files written).
//
// Sources: CONTEXT.md D-52, OF-04, PLAN.md T-02-05-A action block
// Implements: D-52, TRUST-01

import { copyFile, mkdir, readFile, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, relative, join, dirname } from 'node:path';
import { globby } from 'globby';

/**
 * Apply staging artifacts to the design directory.
 *
 * @param {object} opts
 * @param {string} opts.stagingPath - Absolute path to the staging directory
 * @param {string} opts.designDir - Absolute path to the design directory
 * @param {boolean} opts.noOverwrite - If true, abort on any conflict
 * @param {string} [opts.logPath] - Optional path to run-log.jsonl for conflict warnings
 * @returns {Promise<{ applied: string[], warnings: string[] }>}
 */
export async function applyStaging({ stagingPath, designDir, noOverwrite, logPath }) {
  // Find all files in the staging directory
  const files = await globby('**/*', {
    cwd: stagingPath,
    onlyFiles: true,
    dot: true,
  });

  if (files.length === 0) {
    return { applied: [], warnings: [] };
  }

  // If --no-overwrite: check all conflicts before copying anything
  if (noOverwrite) {
    const conflicts = files.filter(relPath => existsSync(join(designDir, relPath)));
    if (conflicts.length > 0) {
      throw new Error(
        `apply: conflict on --no-overwrite — ${conflicts.length} file(s) already exist in ${designDir}: ${conflicts.join(', ')}`
      );
    }
  }

  /** @type {string[]} */
  const applied = [];
  /** @type {string[]} */
  const warnings = [];
  const timestamp = new Date().toISOString();

  for (const relPath of files) {
    const srcPath = join(stagingPath, relPath);
    const destPath = join(designDir, relPath);

    // Ensure destination directory exists
    await mkdir(dirname(destPath), { recursive: true });

    if (existsSync(destPath)) {
      // File exists: overwrite with WARNING (--no-overwrite already handled above)
      warnings.push(relPath);

      // Log to run-log.jsonl if a log path is provided.
      // Ensure the parent directory exists first — `complete-design init` only creates
      // `.complete-design/`, not `.complete-design/private/`, so the appendFile would throw
      // ENOENT in a freshly-initialized repo (Finding 3 fix).
      if (logPath) {
        await mkdir(dirname(logPath), { recursive: true });
        const logEntry = JSON.stringify({
          event: 'apply-conflict-overwrite',
          file: relPath,
          timestamp,
        }) + '\n';
        await appendFile(logPath, logEntry, 'utf8');
      }
    }

    await copyFile(srcPath, destPath);
    applied.push(relPath);
  }

  return { applied, warnings };
}

/** CLI module descriptor for auto-discovery by bin/complete-design.mjs */
export const command = {
  name: 'apply',
  describe: 'Apply staged artifacts from .complete-design/preview/run-<id>/ to design/',

  /** @param {import("commander").Command} cmd */
  builder(cmd) {
    cmd
      .option('--run-id <id>', 'Run ID to apply (from .complete-design/preview/run-<id>/)')
      .option('--design-dir <path>', 'Target design directory', 'design/')
      .option('--no-overwrite', 'Abort on conflict instead of overwriting');
  },

  async handler(args) {
    const runId = args.runId ?? args['run-id'];
    if (!runId) {
      console.error('apply: --run-id is required');
      process.exit(1);
    }

    const projectRoot = process.cwd();
    const stagingPath = resolve(projectRoot, '.complete-design', 'preview', `run-${runId}`);
    const designDir = resolve(projectRoot, args.designDir ?? args['design-dir'] ?? 'design/');
    const noOverwrite = Boolean(args.noOverwrite ?? args['no-overwrite']);
    const logPath = resolve(projectRoot, '.complete-design', 'private', 'run-log.jsonl');

    if (!existsSync(stagingPath)) {
      console.error(`apply: staging path not found: ${stagingPath}`);
      process.exit(1);
    }

    try {
      const result = await applyStaging({ stagingPath, designDir, noOverwrite, logPath });
      console.log(JSON.stringify({ applied: result.applied, warnings: result.warnings }));
      if (result.warnings.length > 0) {
        console.warn(`apply: ${result.warnings.length} conflict(s) overwritten — see run-log.jsonl`);
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};
