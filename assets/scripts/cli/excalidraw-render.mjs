// assets/scripts/cli/excalidraw-render.mjs
// CLI subcommand: excalidraw-render
// Wires Commander --input/--output/--screen flags to renderSkeletonIR().
//
// Usage (via dispatcher):
//   node bin/design-os.mjs excalidraw-render --input <ir.json> --output <dir> --screen <name>
//
// Security (T-03-01-01): validates --input path exists and is a .json file;
// rejects paths containing '..' (path traversal guard).
//
// Source: PLAN.md 03-01 Task A; INVARIANT-05 (no LLM imports)
// Implements: WF-04 CLI surface

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSkeletonIR } from "../excalidraw-render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");

export const command = {
  name: "excalidraw-render",
  describe: "Render skeleton IR JSON → Excalidraw .excalidraw files (Stage 3 emitter)",

  builder(cmd) {
    cmd
      .option("--input <path>", "Path to skeleton-ir.json (array of IR objects)")
      .option("--output <dir>", "Output directory for .excalidraw files")
      .option("--screen <name>", "Screen name used for subdirectory (default: screen)");
  },

  async handler(opts) {
    const { input, output, screen = "screen" } = opts;

    if (!input) {
      console.error("excalidraw-render: --input is required");
      process.exit(1);
    }
    if (!output) {
      console.error("excalidraw-render: --output is required");
      process.exit(1);
    }

    // T-03-01-01: path traversal guard — reject paths with '..'
    if (input.includes("..") || output.includes("..")) {
      console.error("excalidraw-render: paths containing '..' are not allowed (path traversal guard)");
      process.exit(1);
    }

    const inputAbs = resolve(ROOT, input);

    // Validate input file exists and is .json
    if (!existsSync(inputAbs)) {
      console.error(`excalidraw-render: --input file not found: ${inputAbs}`);
      process.exit(1);
    }
    if (extname(inputAbs).toLowerCase() !== ".json") {
      console.error(`excalidraw-render: --input must be a .json file, got: ${extname(inputAbs)}`);
      process.exit(1);
    }

    // Parse IR array
    let irArray;
    try {
      const raw = await readFile(inputAbs, "utf8");
      irArray = JSON.parse(raw);
    } catch (err) {
      console.error(`excalidraw-render: failed to parse --input as JSON: ${err.message}`);
      process.exit(1);
    }

    if (!Array.isArray(irArray)) {
      console.error("excalidraw-render: --input must contain a JSON array of IR objects");
      process.exit(1);
    }

    // Create output directory for this screen
    const screenDir = resolve(ROOT, output, screen);
    await mkdir(screenDir, { recursive: true });

    // Emit one .excalidraw file per IR object in the array
    // Naming: v1.excalidraw … v8.excalidraw (OQ-4 resolution)
    for (let i = 0; i < irArray.length; i++) {
      const variant = irArray[i];
      const doc = renderSkeletonIR([variant]);
      const filename = `v${i + 1}.excalidraw`;
      const outputPath = join(screenDir, filename);
      await writeFile(outputPath, JSON.stringify(doc, null, 2), "utf8");
      console.log(`excalidraw-render: wrote ${outputPath}`);
    }

    console.log(`excalidraw-render: emitted ${irArray.length} variant(s) to ${screenDir}`);
  },
};
