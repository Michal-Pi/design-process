// assets/scripts/audit/slop-tells.mjs
// Deterministic slop-tell pattern matcher (D-46).
//
// Loads pattern definitions from references/slop-tells/heuristics.md at runtime.
// NO LLM CALLS — pure regex matching. Must pass lint-determinism.
//
// Exported API:
//   detectSlopTells(cssOrTsxContent, filePath) → Promise<Finding[]>
//
// Finding shape:
//   { id, severity, message, fixRecipe, suppressWith }
//
// Sources: CONTEXT.md D-46, PLAN.md T-02-05-A behavior block
// Implements: D-46, AUDIT-01, AUDIT-03

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HEURISTICS_PATH = resolve(__dirname, '../../../references/slop-tells/heuristics.md');

/**
 * Finding shape returned by all audit scripts.
 * @typedef {{ id: string, severity: string, message: string, fixRecipe: string, suppressWith: string }} Finding
 */

/**
 * Parse the heuristics Markdown file.
 * Extracts the YAML fenced code block and parses patterns.
 *
 * @returns {{ id: string, label: string, regex: string, severity: string, description: string }[]}
 */
function loadHeuristics() {
  const raw = readFileSync(HEURISTICS_PATH, 'utf8');

  // Extract YAML from fenced code block: ```yaml ... ```
  const yamlMatch = raw.match(/```yaml\s*([\s\S]+?)```/);
  if (!yamlMatch || !yamlMatch[1]) {
    throw new Error(`slop-tells: could not find YAML block in ${HEURISTICS_PATH}`);
  }

  const parsed = parseYaml(yamlMatch[1]);
  if (!parsed || !Array.isArray(parsed.patterns)) {
    throw new Error(`slop-tells: heuristics.md YAML missing 'patterns' array`);
  }

  return parsed.patterns;
}

// Cache heuristics for process lifetime
let _heuristics = /** @type {ReturnType<typeof loadHeuristics>|null} */ (null);

function getHeuristics() {
  if (!_heuristics) {
    _heuristics = loadHeuristics();
  }
  return _heuristics;
}

/**
 * Detect slop-tell patterns in CSS or TSX content.
 *
 * @param {string} content - CSS or TSX file content to scan
 * @param {string} filePath - File path (used in messages for context)
 * @returns {Promise<Finding[]>} Array of findings (empty if clean)
 */
export async function detectSlopTells(content, filePath) {
  const heuristics = getHeuristics();
  /** @type {Finding[]} */
  const findings = [];

  for (const heuristic of heuristics) {
    if (!heuristic.regex) continue;

    let re;
    try {
      re = new RegExp(heuristic.regex, 'i');
    } catch {
      // If the regex is malformed, skip rather than crash
      continue;
    }

    if (re.test(content)) {
      findings.push({
        id: heuristic.id,
        severity: heuristic.severity,
        message: `${heuristic.label} detected in ${filePath}`,
        fixRecipe: heuristic.description,
        suppressWith: heuristic.id,
      });
    }
  }

  return findings;
}
