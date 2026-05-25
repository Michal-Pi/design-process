#!/usr/bin/env node
// assets/scripts/verify-golden.mjs
// Golden determinism CI gate: run each deterministic emit script 5× on its
// fixture input and assert byte-identical output; compare against expected.*.
//
// Fixtures live in evals/fixtures/golden/<script>/ with a sibling expected.* file.
// D-14: regenerating a fixture requires an explicit npm run regen-golden -- --reason "<text>".
//
// Exit 0: all fixtures pass. Exit 1: first mismatch (reports script + fixture + diff).
//
// Source: CONTEXT.md D-12 (verify --golden scope), D-14 (fixture management)
// Implements: PREV-03

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

/** Number of times each script is run to assert byte-identical output. D-12. */
const BYTE_IDENTICAL_RUNS = 5;

/** Registry of fixture runners: maps fixture dir name → async function returning string. */
const FIXTURE_RUNNERS = {
  "schemas-emit": runSchemasEmitFixture,
  "handoff-bundle": runHandoffBundleFixture,
  "gate-stage-5a": runGateStage5aFixtures,
  "mermaid-render": runMermaidRenderFixture,
  "tokens-project": runTokensProjectFixtures,
};

/**
 * Compute SHA-256 hex digest of a string.
 * @param {string} content
 * @returns {string}
 */
function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Run the schemas-emit fixture: emit the persona schema 5× and compare with expected.json.
 * @returns {Promise<{ name: string; pass: boolean; mismatch?: string }[]>}
 */
async function runSchemasEmitFixture() {
  const fixtureDir = join(ROOT, "evals/fixtures/golden/schemas-emit");
  const expectedPath = join(fixtureDir, "expected.json");

  const { emitSchemas } = await import("./schemas/emit.mjs");

  const expected = await readFile(expectedPath, "utf8");
  const expectedHash = sha256(expected);

  const results = [];
  const hashes = [];

  for (let i = 0; i < BYTE_IDENTICAL_RUNS; i++) {
    await emitSchemas();
    // Read back the persona schema (our determinism test artifact)
    const personaPath = join(ROOT, "schemas/dist/persona.v1.json");
    const output = await readFile(personaPath, "utf8");
    hashes.push(sha256(output));
  }

  // Assert all 5 runs produce identical output
  const allSame = hashes.every((h) => h === hashes[0]);
  if (!allSame) {
    results.push({
      name: "schemas-emit / persona.v1.json",
      pass: false,
      mismatch: `Not byte-identical across ${BYTE_IDENTICAL_RUNS} runs.`,
    });
    return results;
  }

  // Assert the output matches expected.json
  if (hashes[0] !== expectedHash) {
    results.push({
      name: "schemas-emit / persona.v1.json",
      pass: false,
      mismatch: `Output hash ${hashes[0]} does not match expected hash ${expectedHash}. Run npm run regen-golden -- --script schemas-emit --reason "<text>" to update.`,
    });
    return results;
  }

  results.push({ name: "schemas-emit / persona.v1.json", pass: true });
  return results;
}

/**
 * Run the handoff-bundle fixture 5× and compare with expected.md.
 * Uses a fixed generatedAt timestamp to ensure deterministic output.
 * @returns {Promise<{ name: string; pass: boolean; mismatch?: string }[]>}
 */
async function runHandoffBundleFixture() {
  const fixtureDir = join(ROOT, "evals/fixtures/golden/handoff-bundle");
  const expectedPath = join(fixtureDir, "expected.md");
  const bodyPath = join(fixtureDir, "input/body.md");
  const designDir = join(fixtureDir, "input/design-dir");

  const { buildHandoffBundle } = await import("./handoff-bundle-build.mjs");

  const expected = await readFile(expectedPath, "utf8");
  const expectedHash = sha256(expected);

  const body = await readFile(bodyPath, "utf8");

  // Fixed timestamp — deterministic golden test anchor.
  // The expected.md was generated with this exact timestamp.
  // To update: npm run regen-golden -- --script handoff-bundle --reason "<text>"
  const GOLDEN_TIMESTAMP = "2026-05-25T00:00:00.000Z";

  const hashes = [];

  for (let i = 0; i < BYTE_IDENTICAL_RUNS; i++) {
    const result = await buildHandoffBundle({
      stageFrom: "1",
      stageTo: "2",
      designDir,
      llmSummaryBody: body,
      generatedAt: GOLDEN_TIMESTAMP,
    });
    if (!result.ok) {
      return [
        {
          name: "handoff-bundle",
          pass: false,
          mismatch: `Build failed: ${JSON.stringify(result)}`,
        },
      ];
    }
    const { readFile: rf } = await import("node:fs/promises");
    const output = await rf(result.path, "utf8");
    hashes.push(sha256(output));
  }

  const allSame = hashes.every((h) => h === hashes[0]);
  if (!allSame) {
    return [
      {
        name: "handoff-bundle",
        pass: false,
        mismatch: `Not byte-identical across ${BYTE_IDENTICAL_RUNS} runs.`,
      },
    ];
  }

  if (hashes[0] !== expectedHash) {
    return [
      {
        name: "handoff-bundle",
        pass: false,
        mismatch: `Output hash ${hashes[0]} does not match expected hash ${expectedHash}. Run npm run regen-golden -- --script handoff-bundle --reason "<text>" to update.`,
      },
    ];
  }

  return [{ name: "handoff-bundle", pass: true }];
}

