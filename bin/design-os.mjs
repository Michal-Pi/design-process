#!/usr/bin/env node
// bin/design-os.mjs
// Thin auto-discovery dispatcher for the design-os CLI.
//
// At startup, globs assets/scripts/cli/*.mjs and registers each module's
// exported `command = { name, describe, builder?, handler }` with commander.
//
// Plans 02/03/04/05 contribute new CLI subcommands by adding files under
// assets/scripts/cli/ — NO plan after 01 needs to modify THIS file.
// This eliminates Wave-3 contention (Blocker 2 in the plan checker notes).
//
// Command names containing spaces (e.g., "eval bundle-sufficiency") are split
// into nested commander groups: first segment becomes the parent command
// (created if absent), remaining segments form the subcommand path.
//
// Source: PLAN.md Task 2 notes; CONTEXT.md D-21 (route registry pattern)
// Implements: DIST-01 (package entry point)

import { Command } from "commander";
import { globby } from "globby";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve, dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const program = new Command();
program
  .name("design-os")
  .description(
    "5-stage design process operationalized as an agent-loop workflow"
  )
  .version("2.0.0");

/**
 * Auto-discover all CLI subcommand modules under assets/scripts/cli/.
 * Each module must export: `command = { name, describe, builder?, handler }`
 */
async function loadCommands() {
  const cliDir = join(ROOT, "assets/scripts/cli");
  const files = await globby(["*.mjs"], { cwd: cliDir, absolute: true });

  for (const file of files.sort()) {
    const module = await import(pathToFileURL(file).href);
    if (!module.command) continue;

    const { name, describe, builder, handler } = module.command;

    // Split command names on whitespace to support nested command groups.
    // e.g., "eval bundle-sufficiency" → parent: "eval", sub: "bundle-sufficiency"
    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      // Top-level command.
      const cmd = program
        .command(parts[0])
        .description(describe ?? "");

      if (builder) builder(cmd);
      // Commander v12: action receives (options, command).
      // The last argument is always the Command instance itself.
      cmd.action(async function() {
        // `this` is the Command instance; opts() returns parsed options.
        await handler(this.opts());
      });
    } else {
      // Nested command — ensure parent group exists.
      const parentName = parts[0];
      const subName = parts.slice(1).join(" ");

      let parentCmd = program.commands.find((c) => c.name() === parentName);
      if (!parentCmd) {
        parentCmd = program.command(parentName).description(`${parentName} subcommands`);
      }

      const subCmd = parentCmd
        .command(subName)
        .description(describe ?? "");

      if (builder) builder(subCmd);
      subCmd.action(async function() {
        await handler(this.opts());
      });
    }
  }
}

// Bootstrap.
await loadCommands();
await program.parseAsync(process.argv);
