// assets/scripts/cli/audit.mjs
// CLI module for the `audit` command.
// Auto-discovered by bin/design-os.mjs; no modification to bin/ required.
//
// Usage:
//   design-os audit --slop-tells [--scan-dir .] [--output design/AUDIT-REPORT.md]
//   design-os audit --pr [--design-dir design/] [--output design/AUDIT-REPORT.md]
//   design-os audit --slop-tells --pr [--continue-anyway]
//
// Modes:
//   --slop-tells: regex scan CSS/TSX files for 5 slop-tell patterns
//   --pr: git diff --name-only HEAD~1 → route to stage-5a-pr or stage-5b-pr detectors
//
// Sources: CONTEXT.md D-45, D-46, D-47, PLAN.md T-02-05-C action block
// Implements: AUDIT-01, AUDIT-03, AUDIT-05, AUDIT-08, D-47, WF-08

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync as readFileSyncNode } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { globby } from 'globby';
import { detectSlopTells } from '../audit/slop-tells.mjs';
import { detectStage5aPrIssues } from '../audit/stage-5a-pr.mjs';
import { detectStage5bPrIssues } from '../audit/stage-5b-pr.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, '../../../schemas/dist/audit-report.v1.json');

/**
 * @typedef {{ id: string, severity: string, message: string, fixRecipe?: string, suppressWith?: string, filePath?: string }} Finding
 */

/**
 * Severity ordering: BLOCKER > ERROR > WARNING > INFO
 */
const SEVERITY_ORDER = { BLOCKER: 0, ERROR: 1, WARNING: 2, INFO: 3 };

function severityCmp(a, b) {
  const aOrder = SEVERITY_ORDER[a.severity] ?? 99;
  const bOrder = SEVERITY_ORDER[b.severity] ?? 99;
  return aOrder - bOrder;
}

/**
 * Load audit suppressions from .design-os/audit-suppressions.json if present.
 * @param {string} projectRoot
 * @returns {Promise<Set<string>>} Set of suppressed findingIds
 */
async function loadSuppressions(projectRoot) {
  const suppressPath = join(projectRoot, '.design-os', 'audit-suppressions.json');
  if (!existsSync(suppressPath)) return new Set();
  try {
    const raw = await readFile(suppressPath, 'utf8');
    const data = JSON.parse(raw);
    return new Set(Array.isArray(data.suppress) ? data.suppress : []);
  } catch {
    return new Set();
  }
}

/**
 * Validate AUDIT-REPORT.md frontmatter against audit-report.v1.json schema.
 * Returns true if valid; logs warnings otherwise (non-blocking for CLI output).
 *
 * @param {Record<string, unknown>} frontmatter - Parsed frontmatter object
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAuditReportFrontmatter(frontmatter) {
  if (!existsSync(SCHEMA_PATH)) {
    return { valid: true, errors: ['schema not found at ' + SCHEMA_PATH + ' — skipping validation'] };
  }
  try {
    const schema = JSON.parse(readFileSyncNode(SCHEMA_PATH, 'utf8'));
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(frontmatter);
    if (!valid) {
      const errors = (validate.errors ?? []).map(e => `${e.instancePath} ${e.message}`);
      return { valid: false, errors };
    }
    return { valid: true, errors: [] };
  } catch (err) {
    return { valid: false, errors: [String(err)] };
  }
}

/**
 * Build AUDIT-REPORT.md content from findings.
 *
 * @param {Finding[]} findings - Sorted findings
 * @param {{ auditType: string, generated: string }} opts
 * @returns {{ frontmatter: Record<string, unknown>, markdown: string }}
 */