/**
 * Run the gate-stage-5a fixture for both input-empty and input-with-interactions.
 * @returns {Promise<{ name: string; pass: boolean; mismatch?: string }[]>}
 */
async function runGateStage5aFixtures() {
  const fixtureDir = join(ROOT, "evals/fixtures/golden/gate-stage-5a");
  const { runStage5aGate } = await import("./gates/stage-5a.mjs");

  const results = [];

  // Test 1: empty interactions → not_runnable
  {
    const inputDir = join(fixtureDir, "input-empty");
    const expectedPath = join(fixtureDir, "expected-not-runnable.json");
    const expected = JSON.parse(await readFile(expectedPath, "utf8"));
    const expectedHash = sha256(JSON.stringify(expected));

    const hashes = [];
    for (let i = 0; i < BYTE_IDENTICAL_RUNS; i++) {
      const result = await runStage5aGate(inputDir);
      hashes.push(sha256(JSON.stringify(result)));
    }

    const allSame = hashes.every((h) => h === hashes[0]);
    if (!allSame) {
      results.push({
        name: "gate-stage-5a / input-empty",
        pass: false,
        mismatch: `Not byte-identical across ${BYTE_IDENTICAL_RUNS} runs.`,
      });
    } else if (hashes[0] !== expectedHash) {
      results.push({
        name: "gate-stage-5a / input-empty",
        pass: false,
        mismatch: `Output hash ${hashes[0]} != expected ${expectedHash}.`,
      });
    } else {
      results.push({ name: "gate-stage-5a / input-empty", pass: true });
    }
  }

  // Test 2: with interactions → pass
  {
    const inputDir = join(fixtureDir, "input-with-interactions");
    const expectedPath = join(fixtureDir, "expected-skeleton-pass.json");
    const expected = JSON.parse(await readFile(expectedPath, "utf8"));
    const expectedHash = sha256(JSON.stringify(expected));

    const hashes = [];
    for (let i = 0; i < BYTE_IDENTICAL_RUNS; i++) {
      const result = await runStage5aGate(inputDir);
      hashes.push(sha256(JSON.stringify(result)));
    }

    const allSame = hashes.every((h) => h === hashes[0]);
    if (!allSame) {
      results.push({
        name: "gate-stage-5a / input-with-interactions",
        pass: false,
        mismatch: `Not byte-identical across ${BYTE_IDENTICAL_RUNS} runs.`,
      });
    } else if (hashes[0] !== expectedHash) {
      results.push({
        name: "gate-stage-5a / input-with-interactions",
        pass: false,
        mismatch: `Output hash ${hashes[0]} != expected ${expectedHash}.`,
      });
    } else {
      results.push({
        name: "gate-stage-5a / input-with-interactions",
        pass: true,
      });
    }
  }

  return results;
}

/**
 * Run the mermaid-render fixture 5× and compare with expected.svg.
 * @returns {Promise<{ name: string; pass: boolean; mismatch?: string }[]>}
 */
