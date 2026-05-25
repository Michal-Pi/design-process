// tests/cli/apply.test.ts
// Tests for assets/scripts/cli/apply.mjs
// TDD RED phase: verify behavior contract from PLAN.md T-02-05-A
//
// Implements: D-52, OF-04

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('apply', () => {
  let tmpDir: string;
  let stagingDir: string;
  let designDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'apply-test-'));
    const runId = 'test-run-001';
    stagingDir = join(tmpDir, '.design-os', 'preview', `run-${runId}`);
    designDir = join(tmpDir, 'design');
    await mkdir(stagingDir, { recursive: true });
    await mkdir(designDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('copies staging artifacts to design/ and returns applied list', async () => {
    // Write artifacts to staging area
    await writeFile(join(stagingDir, 'tokens.json'), '{"tokens":true}');
    await writeFile(join(stagingDir, 'DESIGN.md'), '---\nartifact: design-md\n---\nContent');

    const { applyStaging } = await import('../../assets/scripts/cli/apply.mjs');
    const result = await applyStaging({
      stagingPath: stagingDir,
      designDir,
      noOverwrite: false,
    });

    expect(result.applied).toContain('tokens.json');
    expect(result.applied).toContain('DESIGN.md');
    expect(result.warnings).toHaveLength(0);
    expect(existsSync(join(designDir, 'tokens.json'))).toBe(true);
    expect(existsSync(join(designDir, 'DESIGN.md'))).toBe(true);
  });

  it('returns warnings (not abort) when file exists and --no-overwrite is NOT set', async () => {
    // Pre-existing file in design/
    await writeFile(join(designDir, 'tokens.json'), '{"old":true}');
    // New version in staging
    await writeFile(join(stagingDir, 'tokens.json'), '{"new":true}');

    const { applyStaging } = await import('../../assets/scripts/cli/apply.mjs');
    const result = await applyStaging({
      stagingPath: stagingDir,
      designDir,
      noOverwrite: false,
    });

    // Should have a warning entry
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('tokens.json');
    // File should be overwritten
    const content = await readFile(join(designDir, 'tokens.json'), 'utf8');
    expect(content).toBe('{"new":true}');
  });

  it('throws/exits when --no-overwrite is set and conflict exists', async () => {
    await writeFile(join(designDir, 'tokens.json'), '{"old":true}');
    await writeFile(join(stagingDir, 'tokens.json'), '{"new":true}');

    const { applyStaging } = await import('../../assets/scripts/cli/apply.mjs');
    await expect(
      applyStaging({
        stagingPath: stagingDir,
        designDir,
        noOverwrite: true,
      })
    ).rejects.toThrow(/conflict/i);
  });

  it('copies nested files preserving relative path structure', async () => {
    await mkdir(join(stagingDir, 'research'), { recursive: true });
    await writeFile(join(stagingDir, 'research', 'persona.json'), '{}');

    const { applyStaging } = await import('../../assets/scripts/cli/apply.mjs');
    await applyStaging({
      stagingPath: stagingDir,
      designDir,
      noOverwrite: false,
    });

    expect(existsSync(join(designDir, 'research', 'persona.json'))).toBe(true);
  });

  it('returns empty applied and warnings for empty staging dir', async () => {
    const { applyStaging } = await import('../../assets/scripts/cli/apply.mjs');
    const result = await applyStaging({
      stagingPath: stagingDir,
      designDir,
      noOverwrite: false,
    });

    expect(result.applied).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
