// schemas/src/release-gate-result.ts
// Zod schema for release-gate-results.json — the output written by release-gate.mjs.
//
// Emitted to schemas/dist/release-gate-result.v1.json via `npm run schemas:emit`.
// Validated by ajv in release-gate.mjs BEFORE writeFile (Lesson 4 / T-04-02-02).
//
// Source: 04-02-PLAN.md Task 1; INVARIANTS.md Lesson 4
// Implements: ACCEPT-01, COST-07, COST-10

import { z } from 'zod';

/**
 * Per-fixture gate result summary.
 * Only the 'kind' field is stored per INVARIANTS.md Lesson 1 (no findingId/severity/message).
 */
const FixtureGateResult = z.object({
  kind: z.enum(['pass', 'pass_with_warnings', 'failed_after_repair', 'user_overridden', 'not_runnable']),
});

/**
 * Per-fixture result entry.
 */
const FixtureResult = z.object({
  fixtureId: z.string().min(1),
  pass: z.boolean(),
  tokensUsed: z.number().int().nonnegative(),
  wallClockMs: z.number().int().nonnegative(),
  gateResults: z.record(z.string(), FixtureGateResult),
});

/**
 * ReleaseGateResult v1 schema.
 * Written to release-gate-results.json after the 15-fixture acceptance suite run.
 *
 * Key invariants:
 *   - fixturePassCount >= 12 → ACCEPT-01 hard gate pass
 *   - p50Tokens <= 150000   → COST-07 hard gate pass
 *   - Both must be true for hardGatePassed === true
 *   - Lesson 5: both count (fixturePassCount) AND identity (passingFixtureIds/failingFixtureIds)
 */
export const ReleaseGateResult = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime(),
  host: z.enum(['claude-code', 'codex-cli', 'cursor']),
  dryRun: z.boolean(),

  // Per-fixture results
  fixtureResults: z.array(FixtureResult),

  // Count + identity (INVARIANTS.md Lesson 5)
  fixturePassCount: z.number().int().nonnegative(),
  passingFixtureIds: z.array(z.string()),
  failingFixtureIds: z.array(z.string()),

  // Cost metrics
  p50Tokens: z.number().int().nonnegative(),
  p95Tokens: z.number().int().nonnegative(),
  wallClockP50Ms: z.number().int().nonnegative(),

  // Gate outcomes
  hardGatePassed: z.boolean(),
  hardGateReason: z.string().nullable(),
  // Multi-reason array populated when accept05Pass or accept06Pass also failed (FIX 4)
  hardGateReasons: z.array(z.string()).optional(),
  softGateDisclosures: z.array(z.string()),

  // ACCEPT-05: fid-06-frost-recurrence adversarial harness
  accept05Pass: z.boolean(),

  // ACCEPT-06: audit --all-stages gap detection (Stage 4 spec + Stage 2/3 wireframe)
  accept06Pass: z.boolean(),
});

export type ReleaseGateResultType = z.infer<typeof ReleaseGateResult>;