async function runMermaidRenderFixture() {
  const fixtureDir = join(ROOT, "evals/fixtures/golden/mermaid-render");
  const inputPath = join(fixtureDir, "input.mmd");
  const expectedPath = join(fixtureDir, "expected.svg");

  if (!existsSync(expectedPath)) {
    return [
      {
        name: "mermaid-render",
        pass: false,
        mismatch: `expected.svg not found. Run npm run regen-golden -- --script mermaid-render --reason "<text>"`,
      },
    ];
  }

  const { renderMermaidFile } = await import("./mermaid-render.mjs");
  const expected = await readFile(expectedPath, "utf8");
  const expectedHash = sha256(expected);

  const { join: pathJoin } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const hashes = [];
  for (let i = 0; i < BYTE_IDENTICAL_RUNS; i++) {
    const tempOutput = pathJoin(tmpdir(), `mermaid-verify-${i}-${Date.now()}.svg`);
    await renderMermaidFile(inputPath, tempOutput);
    const output = await readFile(tempOutput, "utf8");
    hashes.push(sha256(output));
  }

  const allSame = hashes.every((h) => h === hashes[0]);
  if (!allSame) {
    return [
      {
        name: "mermaid-render",
        pass: false,
        mismatch: `Not byte-identical across ${BYTE_IDENTICAL_RUNS} runs.`,
      },
    ];
  }

  if (hashes[0] !== expectedHash) {
    return [
      {
        name: "mermaid-render",
        pass: false,
        mismatch: `Output hash ${hashes[0]} != expected ${expectedHash}.`,
      },
    ];
  }

  return [{ name: "mermaid-render", pass: true }];
}

/**
 * Run the tokens-project golden fixtures (shadcn, tailwind-v4, plain-css adapters).
 * Verifies 5× byte-identical output matches expected-*.json files.
 * @returns {Promise<{ name: string; pass: boolean; mismatch?: string }[]>}
 */
async function runTokensProjectFixtures() {
  const fixtureDir = join(ROOT, "evals/fixtures/golden/tokens-project");
  const inputPath = join(fixtureDir, "input.json");

  if (!existsSync(inputPath)) {
    return [
      {
        name: "tokens-project / input missing",
        pass: false,
        mismatch: `input.json not found at ${inputPath}`,
      },
    ];
  }

  const { emitTokens } = await import("./tokens-project.mjs");
  const { tmpdir } = await import("node:os");
  const { mkdir: mkdirAsync, rm } = await import("node:fs/promises");
  const { join: pathJoin } = await import("node:path");

  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const results = [];

  // ── shadcn adapter (tokens.json) ─────────────────────────────────────────
  {
    const expectedPath = join(fixtureDir, "expected-shadcn.json");
    if (!existsSync(expectedPath)) {
      results.push({
        name: "tokens-project / expected-shadcn.json missing",
        pass: false,
        mismatch: `expected-shadcn.json not found. Run npm run regen-golden -- --script tokens-project --reason "<text>" to update.`,
      });
    } else {
      const expected = await readFile(expectedPath, "utf8");
      const expectedHash = sha256(expected);
      const hashes = [];

      for (let i = 0; i < BYTE_IDENTICAL_RUNS; i++) {
        const tmpDir = pathJoin(tmpdir(), `vg-tokens-shadcn-${Date.now()}-${i}`);
        await mkdirAsync(tmpDir, { recursive: true });
        try {
          const res = await emitTokens({
            ...input,
            adapter: "shadcn",
            designDir: tmpDir,
            projectRoot: tmpDir,
          });
          const content = await readFile(res.tokensPath, "utf8");
          hashes.push(sha256(content));
        } finally {
          await rm(tmpDir, { recursive: true, force: true });
        }
      }

      const allSame = hashes.every((h) => h === hashes[0]);
      if (!allSame) {
        results.push({
          name: "tokens-project / shadcn adapter tokens.json",
          pass: false,
          mismatch: `Not byte-identical across ${BYTE_IDENTICAL_RUNS} runs.`,
        });
      } else if (hashes[0] !== expectedHash) {
        results.push({
          name: "tokens-project / shadcn adapter tokens.json",
          pass: false,
          mismatch: `Output hash ${hashes[0]} != expected ${expectedHash}. Run npm run regen-golden to update.`,
        });
      } else {
        results.push({ name: "tokens-project / shadcn adapter tokens.json", pass: true });
      }
    }
  }

  // ── tailwind-v4 adapter (globals.css) ────────────────────────────────────
  {
    const expectedPath = join(fixtureDir, "expected-tailwind-v4.json");
    if (!existsSync(expectedPath)) {
      results.push({
        name: "tokens-project / expected-tailwind-v4.json missing",
        pass: false,
        mismatch: `expected-tailwind-v4.json not found.`,
      });
    } else {
      const expected = await readFile(expectedPath, "utf8");
      const expectedHash = sha256(expected);
      const hashes = [];

      for (let i = 0; i < BYTE_IDENTICAL_RUNS; i++) {
        const tmpDir = pathJoin(tmpdir(), `vg-tokens-tw4-${Date.now()}-${i}`);
        await mkdirAsync(tmpDir, { recursive: true });
        try {
          const res = await emitTokens({
            ...input,
            adapter: "tailwind-v4",
            designDir: tmpDir,
            projectRoot: tmpDir,
          });
          const content = await readFile(res.projectionPath, "utf8");
          hashes.push(sha256(content));
        } finally {
          await rm(tmpDir, { recursive: true, force: true });
        }
      }

      const allSame = hashes.every((h) => h === hashes[0]);
      if (!allSame) {
        results.push({
          name: "tokens-project / tailwind-v4 adapter globals.css",
          pass: false,
          mismatch: `Not byte-identical across ${BYTE_IDENTICAL_RUNS} runs.`,
        });
      } else if (hashes[0] !== expectedHash) {
        results.push({
          name: "tokens-project / tailwind-v4 adapter globals.css",
          pass: false,
          mismatch: `Output hash ${hashes[0]} != expected ${expectedHash}. Run npm run regen-golden to update.`,
        });
      } else {
        results.push({ name: "tokens-project / tailwind-v4 adapter globals.css", pass: true });
      }
    }
  }

  // ── plain-css adapter (design-os-tokens.css) ─────────────────────────────
  {
    const expectedPath = join(fixtureDir, "expected-plain-css.json");
    if (!existsSync(expectedPath)) {
      results.push({
        name: "tokens-project / expected-plain-css.json missing",
        pass: false,
        mismatch: `expected-plain-css.json not found.`,
      });
    } else {
      const expected = await readFile(expectedPath, "utf8");
      const expectedHash = sha256(expected);
      const hashes = [];

      for (let i = 0; i < BYTE_IDENTICAL_RUNS; i++) {
        const tmpDir = pathJoin(tmpdir(), `vg-tokens-plain-${Date.now()}-${i}`);
        await mkdirAsync(tmpDir, { recursive: true });
        try {
          const res = await emitTokens({
            ...input,
            adapter: "plain-css",
            designDir: tmpDir,
            projectRoot: tmpDir,
          });
          const content = await readFile(res.projectionPath, "utf8");
          hashes.push(sha256(content));
        } finally {
          await rm(tmpDir, { recursive: true, force: true });
        }
      }

      const allSame = hashes.every((h) => h === hashes[0]);
      if (!allSame) {
        results.push({
          name: "tokens-project / plain-css adapter design-os-tokens.css",
          pass: false,
          mismatch: `Not byte-identical across ${BYTE_IDENTICAL_RUNS} runs.`,
        });
      } else if (hashes[0] !== expectedHash) {
        results.push({
          name: "tokens-project / plain-css adapter design-os-tokens.css",
          pass: false,
          mismatch: `Output hash ${hashes[0]} != expected ${expectedHash}. Run npm run regen-golden to update.`,
        });
      } else {
        results.push({ name: "tokens-project / plain-css adapter design-os-tokens.css", pass: true });
      }
    }
  }

  return results;
}

