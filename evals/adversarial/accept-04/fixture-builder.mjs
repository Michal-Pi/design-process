// evals/adversarial/accept-04/fixture-builder.mjs
// Fixture builder for ACCEPT-04 adversarial CI suite.
//
// Exports buildHiFiWithoutStateMapsFixture(dir, seed) — creates a design dir
// that has valid Stage 5a prerequisites (tokens.json, wireframes/CHOICE.md)
// but no design/interactions/ .spec.md files, triggering GATE-08.
//
// Three fixture variants (seed mod 3):
//   0: interactions/ directory is ABSENT entirely
//   1: interactions/ directory exists but is empty (no files)
//   2: interactions/ directory exists with non-.spec.md files only
//
// Additional variation axes (ensure 100 distinct fixtures):
//   - Token group count varies by seed (1..10)
//   - Wireframe filename varies by seed
//   - Non-spec filenames vary by seed (variant 2)
//   - DESIGN.md product name varies by seed
//
// Does NOT call an LLM. Per INVARIANTS.md Lesson 5: node:fs/promises + node:path ONLY.
//
// Source: 04-01-PLAN.md Task 2; CONTEXT.md D-76; GATE-08
// Implements: ACCEPT-04

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Product name pool for DESIGN.md variation across seeds.
 * Ensures 100 fixtures have distinct DESIGN.md content.
 */
const PRODUCT_NAMES = [
  "TaskFlow", "Nexus", "Stackwatch", "Meridian", "Prism", "Kinetic", "Mise",
  "Bloom", "Ledger", "Ripple", "Atlas", "Helm", "Pulse", "Orbit", "Verdant",
  "Vantage", "Beacon", "Orbital", "Stackway", "Flowboard", "Datastream",
  "Canopy", "Lumen", "Harbor", "Polaris", "Zenith", "Summit", "Terrain",
  "Cascade", "Tidal", "Ember", "Solace", "Forge", "Anchor", "Compass",
  "Meridian2", "Vertex", "Nexus2", "Radiant", "Crest", "Driftwood", "Mosaic",
  "Praxis", "Foundry", "Lattice", "Cobalt", "Amber", "Indigo", "Sage",
  "Slate", "Dune", "Clay", "Stone", "Grove", "Fern", "Iris", "Sable",
  "Sparrow", "Finch", "Crane", "Ibis", "Heron", "Osprey", "Kestrel", "Merlin",
  "Falcon", "Harrier", "Condor", "Egret", "Plover", "Avocet", "Gadwall",
  "Wigeon", "Teal", "Pintail", "Shoveler", "Pochard", "Canvasback", "Redhead",
  "Bufflehead", "Goldeneye", "Scoter", "Eider", "Merganser", "Smew",
  "Cormorant", "Gannet", "Booby", "Frigatebird", "Tropicbird", "Skua",
  "Kittiwake", "Fulmar", "Petrel", "Shearwater", "Albatross", "Penguin",
  "Puffin", "Murre", "Razorbill", "Guillemot",
];

if (PRODUCT_NAMES.length < 100) {
  throw new Error(
    `ACCEPT-04 fixture-builder: PRODUCT_NAMES pool has only ${PRODUCT_NAMES.length} entries; need ≥100.`
  );
}

/**
 * Non-spec file name patterns for variant 2 fixtures.
 * These files exist in interactions/ but are NOT .spec.md files.
 */
const NON_SPEC_FILENAMES = [
  "README.md", "NOTES.md", "TODO.txt", "scratch.md", "ideas.md",
  "draft.md", "outline.md", "reference.md", "context.md", "background.md",
];

/**
 * Build a minimal tokens.json (DTCG-style) with varying group count.
 * @param {number} seed - Used to vary token group count (1..10)
 * @param {string} productName - Product name for token namespace
 * @returns {string}
 */
function buildTokensJson(seed, productName) {
  const groupCount = (seed % 10) + 1; // 1..10 groups
  const tokenGroups = {};

  for (let g = 0; g < groupCount; g++) {
    const hue = (seed * 37 + g * 19) % 360;
    const lightness = 30 + (g * 7) % 60;
    tokenGroups[`color-${g}`] = {
      $type: "color",
      primary: { $value: `oklch(${lightness}% 0.15 ${hue})`, $type: "color" },
      muted: { $value: `oklch(${lightness + 20}% 0.08 ${hue})`, $type: "color" },
    };
  }

  const frontmatter = `---
artifact: tokens
stage: "5a"
schemaVersion: 1
provenance: generated
evidence: proto
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/accept-04-adversarial
product: ${productName}
---
`;
  return frontmatter + JSON.stringify(tokenGroups, null, 2);
}

/**
 * Build a minimal DESIGN.md with product-specific content.
 * @param {string} productName - Product name
 * @param {number} seed - Seed for minor variation
 * @returns {string}
 */
