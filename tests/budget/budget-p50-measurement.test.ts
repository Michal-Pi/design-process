// tests/budget/budget-p50-measurement.test.ts
// Budget measurement harness — validates token estimates for 15 PRD fixtures.
//
// Measures estimated token consumption for each fixture's PRD.md using a
// character-based approximation (4 chars ≈ 1 token; conservative estimate).
//
// Assertions (R23 from PROJECT.md):
//   - Each fixture PRD.md exists and has ≥50 chars (non-trivial content)
//   - All 15 fixtures loaded without error
//   - Estimated token count per fixture is within a reasonable range (< 5000 tokens)
//     — PRDs should be concise, not full novels
//   - p50 of PRD sizes ≤ 2000 tokens (ensures fixtures are appropriately scoped)
//
// The FULL workflow budget ceiling (≤150k tokens p50) is enforced at integration
// test time when the actual agent loop runs (Phase 4 GA gate). This test validates
// that our fixture corpus is realistic and that PRDs themselves are reasonably sized.
//
// Sources: PROJECT.md R23, CONTEXT.md D-35, PLAN.md T-02-05-C
// Implements: budget fixture corpus validation

import { describe, it, expect } from 'vitest';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const FIXTURES_DIR = join(ROOT, 'evals/fixtures/budget');

/** Rough token estimate: 4 chars ≈ 1 token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Compute p50 (median) of a numeric array */
function p50(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

const FIXTURE_IDS = Array.from({ length: 15 }, (_, i) =>
  String(i + 1).padStart(2, '0')
);

describe('Budget fixture corpus (R23): 15 PRD fixtures', () => {
  it('all 15 fixture PRD.md files exist', () => {
    for (const id of FIXTURE_IDS) {
      const prdPath = join(FIXTURES_DIR, `fixture-${id}`, 'design', 'PRD.md');
      expect(
        existsSync(prdPath),
        `Missing fixture-${id}/design/PRD.md at ${prdPath}`
      ).toBe(true);
    }
  });

  it('all PRD.md files have valid frontmatter (artifact: prd, stage: 0)', async () => {
    for (const id of FIXTURE_IDS) {
      const prdPath = join(FIXTURES_DIR, `fixture-${id}`, 'design', 'PRD.md');
      const content = await readFile(prdPath, 'utf8');
      const parsed = matter(content);

      expect(
        parsed.data.artifact,
        `fixture-${id}: artifact must be 'prd'`
      ).toBe('prd');
      expect(
        parsed.data.stage,
        `fixture-${id}: stage must be 0`
      ).toBe(0);
      expect(
        parsed.data.schemaVersion,
        `fixture-${id}: schemaVersion required`
      ).toBe(1);
    }
  });

  it('all PRD.md files have ≥50 chars of body content (non-trivial)', async () => {
    for (const id of FIXTURE_IDS) {
      const prdPath = join(FIXTURES_DIR, `fixture-${id}`, 'design', 'PRD.md');
      const content = await readFile(prdPath, 'utf8');
      const parsed = matter(content);

      expect(
        parsed.content.trim().length,
        `fixture-${id}: PRD body must be ≥50 chars`
      ).toBeGreaterThanOrEqual(50);
    }
  });

  it('each PRD.md token estimate is < 5000 tokens (PRDs are concise)', async () => {
    for (const id of FIXTURE_IDS) {
      const prdPath = join(FIXTURES_DIR, `fixture-${id}`, 'design', 'PRD.md');
      const content = await readFile(prdPath, 'utf8');
      const tokens = estimateTokens(content);

      expect(
        tokens,
        `fixture-${id}: PRD is too large (${tokens} tokens estimated). ` +
        `PRDs should be concise input specs, not full feature documentation.`
      ).toBeLessThan(5000);
    }
  });

  it('p50 PRD token estimate ≤ 2000 tokens (corpus is appropriately scoped)', async () => {
    const tokenCounts: number[] = [];

    for (const id of FIXTURE_IDS) {
      const prdPath = join(FIXTURES_DIR, `fixture-${id}`, 'design', 'PRD.md');
      const content = await readFile(prdPath, 'utf8');
      tokenCounts.push(estimateTokens(content));
    }

    const median = p50(tokenCounts);

    // Document the measurement
    console.info(
      `Budget fixture p50: ${median} tokens (from ${tokenCounts.length} fixtures). ` +
      `Range: ${Math.min(...tokenCounts)}–${Math.max(...tokenCounts)} tokens. ` +
      `Full workflow budget ceiling (≤150k p50) validated at GA integration gate (Phase 4).`
    );

    expect(median).toBeLessThanOrEqual(2000);
  });

  it('fixture token counts are documented (informational output)', async () => {
    const rows: Array<{ id: string; tokens: number; chars: number }> = [];

    for (const id of FIXTURE_IDS) {
      const prdPath = join(FIXTURES_DIR, `fixture-${id}`, 'design', 'PRD.md');
      const content = await readFile(prdPath, 'utf8');
      rows.push({ id, tokens: estimateTokens(content), chars: content.length });
    }

    // Log the table for CI visibility
    console.table(rows);

    // Structural assertion: all 15 rows present
    expect(rows).toHaveLength(15);

    // All token counts are positive
    for (const row of rows) {
      expect(row.tokens).toBeGreaterThan(0);
    }
  });
});
