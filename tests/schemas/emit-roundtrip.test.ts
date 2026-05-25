// tests/schemas/emit-roundtrip.test.ts
// Verifies: emit pipeline produces valid JSON Schemas; deterministic (byte-identical);
// emitted schemas compile in ajv; v1-minimal fixtures validate against emitted schemas.
// Source: PLAN.md Task 2 behavior; T-01-01 (determinism); D-03 (ajv runtime validation).
// Implements: SCHEMA-01..07, T-01-01

import { describe, it, expect, beforeAll } from "vitest";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname, resolve } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
// ajv-formats has dual CJS/ESM; import with default to handle interop.
import addFormatsModule from "ajv-formats";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addFormats = (typeof (addFormatsModule as any).default === "function"
  ? (addFormatsModule as any).default
  : addFormatsModule) as (ajv: InstanceType<typeof Ajv2020>) => void;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

const DIST_DIR = join(ROOT, "schemas/dist");
const FIXTURES_DIR = join(ROOT, "tests/fixtures");

const ARTIFACT_NAMES = [
  "persona",
  "sitemap",
  "manifest",
  "interaction-spec",
  "audit-report",
  "handoff-bundle",
] as const;

type ArtifactName = (typeof ARTIFACT_NAMES)[number];

/**
 * Helper: read a dist schema file as parsed JSON.
 */
async function readDistSchema(name: string): Promise<Record<string, unknown>> {
  const path = join(DIST_DIR, `${name}.v1.json`);
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

/**
 * Helper: run the emit script once and capture output bytes.
 * We re-run by importing the emitSchemas function.
 */
async function runEmit(): Promise<{ [name: string]: string }> {
  // Import emit function (ESM dynamic import for .mjs)
  // Dynamic import of .mjs file; no TS declarations available for .mjs scripts.
  // The cast to unknown+any is intentional — this is a test utility import.
  // @ts-ignore TS7016: no declaration file for .mjs script
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emitModule: any = await import("../../assets/scripts/schemas/emit.mjs");
  const emitSchemas = emitModule.emitSchemas as () => Promise<unknown>;
  await emitSchemas();

  const results: { [name: string]: string } = {};
  for (const name of ARTIFACT_NAMES) {
    results[name] = await readFile(join(DIST_DIR, `${name}.v1.json`), "utf8");
  }
  results["index"] = await readFile(join(DIST_DIR, "index.json"), "utf8");
  return results;
}

describe("Schema emit roundtrip", () => {
  describe("Emitted file existence", () => {
    for (const name of ARTIFACT_NAMES) {
      it(`schemas/dist/${name}.v1.json exists`, () => {
        expect(existsSync(join(DIST_DIR, `${name}.v1.json`))).toBe(true);
      });
    }

    it("schemas/dist/index.json exists", () => {
      expect(existsSync(join(DIST_DIR, "index.json"))).toBe(true);
    });
  });

  describe("Schema header compliance", () => {
    for (const name of ARTIFACT_NAMES) {
      it(`${name}.v1.json declares Draft 2020-12 $schema`, async () => {
        const schema = await readDistSchema(name);
        expect(schema["$schema"]).toBe(
          "https://json-schema.org/draft/2020-12/schema"
        );
      });

      it(`${name}.v1.json declares versioned $id`, async () => {
        const schema = await readDistSchema(name);
        expect(schema["$id"]).toBe(
          `https://design-os.dev/schemas/${name}.v1.json`
        );
      });
    }
  });

  describe("Discovery manifest", () => {
    it("index.json lists all 6 artifacts", async () => {
      const index = JSON.parse(
        await readFile(join(DIST_DIR, "index.json"), "utf8")
      ) as { schemas: Record<string, { version: number; path: string }> };

      for (const name of ARTIFACT_NAMES) {
        expect(index.schemas[name]).toBeDefined();
        expect(index.schemas[name]?.version).toBe(1);
        expect(index.schemas[name]?.path).toBe(`schemas/dist/${name}.v1.json`);
      }
    });
  });

  describe("Deterministic emit (byte-identical across runs)", () => {
    it("two consecutive emit runs produce byte-identical output", async () => {
      // Run 1: read current files (assumed emitted in test setup or npm run schemas:emit)
      const run1: { [name: string]: string } = {};
      for (const name of ARTIFACT_NAMES) {
        run1[name] = await readFile(join(DIST_DIR, `${name}.v1.json`), "utf8");
      }
      run1["index"] = await readFile(join(DIST_DIR, "index.json"), "utf8");

      // Run 2: re-emit
      const run2 = await runEmit();

      for (const name of [...ARTIFACT_NAMES, "index"] as const) {
        expect(run2[name]).toBe(run1[name]);
      }
    });
  });

  describe("ajv compilation", () => {
    it("all 6 emitted schemas compile without error in ajv Ajv2020", async () => {
      const ajv = new Ajv2020({ strict: false, allErrors: true });
      addFormats(ajv);

      for (const name of ARTIFACT_NAMES) {
        const schema = await readDistSchema(name);
        expect(() => ajv.compile(schema)).not.toThrow();
      }
    });
  });

  describe("Fixture validation via ajv", () => {
    it("persona v1-minimal validates against persona.v1.json", async () => {
      const ajv = new Ajv2020({ strict: false, allErrors: true });
      addFormats(ajv);

      const schema = await readDistSchema("persona");
      const validateFn = ajv.compile(schema);

      const fixture = JSON.parse(
        await readFile(join(FIXTURES_DIR, "persona/v1-minimal.json"), "utf8")
      );
      const valid = validateFn(fixture);
      expect(valid).toBe(true);
    });

    it("sitemap v1-minimal validates against sitemap.v1.json", async () => {
      const ajv = new Ajv2020({ strict: false, allErrors: true });
      addFormats(ajv);

      const schema = await readDistSchema("sitemap");
      const validateFn = ajv.compile(schema);

      const fixture = JSON.parse(
        await readFile(join(FIXTURES_DIR, "sitemap/v1-minimal.json"), "utf8")
      );
      const valid = validateFn(fixture);
      expect(valid).toBe(true);
    });

    it("persona v1-invalid is rejected by persona.v1.json with errors", async () => {
      const ajv = new Ajv2020({ strict: false, allErrors: true });
      addFormats(ajv);

      const schema = await readDistSchema("persona");
      const validateFn = ajv.compile(schema);

      const fixture = JSON.parse(
        await readFile(join(FIXTURES_DIR, "persona/v1-invalid.json"), "utf8")
      );
      const valid = validateFn(fixture);
      expect(valid).toBe(false);
      expect(validateFn.errors).toBeTruthy();
      expect(validateFn.errors!.length).toBeGreaterThan(0);

      // D-03: error must have schemaPath and instancePath
      const firstError = validateFn.errors![0]!;
      expect(firstError.schemaPath).toBeTruthy();
      expect(firstError.instancePath).toBeDefined();
    });
  });
});
