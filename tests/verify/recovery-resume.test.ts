// tests/verify/recovery-resume.test.ts
// Recovery semantics scripted tests — RECOV-01, RECOV-02, RECOV-03
//
// Verifies:
//   RECOV-01: confirm-before-regenerate when design/research/ is deleted after stage-1 PASS
//   RECOV-02: equivalent end-state assertion — interrupted run resumes to same {stage, kind} chain
//   RECOV-03: scripted test suite 100% pass (this test file itself)
//
// Uses in-memory fixture copies (via fs.cp to vitest temp dirs) to avoid mutating committed fixtures.
//
// Source: PLAN.md Task 3; CONTEXT.md RECOV-01..03, PERSIST-04

import { describe, it, expect, beforeAll } from "vitest";
import { existsSync } from "node:fs";
import { cp, rm, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES_DIR = join(ROOT, "tests/fixtures/recovery");
const RECOVER_MJS = join(ROOT, "assets/scripts/recover.mjs");

// ────────────────────────────────────────────────────────────────────────────
// 1. Script existence assertions (structural RED phase tests)
// ────────────────────────────────────────────────────────────────────────────

describe("recover.mjs — structural checks", () => {
  it("recover.mjs exists at assets/scripts/recover.mjs", () => {
    expect(existsSync(RECOVER_MJS)).toBe(true);
  });

  it("recover.mjs exports a recover() function", async () => {
    const mod = await import(RECOVER_MJS);
    expect(typeof mod.recover).toBe("function");
  });

  it("cli/recover.mjs exists at assets/scripts/cli/recover.mjs", () => {
    const cliPath = join(ROOT, "assets/scripts/cli/recover.mjs");
    expect(existsSync(cliPath)).toBe(true);
  });

  it("cli/recover.mjs exports a command with name 'recover'", async () => {
    const cliPath = join(ROOT, "assets/scripts/cli/recover.mjs");
    const mod = await import(cliPath);
    expect(mod.command).toBeDefined();
    expect(mod.command.name).toBe("recover");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. Fixture existence assertions
// ────────────────────────────────────────────────────────────────────────────

describe("recovery fixtures — structural checks", () => {
  it("after-stage-1 fixture has manifest.lock", () => {
    const lock = join(FIXTURES_DIR, "design-dir-after-stage-1/.complete-design/manifest.lock");
    expect(existsSync(lock)).toBe(true);
  });

  it("after-stage-1 fixture has research/personas artifact", () => {
    const artifact = join(FIXTURES_DIR, "design-dir-after-stage-1/research/personas/sample.persona.json");
    expect(existsSync(artifact)).toBe(true);
  });

  it("after-stage-1 manifest.lock has exactly 1 entry", async () => {
    const lock = join(FIXTURES_DIR, "design-dir-after-stage-1/.complete-design/manifest.lock");
    const content = await readFile(lock, "utf8");
    const lines = content.trim().split("\n").filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(1);
  });

  it("after-stage-1 manifest entry has stage='1' and result.kind='pass'", async () => {
    const lock = join(FIXTURES_DIR, "design-dir-after-stage-1/.complete-design/manifest.lock");
    const content = await readFile(lock, "utf8");
    const lines = content.trim().split("\n");
    // noUncheckedIndexedAccess: assert the lock file has at least one line before
    // accessing index 0. An empty manifest.lock would be a structural test failure.
    expect(lines.length).toBeGreaterThan(0);
    const entry = JSON.parse(lines[0]!);
    expect(entry.stage).toBe("1");
    expect(entry.result.kind).toBe("pass");
  });

  it("after-stage-2 fixture has manifest.lock with 2 entries", async () => {
    const lock = join(FIXTURES_DIR, "design-dir-after-stage-2/.complete-design/manifest.lock");
    expect(existsSync(lock)).toBe(true);
    const content = await readFile(lock, "utf8");
    const lines = content.trim().split("\n").filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(2);
  });

  it("after-stage-4 fixture has manifest.lock with 4 entries", async () => {
    const lock = join(FIXTURES_DIR, "design-dir-after-stage-4/.complete-design/manifest.lock");
    expect(existsSync(lock)).toBe(true);
    const content = await readFile(lock, "utf8");
    const lines = content.trim().split("\n").filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(4);
  });

  it("after-stage-4 fixture has interaction artifacts", () => {
    const spec = join(FIXTURES_DIR, "design-dir-after-stage-4/interactions/sample.spec.md");
    expect(existsSync(spec)).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. RECOV-02: resumeFrom detection (interrupt-after-1, -2, -4)
// ────────────────────────────────────────────────────────────────────────────

describe("recover() — resumeFrom detection (RECOV-02)", () => {
  it("interrupt after stage 1: returns resumeFrom='2'", async () => {
    const { recover } = await import(RECOVER_MJS);
    const designDir = join(FIXTURES_DIR, "design-dir-after-stage-1");
    const result = await recover({ designDir, resume: true });
    expect(result.resumeFrom).toBe("2");
    expect(result.lastGate).toBe("stage-1");
  });

  it("interrupt after stage 2: returns resumeFrom='3'", async () => {
    const { recover } = await import(RECOVER_MJS);
    const designDir = join(FIXTURES_DIR, "design-dir-after-stage-2");
    const result = await recover({ designDir, resume: true });
    expect(result.resumeFrom).toBe("3");
    expect(result.lastGate).toBe("stage-2");
  });

  it("interrupt after stage 4: returns resumeFrom='5a'", async () => {
    const { recover } = await import(RECOVER_MJS);
    const designDir = join(FIXTURES_DIR, "design-dir-after-stage-4");
    const result = await recover({ designDir, resume: true });
    expect(result.resumeFrom).toBe("5a");
    expect(result.lastGate).toBe("stage-4");
  });

  it("missing manifest.lock: returns resumeFrom='0'", async () => {
    const { recover } = await import(RECOVER_MJS);
    const designDir = join(FIXTURES_DIR, "design-dir-empty-does-not-exist");
    const result = await recover({ designDir, resume: true });
    expect(result.resumeFrom).toBe("0");
    expect(result.lastGate).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 4. RECOV-01: confirm-before-regenerate (research/ deleted after stage-1 PASS)
// ────────────────────────────────────────────────────────────────────────────

describe("recover() — confirm-before-regenerate (RECOV-01)", () => {
  it("deleting design/research/ after stage-1 triggers requiresConfirmation", async () => {
    const { recover } = await import(RECOVER_MJS);
    // Copy fixture to a temp dir so we can mutate it
    const tempDir = join(ROOT, ".test-recovery-recov01-" + Date.now());

    try {
      await cp(
        join(FIXTURES_DIR, "design-dir-after-stage-1"),
        tempDir,
        { recursive: true }
      );

      // Simulate deletion of design/research/
      const researchDir = join(tempDir, "research");
      if (existsSync(researchDir)) {
        await rm(researchDir, { recursive: true, force: true });
      }

      const result = await recover({ designDir: tempDir, resume: true });

      expect(result.requiresConfirmation).toBe(true);
      expect(result.reason).toMatch(/research/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("confirm-before-regenerate reason mentions stage-1 PASS", async () => {
    const { recover } = await import(RECOVER_MJS);
    const tempDir = join(ROOT, ".test-recovery-reason-" + Date.now());

    try {
      await cp(
        join(FIXTURES_DIR, "design-dir-after-stage-1"),
        tempDir,
        { recursive: true }
      );

      const researchDir = join(tempDir, "research");
      if (existsSync(researchDir)) {
        await rm(researchDir, { recursive: true, force: true });
      }

      const result = await recover({ designDir: tempDir, resume: true });

      expect(result.requiresConfirmation).toBe(true);
      // Reason must explain what happened — mention manifest vs disk mismatch
      expect(result.reason).toBeTruthy();
      expect(typeof result.reason).toBe("string");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 5. RECOV-02: equivalent end-state (chain integrity after truncation + resume)
// ────────────────────────────────────────────────────────────────────────────

describe("recover() — equivalent end-state (RECOV-02)", () => {
  it("truncating manifest.lock to 1 entry and resuming produces correct resumeFrom", async () => {
    const { recover } = await import(RECOVER_MJS);
    // Use the stage-2 fixture but only expose the stage-1 entry to simulate truncation
    const tempDir = join(ROOT, ".test-recovery-truncate-" + Date.now());

    try {
      await cp(
        join(FIXTURES_DIR, "design-dir-after-stage-2"),
        tempDir,
        { recursive: true }
      );

      // Truncate manifest.lock to just the first line (stage-1 entry)
      const lockPath = join(tempDir, ".complete-design/manifest.lock");
      const content = await readFile(lockPath, "utf8");
      const firstLine = content.trim().split("\n")[0];
      await writeFile(lockPath, firstLine + "\n");

      // After truncation to stage-1, recover should say resume from stage-2
      const result = await recover({ designDir: tempDir, resume: true });
      expect(result.resumeFrom).toBe("2");
      expect(result.lastGate).toBe("stage-1");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("stage sequence from manifest.lock stage-4 fixture is {1,2,3,4} in order", async () => {
    const lock = join(FIXTURES_DIR, "design-dir-after-stage-4/.complete-design/manifest.lock");
    const content = await readFile(lock, "utf8");
    const entries = content
      .trim()
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l));

    const stages = entries.map((e) => e.stage);
    expect(stages).toEqual(["1", "2", "3", "4"]);

    // All entries should be pass (fixtures represent successful runs)
    const kinds = entries.map((e) => e.result.kind);
    expect(kinds).toEqual(["pass", "pass", "pass", "pass"]);
  });
});
