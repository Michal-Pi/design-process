// evals/adversarial/accept-03/fixture-builder.mjs
// Fixture builder for ACCEPT-03 adversarial CI suite.
//
// Exports buildStyledWireframeFixture(dir, seed) — creates a design dir
// with wireframes/screen/ containing 3 .excalidraw files, where one element
// has a FID-03 violation from a pool of 100 distinct violation profiles.
//
// 100 STYLED_VIOLATIONS pool:
//   0-6:   7 strokeColor violations (from fid-03 base)
//   7-12:  6 backgroundColor violations (from fid-03 base)
//   13-19: 7 fontFamily violations (from fid-03 base)
//   20-33: 14 additional strokeColor variants
//   34-47: 14 additional backgroundColor variants
//   48-61: 14 additional fontFamily variants
//   62-81: 20 combined (strokeColor + fontFamily) violations
//   82-99: 18 combined (strokeColor + backgroundColor) violations
// Total: 100 distinct violation profiles
//
// Does NOT call an LLM. Per INVARIANTS.md Lesson 5: node:fs/promises + node:path ONLY.
//
// Source: 04-01-PLAN.md Task 2; CONTEXT.md D-76; fid-03-styled-wireframe template
// Implements: ACCEPT-03

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** FID-03 default values */
const FID03_DEFAULTS = {
  backgroundColor: "transparent",
  fontFamily: 1,
  strokeColor: "#1e1e1e",
};

/**
 * 100 distinct FID-03 violation profiles.
 * Each profile has one or more non-default field values that trigger FID-03.
 *
 * Expansion strategy per 04-01-PLAN.md:
 * - Single-field violations: 7 strokeColor + 6 backgroundColor + 7 fontFamily = 20 (base from fid-03)
 * - Additional single-field: 14 strokeColor + 14 backgroundColor + 14 fontFamily = 42 (additional)
 * - Combined violations: 20 strokeColor+fontFamily + 18 strokeColor+backgroundColor = 38 (combined)
 * Total: 20 + 42 + 38 = 100
 */
