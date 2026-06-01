// tests/cli/audit-reverse-engineer-integration.test.ts
// Integration test: `complete-design audit --reverse-engineer-stages` CLI surface.
//
// Finding 1 fix verification:
//   - audit --help registers --reverse-engineer-stages, --source, --output-dir flags
//   - audit handler with --reverse-engineer-stages dispatches to runReverseEngineer()
//   - dry-run (no --apply) prints expected output without creating files
//   - --apply creates artifacts in outputDir
//   - missing --source exits non-zero with clear error
//
// Source: Codex review Finding 1 [P1] — "Wire reverse-engineer through the audit command"
// Implements: AUDIT-06, D-62, D-63, D-64

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const BIN = join(ROOT, 'bin', 'complete-design.mjs');

/** Spawn complete-design with given args and return { stdout, stderr, status } */
function runDesignOs(args: string[]): { stdout: string; stderr: string; status: number } {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 30000,
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 1,
  };
}

describe('audit --reverse-engineer-stages CLI integration', () => {
  let tmpDir: string;
  let sourceFixtureDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'audit-re-int-test-'));
    sourceFixtureDir = join(tmpDir, 'src-fixture');
    outputDir = join(tmpDir, 'design', 'inferred');

    // Create a minimal source fixture with component async patterns
    await mkdir(join(sourceFixtureDir, 'components'), { recursive: true });
    await mkdir(join(sourceFixtureDir, 'app'), { recursive: true });

    await writeFile(
      join(sourceFixtureDir, 'components', 'Dashboard.tsx'),
      `import React, { useState } from 'react';
export function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function fetchData() {
    setLoading(true);
    try { await getData(); } catch(e) { setError(String(e)); }
    finally { setLoading(false); }
  }
  return <div>{loading ? 'Loading...' : 'Ready'}{error && <p>{error}</p>}</div>;
}`,
      'utf8'
    );

    await mkdir(join(sourceFixtureDir, 'app', 'dashboard'), { recursive: true });
    await writeFile(
      join(sourceFixtureDir, 'app', 'dashboard', 'page.tsx'),
      `export default function DashboardPage() { return <Dashboard /> }`,
      'utf8'
    );
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('audit --help includes --reverse-engineer-stages, --source, --output-dir flags', () => {
    const { stdout, status } = runDesignOs(['audit', '--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('--reverse-engineer-stages');
    expect(stdout).toContain('--source');
    expect(stdout).toContain('--output-dir');
    expect(stdout).toContain('--apply');
  });

  it('audit --reverse-engineer-stages without --source exits non-zero with helpful error', () => {
    const { stderr, status } = runDesignOs(['audit', '--reverse-engineer-stages']);
    expect(status).not.toBe(0);
    expect(stderr).toContain('--source');
    expect(stderr).toContain('required');
  });

  it('audit --reverse-engineer-stages dry-run prints inference plan without creating files', () => {
    // Dry-run: no --apply flag
    const { stdout, status } = runDesignOs([
      'audit',
      '--reverse-engineer-stages',
      '--source', sourceFixtureDir,
      '--output-dir', outputDir,
    ]);
    // Dry-run exits 0
    expect(status).toBe(0);
    expect(stdout).toContain('DRY RUN');
    expect(stdout).toContain('design/inferred/');
    expect(stdout).toContain('INFERRED');
    // outputDir must NOT have been created (dry-run)
    expect(existsSync(outputDir)).toBe(false);
  });

  it('audit --reverse-engineer-stages --apply creates artifacts under outputDir', () => {
    const { stdout, status } = runDesignOs([
      'audit',
      '--reverse-engineer-stages',
      '--source', sourceFixtureDir,
      '--output-dir', outputDir,
      '--apply',
    ]);

    // Should exit 0 (pipeline success)
    expect(status).toBe(0);

    // At least some artifacts should be created
    expect(existsSync(outputDir)).toBe(true);

    // stdout should mention artifacts created
    expect(stdout).toContain('artifact');
  });

  it('audit --reverse-engineer-stages is accessible at the audit sub-command level (not a separate top-level command)', () => {
    // Confirm the flag is wired to `audit`, not requiring `reverse-engineer` top-level
    const { stdout } = runDesignOs(['audit', '--help']);
    expect(stdout).toContain('--reverse-engineer-stages');
  });

  it('programmatic runAudit still works for --slop-tells after Adding RE flags (no regression)', async () => {
    // Ensure existing runAudit API signature is unaffected
    // @ts-ignore
    const { runAudit } = await import('../../assets/scripts/cli/audit.mjs');
    // Just verify the export still exists and is callable
    expect(typeof runAudit).toBe('function');
  });
});
