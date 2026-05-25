// tests/fixtures/lint-determinism/scripts/clean-script.mjs
// Fixture: clean script with only stdlib imports — no LLM client imports.
// Used by lint-determinism tests to verify that clean scripts pass.
// This file mentions openai and anthropic only in comments — must NOT trigger lint.

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// Note: we do NOT import from openai, anthropic, langchain, or llamaindex.
// This file exercises the comment-exclusion behavior of the lint regex.

/**
 * A deterministic script that computes a hash of file content.
 * @param {string} filePath
 */
export async function hashFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  return createHash('sha256').update(content).digest('hex');
}
