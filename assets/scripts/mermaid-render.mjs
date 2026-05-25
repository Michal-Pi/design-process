#!/usr/bin/env node
// assets/scripts/mermaid-render.mjs
// Deterministic headless Mermaid renderer using @mermaid-js/mermaid-cli.
// Produces SVG with no embedded timestamps, no random IDs.
//
// Two consecutive renders on the same input MUST produce byte-identical SVG.
// Pitfall 12 prevention: ships in Phase 1 for Phase 3 consumption.
//
// Config: deterministicIds=true, deterministicIDSeed='design-os', theme='default'
// Post-process: strip any <!-- generated YYYY-MM-DD --> HTML comments.
//
// Usage:
//   tsx assets/scripts/mermaid-render.mjs --input <path>.mmd --output <path>.svg
//
// Source: CONTEXT.md D-12 (verify --golden scope), STACK.md (@mermaid-js/mermaid-cli 11.x)
// Implements: Pitfall 12 (designer-readable canonical artifact for Phase 3)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

/**
 * Mermaid configuration for deterministic output.
 * deterministicIds: true ensures element IDs are computed from content, not random.
 * deterministicIDSeed: 'design-os' ensures the same seed across all renders.
 */
const MERMAID_CONFIG = {
  theme: "default",
  securityLevel: "strict",
  startOnLoad: false,
  deterministicIds: true,
  deterministicIDSeed: "design-os",
};

/**
 * Strip date-like HTML comments from SVG to ensure determinism.
 * Matches: <!-- generated 2026-01-01 --> or similar patterns.
 * @param {string} svg
 * @returns {string}
 */
function stripDateComments(svg) {
  // Remove HTML comments that contain date-like content (YYYY-MM-DD pattern)
  return svg.replace(/<!--[^>]*\d{4}-\d{2}-\d{2}[^>]*-->/g, "");
}

/**
 * Render a Mermaid .mmd file to an SVG file.
 * @param {string} inputPath - Path to the .mmd source file.
 * @param {string} outputPath - Path to write the .svg output.
 * @returns {Promise<void>}
 */
export async function renderMermaidFile(inputPath, outputPath) {
  // Dynamic import to avoid module-level side effects
  const { run } = await import("@mermaid-js/mermaid-cli");

  const absInput = resolve(inputPath);
  const absOutput = resolve(outputPath);

  // Ensure output directory exists
  await mkdir(dirname(absOutput), { recursive: true });

  // Use a temp file for intermediate output to avoid partial writes
  const tempOutput = join(
    tmpdir(),
    `mermaid-render-${createHash("sha256")
      .update(absInput)
      .digest("hex")
      .slice(0, 8)}.svg`
  );

  await run(absInput, tempOutput, {
    parseMMDOptions: {
      mermaidConfig: MERMAID_CONFIG,
      backgroundColor: "white",
    },
    quiet: true,
  });

  // Read, post-process, and write to final output
  const rawSvg = await readFile(tempOutput, "utf8");
  const cleanSvg = stripDateComments(rawSvg);
  await writeFile(absOutput, cleanSvg, "utf8");
}

// Run when invoked directly.
const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("mermaid-render.mjs"));

if (isMain) {
  const inputIdx = process.argv.indexOf("--input");
  const outputIdx = process.argv.indexOf("--output");

  if (inputIdx === -1 || outputIdx === -1) {
    console.error(
      "Usage: tsx mermaid-render.mjs --input <path>.mmd --output <path>.svg"
    );
    process.exit(1);
  }

  const inputPath = process.argv[inputIdx + 1];
  const outputPath = process.argv[outputIdx + 1];

  await renderMermaidFile(inputPath, outputPath).catch((err) => {
    console.error("Mermaid render failed:", err);
    process.exit(1);
  });
  console.log(`Rendered ${inputPath} → ${outputPath}`);
}
