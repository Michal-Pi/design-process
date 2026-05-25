// tests/governance/trust-posture.test.ts
// Tests that trust posture docs exist and that shipping copy contains no forbidden phrases.
// RED phase — fails until Task 3 implementation exists.
// Implements: TRUST-01..05, TRUST-04 (forbidden phrase enforcement)

import { describe, it, expect } from "vitest";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { globby } from "globby";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// Forbidden phrases per TRUST-04 and COPY-REVIEW-CHECKLIST.md
const FORBIDDEN_PHRASES = [
  "AI design",
  "AI-powered design",
  "intelligent design",
  "AI-driven design",
  "automatically design",
  "WCAG compliant",
  "WCAG-compliant",
  "WCAG conformant",
  "WCAG-conformant",
];

describe("trust posture docs exist", () => {
  it("docs/TRUST-POSTURE.md exists", () => {
    expect(existsSync(join(ROOT, "docs/TRUST-POSTURE.md"))).toBe(true);
  });

  it("docs/COPY-REVIEW-CHECKLIST.md exists", () => {
    expect(existsSync(join(ROOT, "docs/COPY-REVIEW-CHECKLIST.md"))).toBe(true);
  });

  it("TRUST-POSTURE.md references TRUST-01", () => {
    const content = readFileSync(join(ROOT, "docs/TRUST-POSTURE.md"), "utf8");
    expect(content).toContain("TRUST-01");
  });

  it("TRUST-POSTURE.md references TRUST-02", () => {
    const content = readFileSync(join(ROOT, "docs/TRUST-POSTURE.md"), "utf8");
    expect(content).toContain("TRUST-02");
  });

  it("TRUST-POSTURE.md references TRUST-03", () => {
    const content = readFileSync(join(ROOT, "docs/TRUST-POSTURE.md"), "utf8");
    expect(content).toContain("TRUST-03");
  });

  it("TRUST-POSTURE.md references TRUST-04", () => {
    const content = readFileSync(join(ROOT, "docs/TRUST-POSTURE.md"), "utf8");
    expect(content).toContain("TRUST-04");
  });

  it("TRUST-POSTURE.md references TRUST-05", () => {
    const content = readFileSync(join(ROOT, "docs/TRUST-POSTURE.md"), "utf8");
    expect(content).toContain("TRUST-05");
  });

  it("COPY-REVIEW-CHECKLIST.md lists forbidden phrases section", () => {
    const content = readFileSync(
      join(ROOT, "docs/COPY-REVIEW-CHECKLIST.md"),
      "utf8"
    );
    expect(content).toContain("AI design");
  });
});

describe("forbidden phrase scanner: SKILL.md descriptions", () => {
  it("design SKILL.md description contains no forbidden phrases", () => {
    const content = readFileSync(join(ROOT, "skills/design/SKILL.md"), "utf8");
    // Extract just the frontmatter description (not the full file)
    for (const phrase of FORBIDDEN_PHRASES) {
      // Check in the description field (first 500 chars covers frontmatter)
      const frontmatter = content.slice(0, 500);
      expect(
        frontmatter.toLowerCase().includes(phrase.toLowerCase()),
        `Found forbidden phrase "${phrase}" in design SKILL.md frontmatter`
      ).toBe(false);
    }
  });

  it("audit SKILL.md description contains no forbidden phrases", () => {
    const content = readFileSync(join(ROOT, "skills/audit/SKILL.md"), "utf8");
    const frontmatter = content.slice(0, 500);
    for (const phrase of FORBIDDEN_PHRASES) {
      expect(
        frontmatter.toLowerCase().includes(phrase.toLowerCase()),
        `Found forbidden phrase "${phrase}" in audit SKILL.md frontmatter`
      ).toBe(false);
    }
  });

  it("handoff SKILL.md description contains no forbidden phrases", () => {
    const content = readFileSync(join(ROOT, "skills/handoff/SKILL.md"), "utf8");
    const frontmatter = content.slice(0, 500);
    for (const phrase of FORBIDDEN_PHRASES) {
      expect(
        frontmatter.toLowerCase().includes(phrase.toLowerCase()),
        `Found forbidden phrase "${phrase}" in handoff SKILL.md frontmatter`
      ).toBe(false);
    }
  });
});

describe("forbidden phrase scanner: docs/ shipping copy", () => {
  it("docs/TRUST-POSTURE.md body does not use forbidden phrases in normative text", () => {
    const content = readFileSync(join(ROOT, "docs/TRUST-POSTURE.md"), "utf8");
    // The checklist itself is allowed to list forbidden phrases as examples
    // Only check the normative sections (exclude lines that are clearly listing forbidden phrases)
    const lines = content.split("\n");
    for (const line of lines) {
      // Skip lines that are clearly listing/explaining/quoting forbidden phrases.
      // These are acceptable because they describe what to avoid, not what to claim.
      if (
        line.includes("forbidden") ||
        line.includes("never use") ||
        line.includes("avoid") ||
        line.includes("Rationale") ||
        line.includes("Verification") ||
        line.includes("Correct form") ||
        line.includes("Incorrect form") ||
        line.startsWith("##") ||
        line.startsWith("|") ||
        line.startsWith("-") ||
        line.startsWith("*") ||
        line.startsWith(">")
      ) {
        continue;
      }
      // For remaining lines: only flag if phrase appears in a clearly assertive context.
      // We skip lines containing quotation marks (the phrase is quoted as an example).
      if (line.includes('"') || line.includes("`")) {
        continue;
      }
      for (const phrase of ["WCAG compliant", "WCAG conformant"]) {
        expect(
          line.toLowerCase().includes(phrase.toLowerCase()),
          `Found "${phrase}" in normative line: ${line}`
        ).toBe(false);
      }
    }
  });
});