const STYLED_VIOLATIONS = [
  // 0-6: strokeColor violations (7 variants — from fid-03 base)
  { strokeColor: "#FF0000" },
  { strokeColor: "#00FF00" },
  { strokeColor: "#0000FF" },
  { strokeColor: "#FF00FF" },
  { strokeColor: "#FFFF00" },
  { strokeColor: "#FF8800" },
  { strokeColor: "#8800FF" },
  // 7-12: backgroundColor violations (6 variants — from fid-03 base)
  { backgroundColor: "#0000FF" },
  { backgroundColor: "#FF0000" },
  { backgroundColor: "#00FF00" },
  { backgroundColor: "#FFFF00" },
  { backgroundColor: "#FF8800" },
  { backgroundColor: "#888888" },
  // 13-19: fontFamily violations (7 variants — from fid-03 base, values 2-8)
  { fontFamily: 2 },
  { fontFamily: 3 },
  { fontFamily: 4 },
  { fontFamily: 5 },
  { fontFamily: 6 },
  { fontFamily: 7 },
  { fontFamily: 8 },
  // 20-33: 14 additional strokeColor variants
  { strokeColor: "#CC0000" },
  { strokeColor: "#00CC00" },
  { strokeColor: "#0000CC" },
  { strokeColor: "#CC00CC" },
  { strokeColor: "#CCCC00" },
  { strokeColor: "#CC6600" },
  { strokeColor: "#6600CC" },
  { strokeColor: "#FF4444" },
  { strokeColor: "#44FF44" },
  { strokeColor: "#4444FF" },
  { strokeColor: "#FF44FF" },
  { strokeColor: "#FFFF44" },
  { strokeColor: "#FF9944" },
  { strokeColor: "#9944FF" },
  // 34-47: 14 additional backgroundColor variants
  { backgroundColor: "#CC0000" },
  { backgroundColor: "#00CC00" },
  { backgroundColor: "#0000CC" },
  { backgroundColor: "#CC00CC" },
  { backgroundColor: "#CCCC00" },
  { backgroundColor: "#CC6600" },
  { backgroundColor: "#6600CC" },
  { backgroundColor: "#EEEEEE" },
  { backgroundColor: "#DDDDDD" },
  { backgroundColor: "#CCCCCC" },
  { backgroundColor: "#BBBBBB" },
  { backgroundColor: "#AAAAAA" },
  { backgroundColor: "#999999" },
  { backgroundColor: "#444444" },
  // 48-61: 14 additional fontFamily variants (values 9-22)
  { fontFamily: 9 },
  { fontFamily: 10 },
  { fontFamily: 11 },
  { fontFamily: 12 },
  { fontFamily: 13 },
  { fontFamily: 14 },
  { fontFamily: 15 },
  { fontFamily: 16 },
  { fontFamily: 17 },
  { fontFamily: 18 },
  { fontFamily: 19 },
  { fontFamily: 20 },
  { fontFamily: 21 },
  { fontFamily: 22 },
  // 62-81: 20 combined (strokeColor + fontFamily) violations
  { strokeColor: "#FF0000", fontFamily: 2 },
  { strokeColor: "#00FF00", fontFamily: 3 },
  { strokeColor: "#0000FF", fontFamily: 4 },
  { strokeColor: "#FF00FF", fontFamily: 5 },
  { strokeColor: "#FFFF00", fontFamily: 6 },
  { strokeColor: "#FF8800", fontFamily: 7 },
  { strokeColor: "#8800FF", fontFamily: 8 },
  { strokeColor: "#CC0000", fontFamily: 9 },
  { strokeColor: "#00CC00", fontFamily: 10 },
  { strokeColor: "#0000CC", fontFamily: 11 },
  { strokeColor: "#CC00CC", fontFamily: 12 },
  { strokeColor: "#CCCC00", fontFamily: 13 },
  { strokeColor: "#CC6600", fontFamily: 14 },
  { strokeColor: "#6600CC", fontFamily: 15 },
  { strokeColor: "#FF4444", fontFamily: 16 },
  { strokeColor: "#44FF44", fontFamily: 17 },
  { strokeColor: "#4444FF", fontFamily: 18 },
  { strokeColor: "#FF44FF", fontFamily: 19 },
  { strokeColor: "#FFFF44", fontFamily: 20 },
  { strokeColor: "#FF9944", fontFamily: 21 },
  // 82-99: 18 combined (strokeColor + backgroundColor) violations
  { strokeColor: "#FF0000", backgroundColor: "#0000FF" },
  { strokeColor: "#00FF00", backgroundColor: "#FF0000" },
  { strokeColor: "#0000FF", backgroundColor: "#00FF00" },
  { strokeColor: "#FF00FF", backgroundColor: "#FFFF00" },
  { strokeColor: "#FFFF00", backgroundColor: "#FF8800" },
  { strokeColor: "#FF8800", backgroundColor: "#888888" },
  { strokeColor: "#8800FF", backgroundColor: "#EEEEEE" },
  { strokeColor: "#CC0000", backgroundColor: "#DDDDDD" },
  { strokeColor: "#00CC00", backgroundColor: "#CCCCCC" },
  { strokeColor: "#0000CC", backgroundColor: "#BBBBBB" },
  { strokeColor: "#CC00CC", backgroundColor: "#AAAAAA" },
  { strokeColor: "#CCCC00", backgroundColor: "#999999" },
  { strokeColor: "#CC6600", backgroundColor: "#444444" },
  { strokeColor: "#6600CC", backgroundColor: "#CC0000" },
  { strokeColor: "#FF4444", backgroundColor: "#00CC00" },
  { strokeColor: "#44FF44", backgroundColor: "#0000CC" },
  { strokeColor: "#4444FF", backgroundColor: "#CC00CC" },
  { strokeColor: "#FF44FF", backgroundColor: "#CCCC00" },
];

// Verify pool length at module load time
if (STYLED_VIOLATIONS.length !== 100) {
  throw new Error(
    `ACCEPT-03 fixture-builder: STYLED_VIOLATIONS pool has ${STYLED_VIOLATIONS.length} entries; need exactly 100 for seed 0..99.`
  );
}

