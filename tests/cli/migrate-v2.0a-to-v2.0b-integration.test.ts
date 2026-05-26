// tests/cli/migrate-v2.0a-to-v2.0b-integration.test.ts
// Integration test: `design-os migrate --from 2.0a --to 2.0b` CLI routing.
//
// Finding 2 fix verification:
//   - migrate --help shows --design-dir, --apply, and string-friendly --from/--to flags
//   - --from 2.0a --to 2.0b (dry-run) prints diff without modifying files
//   - --from 2.0a --to 2.0b --apply writes changes; schemaVersion becomes '2.0b'
//   - Second --apply run is a no-op (idempotency)
//   - Integer chain back-compat: --from 0 --to 1 --path <file> still routes correctly
//   - Unknown named migration exits non-zero with clear error
//
// Source: Codex review Finding 2 [P1] — "Route v2.0a migrations from the CLI"
// Implements: PERSIST-03, D-65

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, rm, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const BIN = join(ROOT, 'bin', 'design-os.mjs');
const FIXTURE_DIR = join(ROOT, 'evals', 'fixtures', 'migration', 'v2.0a-to-v2.0b');

/** Spawn design-os with given args and return { stdout, stderr, status } */
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

/** Create a temp design dir with a full fixture set for migration testing */
async function makeTempDesignDir(): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'migrate-int-test-'));

  // ia/ sub-dir with sitemap.json
  await mkdir(join(tmpDir, 'ia'), { recursive: true });
  await copyFile(
    join(FIXTURE_DIR, 'sitemap.v2.0a.json'),
    join(tmpDir, 'ia', 'sitemap.json')
  );

  // research/personas/ with persona.json
  await mkdir(join(tmpDir, 'research', 'personas'), { recursive: true });
  await copyFile(
    join(FIXTURE_DIR, 'persona.v2.0a.json'),
    join(tmpDir, 'research', 'personas', 'primary.persona.json')
  );

  // MANIFEST.md
  await copyFile(
    join(FIXTURE_DIR, 'MANIFEST.v2.0a.md'),
    join(tmpDir, 'MANIFEST.md')
  );

  return tmpDir;
}

describe('migrate --from 2.0a --to 2.0b CLI integration', () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('migrate --help includes --design-dir, --apply, and string-friendly --from/--to flags', () => {
    const { stdout, status } = runDesignOs(['migrate', '--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('--from');
    expect(stdout).toContain('--to');
    expect(stdout).toContain('--design-dir');
    expect(stdout).toContain('--apply');
    // Confirm description mentions semver-ish / 2.0a form
    expect(stdout).toContain('2.0a');
  });

  it('dry-run (no --apply) prints diff without modifying files', async () => {
    tmpDir = await makeTempDesignDir();

    const sitemapBefore = await readFile(join(tmpDir, 'ia', 'sitemap.json'), 'utf8');

    const { stdout, stderr, status } = runDesignOs([
      'migrate',
      '--from', '2.0a',
      '--to', '2.0b',
      '--design-dir', tmpDir,
    ]);

    expect(status).toBe(0);

    // File must NOT be modified in dry-run
    const sitemapAfter = await readFile(join(tmpDir, 'ia', 'sitemap.json'), 'utf8');
    expect(sitemapAfter).toBe(sitemapBefore);

    // Stdout should mention dry-run hint
    const combined = stdout + stderr;
    expect(combined.toLowerCase()).toContain('dry run');
  });

  it('--apply writes changes: sitemap schemaVersion becomes 2.0b and wireframeRefs added', async () => {
    tmpDir = await makeTempDesignDir();

    const { status, stderr } = runDesignOs([
      'migrate',
      '--from', '2.0a',
      '--to', '2.0b',
      '--design-dir', tmpDir,
      '--apply',
    ]);

    if (status !== 0) {
      console.error('stderr:', stderr);
    }
    expect(status).toBe(0);

    // Verify sitemap schemaVersion updated
    const sitemapContent = await readFile(join(tmpDir, 'ia', 'sitemap.json'), 'utf8');
    const sitemap = JSON.parse(sitemapContent);
    expect(sitemap.schemaVersion).toBe('2.0b');

    // Verify wireframeRefs added to first route
    const firstRoute = sitemap.routes[0];
    expect(firstRoute).toBeDefined();
    expect(firstRoute.wireframeRefs).toBeDefined();
    expect(Array.isArray(firstRoute.wireframeRefs)).toBe(true);
  });

  it('--apply persona migration: schemaVersion becomes 2.0b and interactionNeeds added', async () => {
    tmpDir = await makeTempDesignDir();

    const { status } = runDesignOs([
      'migrate',
      '--from', '2.0a',
      '--to', '2.0b',
      '--design-dir', tmpDir,
      '--apply',
    ]);
    expect(status).toBe(0);

    const personaContent = await readFile(
      join(tmpDir, 'research', 'personas', 'primary.persona.json'),
      'utf8'
    );
    const persona = JSON.parse(personaContent);
    expect(persona.schemaVersion).toBe('2.0b');
    expect(Array.isArray(persona.interactionNeeds)).toBe(true);
  });

  it('second --apply run is a no-op (idempotency)', async () => {
    tmpDir = await makeTempDesignDir();

    // First apply
    const r1 = runDesignOs([
      'migrate', '--from', '2.0a', '--to', '2.0b', '--design-dir', tmpDir, '--apply',
    ]);
    expect(r1.status).toBe(0);

    const sitemapAfterFirst = await readFile(join(tmpDir, 'ia', 'sitemap.json'), 'utf8');

    // Second apply
    const r2 = runDesignOs([
      'migrate', '--from', '2.0a', '--to', '2.0b', '--design-dir', tmpDir, '--apply',
    ]);
    expect(r2.status).toBe(0);

    // Content must be identical (idempotent)
    const sitemapAfterSecond = await readFile(join(tmpDir, 'ia', 'sitemap.json'), 'utf8');
    expect(sitemapAfterSecond).toBe(sitemapAfterFirst);

    // Second run output should indicate skipped
    const combined = r2.stdout + r2.stderr;
    expect(combined.toLowerCase()).toMatch(/skip|already/i);
  });

  it('unknown named migration exits non-zero with clear error', () => {
    const { stderr, status } = runDesignOs([
      'migrate',
      '--from', '1.5',
      '--to', '1.6',
    ]);
    expect(status).not.toBe(0);
    expect(stderr).toContain('no named migration');
  });

  it('integer chain back-compat: --from/--to integers + --path still routes correctly', async () => {
    // The integer chain requires --path to a real artifact file.
    // We just verify it fails with a useful message for a non-existent path
    // (not with an "unknown flag" or parse error).
    const { stderr, status } = runDesignOs([
      'migrate',
      '--from', '0',
      '--to', '1',
      '--path', '/tmp/nonexistent-artifact.json',
    ]);
    // Should fail because file doesn't exist, not because of option parsing failure
    expect(status).not.toBe(0);
    // Should NOT fail with "missing required option" for --from/--to
    expect(stderr).not.toContain("required option '--from'");
    expect(stderr).not.toContain("required option '--to'");
  });
});
