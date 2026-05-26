// assets/scripts/audit/stage-4-pr.mjs
// Stage 4 PR diff detector.
//
// Checks for:
//   - 4-pr-states-001 (ERROR): async .spec.md missing loading or error state
//   - 4-pr-hax18-001 (INFO): async .spec.md without HAX-18 guideline citation
//
// INVARIANT-05: No LLM imports. Deterministic PR detector only.
//
// Exported API:
//   detectStage4PrIssues({ designDir }) → Promise<Finding[]>
//
// Finding shape (INVARIANT-06):
//   { findingId: '4-pr-states-001' | '4-pr-hax18-001', severity, evidence, fixRecipe }
//
// Source: PLAN.md 03-02 Task B; CONTEXT.md D-59; INVARIANTS.md INVARIANT-06
// Implements: AUDIT-01

import { readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { globby } from 'globby';

/**
 * @typedef {{
 *   findingId: string,
 *   severity: string,
 *   evidence: object,
 *   fixRecipe: string
 * }} Finding
 */

/** State types required for async operations. */
const ASYNC_REQUIRED_TYPES = ['loading', 'error'];

/**
 * Detect Stage 4 PR issues in design/interactions/*.spec.md files.
 *
 * @param {{ designDir: string }} opts
 * @returns {Promise<Finding[]>}
 */
export async function detectStage4PrIssues({ designDir }) {
  /** @type {Finding[]} */
  const findings = [];

  // Glob all .spec.md files in interactions/
  const specFiles = await globby(['interactions/*.spec.md'], {
    cwd: designDir,
    absolute: false,
  });

  for (const specFile of specFiles) {
    const screenName = basename(specFile, '.spec.md');
    const fullPath = join(designDir, specFile);

    let specData;
    let rawContent = '';
    try {
      rawContent = await readFile(fullPath, 'utf8');
      // Parse YAML frontmatter with gray-matter
      const { default: grayMatter } = await import('gray-matter');
      const parsed = grayMatter(rawContent);
      specData = parsed.data;
    } catch {
      // Cannot parse — skip
      continue;
    }

    const asyncOps = Boolean(specData.asyncOperations);
    if (!asyncOps) continue; // Only check async screens

    // ── Check 1: Missing loading or error state (4-pr-states-001) ─────────────
    const stateTypes = new Set(
      (Array.isArray(specData.states) ? specData.states : [])
        .map((s) => s?.type)
        .filter(Boolean)
    );

    const missingAsyncStates = ASYNC_REQUIRED_TYPES.filter((t) => !stateTypes.has(t));

    if (missingAsyncStates.length > 0) {
      findings.push({
        findingId: '4-pr-states-001',
        severity: 'ERROR',
        evidence: {
          screen: screenName,
          asyncOperations: true,
          missingStateTypes: missingAsyncStates,
        },
        fixRecipe: `Async screen '${screenName}' must include state types: [${missingAsyncStates.join(', ')}]. Update ${screenName}.spec.md states array.`,
      });
    }

    // ── Check 2: HAX-18 citation (4-pr-hax18-001) ─────────────────────────────
    // Async operations signal AI/data product interactions — HAX-18 guidelines required.
    // Check both body text and frontmatter for 'hax-18' or 'HAX-18' reference.
    const hasHax18Citation =
      rawContent.toLowerCase().includes('hax-18') ||
      rawContent.includes('HAX-18');

    if (!hasHax18Citation) {
      findings.push({
        findingId: '4-pr-hax18-001',
        severity: 'INFO',
        evidence: {
          screen: screenName,
          asyncOperations: true,
        },
        fixRecipe: 'Review references/hax-18.md for AI-specific interaction guidelines (Amershi et al. CHI 2019). Cite relevant guidelines (G1, G7, G16) in the spec body.',
      });
    }
  }

  return findings;
}
