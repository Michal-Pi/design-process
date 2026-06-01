// tests/cli/excalidraw-render-security.test.ts
// Security tests for the --screen path traversal guard in excalidraw-render.mjs.
//
// Finding 2 fix verification: --screen values containing '..', absolute paths,
// or traversal sequences must cause process.exit(1) before any file write.
//
// Source: codex-review finding 2 on plan 03-01

import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const BIN = join(ROOT, "bin", "complete-design.mjs");

/** Minimal valid skeleton IR for a single screen */
const MINIMAL_IR = JSON.stringify([
  { type: "rectangle", x: 0, y: 0, w: 100, h: 50, label: "Nav" },
]);

describe("excalidraw-render --screen path traversal guard (Finding 2)", () => {
  const tmpDirs: string[] = [];

  afterEach(async () => {
    for (const dir of tmpDirs.splice(0)) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  async function makeFixture() {
    const dir = await mkdtemp(join(tmpdir(), "excalidraw-security-"));
    tmpDirs.push(dir);
    const irFile = join(dir, "ir.json");
    await writeFile(irFile, MINIMAL_IR, "utf8");
    const outDir = join(dir, "output");
    await mkdir(outDir, { recursive: true });
    return { dir, irFile, outDir };
  }

  it("exits non-zero for --screen ../../outside (dotdot traversal)", async () => {
    const { irFile, outDir } = await makeFixture();
    const result = spawnSync(
      process.execPath,
      [BIN, "excalidraw-render", "--input", irFile, "--output", outDir, "--screen", "../../outside"],
      { encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    // Must exit before writing any file
  });

  it("exits non-zero for --screen /etc (absolute path)", async () => {
    const { irFile, outDir } = await makeFixture();
    const result = spawnSync(
      process.execPath,
      [BIN, "excalidraw-render", "--input", irFile, "--output", outDir, "--screen", "/etc"],
      { encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
  });

  it("exits non-zero for --screen foo/../../../outside (encoded traversal)", async () => {
    const { irFile, outDir } = await makeFixture();
    const result = spawnSync(
      process.execPath,
      [BIN, "excalidraw-render", "--input", irFile, "--output", outDir, "--screen", "foo/../../../outside"],
      { encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
  });

  it("succeeds for --screen safe-name (normal relative path)", async () => {
    const { irFile, outDir } = await makeFixture();
    const result = spawnSync(
      process.execPath,
      [BIN, "excalidraw-render", "--input", irFile, "--output", outDir, "--screen", "safe-screen"],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(0);
  });
});
