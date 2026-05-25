// tests/schemas/interaction-spec.test.ts
// Tests for InteractionSpecV1 Zod schema.

import { describe, it, expect } from "vitest";
import { InteractionSpecV1 } from "../../schemas/src/interaction-spec.js";

const validSpec = {
  artifact: "interaction-spec",
  stage: "4",
  schemaVersion: 1,
  sourceHash:
    "sha256:fdaffdc2252213beae108a437efe0433423c8e4cc8e344018304183e12dd683c",
  generated: "2026-05-24T12:00:00Z",
  provenance: "generated",
  owner: "designer@example.com",
  lastReviewedAt: "2026-05-24T12:00:00Z",
  screen: "Dashboard Onboarding",
  states: [
    {
      id: "idle",
      label: "Idle",
      transitions: [{ event: "START", target: "loading" }],
    },
    {
      id: "loading",
      label: "Loading",
      transitions: [
        { event: "SUCCESS", target: "ready" },
        { event: "ERROR", target: "error" },
      ],
    },
    {
      id: "ready",
      label: "Ready",
      transitions: [],
    },
    {
      id: "error",
      label: "Error",
      transitions: [{ event: "RETRY", target: "loading" }],
    },
  ],
  mermaidStateDiagram:
    "stateDiagram-v2\n  [*] --> idle\n  idle --> loading: START\n  loading --> ready: SUCCESS\n  loading --> error: ERROR\n  error --> loading: RETRY",
};

describe("InteractionSpecV1", () => {
  it("accepts a fixture with Mermaid stateDiagram-v2 body and no XState machine", () => {
    expect(() => InteractionSpecV1.parse(validSpec)).not.toThrow();
    const parsed = InteractionSpecV1.parse(validSpec);
    expect(parsed.artifact).toBe("interaction-spec");
    expect(parsed.stage).toBe("4");
    expect(parsed.xstateMachine).toBeUndefined();
  });

  it("accepts an optional XState machine when provided", () => {
    const withXState = {
      ...validSpec,
      xstateMachine: JSON.stringify({ initial: "idle", states: {} }),
    };
    expect(() => InteractionSpecV1.parse(withXState)).not.toThrow();
    const parsed = InteractionSpecV1.parse(withXState);
    expect(parsed.xstateMachine).toBeDefined();
  });

  it("rejects a fixture missing 'mermaidStateDiagram'", () => {
    const invalid = { ...validSpec } as Record<string, unknown>;
    delete invalid["mermaidStateDiagram"];
    const result = InteractionSpecV1.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.includes("mermaidStateDiagram"))).toBe(true);
    }
  });

  it("rejects a fixture with an empty states array", () => {
    const invalid = { ...validSpec, states: [] };
    const result = InteractionSpecV1.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
