// tests/audit/all-stages.test.ts
// Tests for audit --all-stages and --new-feature modes (T-03-05-B).
//
// Implements: AUDIT-02 (all-stages unified report), AUDIT-04 (new-feature scoped validator)
// Source: PLAN.md T-03-05-B behavior block, CONTEXT.md D-68, D-69

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

// ============================================================
// Fixtures helpers
// ============================================================

/** Create a minimal design directory structure with per-stage artifacts for testing. */
async function createDesignDir(baseDir: string, opts: {
  sitemap?: object;
  interactions?: Array<{ name: string; asyncOperations?: boolean; hasLoading?: boolean; hasError?: boolean }>;
  wireframes?: string[];
  tokens?: boolean;
  withGaps?: boolean; // if true, omit some artifacts to create detectable gaps
} = {}): Promise<string> {
  const designDir = join(baseDir, 'design');
  await mkdir(join(designDir, 'ia'), { recursive: true });
  await mkdir(join(designDir, 'research', 'personas'), { recursive: true });
  await mkdir(join(designDir, 'interactions'), { recursive: true });
  await mkdir(join(designDir, 'wireframes'), { recursive: true });

  // Sitemap (Stage 2)
  const sitemap = opts.sitemap ?? {
    artifact: 'sitemap',
    stage: '2',
    schemaVersion: 1,
    routes: [{ path: '/checkout', label: 'Checkout' }],
  };
  await writeFile(join(designDir, 'ia', 'sitemap.json'), JSON.stringify(sitemap, null, 2), 'utf8');

  // Interactions (Stage 4 specs)
  for (const iSpec of (opts.interactions ?? [])) {
    const frontmatter = [
      '---',
      `artifact: interaction-spec`,
      `stage: '4'`,
      `schemaVersion: 1`,
      `screen: ${iSpec.name}`,
      `asyncOperations: ${iSpec.asyncOperations ?? false}`,
      `stateCount: ${iSpec.asyncOperations ? 4 : 2}`,
      `hasConditionalTransitions: ${iSpec.asyncOperations ?? false}`,
      '---',
    ].join('\n');

    const states = [
      '## States',
      '',
      '- idle',
      ...(iSpec.hasLoading !== false ? ['- loading'] : []),
      ...(iSpec.hasError !== false ? ['- error'] : []),
      '- success',
    ].join('\n');

    const body = `${frontmatter}\n\n${states}\n`;
    await writeFile(join(designDir, 'interactions', `${iSpec.name}.spec.md`), body, 'utf8');
  }

  // Tokens (Stage 5b)
  if (opts.tokens !== false) {
    const tokensData = {
      $schema: 'https://design-tokens.org/tr/2025.10/format/schema.json',
      color: {
        $type: 'color',
        primary: { $value: 'oklch(60% 0.2 270)' },
      },
    };
    await writeFile(join(designDir, 'tokens.json'), JSON.stringify(tokensData, null, 2), 'utf8');
  }

  return designDir;
}

// ============================================================
// Test Suite
// ============================================================

