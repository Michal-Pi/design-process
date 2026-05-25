// tests/schemas/handoff-bundle.test.ts
// Tests for HandoffBundleV1 Zod schema.

import { describe, it, expect } from "vitest";
import { HandoffBundleV1 } from "../../schemas/src/handoff-bundle.js";

const validBundle = {
  artifact: "handoff-bundle",
  stage: "1 → 2",
  schemaVersion: 1,
  sourceHash:
    "sha256:960d394af4e09d005d6bada558a435dd6df4f4ccdb0cd40e06aeb586593f01e7",
  generated: "2026-05-24T14:00:00Z",
  provenance: "generated",
  worstProvenance: "generated",
  owner: "designer@example.com",
  lastReviewedAt: "2026-05-24T14:00:00Z",
  tokenCount: 4200,
  truncationWarning: null,
  goalAndScope: "The IA team needs to produce a sitemap based on Stage 1 research.",
  decisionsMade: [
    {
      decision: "Primary persona is Alex Chen",
      terminalState: "pass",
      evidenceGrade: "proto",
    },
  ],
  openQuestions: ["Should mobile-first patterns differ from desktop?"],
  artifactsInventory: [
    {
      path: "design/research/personas/alex-chen.json",
      brief: "Primary persona",
    },
  ],
  pointersToVerify: ["design/research/personas/alex-chen.json"],
  provenanceWorstCase: "generated",
};

describe("HandoffBundleV1", () => {
  it("parses a valid bundle with all 6 required sections", () => {
    expect(() => HandoffBundleV1.parse(validBundle)).not.toThrow();
    const parsed = HandoffBundleV1.parse(validBundle);
    expect(parsed.artifact).toBe("handoff-bundle");
    expect(parsed.stage).toBe("1 → 2");
    expect(parsed.tokenCount).toBe(4200);
    expect(parsed.truncationWarning).toBeNull();
  });

  it("accepts the stage format '5a → 5b'", () => {
    const data = { ...validBundle, stage: "5a → 5b" };
    expect(() => HandoffBundleV1.parse(data)).not.toThrow();
  });

  it("accepts an optional risksSurfaced field", () => {
    const data = { ...validBundle, risksSurfaced: ["Risk: insufficient coverage"] };
    expect(() => HandoffBundleV1.parse(data)).not.toThrow();
    const parsed = HandoffBundleV1.parse(data);
    expect(parsed.risksSurfaced).toHaveLength(1);
  });

  it("rejects a bundle missing 'goalAndScope'", () => {
    const invalid = { ...validBundle } as Record<string, unknown>;
    delete invalid["goalAndScope"];
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("goalAndScope"))).toBe(true);
    }
  });

  it("rejects a bundle missing 'decisionsMade'", () => {
    const invalid = { ...validBundle } as Record<string, unknown>;
    delete invalid["decisionsMade"];
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("decisionsMade"))).toBe(true);
    }
  });

  it("rejects a bundle missing 'openQuestions'", () => {
    const invalid = { ...validBundle } as Record<string, unknown>;
    delete invalid["openQuestions"];
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects a bundle missing 'artifactsInventory'", () => {
    const invalid = { ...validBundle } as Record<string, unknown>;
    delete invalid["artifactsInventory"];
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects a bundle missing 'pointersToVerify'", () => {
    const invalid = { ...validBundle } as Record<string, unknown>;
    delete invalid["pointersToVerify"];
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects a bundle missing 'provenanceWorstCase'", () => {
    const invalid = { ...validBundle } as Record<string, unknown>;
    delete invalid["provenanceWorstCase"];
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects tokenCount below the 3000 floor", () => {
    const invalid = { ...validBundle, tokenCount: 2999 };
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects tokenCount above the 15000 ceiling", () => {
    const invalid = { ...validBundle, tokenCount: 15001 };
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid stage format", () => {
    const invalid = { ...validBundle, stage: "stage-1-to-2" };
    const result = HandoffBundleV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
