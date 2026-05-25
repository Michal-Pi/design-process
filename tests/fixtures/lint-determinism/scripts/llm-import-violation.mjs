// tests/fixtures/lint-determinism/scripts/llm-import-violation.mjs
// Fixture: deliberately violates the LLM-import architecture rule.
// Used by lint-determinism tests to verify that the lint detects this.
// DO NOT use this pattern in real assets/scripts/*.mjs files.

import { Anthropic } from '@anthropic-ai/sdk';

// This import is intentionally forbidden per D-13 architecture rule.
// The lint-determinism script must detect and report this file.
export const client = new Anthropic();
