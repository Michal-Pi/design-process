// assets/scripts/run-subagent.mjs
// Host-detect + subagent dispatch shim (D-23).
//
// Phase 1 ships:
//   - detectHost(): returns 'claude-code' | 'codex-cli' | 'cursor' | 'unknown'
//   - dispatchSubagent({ prompt, tools, context }): routes to the appropriate host path
//
// Claude Code path:
//   Best-effort against current Claude Code IPC. The exact API is undocumented
//   and subject to change — the adapter pattern (this file) keeps the shim
//   swappable. Currently: checks for CLAUDE_CODE_BIN env var and shells out
//   to `claude --task <prompt>`. If CLAUDE_CODE_BIN is not set, returns
//   { kind: 'sequential-fallback', host: 'claude-code', prompt, reason: 'no CLAUDE_CODE_BIN' }.
//
// Codex/Cursor path:
//   Minimum-viable sequential fallback: constructs a structured message and
//   returns { kind: 'sequential-fallback', host, prompt } for the caller to
//   handle inline. Phase 1 does not spawn host CLIs for Codex/Cursor
//   (full sequential execution lands in Phase 2).
//
// Sources: RESEARCH.md "Pattern 6: Subagent Dispatch Shim",
//          CONTEXT.md D-22, D-23, PLAN.md Task 1 behavior block.

import { spawn } from 'node:child_process';

/**
 * Detect the current host agent from environment variables.
 * Checks in order of precedence.
 *
 * @returns 'claude-code' | 'codex-cli' | 'cursor' | 'unknown'
 */
export function detectHost() {
  if (process.env.CLAUDE_CODE_SESSION || process.env.CLAUDE_CODE_BIN) {
    return 'claude-code';
  }
  if (process.env.CODEX_SESSION || process.env.CODEX_CLI_SESSION) {
    return 'codex-cli';
  }
  if (process.env.CURSOR_SESSION || process.env.CURSOR_AGENT_SESSION) {
    return 'cursor';
  }
  return 'unknown';
}

/**
 * Build a budget preamble string for the subagent prompt.
 * Informs the LLM of its token budget so it can stay within it.
 * D-66: per-stage ceilings are independent — stages do NOT donate unused
 * budget to later stages. The 2× soft-stop from run-subagent.mjs is preserved.
 *
 * @param {number|undefined} tokenBudget - Soft token budget in tokens
 * @param {string|undefined} stage - Stage name for context
 * @returns {string} - Budget preamble or empty string if no budget specified
 */
function buildBudgetPreamble(tokenBudget, stage) {
  if (tokenBudget === undefined || tokenBudget === null) return '';
  const budgetK = Math.round(tokenBudget / 1000);
  const stageLabel = stage ? ` (${stage})` : '';
  return (
    `[Token budget${stageLabel}: You have a soft token budget of ${budgetK}k tokens for this stage. ` +
    `Stay under it. Each stage ceiling is independent — unused budget does NOT carry over to later stages. ` +
    `A 2× soft-stop applies: if you exceed ${budgetK * 2}k tokens the workflow halts for user confirmation.]\n\n`
  );
}

/**
 * Dispatch a subagent task to the appropriate host.
 *
 * @param options.prompt        The prompt/task text (workflow path or task description)
 * @param options.tools         Allowed tools list (hint only — host decides what to allow)
 * @param options.context       Additional context (string or object)
 * @param options.tokenBudget   Optional soft token budget for this stage (D-66).
 *                              When provided, the budget is included in the prompt preamble
 *                              shown to the subagent. Existing callers that omit this field
 *                              continue to work unchanged (backward-compatible optional field).
 * @param options.stage         Optional stage name for budget preamble context (e.g. 'ingest').
 * @returns Result object whose shape depends on the host path taken
 */
export async function dispatchSubagent({ prompt, tools = [], context = '', tokenBudget = undefined, stage = undefined }) {
  const host = detectHost();

  // Prepend the budget hint to the prompt so the subagent LLM is actually informed.
  // This is the "include the budget in the prompt preamble" fix from Finding 3.
  const preamble = buildBudgetPreamble(tokenBudget, stage);
  const fullPrompt = preamble ? `${preamble}${prompt}` : prompt;

  switch (host) {
    case 'claude-code': {
      // Best-effort Claude Code IPC path.
      // The Claude Code agent spawns tasks via its internal IPC mechanism.
      // As of May 2026, there is no stable public API for headless task dispatch
      // from within a running agent session. The best available shim:
      //   1. If CLAUDE_CODE_BIN points to the claude CLI, shell out via --task flag.
      //   2. Otherwise, return a sequential-fallback marker for the caller to handle.
      const bin = process.env.CLAUDE_CODE_BIN;
      if (bin) {
        return new Promise((resolve, reject) => {
          const child = spawn(bin, ['--task', fullPrompt], {
            stdio: 'pipe',
            env: process.env,
          });
          let stdout = '';
          let stderr = '';
          child.stdout?.on('data', d => { stdout += d; });
          child.stderr?.on('data', d => { stderr += d; });
          child.on('close', code => {
            if (code === 0) {
              resolve({ kind: 'dispatched', host: 'claude-code', output: stdout.trim(), tokenBudget, stage });
            } else {
              resolve({ kind: 'dispatch-error', host: 'claude-code', stderr: stderr.trim(), code });
            }
          });
          child.on('error', err => {
            resolve({ kind: 'dispatch-error', host: 'claude-code', error: err.message });
          });
        });
      }
      // No CLAUDE_CODE_BIN set — return sequential-fallback marker
      return {
        kind: 'sequential-fallback',
        host: 'claude-code',
        prompt: fullPrompt,
        tokenBudget,
        stage,
        reason: 'no CLAUDE_CODE_BIN — interface may change; adapter pattern keeps the shim swappable',
      };
    }

    case 'codex-cli': {
      // Minimum-viable sequential fallback for Codex CLI.
      // Full sequential execution lands in Phase 2. Phase 1 returns the
      // structured marker for the caller to handle inline.
      return {
        kind: 'sequential-fallback',
        host: 'codex-cli',
        prompt: fullPrompt,
        tools,
        context,
        tokenBudget,
        stage,
      };
    }

    case 'cursor': {
      // Minimum-viable sequential fallback for Cursor.
      // Same pattern as codex-cli path.
      return {
        kind: 'sequential-fallback',
        host: 'cursor',
        prompt: fullPrompt,
        tools,
        context,
        tokenBudget,
        stage,
      };
    }

    default: {
      return { error: 'host-not-detected', detectedHost: host, prompt: fullPrompt, tokenBudget, stage };
    }
  }
}