function buildAuditReport(findings, opts) {
  const { auditType, generated } = opts;

  // Compute source hash from serialized findings
  const hash = createHash('sha256').update(JSON.stringify(findings)).digest('hex');

  const frontmatterData = {
    artifact: 'audit-report',
    stage: 'cross-stage',
    schemaVersion: 1,
    auditType,
    generated,
    sourceHash: `sha256:${hash}`,
    provenance: 'generated',
    owner: 'design-os/audit',
    lastReviewedAt: generated,
    findings: findings.map(f => ({
      findingId: f.id,
      severity: f.severity === 'WARNING' ? 'WARN' : (f.severity === 'BLOCKER' || f.severity === 'ERROR' || f.severity === 'INFO' ? f.severity : 'WARN'),
      evidence: { path: f.filePath ?? 'unknown' },
      fixRecipe: f.fixRecipe ?? f.message,
      ...(f.suppressWith ? { suppression: f.suppressWith } : {}),
    })),
  };

  // Build GFM table for body
  const tableHeader = '| FindingId | Severity | File | Message | Fix Recipe |';
  const tableSep = '| --- | --- | --- | --- | --- |';
  const tableRows = findings.map(f =>
    `| ${f.id} | ${f.severity} | ${f.filePath ?? 'unknown'} | ${f.message.replace(/\|/g, '\\|')} | ${(f.fixRecipe ?? f.message).replace(/\|/g, '\\|')} |`
  );

  const body = findings.length > 0
    ? `## Findings (${findings.length} total)\n\n${tableHeader}\n${tableSep}\n${tableRows.join('\n')}`
    : `## Findings\n\nNo issues found.`;

  // Serialize frontmatter as YAML (manual for schema compliance)
  const yamlLines = [
    `artifact: ${frontmatterData.artifact}`,
    `stage: ${frontmatterData.stage}`,
    `schemaVersion: ${frontmatterData.schemaVersion}`,
    `auditType: "${frontmatterData.auditType}"`,
    `generated: "${frontmatterData.generated}"`,
    `sourceHash: "${frontmatterData.sourceHash}"`,
    `provenance: ${frontmatterData.provenance}`,
    `owner: "${frontmatterData.owner}"`,
    `lastReviewedAt: "${frontmatterData.lastReviewedAt}"`,
    `findings:`,
    ...frontmatterData.findings.map(f => [
      `  - findingId: ${f.findingId}`,
      `    severity: ${f.severity}`,
      `    evidence:`,
      `      path: "${f.evidence.path}"`,
      `    fixRecipe: "${f.fixRecipe.replace(/"/g, '\\"')}"`,
      ...(f.suppression ? [`    suppression: "${f.suppression}"`] : []),
    ].join('\n')),
  ];

  const markdown = `---\n${yamlLines.join('\n')}\n---\n\n# AUDIT-REPORT\n\n**Generated:** ${generated}  \n**Type:** ${auditType}  \n**Findings:** ${findings.length}\n\n${body}\n`;

  return { frontmatter: frontmatterData, markdown };
}

/**
 * Run the audit command.
 *
 * @param {object} opts
 * @param {boolean} opts.slopTells - Run slop-tells mode
 * @param {boolean} opts.pr - Run PR diff mode
 * @param {string} opts.scanDir - Directory to scan (slop-tells mode)
 * @param {string} opts.designDir - Design directory
 * @param {string} opts.output - Output path for AUDIT-REPORT.md
 * @param {string} opts.blockOnSeverity - Severity level to block on (default: BLOCKER)
 * @param {boolean} opts.continueAnyway - Don't exit 1 on BLOCKER
 * @param {string} opts.projectRoot - Project root (for suppressions)
 * @returns {Promise<{ findings: Finding[], blocked: boolean, outputPath: string }>}
 */
