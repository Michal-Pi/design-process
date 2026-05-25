// tests/schemas/manifest.test.ts
// Tests for ManifestV1 Zod schema.

import { describe, it, expect } from "vitest";
import { ManifestV1 } from "../../schemas/src/manifest.js";

const validManifest = {
  artifact: "manifest",
  stage: "cross-stage",
  schemaVersion: 1,
  sourceHash:
    "sha256:1e75f22c3d101b98875549fe86f0b906c2f3bcb008b2f2d686728ff998fd3fd5",
  generated: "2026-05-24T12:00:00Z",
  provenance: "generated",
  owner: "designer@example.com",
  lastReviewedAt: "2026-05-24T12:00:00Z",
  entries: [
    {
      path: "design/research/personas/alex.json",
      artifact: "persona",
      stage: "1",
      generated: "2026-05-24T11:00:00Z",
      dependents: ["design/ia/sitemap.json"],
    },
    {
      path: "design/ia/sitemap.json",
      artifact: "sitemap",
      stage: "2",
      generated: "2026-05-24T13:00:00Z",
      dependents: [],
    },
  ],
};

describe("ManifestV1", () => {
  it("parses a valid manifest with entry-list and stage/dependent references", () => {
    expect(() => ManifestV1.parse(validManifest)).not.toThrow();
    const parsed = ManifestV1.parse(validManifest);
    expect(parsed.artifact).toBe("manifest");
    expect(parsed.stage).toBe("cross-stage");
    expect(parsed.entries.length).toBe(2);
  });

  it("accepts an empty entries array", () => {
    const data = { ...validManifest, entries: [] };
    expect(() => ManifestV1.parse(data)).not.toThrow();
  });

  it("accepts entries with non-empty dependents", () => {
    const parsed = ManifestV1.parse(validManifest);
    const entry = parsed.entries[0];
    expect(entry).toBeDefined();
    expect(entry!.dependents).toContain("design/ia/sitemap.json");
  });

  it("rejects a manifest missing the 'entries' field", () => {
    const invalid = { ...validManifest } as Record<string, unknown>;
    delete invalid["entries"];
    const result = ManifestV1.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("entries"))).toBe(true);
    }
  });

  it("rejects an entry missing 'path' field", () => {
    const invalid = {
      ...validManifest,
      entries: [
        {
          artifact: "persona",
          stage: "1",
          generated: "2026-05-24T11:00:00Z",
          dependents: [],
        },
      ],
    };
    const result = ManifestV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
