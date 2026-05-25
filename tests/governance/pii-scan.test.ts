// tests/governance/pii-scan.test.ts
// Tests for PII scanner: regex set, Luhn CC validation, allowlist, drift detection.
// RED phase — fails until Task 2 implementation exists.
// Implements: D-18, D-19, D-20, Pitfall D

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile, mkdtemp, rm, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const FIXTURES = join(ROOT, "tests/fixtures/governance");

// @ts-ignore TS7016: no declaration file for .mjs script
const { scanForPII, scanFile, scanWithAllowlist } = await import(
  "../../assets/scripts/pii-scan.mjs"
);

// ── Core scanForPII ────────────────────────────────────────────────────────────

describe("scanForPII: email detection", () => {
  it("flags a bare email address", () => {
    const findings = scanForPII("Contact me at maya@example.com thanks.");
    expect(findings.some((f: { type: string }) => f.type === "email")).toBe(true);
  });

  it("returns the matched value", () => {
    const findings = scanForPII("user@test.org");
    expect(findings[0].value).toBe("user@test.org");
  });
});

describe("scanForPII: phone detection", () => {
  it("flags US phone in standard format", () => {
    const findings = scanForPII("+1-555-123-4567");
    const types = findings.map((f: { type: string }) => f.type);
    expect(types.some((t: string) => t.startsWith("phone"))).toBe(true);
  });

  it("flags E.164 international phone", () => {
    const findings = scanForPII("+447911123456");
    const types = findings.map((f: { type: string }) => f.type);
    expect(types.some((t: string) => t.startsWith("phone"))).toBe(true);
  });
});

describe("scanForPII: SSN detection", () => {
  it("flags SSN pattern", () => {
    const findings = scanForPII("SSN: 123-45-6789");
    expect(findings.some((f: { type: string }) => f.type === "ssn")).toBe(true);
  });
});

describe("scanForPII: IPv4 detection", () => {
  it("flags IPv4 address", () => {
    const findings = scanForPII("Server at 192.168.1.100");
    expect(findings.some((f: { type: string }) => f.type === "ipv4")).toBe(true);
  });
});

describe("scanForPII: credit card (Luhn) detection", () => {
  it("flags Luhn-valid CC (4532 0151 1283 0366)", () => {
    const findings = scanForPII("Card: 4532 0151 1283 0366");
    expect(findings.some((f: { type: string }) => f.type === "credit-card")).toBe(true);
  });

  it("does NOT flag a 16-digit number that fails Luhn", () => {
    // 1234 5678 9012 3456 → fails Luhn
    const findings = scanForPII("Card: 1234 5678 9012 3456");
    expect(findings.some((f: { type: string }) => f.type === "credit-card")).toBe(false);
  });
});

describe("scanForPII: transcript header detection (Pitfall D mitigation)", () => {
  it("flags line-start Interviewer: header", () => {
    const findings = scanForPII("Interviewer: What is your name?");
    expect(findings.some((f: { type: string }) => f.type === "transcript-header")).toBe(true);
  });

  it("flags line-start Participant: header", () => {
    const findings = scanForPII("Participant: My name is John.");
    expect(findings.some((f: { type: string }) => f.type === "transcript-header")).toBe(true);
  });

  it("does NOT flag 'Interviewer' as mid-sentence noun (Pitfall D)", () => {
    // No line-start anchor — should NOT be flagged as transcript-header
    const findings = scanForPII("When the interviewer asked the user about preferences");
    expect(findings.some((f: { type: string }) => f.type === "transcript-header")).toBe(false);
  });

  it("does NOT flag 'User:' unless at line start", () => {
    const findings = scanForPII("The User: was happy with the results.");
    // 'The User:' — 'User:' is NOT at the start of a line
    expect(findings.some((f: { type: string }) => f.type === "transcript-header")).toBe(false);
  });
});

// ── Fixture-level tests ───────────────────────────────────────────────────────

describe("transcript fixtures", () => {
  it("transcript-with-pii.md → has findings", async () => {
    const result = await scanFile(join(FIXTURES, "transcript-with-pii.md"));
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("transcript-clean.md → no findings (Pitfall D: mid-sentence noun phrases not flagged)", async () => {
    const result = await scanFile(join(FIXTURES, "transcript-clean.md"));
    expect(result.findings.length).toBe(0);
  });

  it("transcript-with-credit-card.md → Luhn-valid CC flagged", async () => {
    const result = await scanFile(join(FIXTURES, "transcript-with-credit-card.md"));
    expect(result.findings.some((f: { type: string }) => f.type === "credit-card")).toBe(true);
  });
});

// ── Allowlist ─────────────────────────────────────────────────────────────────

describe("allowlist: suppress and drift detection", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), "design-os-pii-allowlist-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("suppresses findings when hash matches allowlist", async () => {
    // Write a file with PII
    const filePath = join(tmpDir, "transcript-test.md");
    await writeFile(filePath, "Interviewer: Email is test@example.com\n", "utf8");

    // Compute the real sha256
    const content = await readFile(filePath, "utf8");
    const sha256 = "sha256:" + createHash("sha256").update(content, "utf8").digest("hex");

    // Write allowlist pointing to the file
    const allowlistPath = join(tmpDir, "pii-allowlist.json");
    const relPath = relative(tmpDir, filePath);
    await writeFile(
      allowlistPath,
      JSON.stringify({ entries: [{ path: relPath, sha256 }] }),
      "utf8"
    );

    const result = await scanWithAllowlist(filePath, allowlistPath, tmpDir);
    expect(result.allowlisted).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it("re-flags with allowlistDrift when file content changes after allowlist entry", async () => {
    const filePath = join(tmpDir, "transcript-drift.md");
    await writeFile(filePath, "Interviewer: Email is drift@example.com\n", "utf8");

    // Allowlist with WRONG hash (old hash)
    const allowlistPath = join(tmpDir, "pii-allowlist.json");
    const relPath = relative(tmpDir, filePath);
    await writeFile(
      allowlistPath,
      JSON.stringify({
        entries: [{ path: relPath, sha256: "sha256:" + "a".repeat(64) }],
      }),
      "utf8"
    );

    const result = await scanWithAllowlist(filePath, allowlistPath, tmpDir);
    expect(result.allowlistDrift).toBe(true);
    expect(result.findings.length).toBeGreaterThan(0);
  });
});
