// tests/schemas/audit-report.test.ts
// Tests for AuditReportV1 Zod schema.

import { describe, it, expect } from "vitest";
import { AuditReportV1 } from "../../schemas/src/audit-report.js";

const validReport = {
  artifact: "audit-report",
  stage: "cross-stage",
  schemaVersion: 1,
  sourceHash:
    "sha256:6f9844b80d54ae305cc6b0ee1c0425a8c855159ce95ca3857c9db4ecc3d9b57d",
  generated: "2026-05-24T12:00:00Z",
  provenance: "generated",
  owner: "designer@example.com",
  lastReviewedAt: "2026-05-24T12:00:00Z",
  findings: [
    {
      findingId: "WCAG-01",
      severity: "WARN",
      evidence: { path: "design/tokens.json", line: 42 },
      fixRecipe:
        "Increase contrast ratio for primary button background to at least 4.5:1",
    },
    {
      findingId: "PROV-1",
      severity: "BLOCKER",
      evidence: { path: "design/research/personas/alex.json" },
      fixRecipe: "Add at least 5 interview sources to elevate provenance to VALIDATED",
    },
  ],
};

describe("AuditReportV1", () => {
  it("parses a valid audit report successfully", () => {
    expect(() => AuditReportV1.parse(validReport)).not.toThrow();
    const parsed = AuditReportV1.parse(validReport);
    expect(parsed.artifact).toBe("audit-report");
    expect(parsed.findings.length).toBe(2);
  });

  it("accepts findings with optional suppression field", () => {
    const withSuppression = {
      ...validReport,
      findings: [
        {
          ...validReport.findings[0]!,
          suppression: "Design system exception approved by PM on 2026-05-20",
        },
      ],
    };
    expect(() => AuditReportV1.parse(withSuppression)).not.toThrow();
    const parsed = AuditReportV1.parse(withSuppression);
    expect(parsed.findings[0]?.suppression).toBeTruthy();
  });

  it("rejects a finding that omits 'findingId'", () => {
    const invalid = {
      ...validReport,
      findings: [
        {
          severity: "WARN",
          evidence: { path: "design/tokens.json" },
          fixRecipe: "Fix something",
        },
      ],
    };
    const result = AuditReportV1.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("findingId"))).toBe(true);
    }
  });

  it("rejects a finding that omits 'severity'", () => {
    const invalid = {
      ...validReport,
      findings: [
        {
          findingId: "TEST-01",
          evidence: { path: "design/tokens.json" },
          fixRecipe: "Fix something",
        },
      ],
    };
    const result = AuditReportV1.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("severity"))).toBe(true);
    }
  });

  it("rejects a finding with an invalid findingId format", () => {
    const invalid = {
      ...validReport,
      findings: [
        {
          findingId: "invalid-format",
          severity: "WARN",
          evidence: { path: "design/tokens.json" },
          fixRecipe: "Fix something",
        },
      ],
    };
    const result = AuditReportV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts an empty findings array", () => {
    const data = { ...validReport, findings: [] };
    expect(() => AuditReportV1.parse(data)).not.toThrow();
  });
});
