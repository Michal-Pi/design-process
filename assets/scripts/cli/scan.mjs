// assets/scripts/cli/scan.mjs
// complete-design scan subcommand — auto-discovered by bin/complete-design.mjs dispatcher.
//
// Scans files for PII (email, phone, SSN, IPv4, CC, transcript headers).
// Default scan paths: design/research/interviews/ + **/transcript*.md glob.
//
// Source: Plan 01 auto-discovery contract; CONTEXT.md D-18, D-19; PLAN.md Task 2
// Implements: D-18, D-19

import { scanWithAllowlist } from "../pii-scan.mjs";
import { globby } from "globby";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

export const command = {
  name: "scan",
  describe: "Scan files for PII (email, phone, SSN, CC, transcript headers)",

  /**
   * @param {import("commander").Command} cmd
   */
  builder(cmd) {
    cmd
      .option("--pii", "Enable PII scanning mode", false)
      .argument("[path]", "File or directory to scan (default: design/research/interviews/ + **/transcript*.md)")
      .option(
        "--allowlist <path>",
        "Path to PII allowlist JSON",
        ".complete-design/pii-allowlist.json"
      );
  },

  /**
   * @param {{ pii?: boolean, allowlist?: string }} args
   */
  async handler(args) {
    if (!args.pii) {
      console.log("Use --pii to enable PII scanning.");
      return;
    }

    const allowlistPath = args.allowlist ?? ".complete-design/pii-allowlist.json";

    // Collect files to scan
    let filesToScan = [];

    // Extract positional path argument from process.argv.
    // The dispatcher calls handler(this.opts()) which does not include positional args.
    // We scan process.argv for non-flag arguments after the 'scan' command token.
    const argv = process.argv;
    const scanIdx = argv.findIndex((a) => a === "scan");
    const pathArg = scanIdx !== -1
      ? argv.slice(scanIdx + 1).find((a) => !a.startsWith("-"))
      : undefined;

    if (pathArg) {
      const absPath = resolve(pathArg);
      if (existsSync(absPath)) {
        // If it's a single file, scan just that file
        const stat = (await import("node:fs/promises")).stat;
        try {
          const s = await stat(absPath);
          if (s.isFile()) {
            filesToScan = [absPath];
          } else {
            // Directory
            filesToScan = await globby(["**/*.md", "**/*.txt"], {
              cwd: absPath,
              absolute: true,
            });
          }
        } catch {
          filesToScan = [absPath];
        }
      }
    } else {
      // Default paths: design/research/interviews/ + **/transcript*.md
      const cwd = process.cwd();
      filesToScan = await globby(
        [
          "design/research/interviews/**/*.md",
          "design/research/interviews/**/*.txt",
          "**/transcript*.md",
        ],
        { cwd, absolute: true }
      );
    }

    if (filesToScan.length === 0) {
      console.log("No files to scan.");
      return;
    }

    let totalFindings = 0;
    let flaggedFiles = 0;

    for (const file of filesToScan) {
      const result = await scanWithAllowlist(file, allowlistPath);

      if (result.allowlisted) {
        continue;
      }

      if (result.allowlistDrift) {
        console.error(
          `ALLOWLIST DRIFT: ${file} — content changed since allowlisting; re-flagging`
        );
      }

      if (result.findings.length > 0) {
        flaggedFiles++;
        totalFindings += result.findings.length;
        for (const finding of result.findings) {
          console.error(
            `PII [${finding.type}] in ${file} at index ${finding.index}: ${
              finding.value.length > 40
                ? finding.value.slice(0, 40) + "..."
                : finding.value
            }`
          );
        }
      }
    }

    const output = {
      findings: totalFindings,
      totalFiles: filesToScan.length,
      flaggedFiles,
    };

    if (totalFindings > 0) {
      console.error(JSON.stringify(output, null, 2));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify(output, null, 2));
    }
  },
};
