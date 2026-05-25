// assets/scripts/gates/_parse-checklist.mjs
// Parse the canonical 4-column Markdown gate checklist format.
// Used by per-stage gates at runtime to read references/gates/stage-N.md.
//
// Checklist format (D-26):
//   | Check | Required for PASS | Required for VALIDATED grade | Citation |
//
// Source: CONTEXT.md D-26; PLAN.md Task 1 action
// Implements: D-10 (per-stage gates read checklists at runtime)

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import matter from "gray-matter";

/**
 * Expected 4-column header signature for gate checklists.
 * Must match exactly (case-insensitive comparison after trim).
 */
const EXPECTED_HEADERS = [
  "check",
  "required for pass",
  "required for validated grade",
  "citation",
];

/**
 * Parse a pipe-delimited Markdown table row into an array of cell strings.
 * Handles leading/trailing pipes and whitespace.
 *
 * @param {string} line - Markdown table row line
 * @returns {string[]} Array of trimmed cell values
 */
function parseTableRow(line) {
  // Remove leading/trailing | and split on |
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/**
 * Check if a table row is a separator row (e.g., | --- | --- | ... |).
 *
 * @param {string} line - Markdown table row line
 * @returns {boolean}
 */
function isSeparatorRow(line) {
  return /^\|?[\s\-:]+(\|[\s\-:]+)*\|?$/.test(line.trim());
}

/**
 * Parse a gate checklist Markdown file into an array of checklist items.
 * Silently returns [] if the file is absent or has no matching table.
 *
 * @param {string} filePath - Absolute path to the checklist .md file
 * @returns {Promise<Array<{check: string, requiredForPass: string, requiredForValidated: string, citation: string}>>}
 */
export async function parseChecklist(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  const raw = await readFile(filePath, "utf8");

  // Strip YAML frontmatter via gray-matter
  const { content } = matter(raw);

  const lines = content.split("\n");

  // Find the first GFM table with the canonical 4-column header
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) continue;

    const cells = parseTableRow(line);
    if (cells.length !== 4) continue;

    const normalized = cells.map((c) => c.toLowerCase());
    if (
      normalized[0] === EXPECTED_HEADERS[0] &&
      normalized[1] === EXPECTED_HEADERS[1] &&
      normalized[2] === EXPECTED_HEADERS[2] &&
      normalized[3] === EXPECTED_HEADERS[3]
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    // No matching table found — Phase 1 skeletons without checklists return []
    return [];
  }

  // Skip separator row
  const rows = [];
  let rowStart = headerIndex + 1;
  if (rowStart < lines.length && isSeparatorRow(lines[rowStart])) {
    rowStart++;
  }

  // Parse data rows
  for (let i = rowStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break; // End of table

    const cells = parseTableRow(line);
    if (cells.length < 4) continue;

    rows.push({
      check: cells[0],
      requiredForPass: cells[1],
      requiredForValidated: cells[2],
      citation: cells[3],
    });
  }

  return rows;
}
