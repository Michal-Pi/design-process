// assets/scripts/cli/budget-check.mjs
// Per-stage token budget soft/hard enforcement CLI.
// Auto-discovered by bin/complete-design.mjs.
//
// Usage:
//   node bin/complete-design.mjs budget-check --stage style --check post [--run-log .complete-design/private/run-log.jsonl]
//
// Budget table (D-49):
//   discover:      p50=30k, hard=60k
//   structure:     p50=25k, hard=50k
//   style:         p50=55k, hard=110k
//   systematize:   p50=40k, hard=80k
//   design-bug:    p50=20k, hard=40k
//   brand-refresh: p50=55k, hard=110k
//   PR-audit:      p50=15k, hard=30k
//
// Post-check: reads last matching entry from run-log.jsonl.
//   tokensUsed > hard (2×p50) → exit 1 (unless --continue-anyway)
//   tokensUsed > p50 → logs WARNING and exits 0
// Pre-check: logs budget hint as informational, exits 0.
//
// Source: CONTEXT.md D-49; 02-03-PLAN.md T-02-03-A
// Implements: COST-05, D-49

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Budget table per D-49 (p50 targets; hard = 2× p50)
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Record<string, { budgetP50: number, budgetHard: number }>} */
export const STAGE_BUDGETS = {
  discover:     { budgetP50: 30_000,  budgetHard: 60_000  },
  structure:    { budgetP50: 25_000,  budgetHard: 50_000  },
  style:        { budgetP50: 55_000,  budgetHard: 110_000 },
  systematize:  { budgetP50: 40_000,  budgetHard: 80_000  },
  "design-bug": { budgetP50: 20_000,  budgetHard: 40_000  },
  "brand-refresh": { budgetP50: 55_000, budgetHard: 110_000 },
  "PR-audit":   { budgetP50: 15_000,  budgetHard: 30_000  },
};

const VALID_STAGES = Object.keys(STAGE_BUDGETS);
const VALID_CHECKS = ["pre", "post"];

// ─────────────────────────────────────────────────────────────────────────────
// Core budget check function (exported for testability)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a budget check against the run-log.
 *
 * @param {object} opts
 * @param {string} opts.stage - Stage name (discover|structure|style|...)
 * @param {'pre'|'post'} opts.check - pre or post check
 * @param {string} opts.runLogPath - Absolute path to run-log.jsonl
 * @param {boolean} [opts.continueAnyway] - If true, don't exit 1 even on hard-stop
 * @returns {Promise<{ outcome: 'ok'|'warn'|'hard-stop', message: string, tokensUsed?: number }>}
 */
