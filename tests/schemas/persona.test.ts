// tests/schemas/persona.test.ts
// Tests for PersonaV1 Zod schema.
// Implements TDD RED phase for Task 1.

import { describe, it, expect } from "vitest";
import { PersonaV1 } from "../../schemas/src/persona.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../fixtures/persona");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

describe("PersonaV1", () => {
  it("parses a valid v1-minimal fixture successfully", () => {
    const data = loadFixture("v1-minimal.json");
    expect(() => PersonaV1.parse(data)).not.toThrow();
    const parsed = PersonaV1.parse(data);
    expect(parsed.artifact).toBe("persona");
    expect(parsed.stage).toBe("1");
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.thinkingStyle.cognitiveSpace).toBeTruthy();
    expect(parsed.thinkingStyle.emotionalReactions.length).toBeGreaterThan(0);
    expect(parsed.thinkingStyle.guidingPrinciples.length).toBeGreaterThan(0);
  });

  it("accepts optional worstProvenance field", () => {
    const data = loadFixture("v1-minimal.json");
    const parsed = PersonaV1.parse(data);
    expect(parsed.worstProvenance).toBe("generated");
  });

  it("rejects a fixture missing the 'provenance' field", () => {
    const data = loadFixture("v1-minimal.json") as Record<string, unknown>;
    const invalid = { ...data };
    delete invalid["provenance"];
    const result = PersonaV1.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("provenance"))).toBe(true);
    }
  });

  it("rejects invalid provenance enum value", () => {
    const data = loadFixture("v1-minimal.json") as Record<string, unknown>;
    const invalid = { ...data, provenance: "wrong-enum-value" };
    const result = PersonaV1.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("provenance"))).toBe(true);
    }
  });

  it("rejects a fixture with invalid sourceHash format", () => {
    const data = loadFixture("v1-minimal.json") as Record<string, unknown>;
    const invalid = { ...data, sourceHash: "not-a-hash" };
    const result = PersonaV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects a fixture missing thinkingStyle", () => {
    const data = loadFixture("v1-minimal.json") as Record<string, unknown>;
    const invalid = { ...data };
    delete invalid["thinkingStyle"];
    const result = PersonaV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("exports PersonaV1Type as inferred type", () => {
    // Type-level test: if this compiles, the type export works
    type _Test = typeof PersonaV1;
    expect(PersonaV1).toBeDefined();
  });
});
