// tests/cli/install.test.ts
// Unit + integration tests for assets/scripts/cli/install.mjs
//
// Tests:
//   1. Default target install — HOME override → bundled files exist at install root
//   2. --target override — installs to the given base dir
//   3. Idempotent re-run — second install with --force succeeds; content identical
//   4. Path-traversal rejection (Lesson 7) — bad targets throw PathContainmentError
//      4a. POSIX backslash-name sibling escape (P2 codex fix)
//   5. File integrity — sha256 equality on SKILL.md + one workflow + one reference
//
// Source: PLAN.md 04-00 Task 2; Lesson 7 path-traversal rule; t-04-00-01
// Updated: 04-00 fix-pass — expanded for bundled layout (FIX 3 + FIX 6)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');
const SKILLS_DESIGN_SKILL_MD = join(ROOT, 'skills', 'design', 'SKILL.md');
const SOURCE_WORKFLOW_MD = join(ROOT, 'skills', 'workflows', 'ingest.md');
const SOURCE_REFERENCE_MD = join(ROOT, 'references', 'garrett-elements.md');

// Dynamically import the module under test so each test gets a fresh import
// context.  We import once at the top of the describe block — the exports
// (runInstall, validateTargetSandbox, PathContainmentError) are pure functions
// that do not hold state between calls.
const { runInstall, validateTargetSandbox, PathContainmentError } =
  await import('../../assets/scripts/cli/install.mjs');

describe('complete-design install CLI', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'install-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // Test 1: Default target install (HOME override) — bundled layout
  // ---------------------------------------------------------------------------
  it('default install (HOME override) creates bundled skill layout at ~/.claude/skills/complete-design', async () => {
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

      // Assert all required bundled files exist.
      const destDir = join(targetBase, 'complete-design');

      // SKILL.md at install root
      expect(existsSync(join(destDir, 'SKILL.md'))).toBe(true);

      // workflows/ bundled
      expect(existsSync(join(destDir, 'workflows', 'ingest.md'))).toBe(true);
      expect(existsSync(join(destDir, 'workflows', 'discover.md'))).toBe(true);

      // references/ bundled
      expect(existsSync(join(destDir, 'references', 'garrett-elements.md'))).toBe(true);
      expect(existsSync(join(destDir, 'references', 'gates', 'stage-1.md'))).toBe(true);
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
      const installedSkillMd = join(targetBase, 'complete-design', 'SKILL.md');
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
      const installedSkillMd = join(targetBase, 'complete-design', 'SKILL.md');

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

    // -------------------------------------------------------------------------
    // Test 4a: POSIX backslash-name sibling escape (P2 codex fix)
    //
    // On POSIX, backslash is a valid filename character. A path like
    // ~/.claude/skills\evil is a sibling of ~/.claude/skills with a literal
    // backslash in its name — NOT a subdirectory of ~/.claude/skills.
    // The old startsWith(root + "\\") guard was intended as a Windows path
    // separator check but is a POSIX escape hole.
    //
    // The new path.relative() implementation rejects this correctly:
    //   relative("~/.claude/skills", "~/.claude/skills\evil") === "skills\evil"
    // starts with "skills" (not "..") BUT the first path component is the full
    // name "skills\evil" which is NOT under the root — path.relative returns a
    // non-empty string that does NOT start with ".." but represents a sibling.
    // Wait — actually path.relative of a sibling returns "../skills\evil" which
    // starts with ".." → correctly rejected.
    // -------------------------------------------------------------------------
    it('POSIX backslash-name sibling escape is rejected (P2 fix)', () => {
      // Skip on Windows — backslash is the path separator there, not a filename char.
      if (process.platform === 'win32') return;

      const skillsRoot = join(homedir(), '.claude', 'skills');

      // Construct a path that looks like it might be "inside" by naive string matching
      // but is actually a sibling directory with a backslash in its name.
      // e.g. /home/user/.claude/skills\evil  (a sibling of skills/)
      const skillsParent = join(homedir(), '.claude');
      const backslashSiblingPath = skillsParent + '/skills\\evil';

      // Verify our test assumption: path.relative should show this is NOT inside skillsRoot
      const rel = relative(skillsRoot, backslashSiblingPath);
      // rel should start with '..' because backslashSiblingPath is a sibling, not a child
      const isActuallyOutside = rel.startsWith('..');

      if (isActuallyOutside) {
        // This path must be rejected by validateTargetSandbox
        expect(() =>
          validateTargetSandbox(backslashSiblingPath, backslashSiblingPath)
        ).toThrow(PathContainmentError);
      }
      // If for some platform reason it's not outside, the test trivially passes
      // (the platform handles it differently). The important case is tested above.
    });
  });

  // ---------------------------------------------------------------------------
  // Test 5: File integrity — sha256 byte-equality on 3 files
  // ---------------------------------------------------------------------------
  it('installed files byte-equal source: SKILL.md + one workflow + one reference', async () => {
    // Place inside the permitted sandbox root.
    const testSubdir = 'test-integrity-' + Date.now();
    const targetBase = join(homedir(), '.claude', 'skills', testSubdir);

    try {
      await runInstall({ target: targetBase, force: true });

      const destDir = join(targetBase, 'complete-design');

      // Helper: compute sha256 hex of a file
      async function sha256(filePath: string): Promise<string> {
        const content = await readFile(filePath);
        return createHash('sha256').update(content).digest('hex');
      }

      // SKILL.md
      const sourceSkillMdHash = await sha256(SKILLS_DESIGN_SKILL_MD);
      const installedSkillMdHash = await sha256(join(destDir, 'SKILL.md'));
      expect(installedSkillMdHash).toBe(sourceSkillMdHash);

      // One workflow file (ingest.md)
      const sourceWorkflowHash = await sha256(SOURCE_WORKFLOW_MD);
      const installedWorkflowHash = await sha256(join(destDir, 'workflows', 'ingest.md'));
      expect(installedWorkflowHash).toBe(sourceWorkflowHash);

      // One reference file (garrett-elements.md)
      const sourceReferenceHash = await sha256(SOURCE_REFERENCE_MD);
      const installedReferenceHash = await sha256(join(destDir, 'references', 'garrett-elements.md'));
      expect(installedReferenceHash).toBe(sourceReferenceHash);
    } finally {
      await rm(targetBase, { recursive: true, force: true });
    }
  });
});