export async function runAudit({ slopTells, pr, scanDir, designDir, output, blockOnSeverity = 'BLOCKER', continueAnyway = false, projectRoot }) {
  if (!slopTells && !pr) {
    throw new Error('audit: specify --slop-tells or --pr (or both)');
  }

  /** @type {Finding[]} */
  let allFindings = [];

  // Load suppressions
  const suppressedIds = await loadSuppressions(projectRoot);

  // === SLOP-TELLS MODE ===
  if (slopTells) {
    const cssFiles = await globby('**/*.{css,tsx,ts}', {
      cwd: resolve(scanDir),
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    });

    for (const relPath of cssFiles) {
      const fullPath = join(resolve(scanDir), relPath);
      try {
        const content = await readFile(fullPath, 'utf8');
        const findings = await detectSlopTells(content, relPath);
        allFindings.push(...findings.map(f => ({ ...f, filePath: relPath })));
      } catch {
        // skip unreadable files
      }
    }
  }

  // === PR MODE ===
  if (pr) {
    let changedFiles = [];
    try {
      const baseRef = process.env.GITHUB_BASE_REF
        ? `origin/${process.env.GITHUB_BASE_REF}`
        : 'HEAD~1';
      const output = execSync(`git diff --name-only ${baseRef}`, { cwd: projectRoot, stdio: 'pipe' }).toString().trim();
      changedFiles = output.split('\n').filter(Boolean);
    } catch {
      // git not available or no commits — continue with empty list
    }

    for (const filePath of changedFiles) {
      const fullPath = join(projectRoot, filePath);
      if (!existsSync(fullPath)) continue;

      try {
        const content = await readFile(fullPath, 'utf8');

        // Route to appropriate detector
        if (filePath.match(/\.(css|tsx|ts)$/)) {
          const findings = detectStage5aPrIssues(filePath, content);
          allFindings.push(...findings.map(f => ({ ...f, filePath })));

          // Also run slop-tells on CSS/TSX changed files
          const slopFindings = await detectSlopTells(content, filePath);
          allFindings.push(...slopFindings.map(f => ({ ...f, filePath })));
        }

        if (filePath.endsWith('tokens.json')) {
          const findings = detectStage5bPrIssues(filePath, content);
          allFindings.push(...findings.map(f => ({ ...f, filePath })));
        }
      } catch {
        // skip unreadable files
      }
    }
  }

  // Apply suppressions
  allFindings = allFindings.filter(f => !suppressedIds.has(f.id));

  // Sort by severity (BLOCKER first)
  allFindings.sort(severityCmp);

  // Build and emit AUDIT-REPORT.md
  const generated = new Date().toISOString();
  const auditType = [slopTells && 'slop-tells', pr && 'pr-review'].filter(Boolean).join('+');
  const { markdown } = buildAuditReport(allFindings, { auditType, generated });

  const outputPath = resolve(output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, 'utf8');

  // Check for blocking findings
  const blockOrder = SEVERITY_ORDER[blockOnSeverity] ?? 0;
  const blocked = !continueAnyway && allFindings.some(f => (SEVERITY_ORDER[f.severity] ?? 99) <= blockOrder);

  return { findings: allFindings, blocked, outputPath };
}

/** CLI module descriptor for auto-discovery by bin/design-os.mjs */
export const command = {
  name: 'audit',
  describe: 'Audit design artifacts for slop patterns (--slop-tells) or PR regressions (--pr)',

  /** @param {import("commander").Command} cmd */
  builder(cmd) {
    cmd
      .option('--slop-tells', 'Run regex slop-tell linters on CSS/TSX files')
      .option('--pr', 'Run Stage 5a/5b detectors on PR diff')
      .option('--scan-dir <path>', 'Directory to scan (slop-tells mode)', '.')
      .option('--design-dir <path>', 'Design directory', 'design/')
      .option('--output <path>', 'Output path for AUDIT-REPORT.md', 'design/AUDIT-REPORT.md')
      .option('--block-on-severity <level>', 'Severity to block on (BLOCKER|ERROR|WARNING|INFO)', 'BLOCKER')
      .option('--continue-anyway', 'Exit 0 even if BLOCKER findings present');
  },

  async handler(args) {
    const slopTells = Boolean(args.slopTells ?? args['slop-tells']);
    const prMode = Boolean(args.pr);

    if (!slopTells && !prMode) {
      console.error('audit: specify --slop-tells or --pr (or both)');
      process.exit(1);
    }

    const projectRoot = process.cwd();
    const scanDir = resolve(projectRoot, args.scanDir ?? args['scan-dir'] ?? '.');
    const designDir = resolve(projectRoot, args.designDir ?? args['design-dir'] ?? 'design/');
    const output = resolve(projectRoot, args.output ?? 'design/AUDIT-REPORT.md');
    const blockOnSeverity = args.blockOnSeverity ?? args['block-on-severity'] ?? 'BLOCKER';
    const continueAnyway = Boolean(args.continueAnyway ?? args['continue-anyway']);

    try {
      const { findings, blocked, outputPath } = await runAudit({
        slopTells,
        pr: prMode,
        scanDir,
        designDir,
        output,
        blockOnSeverity,
        continueAnyway,
        projectRoot,
      });

      console.log(`audit: ${findings.length} finding(s) → ${outputPath}`);
      if (findings.length > 0) {
        const counts = {};
        for (const f of findings) {
          counts[f.severity] = (counts[f.severity] ?? 0) + 1;
        }
        console.log('  ' + Object.entries(counts).map(([s, c]) => `${s}: ${c}`).join(', '));
      }

      if (blocked) {
        console.error(`audit: BLOCKED — BLOCKER-severity findings present. Use --continue-anyway to override.`);
        process.exit(1);
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  },
};