describe('audit --all-stages (T-03-05-B)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'audit-all-stages-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── Test 1: runAuditAllStages calls all 6 per-stage detectors ──────────────
  it('Test 1: runAuditAllStages calls each per-stage detector and collects all findings', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');
    expect(typeof runAuditAllStages).toBe('function');

    const designDir = await createDesignDir(tmpDir, {
      interactions: [{ name: 'checkout', asyncOperations: true }],
    });

    // Should not throw — calls each detector
    const result = await runAuditAllStages({ designDir });
    expect(result).toBeDefined();
    expect(Array.isArray(result.findings)).toBe(true);
    // Each detector returns an array; we combine all
    expect(typeof result.auditType).toBe('string');
    expect(result.auditType).toContain('all-stages');
  });

  // ── Test 2: Findings sorted by severity DESC then stage ASC (D-68) ──────────
  it('Test 2: findings sorted by SEVERITY_RANK DESC then stage ASC — BLOCKER stage-2 ranks before BLOCKER stage-4', async () => {
    const { sortFindingsByRank } = await import('../../assets/scripts/audit/all-stages.mjs');
    expect(typeof sortFindingsByRank).toBe('function');

    const findings = [
      { findingId: 'test-4-001', severity: 'BLOCKER', stage: 4, evidence: 'stage-4 blocker' },
      { findingId: 'test-2-001', severity: 'BLOCKER', stage: 2, evidence: 'stage-2 blocker' },
      { findingId: 'test-1-001', severity: 'ERROR', stage: 1, evidence: 'stage-1 error' },
    ];

    const sorted = sortFindingsByRank(findings as Parameters<typeof sortFindingsByRank>[0]);

    // D-68: severity DESC (BLOCKER > ERROR), then stage ASC
    expect(sorted[0]).toMatchObject({ severity: 'BLOCKER', stage: 2 }); // BLOCKER stage-2 first
    expect(sorted[1]).toMatchObject({ severity: 'BLOCKER', stage: 4 }); // BLOCKER stage-4 second
    expect(sorted[2]).toMatchObject({ severity: 'ERROR', stage: 1 });   // ERROR stage-1 third
  });

  // ── Test 3: Stage numeric ordering (5a < 5b) ─────────────────────────────
  it('Test 3: stage numeric ordering: 1 < 2 < 3 < 4 < 5a < 5b (5a→5.1, 5b→5.2)', async () => {
    const { sortFindingsByRank } = await import('../../assets/scripts/audit/all-stages.mjs');

    const findings = [
      { findingId: 'test-5b-001', severity: 'WARN', stage: '5b', evidence: 'stage-5b' },
      { findingId: 'test-5a-001', severity: 'WARN', stage: '5a', evidence: 'stage-5a' },
      { findingId: 'test-3-001', severity: 'WARN', stage: 3, evidence: 'stage-3' },
    ];

    const sorted = sortFindingsByRank(findings as Parameters<typeof sortFindingsByRank>[0]);

    // Same severity (WARN), so sort by stage numeric ASC: 3 < 5a < 5b
    expect(sorted[0]).toMatchObject({ stage: 3 });
    expect(sorted[1]).toMatchObject({ stage: '5a' });
    expect(sorted[2]).toMatchObject({ stage: '5b' });
  });

  // ── Test 4: AUDIT-REPORT.md output validates against schema ─────────────
  it('Test 4: output AUDIT-REPORT.md validates against audit-report.v1.json schema', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createDesignDir(tmpDir);
    const outputPath = join(tmpDir, 'AUDIT-REPORT.md');

    const result = await runAuditAllStages({ designDir, outputPath });
    expect(result.valid).toBe(true);

    // Verify the output file was created
    expect(existsSync(outputPath)).toBe(true);
  });

  // ── Test 5: --new-feature scopes to sitemap subtree ─────────────────────
  it('Test 5: runAuditAllStages with featureName scopes to sitemap subtree, does NOT generate new artifacts', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createDesignDir(tmpDir, {
      sitemap: {
        artifact: 'sitemap',
        stage: '2',
        schemaVersion: 1,
        routes: [
          { path: '/checkout', label: 'checkout' },
          { path: '/dashboard', label: 'dashboard' },
        ],
      },
      interactions: [
        { name: 'checkout', asyncOperations: true },
        { name: 'dashboard', asyncOperations: false },
      ],
    });

    // --new-feature mode: scoped to 'checkout'
    const result = await runAuditAllStages({
      designDir,
      featureName: 'checkout',
      outputPath: join(tmpDir, 'AUDIT-REPORT.md'),
    });

    expect(result).toBeDefined();
    expect(result.auditType).toContain('feature-audit');
    // Should not have created any design artifacts (only AUDIT-REPORT.md)
    const designFiles = await import('globby').then(m => m.globby('**/*', { cwd: designDir }));
    const newArtifacts = designFiles.filter((f: string) => !f.startsWith('ia/') && !f.startsWith('interactions/'));
    expect(newArtifacts.filter((f: string) => f.endsWith('.excalidraw') || f.endsWith('.mmd') || f.endsWith('.json') && f !== 'tokens.json')).toHaveLength(0);
  });

  // ── Test 6: --new-feature on unknown feature → error ────────────────────
  it('Test 6: audit --new-feature on a feature not in sitemap → throws error, not empty report', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createDesignDir(tmpDir, {
      sitemap: {
        artifact: 'sitemap',
        stage: '2',
        schemaVersion: 1,
        routes: [{ path: '/checkout', label: 'checkout' }],
      },
    });

    await expect(
      runAuditAllStages({ designDir, featureName: 'nonexistent-feature' })
    ).rejects.toThrow(/nonexistent-feature.*not found/i);
  });

  // ── Test 7: clean run produces findings:[] (not null) ────────────────────
  it('Test 7: audit --all-stages on fixture with no findings produces findings:[] (not null)', async () => {
    const { runAuditAllStages } = await import('../../assets/scripts/audit/all-stages.mjs');

    const designDir = await createDesignDir(tmpDir);
    const outputPath = join(tmpDir, 'AUDIT-REPORT-CLEAN.md');

    const result = await runAuditAllStages({ designDir, outputPath });

    // The report exists and findings is an array (possibly empty — not null)
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.findings).not.toBeNull();

    // Verify the AUDIT-REPORT.md does NOT have "findings: null" in it
    const content = readFileSync(outputPath, 'utf8');
    expect(content).not.toMatch(/findings:\s*null/);
    // It should have either "findings: []" (empty) or proper findings list
    expect(content).toMatch(/findings:/);
  });
});

describe('audit --all-stages: CLI integration', () => {
  it('audit.mjs command builder exposes --all-stages option', async () => {
    const mod = await import('../../assets/scripts/cli/audit.mjs');
    // The CLI module must export a command with a builder that registers --all-stages
    const command = mod.command;
    expect(command).toBeDefined();
    expect(typeof command.builder).toBe('function');
    // builder registers options on a Commander command; verify by creating a mock
    const options: string[] = [];
    const mockCmd = {
      option: (flag: string) => { options.push(flag); return mockCmd; },
    };
    command.builder(mockCmd as never);
    expect(options.some(o => o.includes('all-stages'))).toBe(true);
    expect(options.some(o => o.includes('new-feature'))).toBe(true);
  });
});
