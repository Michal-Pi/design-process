// evals/adversarial/fid-06-frost-recurrence/fixture-builder.mjs
// Fixture builder for FID-06 adversarial CI suite.
//
// Creates a temp design dir with:
// - tokens.json containing one promoted component "Button" in component-tier
// - wireframes/login/v3.excalidraw with element label "Button" (1x wireframe)
// - interactions/login.spec.md with body text referencing "Button" once (1x spec)
// Total recurrence: 2x (below threshold of 3)
//
// Intentionally below the D-70 Frost ≥3x threshold to trigger the BLOCKER.
//
// Does NOT call an LLM. All content is hardcoded minimal fixture data.
// Per D-61: gate logic is pure script, no LLM calls.
//
// Source: CONTEXT.md D-61, D-70; PLAN.md T-03-03-B
// Implements: FID-06, D-70, ROADMAP SC-3

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Minimal tokens.json with 'button' in component-tier (DTCG v2025.10) */
const TOKENS_JSON_WITH_BUTTON = `---
artifact: tokens
stage: 5a
evidence: INFERRED
schemaVersion: 1
generated: 2026-05-25T00:00:00.000Z
---
{
  "$schema": "https://tr.designtokens.org/format/",
  "$description": "FID-06 adversarial fixture — Button component promoted",
  "component": {
    "button": {
      "background": { "$type": "color", "$value": "oklch(60% 0.2 270)" },
      "label": { "$type": "color", "$value": "oklch(100% 0 0)" }
    }
  }
}`;

/** Excalidraw JSON with one element labeled "Button" (1x wireframe occurrence) */
function makeExcalidrawWithButton() {
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: [
      {
        id: "fid06-el1",
        type: "rectangle",
        x: 100,
        y: 200,
        width: 120,
        height: 40,
        label: "Button",
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 1,
        roughness: 1,
        opacity: 100,
        angle: 0,
      },
      {
        id: "fid06-el2",
        type: "text",
        x: 50,
        y: 50,
        width: 200,
        height: 30,
        text: "Login Screen",
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 1,
        roughness: 1,
        opacity: 100,
        angle: 0,
      },
    ],
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  });
}

/** Interaction spec with one mention of "Button" (1x spec occurrence) */
const SPEC_MD_WITH_BUTTON = `---
artifact: interaction-spec
stage: 4
generated: 2026-05-25T00:00:00.000Z
schemaVersion: 1
asyncOperations: false
stateCount: 2
hasConditionalTransitions: false
---

# Login Screen Interaction Spec

## Purpose

Describes the login screen interaction flow for FID-06 adversarial test.

## Components Used

The Button component is the primary submit action on this screen.

## States

- idle: User has not yet interacted
- submitting: Form submission in progress

## Transitions

- idle --> submitting : on SUBMIT_CLICK
`;

/**
 * Build the FID-06 adversarial fixture directory.
 *
 * Creates a design dir where the "button" component appears exactly 2x:
 * - 1x in wireframes/login/v3.excalidraw (element label)
 * - 1x in interactions/login.spec.md (body text reference)
 *
 * This is intentionally below the D-70 threshold of 3x.
 *
 * @param {string} tmpDir - Temporary directory to build fixture in
 * @returns {Promise<void>}
 */
export async function buildFid06Fixture(tmpDir) {
  // wireframes/login/v3.excalidraw — "Button" element label (1x wireframe)
  await mkdir(join(tmpDir, "wireframes", "login"), { recursive: true });
  await writeFile(
    join(tmpDir, "wireframes", "login", "v3.excalidraw"),
    makeExcalidrawWithButton(),
    "utf8"
  );

  // interactions/login.spec.md — "Button" in body text (1x spec)
  await mkdir(join(tmpDir, "interactions"), { recursive: true });
  await writeFile(
    join(tmpDir, "interactions", "login.spec.md"),
    SPEC_MD_WITH_BUTTON,
    "utf8"
  );

  // tokens.json — "button" in component-tier
  await writeFile(join(tmpDir, "tokens.json"), TOKENS_JSON_WITH_BUTTON, "utf8");

  // DESIGN.md — valid schema, evidence:INFERRED
  await writeFile(
    join(tmpDir, "DESIGN.md"),
    `---
name: "FID-06 Adversarial Fixture"
tokens: 1000
version: "2026.04"
$extensions:
  complete-design:
    evidence: "INFERRED"
    stage: "5b-lite"
    generatedBy: "complete-design/systematize"
---

## Typography rationale

System UI fallback.

## Color system rationale

OKLCH primary.

## Spacing rationale

8px base unit.

## Component decisions

- **button**: Promoted (appears 2x — deliberately below Frost ≥3x threshold for FID-06 test).
`,
    "utf8"
  );
  // Total "Button" recurrence: 2x (1 wireframe label + 1 spec body mention)
  // This is intentionally below the D-70 threshold of 3x.
}
