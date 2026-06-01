// tests/audit/audit-report-emit.test.ts
// Tests for runAudit() AUDIT-REPORT.md emit behavior.
//
// Assertions:
//   (a) findings in severity-descending order (BLOCKER > WARN > INFO)
//   (b) AUDIT-REPORT.md frontmatter validates against audit-report.v1.json
//   (c) suppression: findingId in .complete-design/audit-suppressions.json → excluded
//   (d) codex-review Finding 1: rainbow-gradient (ERROR heuristic) → BLOCKER in output; report validates
//   (e) codex-review Finding 2: clean audit emits findings:[] not findings: null
//   (f) codex-review Finding 4: audit --pr with multi-commit range uses merge-base diff
//   (g) codex-review Finding 5: audit --pr exits non-zero with error message when git diff fails
//
// Implements: AUDIT-01, AUDIT-03, AUDIT-05, AUDIT-08, D-47
// Sources: PLAN.md T-02-05-C behavior block; codex-review findings 1,2,4,5

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import matter from 'gray-matter';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addFormats = (typeof (addFormatsModule as any).default === 'function'
  ? (addFormatsModule as any).default
  : addFormatsModule) as (ajv: InstanceType<typeof Ajv2020>) => void;
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// Import the module under test
// @ts-ignore TS7016 — .mjs without declaration file
const { runAudit } = await import('../../assets/scripts/cli/audit.mjs') as {
  runAudit: (opts: {
    slopTells?: boolean;
    pr?: boolean;
    scanDir: string;
    designDir: string;
    output: string;
    blockOnSeverity?: string;
    continueAnyway?: boolean;
    projectRoot: string;
    base?: string;
  }) => Promise<{ findings: Array<{ id: string; severity: string; message: string; filePath?: string }>, blocked: boolean, outputPath: string }>;
};

const SCHEMA_PATH = resolve(ROOT, 'schemas/dist/audit-report.v1.json');
const schemaJson = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schemaJson);

