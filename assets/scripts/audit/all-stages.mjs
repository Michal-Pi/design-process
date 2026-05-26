// assets/scripts/audit/all-stages.mjs
// Unified multi-stage audit runner for audit --all-stages and audit --new-feature modes.
//
// D-68: audit --all-stages produces a single unified ranked finding list sorted by:
//   severity DESC (BLOCKER=4, ERROR=3, WARN=2, INFO=1) then stage ASC
//   (5a → 5.1, 5b → 5.2 for numeric comparison)
//
// D-69: audit --new-feature scopes to the sitemap node matching featureName
//   and does NOT generate new artifacts.
//
// T-03-05-02 (path-traversal containment): findSitemapNode uses string match on
//   route label/path — does NOT use feature name as a filesystem path.
//
// Sources: PLAN.md T-03-05-B; CONTEXT.md D-68, D-69; INVARIANTS.md
// Implements: AUDIT-02, AUDIT-04

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { detectStage3PrIssues } from './stage-3-pr.mjs';
import { detectStage4PrIssues } from './stage-4-pr.mjs';
import { detectStage5aPrIssues } from './stage-5a-pr.mjs';
import { detectStage5bPrIssues } from './stage-5b-pr.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, '../../../schemas/dist/audit-report.v1.json');

/**
 * Severity rank map for sorting (D-68).
 * Higher rank = higher severity = sorts first.
 */
const SEVERITY_RANK = { BLOCKER: 4, ERROR: 3, WARN: 2, WARNING: 2, INFO: 1 };

/**
 * Normalize severity alias: ERROR → BLOCKER, WARNING → WARN.
 * @param {string} severity
 * @returns {string}
 */
function normalizeSeverity(severity) {
  if (severity === 'ERROR') return 'BLOCKER';
  if (severity === 'WARNING') return 'WARN';
  return severity;
}

/**
 * Convert a stage identifier to a numeric value for ASC comparison.
 * '5a' → 5.1, '5b' → 5.2, numeric strings/numbers pass through.
 *
 * @param {string|number} stage
 * @returns {number}
 */
function stageToNum(stage) {
  if (stage === '5a' || stage === 5.1) return 5.1;
  if (stage === '5b' || stage === 5.2) return 5.2;
  return Number(stage);
}

/**
 * Sort findings by (severity DESC, stage ASC) per D-68.
 * BLOCKER stage-2 beats BLOCKER stage-4 beats ERROR stage-1.
 *
 * @param {Array<{severity: string, stage: string|number, [key: string]: unknown}>} findings
 * @returns {Array<{severity: string, stage: string|number, [key: string]: unknown}>}
 */
export function sortFindingsByRank(findings) {
  return [...findings].sort((a, b) => {
    const aSeverity = SEVERITY_RANK[a.severity] ?? 0;
    const bSeverity = SEVERITY_RANK[b.severity] ?? 0;
    const sRank = bSeverity - aSeverity; // DESC: higher rank first
    if (sRank !== 0) return sRank;
    // Same severity: sort by stage numeric ASC (earlier stage first)
    return stageToNum(a.stage) - stageToNum(b.stage);
  });
}

/**
 * Find the sitemap node matching featureName by path or label (case-insensitive).
 * T-03-05-02: does NOT use featureName as filesystem path — only as string matcher.
 *
 * @param {object} sitemap - Parsed sitemap JSON
 * @param {string} featureName - Feature name to search for
 * @returns {{ path: string, label: string } | null}
 */
function findSitemapNode(sitemap, featureName) {
  const routes = Array.isArray(sitemap.routes) ? sitemap.routes : [];
  const needle = featureName.toLowerCase();

  for (const route of routes) {
    const routePath = typeof route === 'string' ? route : (route.path ?? '');
    const label = typeof route === 'object' && route.label ? String(route.label) : routePath;

    if (routePath.toLowerCase().includes(needle) || label.toLowerCase().includes(needle)) {
      return { path: routePath, label };
    }
  }
  return null;
}

/**
 * Normalize a finding from any per-stage detector into a consistent shape
 * with a `stage` field and canonical `findingId`.
 *
 * Per-stage detectors use two different Finding shapes:
 *   - Stage 3/4 pr detectors: { findingId, severity, evidence, fixRecipe }
 *   - Stage 5a/5b pr detectors: { id, severity, message }
 *
 * @param {unknown} finding - Raw finding from any detector
 * @param {string|number} stage - Stage number/identifier
 * @returns {{ findingId: string, severity: string, stage: string|number, evidence: string, fixRecipe: string }}
 */