export async function checkBudget({ stage, check, runLogPath, continueAnyway = false }) {
  if (!VALID_STAGES.includes(stage)) {
    return {
      outcome: "hard-stop",
      message: `Unknown stage: '${stage}'. Valid stages: ${VALID_STAGES.join(", ")}`,
    };
  }

  if (!VALID_CHECKS.includes(check)) {
    return {
      outcome: "hard-stop",
      message: `Unknown check type: '${check}'. Valid: pre, post`,
    };
  }

  const budget = STAGE_BUDGETS[stage];

  if (check === "pre") {
    // Pre-check: informational only
    return {
      outcome: "ok",
      message: [
        `budget-check [pre] stage:${stage}`,
        `  p50 target: ${(budget.budgetP50 / 1000).toFixed(0)}k tokens`,
        `  hard-stop:  ${(budget.budgetHard / 1000).toFixed(0)}k tokens (${continueAnyway ? "--continue-anyway will bypass" : "exits 1"})`,
      ].join("\n"),
    };
  }

  // Post-check: read last matching entry from run-log.jsonl
  if (!existsSync(runLogPath)) {
    return {
      outcome: "ok",
      message: `budget-check [post] stage:${stage} — run-log not found at ${runLogPath} (no usage recorded)`,
    };
  }

  let tokensUsed = 0;

  try {
    const raw = await readFile(runLogPath, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);

    // Find the LAST line matching the given stage
    let lastEntry = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.stage === stage) {
          lastEntry = entry;
          break;
        }
      } catch {
        // Skip malformed lines
      }
    }

    if (!lastEntry) {
      return {
        outcome: "ok",
        message: `budget-check [post] stage:${stage} — no log entry found for this stage`,
      };
    }

    // Support both tokensUsed and token_count field names for flexibility
    tokensUsed = lastEntry.tokensUsed ?? lastEntry.token_count ?? lastEntry.tokens ?? 0;
  } catch (err) {
    return {
      outcome: "ok",
      message: `budget-check [post] stage:${stage} — could not read run-log: ${err.message}`,
    };
  }

  if (tokensUsed > budget.budgetHard) {
    const msg = [
      `budget-check [post] HARD-STOP stage:${stage}`,
      `  tokens used: ${tokensUsed.toLocaleString()} (limit: ${budget.budgetHard.toLocaleString()})`,
      `  Exceeded ${(tokensUsed / budget.budgetP50).toFixed(1)}× p50 target (${budget.budgetP50.toLocaleString()})`,
      continueAnyway
        ? "  --continue-anyway flag set: proceeding despite hard-stop"
        : "  Re-run with --continue-anyway to proceed (logs event for monitoring)",
    ].join("\n");

    return {
      outcome: continueAnyway ? "warn" : "hard-stop",
      message: msg,
      tokensUsed,
    };
  }

  if (tokensUsed > budget.budgetP50) {
    return {
      outcome: "warn",
      message: [
        `budget-check [post] WARNING stage:${stage}`,
        `  tokens used: ${tokensUsed.toLocaleString()} (p50 target: ${budget.budgetP50.toLocaleString()})`,
        `  Exceeded p50 target by ${(((tokensUsed - budget.budgetP50) / budget.budgetP50) * 100).toFixed(0)}%`,
        "  Hard-stop threshold not reached — continuing.",
      ].join("\n"),
      tokensUsed,
    };
  }

  return {
    outcome: "ok",
    message: [
      `budget-check [post] OK stage:${stage}`,
      `  tokens used: ${tokensUsed.toLocaleString()} / p50=${budget.budgetP50.toLocaleString()} hard=${budget.budgetHard.toLocaleString()}`,
    ].join("\n"),
    tokensUsed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI command (auto-discovered by bin/complete-design.mjs)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auto-discovered command object per the Plan 01 dispatcher contract.
 * bin/complete-design.mjs globs cli/*.mjs and registers each module's `command` export.
 */
export const command = {
  name: "budget-check",
  describe: "Per-stage token budget soft/hard enforcement (D-49)",

  /** @param {import("commander").Command} cmd */
  builder: (cmd) => {
    cmd
      .option(
        "--stage <stage>",
        `Stage name: ${VALID_STAGES.join("|")}`
      )
      .option(
        "--check <type>",
        "Check type: pre (informational) | post (enforce)",
        "post"
      )
      .option(
        "--run-log <path>",
        "Path to run-log.jsonl",
        ".complete-design/private/run-log.jsonl"
      )
      .option(
        "--continue-anyway",
        "Proceed even when hard-stop threshold is exceeded (logs event)",
        false
      );
  },

  /** @param {Record<string, unknown>} args */
  handler: async (args) => {
    const stage = String(args.stage ?? "");
    const check = String(args.check ?? "post");
    const runLogPath = resolve(String(args.runLog ?? ".complete-design/private/run-log.jsonl"));
    const continueAnyway = Boolean(args.continueAnyway);

    if (!stage) {
      console.error(`Error: --stage is required. Valid stages: ${VALID_STAGES.join(", ")}`);
      process.exit(1);
    }

    const result = await checkBudget({ stage, check, runLogPath, continueAnyway });

    if (result.outcome === "hard-stop") {
      console.error(result.message);
      process.exit(1);
    } else if (result.outcome === "warn") {
      console.warn(result.message);
    } else {
      console.log(result.message);
    }
  },
};
