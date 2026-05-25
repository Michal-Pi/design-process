// tests/audit/audit-report-emit.test.ts
// Tests for runAudit() AUDIT-REPORT.md emit behavior.
//
// Assertions:
//   (a) findings in severity-descending order (BLOCKER > ERROR > WARNING > INFO)
//   (b) AUDIT-REPORT.md frontmatter validates against audit-report.v1.json
//   (c) suppression: findingId in .design-os/audit-suppressions.json → excluded
//
// Implements: AUDIT-01, AUDIT-03, AUDIT-05, AUDIT-08, D-47
// Sources: PLAN.md T-02-05-C behavior block

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
  it('(a) findings appear in severity-descending order: BLOCKER before WARNING before INFO', async () => {
    await withTempDir(async (dir) => {
      // Create a CSS file that triggers multiple slop-tell severities:
      //   rainbow-gradient → ERROR  (5a-slop-001)
      //   Inter-default    → WARNING (5a-slop-002)
      //   three-col-grid   → INFO   (5a-slop-004)
      const cssContent = [
        // ERROR: rainbow gradient
        'background: linear-gradient(to right, red, orange, blue);',
        // WARNING: Inter font
        'font-family: Inter;',
        // WARNING: glass-stack
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

      // Verify severity ordering
      const SEVERITY_ORDER: Record<string, number> = { BLOCKER: 0, ERROR: 1, WARNING: 2, INFO: 3 };
      for (let i = 0; i < findings.length - 1; i++) {
        const currFinding = findings[i];
        const nextFinding = findings[i + 1];
        if (!currFinding || !nextFinding) continue;
        const curr = SEVERITY_ORDER[currFinding.severity] ?? 99;
        const next = SEVERITY_ORDER[nextFinding.severity] ?? 99;
        expect(curr).toBeLessThanOrEqual(next);
      }

      // Verify ERROR (rainbow gradient) comes before INFO (three-col-grid)
      const errorIdx = findings.findIndex(f => f.severity === 'ERROR');
      const infoIdx = findings.findIndex(f => f.severity === 'INFO');
      if (errorIdx !== -1 && infoIdx !== -1) {
        expect(errorIdx).toBeLessThan(infoIdx);
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
      const suppressDir = join(dir, '.design-os');
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