function normalizeFinding(finding, stage) {
  const f = /** @type {Record<string, unknown>} */ (finding);
  const findingId = /** @type {string} */ (f['findingId'] ?? f['id'] ?? `${stage}-finding-001`);
  const severity = normalizeSeverity(/** @type {string} */ (f['severity'] ?? 'INFO'));
  const rawEvidence = f['evidence'];
  const evidence = typeof rawEvidence === 'string'
    ? rawEvidence
    : typeof rawEvidence === 'object' && rawEvidence !== null
      ? JSON.stringify(rawEvidence)
      : String(f['message'] ?? '');
  const fixRecipe = /** @type {string} */ (f['fixRecipe'] ?? f['message'] ?? 'See audit report');
  return { findingId, severity, stage, evidence, fixRecipe };
}

/**
 * Run all 6 per-stage detectors and collect findings.
 * Optionally scope to a feature name (--new-feature mode, D-69).
 *
 * @param {object} opts
 * @param {string} opts.designDir - Path to the design directory
 * @param {string} [opts.featureName] - Feature name to scope (--new-feature mode)
 * @param {string} [opts.outputPath] - Where to write AUDIT-REPORT.md
 * @returns {Promise<{
 *   findings: Array<{findingId: string, severity: string, stage: string|number, evidence: string, fixRecipe: string}>,
 *   auditType: string,
 *   valid: boolean,
 *   outputPath: string|undefined
 * }>}
 */
