// evals/adversarial/fid-03-styled-wireframe/fixture-builder.mjs
// Generates 20 styled + 20 clean .excalidraw fixture files for the FID-03 adversarial suite.
//
// STYLED: each fixture has at least one element with a deliberate FID-03 violation:
//   - strokeColor: '#FF0000' (non-default)
//   - backgroundColor: '#0000FF' (non-default)
//   - fontFamily: 2 (non-default, not Virgil)
//
// CLEAN: each fixture has only FID-03-default values.
//
// All fixtures are written to a caller-provided temp directory.
// The directory structure per fixture:
//   <baseDir>/styled-N/wireframes/screen/v1.excalidraw
//   <baseDir>/clean-N/wireframes/screen/v1.excalidraw
//
// Source: PLAN.md 03-01 Task B; CONTEXT.md D-56
// Implements: FID-03 adversarial CI suite

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** FID-03 default values */
const FID03_DEFAULTS = {
  backgroundColor: "transparent",
  fontFamily: 1,
  strokeColor: "#1e1e1e",
};

/** Non-default FID-03 violations for styled fixtures */
const STYLED_VIOLATIONS = [
  // 0-6: strokeColor violations (7 variants)
  { field: "strokeColor", value: "#FF0000" }, // red
  { field: "strokeColor", value: "#00FF00" }, // lime
  { field: "strokeColor", value: "#0000FF" }, // blue
  { field: "strokeColor", value: "#FF00FF" }, // magenta
  { field: "strokeColor", value: "#FFFF00" }, // yellow
  { field: "strokeColor", value: "#FF8800" }, // orange
  { field: "strokeColor", value: "#8800FF" }, // purple
  // 7-12: backgroundColor violations (6 variants)
  { field: "backgroundColor", value: "#0000FF" },
  { field: "backgroundColor", value: "#FF0000" },
  { field: "backgroundColor", value: "#00FF00" },
  { field: "backgroundColor", value: "#FFFF00" },
  { field: "backgroundColor", value: "#FF8800" },
  { field: "backgroundColor", value: "#888888" },
  // 13-19: fontFamily violations (7 variants — values 2-8)
  { field: "fontFamily", value: 2 },
  { field: "fontFamily", value: 3 },
  { field: "fontFamily", value: 4 },
  { field: "fontFamily", value: 5 },
  { field: "fontFamily", value: 6 },
  { field: "fontFamily", value: 7 },
  { field: "fontFamily", value: 8 },
];

/**
 * Build a base element with FID-03-clean values.
 * @param {number} i - Element index (for positioning)
 * @param {string} suffix - Label suffix
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
 * Build an Excalidraw document with FID-03-clean elements.
 * Returns a mix of 4-8 elements per fixture for variety.
 * @param {number} seed
 * @returns {object}
 */
function buildCleanDoc(seed) {
  const count = 4 + (seed % 5); // 4-8 elements
  const elements = Array.from({ length: count }, (_, i) =>
    buildBaseElement(i, `clean${seed}`)
  );
  return {
    appState: {},
    elements,
    files: {},
    source: "design-os",
    type: "excalidraw",
    version: 2,
  };
}

/**
 * Build an Excalidraw document with a FID-03 violation on one element.
 * @param {number} seed - Fixture seed (0-19)
 * @returns {object}
 */
function buildStyledDoc(seed) {
  const violation = STYLED_VIOLATIONS[seed % STYLED_VIOLATIONS.length];
  const count = 4 + (seed % 5); // 4-8 elements
  const elements = Array.from({ length: count }, (_, i) =>
    buildBaseElement(i, `styled${seed}`)
  );

  // Inject violation on the first element (index 0)
  elements[0] = { ...elements[0], [violation.field]: violation.value };

  return {
    appState: {},
    elements,
    files: {},
    source: "design-os-test-fixture",
    type: "excalidraw",
    version: 2,
  };
}

/**
 * Build all styled + clean fixtures into the provided base directory.
 * Creates 20 styled dirs and 20 clean dirs.
 *
 * STYLED dirs: have 3 .excalidraw files (2 clean padding + 1 styled with FID-03 violation).
 * Having 3 files ensures the count check (≥3) passes so the gate reaches FID-03 check.
 *
 * CLEAN dirs: have 1 .excalidraw file with only FID-03-default values.
 * (Count < 3 causes failed_after_repair for count reason, NOT for FID-03 — that's expected.)
 *
 * @param {string} baseDir - Base directory to write fixture subdirectories into
 * @returns {Promise<{ styledDirs: string[], cleanDirs: string[] }>}
 */
export async function buildFid03Fixtures(baseDir) {
  const styledDirs = [];
  const cleanDirs = [];

  for (let i = 0; i < 20; i++) {
    // Styled fixture: 3 files — 2 clean padding + 1 styled (ensures count check passes)
    const styledDir = join(baseDir, `styled-${i}`);
    const styledWireDir = join(styledDir, "wireframes", "screen");
    await mkdir(styledWireDir, { recursive: true });

    // v1: styled (FID-03 violation)
    await writeFile(
      join(styledWireDir, "v1.excalidraw"),
      JSON.stringify(buildStyledDoc(i), null, 2),
      "utf8"
    );
    // v2, v3: clean padding (content doesn't matter — FID-03 check on v1 fires first)
    await writeFile(
      join(styledWireDir, "v2.excalidraw"),
      JSON.stringify(buildCleanDoc((i + 1) % 20), null, 2),
      "utf8"
    );
    await writeFile(
      join(styledWireDir, "v3.excalidraw"),
      JSON.stringify(buildCleanDoc((i + 2) % 20), null, 2),
      "utf8"
    );
    styledDirs.push(styledDir);

    // Clean fixture: 1 file (intentionally < 3 so count check fires, not FID-03)
    const cleanDir = join(baseDir, `clean-${i}`);
    const cleanWireDir = join(cleanDir, "wireframes", "screen");
    await mkdir(cleanWireDir, { recursive: true });
    await writeFile(
      join(cleanWireDir, "v1.excalidraw"),
      JSON.stringify(buildCleanDoc(i), null, 2),
      "utf8"
    );
    cleanDirs.push(cleanDir);
  }

  return { cleanDirs, styledDirs };
}
