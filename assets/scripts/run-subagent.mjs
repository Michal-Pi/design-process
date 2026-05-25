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
 * Dispatch a subagent task to the appropriate host.
 *
 * @param options.prompt   The prompt/task text
 * @param options.tools    Allowed tools list (hint only — host decides what to allow)
 * @param options.context  Additional context (string or object)
 * @returns Result object whose shape depends on the host path taken
 */
export async function dispatchSubagent({ prompt, tools = [], context = '' }) {
  const host = detectHost();

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
          const child = spawn(bin, ['--task', prompt], {
            stdio: 'pipe',
            env: process.env,
          });
          let stdout = '';
          let stderr = '';
          child.stdout?.on('data', d => { stdout += d; });
          child.stderr?.on('data', d => { stderr += d; });
          child.on('close', code => {
            if (code === 0) {
              resolve({ kind: 'dispatched', host: 'claude-code', output: stdout.trim() });
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
        prompt,
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
        prompt,
        tools,
        context,
      };
    }

    case 'cursor': {
      // Minimum-viable sequential fallback for Cursor.
      // Same pattern as codex-cli path.
      return {
        kind: 'sequential-fallback',
        host: 'cursor',
        prompt,
        tools,
        context,
      };
    }

    default: {
      return { error: 'host-not-detected', detectedHost: host };
    }
  }
}