export async function runAuditAllStages({ designDir, featureName, outputPath }) {
  const resolvedDesignDir = resolve(designDir);

  // For --new-feature mode (D-69): validate featureName exists in sitemap
  // T-03-05-02: findSitemapNode matches by label/path string — no filesystem use of featureName
  if (featureName) {
    const sitemapPath = join(resolvedDesignDir, 'ia', 'sitemap.json');
    if (!existsSync(sitemapPath)) {
      throw new Error(`Feature "${featureName}" not found in sitemap — sitemap.json is missing`);
    }

    let sitemap;
    try {
      const raw = await readFile(sitemapPath, 'utf8');
      sitemap = JSON.parse(raw);
    } catch {
      throw new Error(`Feature "${featureName}" not found in sitemap — cannot parse sitemap.json`);
    }

    const node = findSitemapNode(sitemap, featureName);
    if (!node) {
      throw new Error(`Feature "${featureName}" not found in sitemap — check label and path values`);
    }
  }

  const auditType = featureName ? `feature-audit:${featureName}` : 'all-stages';
  /** @type {Array<{findingId: string, severity: string, stage: string|number, evidence: string, fixRecipe: string}>} */
  const allFindings = [];

  // ── Stage 1: no dedicated PR detector in Phase 3 (skip, no Stage 1 PR detector) ──

  // ── Stage 2: no dedicated Stage 2 PR detector yet — placeholder (returns empty) ──
  // The Stage 2 audit is covered by the existing --pr mode slop-tells + Stage 5a detector.
  // A dedicated stage-2-pr.mjs is out of Phase 3 scope (ships with PR-audit workflows).

  // ── Stage 3 (sketch/wireframes) ─────────────────────────────────────────────────
  try {
    const sitemapPath = join(resolvedDesignDir, 'ia', 'sitemap.json');
    const wireframesDir = join(resolvedDesignDir, 'wireframes');
    const stage3Findings = await detectStage3PrIssues({
      sitemapPath,
      wireframesDir,
    });
    allFindings.push(...stage3Findings.map(f => normalizeFinding(f, 3)));
  } catch {
    // Detector failure is non-fatal — continue with remaining stages
  }

  // ── Stage 4 (interactions/IxD) ───────────────────────────────────────────────────
  try {
    const stage4Findings = await detectStage4PrIssues({ designDir: resolvedDesignDir });
    allFindings.push(...stage4Findings.map(f => normalizeFinding(f, 4)));
  } catch {
    // Detector failure is non-fatal
  }

  // ── Stage 5a (tokens/style) ──────────────────────────────────────────────────────
  // Stage 5a PR detector takes changedFilePath + content; for --all-stages we scan tokens.json
  try {
    const tokensPath = join(resolvedDesignDir, 'tokens.json');
    if (existsSync(tokensPath)) {
      const content = await readFile(tokensPath, 'utf8');
      const stage5aFindings = detectStage5aPrIssues('tokens.json', content);
      allFindings.push(...stage5aFindings.map(f => normalizeFinding(f, '5a')));
    }
  } catch {
    // Detector failure is non-fatal
  }

  // ── Stage 5b (design system/DTCG) ──────────────────────────────────────────────
  // Stage 5b PR detector takes changedFilePath + content
  try {
    const tokensPath = join(resolvedDesignDir, 'tokens.json');
    if (existsSync(tokensPath)) {
      const content = await readFile(tokensPath, 'utf8');
      const stage5bFindings = detectStage5bPrIssues('tokens.json', content);
      allFindings.push(...stage5bFindings.map(f => normalizeFinding(f, '5b')));
    }
  } catch {
    // Detector failure is non-fatal
  }

  // Sort findings: severity DESC then stage ASC (D-68)
  const sortedFindings = sortFindingsByRank(allFindings);

  // Build AUDIT-REPORT.md (using the same pattern as the main audit.mjs buildAuditReport)
  let valid = true;
  if (outputPath) {
    try {
      const reportPath = resolve(outputPath);
      await mkdir(dirname(reportPath), { recursive: true });

      const generated = new Date().toISOString();
      const hash = createHash('sha256').update(JSON.stringify(sortedFindings)).digest('hex');

      // Build frontmatter findings array for schema validation
      const frontmatterFindings = sortedFindings.length === 0
        ? 'findings: []'
        : ['findings:', ...sortedFindings.map(f => [
            `  - findingId: ${f.findingId}`,
            `    severity: ${f.severity}`,
            `    evidence:`,
            `      path: "${String(f.evidence).replace(/"/g, '\\"')}"`,
            `    fixRecipe: "${String(f.fixRecipe).replace(/"/g, '\\"')}"`,
          ].join('\n'))].join('\n');

      const yamlLines = [
        `artifact: audit-report`,
        `stage: cross-stage`,
        `schemaVersion: 1`,
        `auditType: "${auditType}"`,
        `generated: "${generated}"`,
        `sourceHash: "sha256:${hash}"`,
        `provenance: generated`,
        `owner: "design-os/audit"`,
        `lastReviewedAt: "${generated}"`,
        frontmatterFindings,
      ];

      const tableHeader = '| FindingId | Severity | Stage | Fix Recipe |';
      const tableSep = '| --- | --- | --- | --- |';
      const tableRows = sortedFindings.map(f =>
        `| ${f.findingId} | ${f.severity} | ${f.stage} | ${String(f.fixRecipe).replace(/\|/g, '\\|')} |`
      );

      const body = sortedFindings.length > 0
        ? `## Findings (${sortedFindings.length} total — sorted by severity DESC, stage ASC)\n\n${tableHeader}\n${tableSep}\n${tableRows.join('\n')}`
        : `## Findings\n\nNo issues found.`;

      const title = featureName ? `# Feature audit: ${featureName}` : '# AUDIT-REPORT (all-stages)';
      const markdown = `---\n${yamlLines.join('\n')}\n---\n\n${title}\n\n**Generated:** ${generated}  \n**Type:** ${auditType}  \n**Findings:** ${sortedFindings.length}\n\n${body}\n`;

      await writeFile(reportPath, markdown, 'utf8');

      // Schema validate the frontmatter object
      const frontmatterObj = {
        artifact: 'audit-report',
        stage: 'cross-stage',
        schemaVersion: 1,
        auditType,
        generated,
        sourceHash: `sha256:${hash}`,
        provenance: 'generated',
        owner: 'design-os/audit',
        lastReviewedAt: generated,
        findings: sortedFindings.map(f => ({
          findingId: f.findingId,
          severity: f.severity,
          evidence: { path: String(f.evidence) || 'unknown' },
          fixRecipe: String(f.fixRecipe),
        })),
      };

      if (existsSync(SCHEMA_PATH)) {
        try {
          const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
          const ajv = new Ajv2020({ strict: false });
          addFormats(ajv);
          const validateFn = ajv.compile(schema);
          valid = Boolean(validateFn(frontmatterObj));
        } catch {
          // Schema validation failure is non-blocking but marks valid:false
          valid = false;
        }
      }
    } catch {
      valid = false;
    }
  }

  return {
    findings: sortedFindings,
    auditType,
    valid,
    outputPath,
  };
}
