// assets/scripts/pii-scan.mjs
// PII scanner: regex set + Luhn-validated CC + allowlist with content-hash drift detection.
//
// Source: CONTEXT.md D-18, D-19, D-20; RESEARCH.md "PII Regex Set + Luhn Check (D-18)"
// Implements: D-18 (regex set + Luhn), D-19 (CLI + pre-commit), D-20 (allowlist + drift)
// Pitfall D mitigation: transcript-header regex uses line-start anchor (^) with multiline
// flag to prevent "When the interviewer asked…" noun-phrase false positives.

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// ── Regex set (per RESEARCH.md D-18 code example) ────────────────────────────

const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
const PHONE_US =
  /\b(\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const PHONE_E164 = /\+[1-9]\d{6,14}\b/g;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
// CC_CANDIDATE: 13-19 digits with optional spaces or hyphens between groups
const CC_CANDIDATE =
  /\b\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d[ -]*?\d(?:[ -]*?\d)?(?:[ -]*?\d)?(?:[ -]*?\d)?\b/g;
// Pitfall D: line-start anchor prevents "When the interviewer asked…" false positives.
const TRANSCRIPT_HEADER =
  /^(Interviewer|Participant|User|Respondent|Moderator):\s/gm;

// ── Luhn algorithm ────────────────────────────────────────────────────────────

/**
 * Validate a string of digits using the Luhn algorithm.
 * @param {string} digits - Digit-only string.
 * @returns {boolean}
 */
function luhn(digits) {
  let sum = 0,
    alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// ── Core scan ─────────────────────────────────────────────────────────────────

/**
 * Scan a text string for PII patterns.
 *
 * @param {string} text
 * @returns {Array<{ type: string, value: string, index: number }>}
 */
export function scanForPII(text) {
  const findings = [];

  for (const m of text.matchAll(EMAIL)) {
    findings.push({ type: "email", value: m[0], index: m.index });
  }
  for (const m of text.matchAll(PHONE_US)) {
    findings.push({ type: "phone-us", value: m[0], index: m.index });
  }
  for (const m of text.matchAll(PHONE_E164)) {
    findings.push({ type: "phone-e164", value: m[0], index: m.index });
  }
  for (const m of text.matchAll(SSN)) {
    findings.push({ type: "ssn", value: m[0], index: m.index });
  }
  for (const m of text.matchAll(IPV4)) {
    findings.push({ type: "ipv4", value: m[0], index: m.index });
  }
  for (const m of text.matchAll(CC_CANDIDATE)) {
    const digits = m[0].replace(/[^\d]/g, "");
    if (digits.length >= 13 && digits.length <= 19 && luhn(digits)) {
      findings.push({ type: "credit-card", value: m[0], index: m.index });
    }
  }
  for (const m of text.matchAll(TRANSCRIPT_HEADER)) {
    findings.push({
      type: "transcript-header",
      value: m[0],
      index: m.index,
    });
  }

  return findings;
}

// ── File-level scan ───────────────────────────────────────────────────────────

/**
 * Scan a file for PII. Returns findings + sha256 of file content.
 *
 * @param {string} filePath - Absolute path to the file.
 * @returns {Promise<{ findings: Array<{ type: string, value: string, index: number }>, sha256: string }>}
 */
export async function scanFile(filePath) {
  const content = await readFile(filePath, "utf8");
  const sha256 =
    "sha256:" + createHash("sha256").update(content, "utf8").digest("hex");
  const findings = scanForPII(content);
  return { findings, sha256 };
}

// ── Allowlist-aware scan ──────────────────────────────────────────────────────

/**
 * Scan a file with allowlist support.
 *
 * - If the file's path + sha256 matches an allowlist entry → return `{ findings: [], allowlisted: true }`.
 * - If the path matches but sha256 differs (content drift) → return `{ findings, allowlistDrift: true }`.
 * - If no entry for this path → return `{ findings }` (normal result).
 *
 * @param {string} filePath - Absolute path to the file being scanned.
 * @param {string} [allowlistPath] - Absolute path to the allowlist JSON file.
 * @param {string} [baseDir] - Base directory for relative path computation (default: cwd).
 * @returns {Promise<{ findings: Array<any>, allowlisted?: boolean, allowlistDrift?: boolean }>}
 */
export async function scanWithAllowlist(
  filePath,
  allowlistPath = ".design-os/pii-allowlist.json",
  baseDir = process.cwd()
) {
  const { findings, sha256 } = await scanFile(filePath);

  // Compute relative path from baseDir to use as the allowlist key
  const relPath = relative(resolve(baseDir), resolve(filePath));

  // Load allowlist
  const absAllowlistPath = resolve(baseDir, allowlistPath);
  if (!existsSync(absAllowlistPath)) {
    return { findings };
  }

  let allowlist;
  try {
    const raw = await readFile(absAllowlistPath, "utf8");
    allowlist = JSON.parse(raw);
  } catch {
    return { findings };
  }

  const entries = allowlist?.entries ?? [];
  const entry = entries.find(
    (e) => e.path === relPath || e.path === filePath
  );

  if (!entry) {
    return { findings };
  }

  if (entry.sha256 === sha256) {
    // Hash matches — file is allowlisted
    return { findings: [], allowlisted: true };
  } else {
    // Path matched but hash drifted — re-flag
    return { findings, allowlistDrift: true };
  }
}
