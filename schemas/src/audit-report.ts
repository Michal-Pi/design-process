// schemas/src/audit-report.ts
// Zod source for AUDIT-REPORT.md with findings, severity, evidence, fix recipe, suppression.
// Source: CONTEXT.md D-01; design-os-mrd-v2.md §3.22; GATE-01..07.
// Implements: SCHEMA-05, ART-03

import { z } from "zod";
import { FrontmatterCommon } from "./frontmatter-common.js";

/**
 * A pointer to the evidence that supports or refutes a finding.
 */
const EvidencePointer = z.object({
  /** Relative path to the file that contains the evidence. */
  path: z.string().min(1),

  /** Optional line number within the file. */
  line: z.number().int().positive().optional(),
});

/**
 * A single finding in the audit report.
 */
const Finding = z.object({
  /**
   * Unique finding identifier.
   * Format: UPPERCASE-LETTERS followed by a hyphen and one or more digits.
   * Examples: WCAG-01, A11Y-003, PROV-1
   */
  findingId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]*-\d+$/),

  /**
   * Severity level.
   * - BLOCKER: must be resolved before proceeding
   * - WARN: should be resolved; can proceed with annotation
   * - INFO: informational only
   */
  severity: z.enum(["BLOCKER", "WARN", "INFO"]),

  /** Pointer to the evidence for this finding. */
  evidence: EvidencePointer,

  /**
   * Actionable fix recipe: what to do to resolve this finding.
   * Plain English; may include code snippets.
   */
  fixRecipe: z.string().min(1),

  /**
   * Optional suppression reason.
   * Present when a user has explicitly acknowledged and suppressed this finding.
   */
  suppression: z.string().optional(),
});

/**
 * AuditReport v1 schema.
 * Extends FrontmatterCommon with a list of findings.
 * $id: https://design-os.dev/schemas/audit-report.v1.json
 */
export const AuditReportV1 = FrontmatterCommon.extend({
  artifact: z.literal("audit-report"),
  stage: z.literal("cross-stage"),

  /**
   * Type of audit run (e.g., "slop-tells", "pr-review", "slop-tells+pr-review").
   */
  auditType: z.string().min(1).optional(),

  /** All findings identified in this audit run. */
  findings: z.array(Finding),
}).meta({
  $id: "https://design-os.dev/schemas/audit-report.v1.json",
  title: "Audit Report (cross-stage)",
  description:
    "AUDIT-REPORT.md with findingId, severity, evidence pointer, fix recipe, and suppression option",
});

export type AuditReportV1Type = z.infer<typeof AuditReportV1>;