function buildDesignMd(productName, seed) {
  const version = `1.${seed % 10}.0`;
  return `---
artifact: design-contract
stage: "5a"
schemaVersion: 1
provenance: generated
evidence: proto
generated: "2026-05-31T00:00:00.000Z"
owner: design-os/accept-04-adversarial
product: ${productName}
version: ${version}
---

# ${productName} Design Contract v${version}

## Token System

The ${productName} design token system follows DTCG v2025.10 with ${(seed % 10) + 1} token group(s).
All visual properties reference semantic tokens from tokens.json.

## Component Inventory

Seed ${seed} — ${productName} accepts-04 adversarial fixture.
`;
}

/**
 * Build a CHOICE.md for the wireframes directory.
 * @param {string} screenName - Screen name
 * @param {number} seed - Seed for content variation
 * @returns {string}
 */
function buildChoiceMd(screenName, seed) {
  return `# CHOICE: ${screenName} (seed ${seed})

## Selected Variant: v${(seed % 3) + 1}

### Rationale

The v${(seed % 3) + 1} variant was selected for its ${
    seed % 2 === 0 ? "clarity and reduced cognitive load" : "visual hierarchy and scannability"
  }.

## Rejected Variants

${seed % 2 === 0 ? "v2, v3 — too dense for the target user's context" : "v1, v3 — insufficient information density for power users"}
`;
}

/**
 * Build a hi-fi-without-state-maps fixture at the given dir.
 *
 * All fixtures have:
 * - tokens.json (DTCG v2025.10 format with frontier stage:'5a')
 * - DESIGN.md (design contract stub)
 * - wireframes/screen/CHOICE.md (required by stage-5a checklist)
 *
 * All fixtures LACK:
 * - interactions/*.spec.md (triggers GATE-08 not_runnable)
 *
 * Variant strategy (seed % 3):
 *   0 — no interactions/ directory at all
 *   1 — empty interactions/ directory (no files)
 *   2 — interactions/ with non-.spec.md file(s) only
 *
 * Additional variation (ensures 100 distinct fixtures):
 *   - PRODUCT_NAMES[seed % 100] varies the design content
 *   - Token group count = (seed % 10) + 1
 *   - Wireframe filename = `v${(seed % 3) + 1}.excalidraw`
 *   - Non-spec file count = (seed % 5) + 1 (for variant 2)
 *
 * @param {string} dir - Directory to create the fixture in
 * @param {number} seed - Seed value (0..99)
 * @returns {Promise<void>}
 */
export async function buildHiFiWithoutStateMapsFixture(dir, seed) {
  const productName = PRODUCT_NAMES[seed % PRODUCT_NAMES.length];
  const variant = seed % 3; // 0, 1, or 2

  // Create tokens.json
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "tokens.json"), buildTokensJson(seed, productName), "utf8");

  // Create DESIGN.md
  await writeFile(join(dir, "DESIGN.md"), buildDesignMd(productName, seed), "utf8");

  // Create wireframes/screen/CHOICE.md (stage-5a checklist condition 2)
  const screenName = `screen-${(seed % 6) + 1}`;
  const wireframesDir = join(dir, "wireframes", screenName);
  await mkdir(wireframesDir, { recursive: true });
  await writeFile(join(wireframesDir, "CHOICE.md"), buildChoiceMd(screenName, seed), "utf8");

  // Create ia/sitemap.json (optional but adds variation for some seeds)
  if (seed % 4 === 0) {
    const iaDir = join(dir, "ia");
    await mkdir(iaDir, { recursive: true });
    const sitemapContent = JSON.stringify({
      schemaVersion: 1,
      routes: [
        { id: `route-${seed}-main`, path: "/", label: `${productName} Home` },
        { id: `route-${seed}-detail`, path: "/detail", label: "Detail View" },
      ],
    }, null, 2);
    await writeFile(join(iaDir, "sitemap.json"), sitemapContent, "utf8");
  }

  // Variant-specific: interactions/ directory setup
  switch (variant) {
    case 0:
      // No interactions/ directory at all — GATE-08 fires on missing dir
      break;

    case 1: {
      // Empty interactions/ directory (no real files)
      const interactionsDir = join(dir, "interactions");
      await mkdir(interactionsDir, { recursive: true });
      // Intentionally: no files written. Gate checks for spec files; none exist.
      break;
    }

    case 2: {
      // interactions/ with non-.spec.md files only
      const interactionsDir = join(dir, "interactions");
      await mkdir(interactionsDir, { recursive: true });
      const fileCount = (seed % 5) + 1; // 1..5 non-spec files
      for (let f = 0; f < fileCount; f++) {
        const filename = NON_SPEC_FILENAMES[(seed + f) % NON_SPEC_FILENAMES.length];
        // Add a seed-specific prefix to ensure all 100 seeds have distinct filenames
        const uniqueFilename = `s${seed}-${filename}`;
        await writeFile(
          join(interactionsDir, uniqueFilename),
          `# Non-spec file for seed ${seed}, file ${f + 1}\n\nThis file is intentionally NOT a .spec.md file.\n`,
          "utf8"
        );
      }
      break;
    }
  }
}