/**
 * Build a base Excalidraw element with FID-03-clean values.
 * @param {number} i - Element index (for positioning + ID uniqueness)
 * @param {string} suffix - Label suffix for unique IDs
 * @returns {object}
 */
function buildBaseElement(i, suffix = "") {
  return {
    angle: 0,
    backgroundColor: FID03_DEFAULTS.backgroundColor,
    boundElements: null,
    fillStyle: "hachure",
    frameId: null,
    groupIds: [],
    height: 60 + (i % 3) * 20,
    id: `el-${i}-${suffix}`,
    isDeleted: false,
    link: null,
    locked: false,
    opacity: 100,
    roughness: 1,
    roundness: null,
    seed: i + 1,
    strokeColor: FID03_DEFAULTS.strokeColor,
    strokeStyle: "solid",
    strokeWidth: 1,
    type: "rectangle",
    updated: 1,
    version: 1,
    versionNonce: 1,
    width: 120 + (i % 5) * 30,
    x: (i % 5) * 200,
    y: Math.floor(i / 5) * 100,
  };
}

/**
 * Build an Excalidraw document with a FID-03 violation on the first element.
 * @param {number} seed - Fixture seed (0..99) — selects violation profile
 * @param {string} suffix - Label suffix for unique element IDs
 * @returns {object}
 */
function buildStyledDoc(seed, suffix) {
  const violation = STYLED_VIOLATIONS[seed % STYLED_VIOLATIONS.length];
  const count = 4 + (seed % 5); // 4-8 elements for variety
  const elements = Array.from({ length: count }, (_, i) =>
    buildBaseElement(i, `${suffix}-s${seed}`)
  );
  // Inject violation on the first element — FID-03 check fires on any element
  elements[0] = { ...elements[0], ...violation };
  return {
    appState: {},
    elements,
    files: {},
    source: "design-os-accept-03",
    type: "excalidraw",
    version: 2,
  };
}

/**
 * Build a clean Excalidraw document with FID-03-default values.
 * @param {number} seed - Fixture seed for variety
 * @param {string} suffix - Label suffix
 * @returns {object}
 */
function buildCleanDoc(seed, suffix) {
  const count = 4 + (seed % 5);
  const elements = Array.from({ length: count }, (_, i) =>
    buildBaseElement(i, `${suffix}-c${seed}`)
  );
  return {
    appState: {},
    elements,
    files: {},
    source: "design-os-accept-03",
    type: "excalidraw",
    version: 2,
  };
}

/**
 * Build a styled wireframe fixture at the given dir.
 * Creates wireframes/screen/ with 3 .excalidraw files:
 * - v1.excalidraw: styled (FID-03 violation from STYLED_VIOLATIONS[seed])
 * - v2.excalidraw: clean padding (ensures count check ≥3 passes, FID-03 fires first)
 * - v3.excalidraw: clean padding
 *
 * Gate stage-3 checks in order: (1) count ≥3, (2) FID-03, (3) diversity, (4) CHOICE.md
 * Having 3 files ensures count check passes so FID-03 check is reached.
 *
 * @param {string} dir - Directory to create the fixture in
 * @param {number} seed - Seed value (0..99) for distinct violation profile
 * @returns {Promise<void>}
 */
export async function buildStyledWireframeFixture(dir, seed) {
  const wireDir = join(dir, "wireframes", "screen");
  await mkdir(wireDir, { recursive: true });

  // v1: styled (FID-03 violation specific to this seed)
  await writeFile(
    join(wireDir, "v1.excalidraw"),
    JSON.stringify(buildStyledDoc(seed, "v1"), null, 2),
    "utf8"
  );
  // v2, v3: clean padding (ensures count ≥3 so FID-03 check is reached)
  await writeFile(
    join(wireDir, "v2.excalidraw"),
    JSON.stringify(buildCleanDoc((seed + 1) % 100, "v2"), null, 2),
    "utf8"
  );
  await writeFile(
    join(wireDir, "v3.excalidraw"),
    JSON.stringify(buildCleanDoc((seed + 2) % 100, "v3"), null, 2),
    "utf8"
  );
}