/**
 * Run all golden fixture verifications.
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun] - If true, just check structure without running scripts.
 * @param {string} [opts.fixturesDir] - Override fixtures directory (for testing).
 * @param {string} [opts.scriptName] - Run only a specific fixture.
 * @returns {Promise<boolean>} true if all pass, false if any fail.
 */
export async function runGolden(opts = {}) {
  const { dryRun = false } = opts;

  if (dryRun) {
    // Structural check only — verify fixture dirs and expected files exist
    const fixturesRoot = join(ROOT, "evals/fixtures/golden");
    if (!existsSync(fixturesRoot)) return false;
    const dirs = await readdir(fixturesRoot);
    return dirs.length > 0;
  }

  const allResults = [];
  let anyFailed = false;

  for (const [name, runner] of Object.entries(FIXTURE_RUNNERS)) {
    console.log(`\nRunning golden fixture: ${name} (${BYTE_IDENTICAL_RUNS}× runs)...`);
    try {
      const results = await runner();
      for (const r of results) {
        allResults.push(r);
        if (!r.pass) {
          anyFailed = true;
          console.error(`  FAIL: ${r.name}`);
          if (r.mismatch) console.error(`       ${r.mismatch}`);
        } else {
          console.log(`  PASS: ${r.name}`);
        }
      }
    } catch (err) {
      anyFailed = true;
      allResults.push({ name, pass: false, mismatch: String(err) });
      console.error(`  FAIL: ${name} — ${err}`);
    }
  }

  console.log(
    `\nverify-golden summary: ${allResults.filter((r) => r.pass).length}/${allResults.length} passed.`
  );

  return !anyFailed;
}

// Run when invoked directly.
const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("verify-golden.mjs"));

if (isMain) {
  const ok = await runGolden();
  process.exit(ok ? 0 : 1);
}
