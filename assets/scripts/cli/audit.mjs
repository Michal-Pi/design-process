// assets/scripts/cli/audit.mjs
// CLI module for the `audit` command.
// Auto-discovered by bin/design-os.mjs; no modification to bin/ required.
//
// Usage:
//   design-os audit --slop-tells [--scan-dir .] [--output design/AUDIT-REPORT.md]
//   design-os audit --pr [--design-dir design/] [--output design/AUDIT-REPORT.md]
//   design-os audit --slop-tells --pr [--continue-anyway]
//   design-os audit --reverse-engineer-stages --source <path|url> [--output-dir design/inferred/] [--apply]
//
// Modes:
//   --slop-tells: regex scan CSS/TSX files for 5 slop-tell patterns
//   --pr: git diff --name-only HEAD~1 → route to stage-5a-pr or stage-5b-pr detectors
//   --reverse-engineer-stages: infer Stage 4→3→2→1 artifacts from an existing prototype
//
// Sources: CONTEXT.md D-45, D-46, D-47, D-62..D-64, PLAN.md T-02-05-C, T-03-04-A
// Implements: AUDIT-01, AUDIT-03, AUDIT-05, AUDIT-06, AUDIT-07, AUDIT-08, D-47, D-62, WF-08

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
 * Severity ordering: BLOCKER > WARN > INFO
 * ERROR is a legacy alias for BLOCKER (slop-tells heuristics may emit it).
 * Normalize ERROR → BLOCKER at input boundaries so all downstream code and
 * the audit-report.v1.json schema (which only allows BLOCKER | WARN | INFO)
 * see consistent values.
 */
const SEVERITY_ORDER = { BLOCKER: 0, WARN: 1, WARNING: 1, INFO: 2 };

/**
 * Normalize a severity string to the canonical set accepted by audit-report.v1.json:
 *   ERROR → BLOCKER (semantically identical: must fix)
 *   WARNING → WARN  (schema uses WARN, not WARNING)
 *
 * @param {string} severity
 * @returns {string}
 */
