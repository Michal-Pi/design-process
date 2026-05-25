// assets/scripts/audit/stage-5a-pr.mjs
// Stage 5a PR diff detector (D-45).
//
// Checks changed files for raw hex values and hardcoded Tailwind color classes —
// both of which bypass the DTCG token layer.
//
// Exported API:
//   detectStage5aPrIssues(changedFilePath, content) → Finding[]
//
// Sources: CONTEXT.md D-45, PLAN.md T-02-05-A behavior block
// Implements: D-45, AUDIT-01

/**
 * @typedef {{ id: string, severity: string, message: string }} Finding
 */

// Raw hex value pattern: #xxx or #xxxxxx (3 or 6 hex digits)
const HEX_PATTERN = /#[0-9a-fA-F]{3,6}\b/;

// Hardcoded Tailwind color utility class pattern
// Covers bg-*, text-*, border-* with named Tailwind colors + numeric scale
const TAILWIND_COLOR_PATTERN = /\b(bg|text|border)-(red|blue|green|yellow|purple|pink|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d{2,3}\b/;

/**
 * Detect Stage 5a PR violations in a changed file.
 *
 * @param {string} changedFilePath - Path of the changed file (for message context)
 * @param {string} content - File content (diff or full content)
 * @returns {Finding[]} Array of findings (empty if clean)
 */
export function detectStage5aPrIssues(changedFilePath, content) {
  /** @type {Finding[]} */
  const findings = [];

  if (HEX_PATTERN.test(content)) {
    findings.push({
      id: '5a-token-001',
      severity: 'WARNING',
      message: `Raw hex value in ${changedFilePath} — use DTCG token variable instead`,
    });
  }

  if (TAILWIND_COLOR_PATTERN.test(content)) {
    findings.push({
      id: '5a-token-002',
      severity: 'WARNING',
      message: `Hardcoded Tailwind color class in ${changedFilePath} — use semantic token class (bg-primary, text-foreground, etc.)`,
    });
  }

  return findings;
}
