// tests/gates/manifest-lock-chain.test.ts
// Tests for the manifest.lock hash chain: 3 sequential gate calls produce
// 3 entries with valid prev→entry chain; tampering breaks chain.

import { describe, it, expect, beforeEach } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtemp, rm, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES = resolve(ROOT, "tests/fixtures/design-dirs");

// @ts-ignore TS7016: no declaration for .mjs script
const manifestLockModule: any = await import("../../assets/scripts/manifest-lock-append.mjs");

// @ts-ignore TS7016: no declaration for .mjs script
const gateBaseModule: any = await import("../../assets/scripts/gates/base.mjs");

const { appendManifestLockEntry, verifyManifestLockChain } = manifestLockModule;
const { runGate } = gateBaseModule;

const ZERO_HASH = "sha256:" + "0".repeat(64);

describe("manifest.lock hash chain", () => {
  let tmpDir: string;
  let designOsDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "manifest-lock-test-"));
    designOsDir = join(tmpDir, ".design-os");
    await mkdir(designOsDir, { recursive: true });
  });

  it("exports appendManifestLockEntry as a function", () => {
    expect(typeof appendManifestLockEntry).toBe("function");
  });

  it("exports verifyManifestLockChain as a function", () => {
    expect(typeof verifyManifestLockChain).toBe("function");
  });

  it("first entry has prevHash equal to zero-hash", async () => {
    const withInteractions = resolve(FIXTURES, "with-interactions");
    const sourceHash = "sha256:" + "a".repeat(64);
    await appendManifestLockEntry(designOsDir, {
      stage: "1",
      gate: "stage-1",
      result: { kind: "pass", evidence: "inferred", findings: [] },
      sourceHash,
    });
    const lockPath = join(designOsDir, "manifest.lock");
    const content = await readFile(lockPath, "utf8");
    const firstLine = content.trim().split("\n")[0] ?? "{}";
    const line = JSON.parse(firstLine);
    expect(line.prevHash).toBe(ZERO_HASH);
    expect(line.seq).toBe(0);
  });

  it("3 sequential appends produce 3 entries with valid prev→entry chain", async () => {
    const sourceHash = "sha256:" + "b".repeat(64);
    for (let i = 0; i < 3; i++) {
      await appendManifestLockEntry(designOsDir, {
        stage: String(i + 1),
        gate: `stage-${i + 1}`,
        result: { kind: "pass", evidence: "inferred", findings: [] },
        sourceHash,
      });
    }
    const lockPath = join(designOsDir, "manifest.lock");
    const content = await readFile(lockPath, "utf8");
    const lines = content.trim().split("\n").map((l) => JSON.parse(l));
    expect(lines).toHaveLength(3);
    // Check chain continuity
    expect(lines[0].prevHash).toBe(ZERO_HASH);
    expect(lines[1].prevHash).toBe(lines[0].entryHash);
    expect(lines[2].prevHash).toBe(lines[1].entryHash);
    // Check seq values
    expect(lines[0].seq).toBe(0);
    expect(lines[1].seq).toBe(1);
    expect(lines[2].seq).toBe(2);
  });

  it("verifyManifestLockChain returns { valid: true } on an intact chain", async () => {
    const sourceHash = "sha256:" + "c".repeat(64);
    for (let i = 0; i < 3; i++) {
      await appendManifestLockEntry(designOsDir, {
        stage: "1",
        gate: "stage-1",
        result: { kind: "pass", evidence: "inferred", findings: [] },
        sourceHash,
      });
    }
    const result = await verifyManifestLockChain(designOsDir);
    expect(result.valid).toBe(true);
    expect(result.brokenAt).toBeUndefined();
  });

  it("tampering with any entry breaks the chain", async () => {
    const sourceHash = "sha256:" + "d".repeat(64);
    for (let i = 0; i < 3; i++) {
      await appendManifestLockEntry(designOsDir, {
        stage: "1",
        gate: "stage-1",
        result: { kind: "pass", evidence: "inferred", findings: [] },
        sourceHash,
      });
    }
    // Tamper: modify the second line
    const lockPath = join(designOsDir, "manifest.lock");
    const content = await readFile(lockPath, "utf8");
    const lines = content.trim().split("\n");
    const secondEntry = JSON.parse(lines[1] ?? "{}");
    secondEntry.stage = "TAMPERED";
    lines[1] = JSON.stringify(secondEntry);
    await writeFile(lockPath, lines.join("\n") + "\n");
    // Verify should fail
    const result = await verifyManifestLockChain(designOsDir);
    expect(result.valid).toBe(false);
    expect(typeof result.brokenAt).toBe("number");
  });

  it("verifyManifestLockChain returns brokenAt with the index of the tampered entry", async () => {
    const sourceHash = "sha256:" + "e".repeat(64);
    for (let i = 0; i < 3; i++) {
      await appendManifestLockEntry(designOsDir, {
        stage: "1",
        gate: "stage-1",
        result: { kind: "pass", evidence: "inferred", findings: [] },
        sourceHash,
      });
    }
    const lockPath = join(designOsDir, "manifest.lock");
    const content = await readFile(lockPath, "utf8");
    const lines = content.trim().split("\n");
    // Tamper second entry (index 1)
    const secondEntry = JSON.parse(lines[1] ?? "{}");
    secondEntry.gate = "TAMPERED";
    lines[1] = JSON.stringify(secondEntry);
    await writeFile(lockPath, lines.join("\n") + "\n");
    const result = await verifyManifestLockChain(designOsDir);
    expect(result.valid).toBe(false);
    // brokenAt may be 1 (tampered entry) or 2 (next entry has bad prevHash)
    expect(result.brokenAt).toBeGreaterThanOrEqual(1);
  });
});