function normalizeSeverity(severity) {
  if (severity === 'ERROR') return 'BLOCKER';
  if (severity === 'WARNING') return 'WARN';
  return severity;
}

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

  // Normalize severities before hashing / building schema-compliant output.
  // All findings must use BLOCKER | WARN | INFO — ERROR and WARNING are aliases
  // emitted by slop-tells heuristics that must be canonicalized here.
  const normalizedFindings = findings.map(f => ({ ...f, severity: normalizeSeverity(f.severity) }));

  // Compute source hash from serialized findings
  const hash = createHash('sha256').update(JSON.stringify(normalizedFindings)).digest('hex');

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
    findings: normalizedFindings.map(f => ({
      findingId: f.id,
      severity: f.severity,
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

  // Serialize frontmatter as YAML (manual for schema compliance).
  // IMPORTANT: when findings is empty we must emit `findings: []` — NOT bare
  // `findings:` which YAML parsers interpret as null (fails schema validation).
  const findingsYaml = frontmatterData.findings.length === 0
    ? 'findings: []'
    : ['findings:', ...frontmatterData.findings.map(f => [
        `  - findingId: ${f.findingId}`,
        `    severity: ${f.severity}`,
        `    evidence:`,
        `      path: "${f.evidence.path}"`,
        `    fixRecipe: "${f.fixRecipe.replace(/"/g, '\\"')}"`,
        ...(f.suppression ? [`    suppression: "${f.suppression}"`] : []),
      ].join('\n'))].join('\n');

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
    findingsYaml,
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
 * @param {string} [opts.base] - Explicit base ref for --pr mode (overrides GITHUB_BASE_REF and auto-detection)
 * @returns {Promise<{ findings: Finding[], blocked: boolean, outputPath: string }>}
 */
export async function runAudit({ slopTells, pr, scanDir, designDir, output, blockOnSeverity = 'BLOCKER', continueAnyway = false, projectRoot, base }) {
  const opts = { slopTells, pr, scanDir, designDir, output, blockOnSeverity, continueAnyway, projectRoot, base };
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

    // Determine the PR base ref. Precedence:
    //   1. Explicit --base <ref> CLI flag (passed as opts.base)
    //   2. GITHUB_BASE_REF env var (set by GitHub Actions)
    //   3. Merge-base against origin/HEAD default branch (full PR range, not HEAD~1)
    //
    // Using `git diff <base>...HEAD` (three-dot) gives the symmetric diff from the
    // merge-base so all commits in the PR are covered — not just the last one.
    let baseRef = opts.base ?? null;
    if (!baseRef && process.env.GITHUB_BASE_REF) {
      baseRef = `origin/${process.env.GITHUB_BASE_REF}`;
    }

    if (!baseRef) {
      // Detect default branch via symbolic-ref; fall back to origin/main
      try {
        const defaultBranch = execSync(
          "git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'",
          { cwd: projectRoot, stdio: 'pipe', shell: '/bin/sh' }
        ).toString().trim();
        baseRef = defaultBranch ? `origin/${defaultBranch}` : 'origin/main';
      } catch {
        baseRef = 'origin/main';
      }

      // Use merge-base so we diff the full PR range (all commits, not just HEAD~1)
      try {
        const mergeBase = execSync(`git merge-base HEAD ${baseRef}`, {
          cwd: projectRoot,
          stdio: 'pipe',
        }).toString().trim();
        if (mergeBase) {
          baseRef = mergeBase;
        }
      } catch {
        // merge-base failed (shallow clone, no common ancestor) — keep baseRef as-is
      }
    }

    // Attempt the diff. On failure, surface the error and exit non-zero rather than
    // emitting a silent clean report (Finding 5 fix).
    let diffFailed = false;
    let diffError = '';
    const diffCmd = `git diff --name-only ${baseRef}...HEAD`;
    try {
      const diffOutput = execSync(diffCmd, { cwd: projectRoot, stdio: 'pipe' }).toString().trim();
      changedFiles = diffOutput.split('\n').filter(Boolean);
    } catch (err) {
      diffFailed = true;
      diffError = err instanceof Error ? err.message : String(err);
    }

    if (diffFailed) {
      // Do NOT silently emit a clean report — that would give CI a false pass.
      process.stderr.write(
        `audit --pr: git diff failed.\n` +
        `  Command: ${diffCmd}\n` +
        `  Error: ${diffError}\n` +
        `  Hint: ensure the base ref is fetched (e.g. git fetch origin) or pass --base <ref>.\n`
      );
      process.exit(1);
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

  // Normalize severities to canonical set (ERROR→BLOCKER, WARNING→WARN) so
  // all downstream code — blocking check, returned findings, schema — sees
  // consistent values without ERROR or WARNING leaking through.
  allFindings = allFindings.map(f => ({ ...f, severity: normalizeSeverity(f.severity) }));

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
  describe: 'Audit design artifacts for slop patterns (--slop-tells), PR regressions (--pr), or reverse-engineer stages (--reverse-engineer-stages)',

  /** @param {import("commander").Command} cmd */
  builder(cmd) {
    cmd
      .option('--slop-tells', 'Run regex slop-tell linters on CSS/TSX files')
      .option('--pr', 'Run Stage 5a/5b detectors on PR diff')
      .option('--base <ref>', 'Explicit base ref for --pr mode (e.g. origin/main). Overrides GITHUB_BASE_REF and auto-detection.')
      .option('--scan-dir <path>', 'Directory to scan (slop-tells mode)', '.')
      .option('--design-dir <path>', 'Design directory', 'design/')
      .option('--output <path>', 'Output path for AUDIT-REPORT.md', 'design/AUDIT-REPORT.md')
      .option('--block-on-severity <level>', 'Severity to block on (BLOCKER|ERROR|WARNING|INFO)', 'BLOCKER')
      .option('--continue-anyway', 'Exit 0 even if BLOCKER findings present')
      // --reverse-engineer-stages mode (D-62..D-64)
      .option('--reverse-engineer-stages', 'Infer Stage 4→3→2→1 artifacts from an existing prototype (local path or live URL)')
      .option('--source <path-or-url>', 'Local path to cloned repo or live URL (https://...) — required for --reverse-engineer-stages')
      .option('--output-dir <path>', 'Output directory for inferred artifacts (--reverse-engineer-stages mode)', 'design/inferred/')
      .option('--apply', 'Write artifacts to outputDir (default: dry-run, shows what would be created)');
  },

  async handler(args) {
    const slopTells = Boolean(args.slopTells ?? args['slop-tells']);
    const prMode = Boolean(args.pr);
    const reverseEngineerStages = Boolean(args.reverseEngineerStages ?? args['reverse-engineer-stages']);

    // === REVERSE-ENGINEER-STAGES MODE (D-62..D-64) ===
    if (reverseEngineerStages) {
      const source = /** @type {string|undefined} */ (args.source);
      const outputDir = /** @type {string} */ (args.outputDir ?? args['output-dir'] ?? 'design/inferred/');
      const apply = Boolean(args.apply);

      if (!source) {
        console.error(
          'audit --reverse-engineer-stages: --source <path-or-url> is required.\n' +
          '  Local: design-os audit --reverse-engineer-stages --source ./my-app\n' +
          '  URL:   design-os audit --reverse-engineer-stages --source https://my-app.vercel.app'
        );
        process.exit(1);
      }

      const { runReverseEngineer } = await import('../audit/reverse-engineer.mjs');

      if (!apply) {
        console.log(`[DRY RUN] design-os audit --reverse-engineer-stages --source ${source} --output-dir ${outputDir}`);
        console.log('  Would create artifacts in design/inferred/ with two-layer INFERRED enforcement:');
        console.log('    1. YAML frontmatter: provenance:inferred + inferredDisclaimer + evidence:INFERRED');
        console.log('    2. Body banner: > **INFERRED** — This artifact was reverse-engineered...');
        console.log('');
        console.log('  Inference order (Stage 4 → 3 → 2 → 1):');
        console.log('    Stage 4: Interaction state catalog (from component async patterns)');
        console.log('    Stage 3: Wireframe structure (from component tree shape)');
        console.log('    Stage 2: IA/Sitemap (from routing structure)');
        console.log('    Stage 1: Personas/JTBDs (from copy, onboarding text)');
        console.log('');
        console.log('  Use --apply to write artifacts.');
        console.log('  After reviewing, use: design-os promote-inferred --file <path>');
        return;
      }

      try {
        console.log('[audit --reverse-engineer-stages] Starting inference pipeline...');
        console.log(`  Source: ${source}`);
        console.log(`  Output: ${outputDir}`);
        console.log(`  Mode: ${source.startsWith('http') ? 'URL (Playwright crawl, depth=1)' : 'Local path'}`);
        console.log('');

        const result = await runReverseEngineer({ source, outputDir, dryRun: false });

        console.log(`[audit --reverse-engineer-stages] Pipeline complete: ${result.artifactsCreated.length} artifact(s) created`);
        console.log('');
        console.log('Inference log:');
        for (const entry of result.inferenceLog) {
          console.log(`  Stage ${entry.stage}: confidence=${entry.confidence}`);
        }
        console.log('');
        console.log('Artifacts created:');
        for (const path of result.artifactsCreated) {
          console.log(`  ${path}`);
        }
        console.log('');
        console.log('IMPORTANT: Review each artifact in design/inferred/ and remove the');
        console.log("  'provenance: inferred' frontmatter AND the > **INFERRED** banner before promoting.");
        console.log('  Then use: design-os promote-inferred --file <path>');
      } catch (err) {
        console.error(`[audit --reverse-engineer-stages] Error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }

      return;
    }

    if (!slopTells && !prMode) {
      console.error('audit: specify --slop-tells, --pr, or --reverse-engineer-stages (or a combination)');
      process.exit(1);
    }

    const projectRoot = process.cwd();
    const scanDir = resolve(projectRoot, args.scanDir ?? args['scan-dir'] ?? '.');
    const designDir = resolve(projectRoot, args.designDir ?? args['design-dir'] ?? 'design/');
    const output = resolve(projectRoot, args.output ?? 'design/AUDIT-REPORT.md');
    const blockOnSeverity = args.blockOnSeverity ?? args['block-on-severity'] ?? 'BLOCKER';
    const continueAnyway = Boolean(args.continueAnyway ?? args['continue-anyway']);
    const base = args.base ?? undefined;

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
        base,
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
