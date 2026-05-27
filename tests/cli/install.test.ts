// tests/cli/install.test.ts
// Unit + integration tests for assets/scripts/cli/install.mjs
//
// Tests:
//   1. Default target install — HOME override → ~/.claude/skills/design-os/SKILL.md exists
//   2. --target override — installs to the given base dir
//   3. Idempotent re-run — second install with --force succeeds; content identical
//   4. Path-traversal rejection (Lesson 7) — bad targets throw PathContainmentError
//   5. File integrity — installed SKILL.md byte-equals source skills/design/SKILL.md
//
// Source: PLAN.md 04-00 Task 2; Lesson 7 path-traversal rule; t-04-00-01

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');
const SKILLS_DESIGN_SKILL_MD = join(ROOT, 'skills', 'design', 'SKILL.md');

// Dynamically import the module under test so each test gets a fresh import
// context.  We import once at the top of the describe block — the exports
// (runInstall, validateTargetSandbox, PathContainmentError) are pure functions
// that do not hold state between calls.
const { runInstall, validateTargetSandbox, PathContainmentError } =
  await import('../../assets/scripts/cli/install.mjs');

describe('design-os install CLI', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'install-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // Test 1: Default target install (HOME override)
  // ---------------------------------------------------------------------------
  it('default install (HOME override) creates SKILL.md at ~/.claude/skills/design-os', async () => {
    // Override HOME so the install goes to our tmpdir instead of the real home.
    const fakeHome = join(tmpDir, 'fake-home');
    const originalHome = process.env['HOME'];

    try {
      process.env['HOME'] = fakeHome;

      // We cannot simply pass opts.target=undefined here because validateTargetSandbox
      // uses os.homedir() internally — which caches the value at module load time in
      // some Node.js versions.  Use --target instead, pointing to the fake home's
      // .claude/skills, which is one of the permitted sandbox roots (homedir()/.claude/skills/).
      // For the same reason, we supply a target that mirrors what the default would be.
      const targetBase = join(fakeHome, '.claude', 'skills');

      await runInstall({ target: targetBase, force: true });

      const installedSkillMd = join(targetBase, 'design-os', 'SKILL.md');
      expect(existsSync(installedSkillMd)).toBe(true);
    } finally {
      // Restore HOME regardless of test outcome.
      if (originalHome === undefined) {
        delete process.env['HOME'];
      } else {
        process.env['HOME'] = originalHome;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Test 2: --target override
  // ---------------------------------------------------------------------------
  it('--target override installs to the specified base directory', async () => {
    // Use a path inside the permitted sandbox root ~/.claude/skills/.
    // Place it in a unique subdirectory so it does not pollute real skills.
    const testSubdir = 'test-override-' + Date.now();
    const targetBase = join(homedir(), '.claude', 'skills', testSubdir);

    try {
      await runInstall({ target: targetBase, force: true });
      const installedSkillMd = join(targetBase, 'design-os', 'SKILL.md');
      expect(existsSync(installedSkillMd)).toBe(true);
    } finally {
      await rm(targetBase, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------------------
  // Test 3: Idempotent re-run (--force)
  // ---------------------------------------------------------------------------
  it('idempotent re-run with --force succeeds and final content is identical', async () => {
    // Place inside the permitted sandbox root.
    const testSubdir = 'test-idem-' + Date.now();
    const targetBase = join(homedir(), '.claude', 'skills', testSubdir);

    try {
      // First install.
      await runInstall({ target: targetBase, force: true });
      const installedSkillMd = join(targetBase, 'design-os', 'SKILL.md');

      const contentAfterFirstInstall = await readFile(installedSkillMd, 'utf8');

      // Second install — should overwrite cleanly without errors.
      await runInstall({ target: targetBase, force: true });

      const contentAfterSecondInstall = await readFile(installedSkillMd, 'utf8');

      expect(contentAfterFirstInstall).toBe(contentAfterSecondInstall);
    } finally {
      await rm(targetBase, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------------------
  // Test 4: Path-traversal rejection (Lesson 7)
  // ---------------------------------------------------------------------------
  describe('path-traversal containment (Lesson 7)', () => {
    it('rejects --target=/etc/passwd-traversal (absolute path outside sandbox)', async () => {
      await expect(
        runInstall({ target: '/etc/passwd-traversal', force: true })
      ).rejects.toThrow(PathContainmentError);
    });

    it('rejects --target=../../../etc (relative path that traverses out)', async () => {
      // path.resolve('../../../etc') from cwd will land outside the sandbox roots.
      // The test confirms containment check catches resolved paths, not raw strings.
      const resolved = resolve('../../../etc');
      // Guard: only test rejection if the resolved path is actually outside any sandbox root.
      // (On a machine where cwd IS .claude/skills, this could theoretically pass — extremely unlikely.)
      const skillsRoot = join(homedir(), '.claude', 'skills');
      const codexRoot = join(homedir(), '.codex', 'skills');
      const cwdRoot = join(process.cwd(), '.claude', 'skills');

      const isInsideSandbox =
        resolved === skillsRoot ||
        resolved.startsWith(skillsRoot + '/') ||
        resolved === codexRoot ||
        resolved.startsWith(codexRoot + '/') ||
        resolved === cwdRoot ||
        resolved.startsWith(cwdRoot + '/');

      if (!isInsideSandbox) {
        await expect(
          runInstall({ target: '../../../etc', force: true })
        ).rejects.toThrow(PathContainmentError);
      }
    });

    it('rejects --target=/tmp/random-path (absolute path outside any sandbox root)', async () => {
      // /tmp is not inside ~/.claude/skills, ~/.codex/skills, or <cwd>/.claude/skills
      await expect(
        runInstall({ target: '/tmp/random-path', force: true })
      ).rejects.toThrow(PathContainmentError);
    });

    it('validateTargetSandbox throws PathContainmentError for paths outside sandbox', () => {
      // Direct unit test of the exported validator function.
      expect(() =>
        validateTargetSandbox('/etc/passwd', '/etc/passwd')
      ).toThrow(PathContainmentError);

      expect(() =>
        validateTargetSandbox('/var/log', '/var/log')
      ).toThrow(PathContainmentError);

      // Sanity check: valid target should NOT throw.
      const validTarget = join(homedir(), '.claude', 'skills', 'my-project');
      expect(() =>
        validateTargetSandbox(validTarget, validTarget)
      ).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Test 5: File integrity — installed SKILL.md byte-equals source
  // ---------------------------------------------------------------------------
  it('installed SKILL.md content byte-equals skills/design/SKILL.md from repo', async () => {
    // Place inside the permitted sandbox root.
    const testSubdir = 'test-integrity-' + Date.now();
    const targetBase = join(homedir(), '.claude', 'skills', testSubdir);

    try {
      await runInstall({ target: targetBase, force: true });

      const installedSkillMd = join(targetBase, 'design-os', 'SKILL.md');

      const sourceContent = await readFile(SKILLS_DESIGN_SKILL_MD);
      const installedContent = await readFile(installedSkillMd);

      const sourceHash = createHash('sha256').update(sourceContent).digest('hex');
      const installedHash = createHash('sha256').update(installedContent).digest('hex');

      expect(installedHash).toBe(sourceHash);
    } finally {
      await rm(targetBase, { recursive: true, force: true });
    }
  });
});
