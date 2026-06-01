// assets/scripts/security-sandbox.mjs
// Permission boundary for the complete-design preview harness.
//
// Threat model: Phase 1 does NOT execute arbitrary user code in a sandbox.
// The "sandbox" enforces:
//   (1) path allow-listing for reads/writes via isPathAllowed()
//   (2) env scrub for spawned dev servers via scrubEnvForPreview()
//
// vm2 explicitly NOT used (CVE-2026-22709 + 11 advisories early 2026).
// The project maintainer of vm2 recommends migration away from vm-based
// sandboxing; complete-design never executed arbitrary user code in a VM anyway.
//
// Sources: RESEARCH.md "Security Sandbox — Permission Boundary (NOT vm-based)",
//          CONTEXT.md D-23, PLAN.md Task 1 behavior block, threat model T-05-01..04.

import { resolve, relative } from 'node:path';

/**
 * Relative path prefixes allowed for READ operations.
 * Paths must start with one of these to be permitted.
 */
const READ_ALLOWLIST = ['design/', 'design/.handoff/', '.complete-design/', 'PRD.md'];

/**
 * Relative path prefixes allowed for WRITE operations.
 * Writes are restricted to the working directories complete-design manages.
 */
const WRITE_ALLOWLIST = ['design/', '.complete-design/'];

/**
 * Determine whether a filesystem operation is permitted.
 *
 * @param absPath      Absolute path to check
 * @param mode         'read' or 'write'
 * @param projectRoot  Absolute path to the project root
 * @returns true if the operation is within the permission boundary
 */
export function isPathAllowed(absPath, mode, projectRoot) {
  // Resolve both paths to normalize them
  const resolvedPath = resolve(absPath);
  const resolvedRoot = resolve(projectRoot);

  // Reject any path that doesn't start with projectRoot
  if (!resolvedPath.startsWith(resolvedRoot + '/') && resolvedPath !== resolvedRoot) {
    return false;
  }

  // Get relative path from project root
  const rel = relative(resolvedRoot, resolvedPath);

  // Reject any path containing '..' traversal after normalization
  if (rel.startsWith('..')) {
    return false;
  }

  const allowlist = mode === 'write' ? WRITE_ALLOWLIST : READ_ALLOWLIST;

  // Check if relative path is or starts with an allowlist entry
  for (const entry of allowlist) {
    if (rel === entry || rel.startsWith(entry)) {
      return true;
    }
    // Handle exact file matches (e.g., 'PRD.md')
    if (!entry.endsWith('/') && rel === entry) {
      return true;
    }
  }

  return false;
}

/**
 * Scrub sensitive environment variables before passing env to a spawned process.
 * Removes any key matching the pattern: *_KEY, *_SECRET, *_TOKEN, *_PASSWORD (case-insensitive).
 *
 * Implements T-05-01 mitigation: secrets must not cross the spawned dev server boundary.
 *
 * @param env  Environment variable map (record of string→string)
 * @returns A new env map with secret-looking keys removed
 */
export function scrubEnvForPreview(env) {
  const SENSITIVE_PATTERN = /_(KEY|SECRET|TOKEN|PASSWORD)$/i;
  const scrubbed = {};
  for (const [key, value] of Object.entries(env)) {
    if (!SENSITIVE_PATTERN.test(key)) {
      scrubbed[key] = value;
    }
  }
  return scrubbed;
}
