// assets/scripts/audit/stage-3-pr.mjs
// Stage 3 PR diff detector.
//
// Checks for new screens in sitemap.json that have no corresponding CHOICE.md
// in design/wireframes/<screen>/, and significant layout drift (.excalidraw modification).
//
// INVARIANT-05: No LLM imports. Deterministic PR detector only.
//
// Exported API:
//   detectStage3PrIssues({ sitemapPath, wireframesDir }) → Promise<Finding[]>
//
// Finding shape (INVARIANT-06):
//   { findingId: '3-pr-choice-001' | '3-pr-layout-001', severity, evidence, fixRecipe }
//
// Source: PLAN.md 03-02 Task B; CONTEXT.md D-59; INVARIANTS.md INVARIANT-06
// Implements: AUDIT-01

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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

/**
 * Derive screen name from a sitemap route path.
 * Takes the last path segment.
 *
 * @param {string} routePath
 * @returns {string}
 */
function routeToScreenName(routePath) {
  const segments = routePath.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';
  return last.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Detect Stage 3 PR issues:
 *   - 3-pr-choice-001 (WARN): sitemap route has no corresponding CHOICE.md in wireframes/
 *   - 3-pr-layout-001 (INFO): .excalidraw file was modified in the PR diff
 *
 * @param {{ sitemapPath: string, wireframesDir: string, gitDiff?: string }} opts
 * @returns {Promise<Finding[]>}
 */
export async function detectStage3PrIssues({ sitemapPath, wireframesDir, gitDiff = '' }) {
  /** @type {Finding[]} */
  const findings = [];

  // ── Check 1: Screen without CHOICE.md (3-pr-choice-001) ───────────────────
  if (!existsSync(sitemapPath)) {
    // No sitemap — cannot check; return empty
    return findings;
  }

  let sitemap;
  try {
    const raw = await readFile(sitemapPath, 'utf8');
    sitemap = JSON.parse(raw);
  } catch {
    return findings; // Cannot parse sitemap — skip check
  }

  const routes = Array.isArray(sitemap.routes) ? sitemap.routes : [];

  for (const route of routes) {
    const routePath = typeof route === 'string' ? route : (route.path ?? '');
    const screenName = routeToScreenName(routePath);
    if (!screenName) continue;

    const choiceMdPath = join(wireframesDir, screenName, 'CHOICE.md');
    if (!existsSync(choiceMdPath)) {
      findings.push({
        findingId: '3-pr-choice-001',
        severity: 'WARN',
        evidence: {
          screen: screenName,
          route: routePath,
          expectedChoiceMd: choiceMdPath,
        },
        fixRecipe: `Run the converge atom for screen '${screenName}' to produce wireframes/${screenName}/CHOICE.md selecting the chosen variant.`,
      });
    }
  }

  // ── Check 2: Layout drift — .excalidraw modified in PR diff (3-pr-layout-001) ─
  if (gitDiff) {
    const modifiedExcalidraw = gitDiff
      .split('\n')
      .filter((line) => line.match(/\.excalidraw$/));

    if (modifiedExcalidraw.length > 0) {
      findings.push({
        findingId: '3-pr-layout-001',
        severity: 'INFO',
        evidence: {
          modifiedFiles: modifiedExcalidraw,
        },
        fixRecipe: 'Significant layout drift detected (.excalidraw file modified). Re-run gate-stage-3 to verify structural diversity ≥0.35 is maintained.',
      });
    }
  }

  return findings;
}
