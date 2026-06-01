// assets/scripts/install-hooks.mjs
// Install complete-design git pre-commit hook that scans staged files for PII.
//
// Source: CONTEXT.md D-19; PLAN.md Task 2
// Implements: D-19 (pre-commit hook installation), ART-01 (per-file commit policy)

import { existsSync } from "node:fs";
import { mkdir, writeFile, chmod, symlink, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";

const HOOK_SCRIPT_CONTENT = `#!/bin/sh
# complete-design pre-commit hook — PII scanner
# Installed by: complete-design install-hooks
# Source: assets/scripts/install-hooks.mjs

# Get list of staged files
STAGED=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED" ]; then
  exit 0
fi

FAILED=0

for FILE in $STAGED; do
  # Only scan design/research/** and **/transcript*.md files
  case "$FILE" in
    design/research/*|*transcript*.md)
      # Run PII scanner on this file
      if ! npx tsx bin/complete-design.mjs scan --pii "$FILE"; then
        echo "complete-design: PII found in $FILE — commit blocked. Use 'complete-design install-hooks' to update allowlist."
        FAILED=1
      fi
      ;;
  esac
done

exit $FAILED
`;

/**
 * Install the complete-design pre-commit hook in the current git repository.
 *
 * @param {{ repoDir?: string }} opts
 * @returns {Promise<{ installed: boolean, hookPath: string }>}
 */
export async function installHooks({ repoDir = process.cwd() } = {}) {
  const absRepo = resolve(repoDir);
  const gitDir = join(absRepo, ".git");

  if (!existsSync(gitDir)) {
    throw new Error(
      `Not a git repository: ${absRepo} (no .git directory found)`
    );
  }

  // Ensure tools/ directory exists
  const toolsDir = join(absRepo, "tools");
  await mkdir(toolsDir, { recursive: true });

  // Write tools/install-hooks.sh if not present
  const hookScriptPath = join(toolsDir, "install-hooks.sh");
  await writeFile(hookScriptPath, HOOK_SCRIPT_CONTENT, "utf8");
  await chmod(hookScriptPath, 0o755);

  // Create .git/hooks/ directory
  const hooksDir = join(gitDir, "hooks");
  await mkdir(hooksDir, { recursive: true });

  const preCommitPath = join(hooksDir, "pre-commit");

  // Remove existing hook if any
  if (existsSync(preCommitPath)) {
    await unlink(preCommitPath);
  }

  // Attempt symlink; fall back to copy on Windows
  try {
    await symlink(hookScriptPath, preCommitPath);
  } catch {
    // Fallback: write the script directly
    await writeFile(preCommitPath, HOOK_SCRIPT_CONTENT, "utf8");
    await chmod(preCommitPath, 0o755);
  }

  return { installed: true, hookPath: preCommitPath };
}
