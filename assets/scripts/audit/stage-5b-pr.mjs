// assets/scripts/audit/stage-5b-pr.mjs
// Stage 5b PR diff detector (D-45).
//
// Checks tokens.json changes for evidence field violations and $schema mismatches.
// Enforces D-51: tokens.json must carry evidence:INFERRED in v2.0a.
//
// Exported API:
//   detectStage5bPrIssues(changedFilePath, content) → Finding[]
//
// Sources: CONTEXT.md D-45, D-51, PLAN.md T-02-05-A behavior block
// Implements: D-45, D-51, AUDIT-01

/**
 * @typedef {{ id: string, severity: string, message: string }} Finding
 */

// evidence field changed from INFERRED to validated or proto
const EVIDENCE_CHANGED_PATTERN = /"evidence"\s*:\s*"(validated|proto)"/;

// $schema present but not pointing to design-tokens.org
const SCHEMA_WRONG_PATTERN = /"\$schema"\s*:/;
const SCHEMA_VALID_URL = /designtokens\.org/;

/**
 * Detect Stage 5b PR violations in a changed file (typically tokens.json).
 *
 * @param {string} changedFilePath - Path of the changed file
 * @param {string} content - File content (diff or full content)
 * @returns {Finding[]} Array of findings (empty if clean)
 */
export function detectStage5bPrIssues(changedFilePath, content) {
  /** @type {Finding[]} */
  const findings = [];

  if (EVIDENCE_CHANGED_PATTERN.test(content)) {
    findings.push({
      id: '5b-evidence-001',
      severity: 'BLOCKER',
      message: `tokens.json evidence field changed from INFERRED in ${changedFilePath} — violates D-51. Stage 5b tokens must carry evidence:INFERRED in v2.0a.`,
    });
  }

  // Check for $schema present but not the DTCG URL
  if (SCHEMA_WRONG_PATTERN.test(content) && !SCHEMA_VALID_URL.test(content)) {
    findings.push({
      id: '5b-schema-001',
      severity: 'WARNING',
      message: `tokens.json $schema in ${changedFilePath} does not reference designtokens.org — expected DTCG v2025.10 schema URL`,
    });
  }

  return findings;
}