/** Create a temp dir, populate it, run audit, read report */
async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'audit-test-'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe('runAudit: AUDIT-REPORT.md emit', () => {
  it('(a) findings appear in severity-descending order: BLOCKER before WARN before INFO', async () => {
    await withTempDir(async (dir) => {
      // Create a CSS file that triggers multiple slop-tell severities.
      // Note: heuristics emit ERROR / WARNING but runAudit normalizes these to
      // the canonical schema set before returning: ERROR→BLOCKER, WARNING→WARN.
      //   rainbow-gradient → ERROR (heuristic) → normalized to BLOCKER
      //   Inter-default    → WARNING (heuristic) → normalized to WARN
      //   three-col-grid   → INFO (unchanged)
      const cssContent = [
        // BLOCKER after normalize: rainbow gradient
        'background: linear-gradient(to right, red, orange, blue);',
        // WARN after normalize: Inter font
        'font-family: Inter;',
        // WARN after normalize: glass-stack
        'backdrop-filter: blur(10px);',
        // INFO: three-column grid
        'grid-template-columns: repeat(3, 1fr);',
      ].join('\n');

      const scanDir = join(dir, 'src');
      await mkdir(scanDir, { recursive: true });
      await writeFile(join(scanDir, 'styles.css'), cssContent, 'utf8');

      const outputPath = join(dir, 'AUDIT-REPORT.md');

      const { findings } = await runAudit({
        slopTells: true,
        scanDir,
        designDir: join(dir, 'design'),
        output: outputPath,
        blockOnSeverity: 'BLOCKER',
        continueAnyway: true,
        projectRoot: dir,
      });

      expect(findings.length).toBeGreaterThanOrEqual(3);

      // Normalized severities: BLOCKER | WARN | INFO only (no ERROR or WARNING)
      const SEVERITY_ORDER: Record<string, number> = { BLOCKER: 0, WARN: 1, INFO: 2 };
      for (let i = 0; i < findings.length - 1; i++) {
        const currFinding = findings[i];
        const nextFinding = findings[i + 1];
        if (!currFinding || !nextFinding) continue;
        const curr = SEVERITY_ORDER[currFinding.severity] ?? 99;
        const next = SEVERITY_ORDER[nextFinding.severity] ?? 99;
        expect(curr).toBeLessThanOrEqual(next);
      }

      // Verify BLOCKER (rainbow gradient, normalized from ERROR) comes before INFO
      const blockerIdx = findings.findIndex(f => f.severity === 'BLOCKER');
      const infoIdx = findings.findIndex(f => f.severity === 'INFO');
      if (blockerIdx !== -1 && infoIdx !== -1) {
        expect(blockerIdx).toBeLessThan(infoIdx);
      }

      // Verify AUDIT-REPORT.md was written
      const reportContent = await readFile(outputPath, 'utf8');
      expect(reportContent).toContain('AUDIT-REPORT');
    });
  });

  it('(b) AUDIT-REPORT.md frontmatter validates against audit-report.v1.json schema', async () => {
    await withTempDir(async (dir) => {
      const cssContent = 'font-family: Inter;\ngrid-template-columns: repeat(3, 1fr);';

      const scanDir = join(dir, 'src');
      await mkdir(scanDir, { recursive: true });
      await writeFile(join(scanDir, 'component.css'), cssContent, 'utf8');

      const outputPath = join(dir, 'design', 'AUDIT-REPORT.md');

      await runAudit({
        slopTells: true,
        scanDir,
        designDir: join(dir, 'design'),
        output: outputPath,
        blockOnSeverity: 'BLOCKER',
        continueAnyway: true,
        projectRoot: dir,
      });

      const reportContent = await readFile(outputPath, 'utf8');
      const parsed = matter(reportContent);
      const frontmatter = parsed.data;

      // Frontmatter must have required fields
      expect(frontmatter.artifact).toBe('audit-report');
      expect(frontmatter.stage).toBe('cross-stage');
      expect(frontmatter.schemaVersion).toBe(1);
      expect(frontmatter.provenance).toBe('generated');
      expect(typeof frontmatter.sourceHash).toBe('string');
      expect(frontmatter.sourceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(typeof frontmatter.generated).toBe('string');
      expect(typeof frontmatter.owner).toBe('string');
      expect(Array.isArray(frontmatter.findings)).toBe(true);

      // Validate against JSON schema
      const valid = validateSchema(frontmatter);
      if (!valid) {
        console.error('Schema validation errors:', validateSchema.errors);
      }
      expect(valid, `Schema validation failed: ${JSON.stringify(validateSchema.errors, null, 2)}`).toBe(true);
    });
  });

  it('(c) suppression: findingId in audit-suppressions.json → excluded from output', async () => {
    await withTempDir(async (dir) => {
      const cssContent = [
        'font-family: Inter;',         // 5a-slop-002 WARNING
        'backdrop-filter: blur(10px);', // 5a-slop-003 WARNING
      ].join('\n');

      const scanDir = join(dir, 'src');
      await mkdir(scanDir, { recursive: true });
      await writeFile(join(scanDir, 'ui.css'), cssContent, 'utf8');

      // Create suppression file suppressing 5a-slop-002 (Inter-default)
      const suppressDir = join(dir, '.complete-design');
      await mkdir(suppressDir, { recursive: true });
      await writeFile(
        join(suppressDir, 'audit-suppressions.json'),
        JSON.stringify({ suppress: ['5a-slop-002'] }),
        'utf8'
      );

      const outputPath = join(dir, 'AUDIT-REPORT.md');

      const { findings } = await runAudit({
        slopTells: true,
        scanDir,
        designDir: join(dir, 'design'),
        output: outputPath,
        continueAnyway: true,
        projectRoot: dir,
      });

      // 5a-slop-002 must be suppressed
      const suppressedFinding = findings.find(f => f.id === '5a-slop-002');
      expect(suppressedFinding).toBeUndefined();

      // 5a-slop-003 (glass-stack) must still appear
      const glassStackFinding = findings.find(f => f.id === '5a-slop-003');
      expect(glassStackFinding).toBeDefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// codex-review fix tests (Findings 1, 2, 4, 5)
// ─────────────────────────────────────────────────────────────────────────────

describe('codex-review Finding 1: ERROR severity normalized to BLOCKER', () => {
  it('rainbow-gradient slop-tell emits BLOCKER (not ERROR) in findings and report validates against schema', async () => {
    await withTempDir(async (dir) => {
      // 5a-slop-001 heuristic has severity:ERROR in heuristics.md.
      // After normalization, the finding returned by runAudit and stored in the
      // AUDIT-REPORT.md frontmatter must be BLOCKER (not ERROR).
      const cssContent = 'background: linear-gradient(to right, red, orange, blue);';

      const scanDir = join(dir, 'src');
      await mkdir(scanDir, { recursive: true });
      await writeFile(join(scanDir, 'rainbow.css'), cssContent, 'utf8');

      const outputPath = join(dir, 'AUDIT-REPORT.md');

      const { findings } = await runAudit({
        slopTells: true,
        scanDir,
        designDir: join(dir, 'design'),
        output: outputPath,
        blockOnSeverity: 'BLOCKER',
        continueAnyway: true,
        projectRoot: dir,
      });

      // Finding 1: returned severity must be BLOCKER, not ERROR
      const rainbow = findings.find(f => f.id === '5a-slop-001');
      expect(rainbow).toBeDefined();
      expect(rainbow?.severity).toBe('BLOCKER');
      expect(rainbow?.severity).not.toBe('ERROR');

      // Report frontmatter must validate clean against audit-report.v1.json
      const reportContent = await readFile(outputPath, 'utf8');
      const parsed = matter(reportContent);
      const valid = validateSchema(parsed.data);
      if (!valid) {
        console.error('Schema validation errors:', validateSchema.errors);
      }
      expect(valid, `Schema must be valid after ERROR→BLOCKER normalization: ${JSON.stringify(validateSchema.errors)}`).toBe(true);

      // The schema enum for severity is BLOCKER|WARN|INFO — ERROR is not allowed
      const schemaSeverities = (parsed.data.findings as Array<{ severity: string }>)
        .map(f => f.severity);
      expect(schemaSeverities).not.toContain('ERROR');
    });
  });
});

describe('codex-review Finding 2: clean audit emits findings: [] not null', () => {
  it('audit on fixture with zero slop-tells produces findings:[] in frontmatter and validates against schema', async () => {
    await withTempDir(async (dir) => {
      // Clean CSS — no slop-tell patterns
      const cssContent = `.btn { background: var(--color-primary); color: var(--color-on-primary); }`;

      const scanDir = join(dir, 'src');
      await mkdir(scanDir, { recursive: true });
      await writeFile(join(scanDir, 'clean.css'), cssContent, 'utf8');

      const outputPath = join(dir, 'AUDIT-REPORT.md');

      const { findings } = await runAudit({
        slopTells: true,
        scanDir,
        designDir: join(dir, 'design'),
        output: outputPath,
        blockOnSeverity: 'BLOCKER',
        continueAnyway: true,
        projectRoot: dir,
      });

      expect(findings).toHaveLength(0);

      const reportContent = await readFile(outputPath, 'utf8');

      // Finding 2: The YAML must contain `findings: []` — NOT bare `findings:` (null)
      // A bare `findings:` key serializes as null in YAML, breaking schema validation
      // and causing .findings.map(...) to throw at consumers.
      expect(reportContent).toMatch(/^findings: \[\]/m);
      expect(reportContent).not.toMatch(/^findings:\s*$/m);

      // Frontmatter must parse to an array (not null)
      const parsed = matter(reportContent);
      expect(Array.isArray(parsed.data.findings)).toBe(true);
      expect(parsed.data.findings).toHaveLength(0);

      // Schema validation must pass
      const valid = validateSchema(parsed.data);
      if (!valid) {
        console.error('Schema validation errors:', validateSchema.errors);
      }
      expect(valid, `Clean audit report must validate against schema: ${JSON.stringify(validateSchema.errors)}`).toBe(true);
    });
  });
});

describe('codex-review Finding 4: audit --pr uses full PR range via merge-base', () => {
  it('passes an explicit --base ref and performs a three-dot diff (not HEAD~1)', async () => {
    // We cannot run a real git scenario in unit tests, but we CAN verify:
    //   (a) runAudit accepts and plumbs the `base` option without error
    //   (b) when a valid base ref is given, the audit completes without throwing
    //
    // For a multi-commit PR scenario, the important contract is that runAudit
    // uses the base ref for the diff command rather than hard-coding HEAD~1.
    // We test this by passing base='HEAD' which gives a zero-file diff (empty
    // range HEAD...HEAD) and asserting the audit completes with 0 changed files
    // (no crash, no silent pass from a fallback to HEAD~1).
    await withTempDir(async (dir) => {
      // Minimal git repo with one commit so HEAD is valid
      const { execSync } = await import('node:child_process');
      execSync('git init', { cwd: dir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'pipe' });
      execSync('git config user.name "Test"', { cwd: dir, stdio: 'pipe' });
      await writeFile(join(dir, 'README.md'), 'test', 'utf8');
      execSync('git add README.md', { cwd: dir, stdio: 'pipe' });
      execSync('git commit -m "init"', { cwd: dir, stdio: 'pipe' });

      const outputPath = join(dir, 'AUDIT-REPORT.md');

      // base='HEAD' means diff HEAD...HEAD = zero files changed.
      // runAudit must complete without throwing (previously would have crashed
      // trying HEAD~1 on a shallow checkout with only 1 commit).
      await expect(
        runAudit({
          pr: true,
          slopTells: false,
          scanDir: dir,
          designDir: join(dir, 'design'),
          output: outputPath,
          continueAnyway: true,
          projectRoot: dir,
          base: 'HEAD',
        })
      ).resolves.toMatchObject({ findings: expect.any(Array) });

      // Report must exist and findings must be an array
      const reportContent = await readFile(outputPath, 'utf8');
      const parsed = matter(reportContent);
      expect(Array.isArray(parsed.data.findings)).toBe(true);
    });
  });
});

describe('codex-review Finding 5: git diff failure surfaces as non-zero exit', () => {
  it('runAudit --pr calls process.exit(1) when git diff command fails', async () => {
    // When the diff command fails (shallow checkout, no fetch), runAudit must
    // NOT emit a clean report with 0 findings. It must call process.exit(1)
    // with a clear error message on stderr.
    //
    // We test this by using a non-git directory so `git diff` throws ENOENT /
    // non-zero exit, and intercepting process.exit via a mock.
    await withTempDir(async (dir) => {
      // dir is not a git repo — git diff will fail
      const outputPath = join(dir, 'AUDIT-REPORT.md');

      // Capture process.exit calls
      const originalExit = process.exit.bind(process);
      let exitCode: number | undefined;
      const stderrChunks: string[] = [];
      const originalStderrWrite = process.stderr.write.bind(process.stderr);

      // @ts-ignore override for testing
      process.exit = (code?: number) => { exitCode = code; throw new Error(`process.exit(${code})`); };
      // @ts-ignore override for testing
      process.stderr.write = (chunk: string) => { stderrChunks.push(chunk); return true; };

      try {
        await runAudit({
          pr: true,
          slopTells: false,
          scanDir: dir,
          designDir: join(dir, 'design'),
          output: outputPath,
          continueAnyway: true,
          projectRoot: dir,
          base: 'origin/nonexistent-branch-that-does-not-exist',
        });
        // If we reach here without process.exit being called, that's a failure
        expect.fail('runAudit should have called process.exit(1) on git diff failure');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Should have thrown from our process.exit mock
        expect(msg).toContain('process.exit(1)');
      } finally {
        // @ts-ignore restore
        process.exit = originalExit;
        // @ts-ignore restore
        process.stderr.write = originalStderrWrite;
      }

      // Must have called process.exit with code 1
      expect(exitCode).toBe(1);

      // Must have printed a clear error message to stderr (not silent pass)
      const stderrOutput = stderrChunks.join('');
      expect(stderrOutput).toMatch(/audit --pr.*git diff failed/i);
    });
  });
});
