// tests/cli/apply.test.ts
// Tests for assets/scripts/cli/apply.mjs
// TDD RED phase: verify behavior contract from PLAN.md T-02-05-A
//
// Implements: D-52, OF-04
// codex-review Finding 3: apply succeeds even when .complete-design/private/ does not exist

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
    stagingDir = join(tmpDir, '.complete-design', 'preview', `run-${runId}`);
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

  it('codex-review Finding 3: succeeds (no ENOENT) when .complete-design/private/ does not exist', async () => {
    // Simulates a freshly-cloned repo where `complete-design init` ran but only created
    // .complete-design/ — not .complete-design/private/. The overwrite-warning path must not
    // throw ENOENT when appending to run-log.jsonl.
    const logPath = join(tmpDir, '.complete-design', 'private', 'run-log.jsonl');

    // Deliberately do NOT create .complete-design/private/ — mimic a pre-fix repo state
    // (the .complete-design/ parent is also absent to maximally stress the guard)
    await writeFile(join(stagingDir, 'tokens.json'), '{"v":1}', 'utf8');
    // Create a pre-existing target so the overwrite path is triggered
    await writeFile(join(designDir, 'tokens.json'), '{"v":0}', 'utf8');

    const { applyStaging } = await import('../../assets/scripts/cli/apply.mjs');

    // Must resolve without throwing ENOENT
    await expect(
      applyStaging({
        stagingPath: stagingDir,
        designDir,
        noOverwrite: false,
        logPath,
      })
    ).resolves.toMatchObject({ applied: expect.arrayContaining(['tokens.json']) });

    // Run-log must have been written despite the parent dir not existing beforehand
    const { existsSync } = await import('node:fs');
    expect(existsSync(logPath)).toBe(true);

    // Overwrite event must be in the log
    const { readFile: rf } = await import('node:fs/promises');
    const logContent = await rf(logPath, 'utf8');
    const entry = JSON.parse(logContent.trim().split('\n').at(-1) ?? '{}');
    expect(entry.event).toBe('apply-conflict-overwrite');
    expect(entry.file).toBe('tokens.json');
  });
});
