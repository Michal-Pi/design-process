#!/usr/bin/env node
// assets/scripts/lint-determinism.mjs
// Architecture lint: walks assets/scripts/**/*.{mjs,ts} (or a --scope dir) and
// rejects any ES import statement whose path matches LLM-client packages.
//
// Pattern per RESEARCH.md Pattern 1: "LLM Picks, Scripts Emit — enforced via lint"
// Only line-anchored import statements are checked (comments are NOT flagged).
//
// Forbidden pattern: /(anthropic|openai|langchain|llamaindex|@anthropic-ai|@openai)/
//
// Exit 0: clean. Exit 1: violations found.
//
// Source: CONTEXT.md D-13; PLAN.md Task 1 action
// Implements: PREV-04, D-13

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { globby } from "globby";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// Forbidden LLM-client package patterns (D-13).
// Defense-in-depth with ESLint no-restricted-imports rule as additional layer (T-03-03).
const FORBIDDEN = /(anthropic|openai|langchain|llamaindex|@anthropic-ai|@openai)/;

/**
 * Regex to extract ES import paths from live import statements ONLY.
 * Anchored to start-of-line (after optional whitespace) to exclude comments.
 * Matches:
 *   import ... from 'pkg'
 *   import ... from "pkg"
 *   export ... from 'pkg'
 *
 * Does NOT match:
 *   // import from 'pkg'    (line comment — excluded by ^-anchor)
 *   block comments with import keyword (excluded by ^-anchor)
 *   const x = "import from 'pkg'"  (string literal — excluded by ^-anchor)
 */
const IMPORT_REGEX =
  /^(?:import|export)\s+(?:[^'"]*\s+from\s+|)['"]([^'"]+)['"]/gm;

/**
 * Scan a single file and return the list of forbidden import paths found.
 * @param {string} filePath Absolute path to the file.
 * @returns {Promise<string[]>} List of forbidden import specifiers.
 */
async function scanFile(filePath) {
  const content = await readFile(filePath, "utf8");
  const violations = [];

  let match;
  IMPORT_REGEX.lastIndex = 0;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const importPath = match[1];
    if (FORBIDDEN.test(importPath)) {
      violations.push(importPath);
    }
  }

  return violations;
}

/**
 * Run the lint check.
 * @param {object} opts
 * @param {string} [opts.scope] - Override directory to scan (instead of assets/scripts/).
 * @returns {Promise<{ ok: boolean; violations: Array<{file: string; imports: string[]}> }>}
 */
export async function lintDeterminism({ scope } = {}) {
  const scanDir = scope ? resolve(scope) : join(ROOT, "assets/scripts");

  const files = await globby(["**/*.{mjs,ts}"], {
    cwd: scanDir,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const violations = [];

  for (const file of files.sort()) {
    const forbidden = await scanFile(file);
    if (forbidden.length > 0) {
      violations.push({ file, imports: forbidden });
    }
  }

  return { ok: violations.length === 0, violations };
}

// Run when invoked directly.
const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("lint-determinism.mjs"));

if (isMain) {
  // Parse --scope flag from argv
  const scopeIdx = process.argv.indexOf("--scope");
  const scope = scopeIdx !== -1 ? process.argv[scopeIdx + 1] : undefined;

  const { ok, violations } = await lintDeterminism({ scope });

  if (!ok) {
    console.error("lint-determinism: VIOLATIONS FOUND\n");
    for (const { file, imports } of violations) {
      for (const imp of imports) {
        console.error(`  ${file}: ${imp}`);
      }
    }
    console.error(
      `\n${violations.reduce((sum, v) => sum + v.imports.length, 0)} violation(s) found in ${violations.length} file(s).`
    );
    console.error(
      "Per D-13: LLM-client imports are forbidden inside assets/scripts/."
    );
    process.exit(1);
  } else {
    console.log("lint-determinism: CLEAN");
    process.exit(0);
  }
}
