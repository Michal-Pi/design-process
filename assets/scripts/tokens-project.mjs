#!/usr/bin/env node
// assets/scripts/tokens-project.mjs
// DTCG v2025.10 token emit script + three adapter projections.
//
// Exports: emitTokens(options) → { tokensPath, projectionPath, adapterUsed }
// CLI: node assets/scripts/tokens-project.mjs --design-dir design/ --adapter shadcn [--generated-at ISO]
//
// NO LLM imports — must pass lint-determinism.mjs (PREV-04, D-13).
// Uses assertNever for exhaustive switch (ESLint switch-exhaustiveness-check, Phase 1 Plan 03).
//
// Implements: D-41 (DTCG tiers), D-42 (evidence:INFERRED), D-48 (adapter dispatch),
//             D-52 (staging area), ADAPT-01, ADAPT-03, MVPA-04
//
// Source: CONTEXT.md D-41..D-48; 02-03-PLAN.md T-02-03-A

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// Type helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exhaustiveness check for discriminated unions (ESLint switch-exhaustiveness-check).
 * @param {never} _x
 * @returns {never}
 */
function assertNever(_x) {
  throw new Error(`Unhandled discriminated union case: ${JSON.stringify(_x)}`);
}

/**
 * Recursively sort object keys for deterministic canonical JSON output.
 * Arrays are preserved in order; object keys are sorted lexicographically.
 * Mirrors canonicalize() in schemas/emit.mjs (single algorithm).
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonicalize(value[k])])
    );
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTCG token construction helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a DTCG v2025.10 color token.
 * @param {string} value - OKLCH value e.g. 'oklch(60% 0.2 270)'
 * @param {string} [description]
 * @returns {{ $type: 'color', $value: string, $description?: string }}
 */
function colorToken(value, description) {
  /** @type {{ $type: 'color', $value: string, $description?: string }} */
  const token = { $type: "color", $value: value };
  if (description) token.$description = description;
  return token;
}

/**
 * Create a DTCG v2025.10 dimension token.
 * @param {string} value - CSS dimension e.g. '0.5rem', '4px'
 * @param {string} [description]
 * @returns {{ $type: 'dimension', $value: string, $description?: string }}
 */
function dimensionToken(value, description) {
  /** @type {{ $type: 'dimension', $value: string, $description?: string }} */
  const token = { $type: "dimension", $value: value };
  if (description) token.$description = description;
  return token;
}

/**
 * Create a DTCG v2025.10 fontFamily token.
 * @param {string} value - Font family stack e.g. 'Inter, system-ui'
 * @param {string} [description]
 * @returns {{ $type: 'fontFamily', $value: string, $description?: string }}
 */
function fontFamilyToken(value, description) {
  /** @type {{ $type: 'fontFamily', $value: string, $description?: string }} */
  const token = { $type: "fontFamily", $value: value };
  if (description) token.$description = description;
  return token;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color derivation utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a border color by lightening the background slightly toward foreground.
 * Pure string math: extract lightness from OKLCH and offset by 15%.
 * Falls back to a neutral mid-value if parsing fails.
 *
 * @param {string} background - OKLCH background color
 * @param {string} foreground - OKLCH foreground color
 * @returns {string}
 */
function deriveBorderColor(background, foreground) {
  // Attempt to parse background lightness
  const bgMatch = background.match(/oklch\(\s*([\d.]+)%/);
  const fgMatch = foreground.match(/oklch\(\s*([\d.]+)%/);
  if (bgMatch && fgMatch) {
    const bgL = parseFloat(bgMatch[1]);
    const fgL = parseFloat(fgMatch[1]);
    // Move 15% toward foreground
    const borderL = bgL + (fgL - bgL) * 0.15;
    return `oklch(${borderL.toFixed(1)}% 0.02 0)`;
  }
  return "oklch(85% 0.02 0)";
}

/**
 * Derive primary-foreground (accessible text on primary bg) by flipping lightness.
 * If primary is dark (L < 50%), use a light fg; otherwise use a dark fg.
 *
 * @param {string} primary - OKLCH primary color
 * @returns {string}
 */
function derivePrimaryForeground(primary) {
  const match = primary.match(/oklch\(\s*([\d.]+)%/);
  if (match) {
    const L = parseFloat(match[1]);
    return L < 50 ? "oklch(98% 0.0 0)" : "oklch(10% 0.0 0)";
  }
  return "oklch(98% 0.0 0)";
}

/**
 * Derive muted color (slightly off-background).
 * @param {string} background - OKLCH background color
 * @returns {string}
 */
function deriveMutedColor(background) {
  const match = background.match(/oklch\(\s*([\d.]+)%/);
  if (match) {
    const L = parseFloat(match[1]);
    const mutedL = L > 50 ? L - 5 : L + 5;
    return `oklch(${mutedL.toFixed(1)}% 0.01 0)`;
  }
  return "oklch(93% 0.01 0)";
}

/**
 * Derive muted-foreground (dimmer text for secondary content).
 * @param {string} foreground - OKLCH foreground color
 * @returns {string}
 */
function deriveMutedForeground(foreground) {
  const match = foreground.match(/oklch\(\s*([\d.]+)%/);
  if (match) {
    const L = parseFloat(match[1]);
    // Move 30% toward mid-gray
    const mutedL = L + (50 - L) * 0.30;
    return `oklch(${mutedL.toFixed(1)}% 0.01 0)`;
  }
  return "oklch(45% 0.01 0)";
}

// ─────────────────────────────────────────────────────────────────────────────
// Spacing scale (8-step, D-41)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate 8-step spacing scale from a base unit.
 * Multipliers: 0.5×, 1×, 1.5×, 2×, 3×, 4×, 6×, 8×
 *
 * @param {number} basePixels - Base spacing in pixels (e.g. 4)
 * @returns {Record<string, { $type: 'dimension', $value: string, $description?: string }>}
 */
function buildSpacingScale(basePixels) {
  const multipliers = [0.5, 1, 1.5, 2, 3, 4, 6, 8];
  const scale = {};
  for (const m of multipliers) {
    const px = basePixels * m;
    const rem = px / 16;
    const key = `space-${String(m).replace(".", "-")}x`;
    scale[key] = dimensionToken(`${rem}rem`, `${m}× spacing unit (${px}px)`);
  }
  return scale;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTCG token tree assembly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the DTCG v2025.10 three-tier token tree.
 *
 * @param {object} opts
 * @param {string} opts.colorPrimary
 * @param {string} opts.colorBackground
 * @param {string} opts.colorForeground
 * @param {string} opts.borderRadius
 * @param {string} opts.fontFamilyBase
 * @param {number} opts.spacingBase
 * @returns {{ primitive: object, semantic: object, component: object }}
 */
function buildTokenTree({
  colorPrimary,
  colorBackground,
  colorForeground,
  borderRadius,
  fontFamilyBase,
  spacingBase,
}) {
  const colorBorder = deriveBorderColor(colorBackground, colorForeground);
  const colorPrimaryForeground = derivePrimaryForeground(colorPrimary);
  const colorMuted = deriveMutedColor(colorBackground);
  const colorMutedForeground = deriveMutedForeground(colorForeground);

  // ── Primitive tier: raw OKLCH values + dimension primitives ──────────────
  const primitive = {
    color: {
      primary: colorToken(colorPrimary, "Brand primary hue (OKLCH)"),
      background: colorToken(colorBackground, "Page background (OKLCH)"),
      foreground: colorToken(colorForeground, "Default text (OKLCH)"),
      border: colorToken(colorBorder, "Default border (derived: background+foreground mix @15%)"),
      "primary-foreground": colorToken(colorPrimaryForeground, "Text on primary bg (auto light-flip)"),
      muted: colorToken(colorMuted, "Muted surface (background ±5% L)"),
      "muted-foreground": colorToken(colorMutedForeground, "Muted text (foreground 30% toward mid-gray)"),
    },
    dimension: {
      "border-radius": dimensionToken(borderRadius, "Default border radius"),
      ...buildSpacingScale(spacingBase),
    },
    typography: {
      "font-family-base": fontFamilyToken(fontFamilyBase, "Base font family stack"),
    },
  };

  // ── Semantic tier: role-mapped aliases ───────────────────────────────────
  const semantic = {
    color: {
      background: colorToken(`{primitive.color.background.$value}`, "Semantic background alias"),
      foreground: colorToken(`{primitive.color.foreground.$value}`, "Semantic foreground alias"),
      primary: colorToken(`{primitive.color.primary.$value}`, "Semantic primary alias"),
      "primary-foreground": colorToken(`{primitive.color.primary-foreground.$value}`, "Text on primary"),
      border: colorToken(`{primitive.color.border.$value}`, "Semantic border alias"),
      muted: colorToken(`{primitive.color.muted.$value}`, "Semantic muted surface"),
      "muted-foreground": colorToken(`{primitive.color.muted-foreground.$value}`, "Semantic muted text"),
    },
  };

  // Use actual values for semantic tier (DTCG alias syntax is advisory; emit resolved values)
  semantic.color.background = colorToken(colorBackground, "Semantic background");
  semantic.color.foreground = colorToken(colorForeground, "Semantic foreground");
  semantic.color.primary = colorToken(colorPrimary, "Semantic primary");
  semantic.color["primary-foreground"] = colorToken(colorPrimaryForeground, "Text on primary");
  semantic.color.border = colorToken(colorBorder, "Semantic border");
  semantic.color.muted = colorToken(colorMuted, "Semantic muted surface");
  semantic.color["muted-foreground"] = colorToken(colorMutedForeground, "Semantic muted text");

  // ── Component tier: component-specific tokens ────────────────────────────
  const component = {
    button: {
      background: colorToken(colorPrimary, "Button background (= color.primary)"),
      foreground: colorToken(colorPrimaryForeground, "Button text (= color.primary-foreground)"),
      "border-radius": dimensionToken(borderRadius, "Button border radius"),
    },
    input: {
      border: colorToken(colorBorder, "Input border (= color.border)"),
      background: colorToken(colorBackground, "Input background (= color.background)"),
    },
    card: {
      background: colorToken(colorBackground, "Card background (= color.background)"),
      border: colorToken(colorBorder, "Card border (= color.border)"),
    },
  };

  return { primitive, semantic, component };
}

// ─────────────────────────────────────────────────────────────────────────────
// DTCG JSON emission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assemble and write design/tokens.json with YAML frontmatter.
 * The frontmatter block carries: artifact, stage, evidence, schemaVersion, generated.
 * The JSON body carries the DTCG three-tier token tree.
 *
 * @param {object} tokenTree - { primitive, semantic, component }
 * @param {string} tokensPath - Absolute path to write tokens.json
 * @param {string} generatedAt - ISO datetime string for deterministic golden tests
 * @returns {Promise<void>}
 */
async function writeDtcgTokensJson(tokenTree, tokensPath, generatedAt) {
  const frontmatter = [
    "---",
    "artifact: tokens",
    "stage: 5a-lite",
    "evidence: INFERRED",
    "schemaVersion: 1",
    `generated: ${generatedAt}`,
    "---",
  ].join("\n");

  const dtcgBody = canonicalize({
    $schema: "https://tr.designtokens.org/format/",
    $description: "DTCG v2025.10 design tokens — Stage 5a-lite, evidence:INFERRED",
    primitive: tokenTree.primitive,
    semantic: tokenTree.semantic,
    component: tokenTree.component,
  });

  const content = frontmatter + "\n" + JSON.stringify(dtcgBody, null, 2) + "\n";

  await mkdir(dirname(tokensPath), { recursive: true });
  await writeFile(tokensPath, content, "utf8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter: shadcn
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit the shadcn adapter projection.
 * Writes a CSS custom properties file to .design-os/preview/run-<id>/ staging area.
 * NEVER modifies components/ui/ — writes wrappers only.
 * Uses semantic color tokens via var() in named props per shadcn naming convention.
 *
 * @param {object} tokenTree
 * @param {string} stagingDir - .design-os/preview/run-<id>/ path
 * @returns {Promise<string>} projectionPath
 */
async function emitShadcnAdapter(tokenTree, stagingDir) {
  const colors = tokenTree.semantic.color;

  // shadcn CSS variable naming convention: --background, --foreground, --primary, etc.
  const cssVars = [
    `  --background: ${colors.background.$value};`,
    `  --foreground: ${colors.foreground.$value};`,
    `  --primary: ${colors.primary.$value};`,
    `  --primary-foreground: ${colors["primary-foreground"].$value};`,
    `  --border: ${colors.border.$value};`,
    `  --muted: ${colors.muted.$value};`,
    `  --muted-foreground: ${colors["muted-foreground"].$value};`,
    `  --card: ${tokenTree.component.card.background.$value};`,
    `  --card-foreground: ${colors.foreground.$value};`,
    `  --input: ${tokenTree.component.input.border.$value};`,
  ].join("\n");

  const cssContent = [
    "/* design-os generated — stage:5a-lite evidence:INFERRED */",
    "/* Adapter: shadcn — CSS custom properties for shadcn/ui compatibility */",
    "/* DO NOT EDIT: regenerate via node assets/scripts/tokens-project.mjs */",
    "",
    ":root {",
    cssVars,
    "}",
    "",
    ".dark {",
    "  /* Dark mode tokens (placeholder — extend in future workflow) */",
    "}",
    "",
  ].join("\n");

  const projectionPath = join(stagingDir, "design-os-tokens.css");
  await mkdir(stagingDir, { recursive: true });
  await writeFile(projectionPath, cssContent, "utf8");

  // Also write a sample theme-provider wrapper (references CSS file; uses var() not raw values)
  // Writes to staging components/ — NEVER to components/ui/ per CLAUDE.md
  const componentsDir = join(stagingDir, "components");
  await mkdir(componentsDir, { recursive: true });

  const themeProviderContent = [
    "// design-os generated — stage:5a-lite evidence:INFERRED",
    "// Adapter: shadcn theme-provider wrapper",
    "// Imports CSS tokens from staging area; wraps children with token scope.",
    "// NOTE: This is in the STAGING area (.design-os/preview/) — NOT in components/ui/",
    "// Apply with --apply to copy to your project's components/ directory.",
    "",
    'import "./design-os-tokens.css";',
    "",
    "interface DesignOsThemeProviderProps {",
    "  children: React.ReactNode;",
    "  className?: string;",
    "}",
    "",
    "/**",
    " * DesignOsThemeProvider — wraps app with design-os DTCG token CSS variables.",
    " * Uses semantic color tokens via CSS vars (var(--primary), etc.).",
    " * Never imports from shadcn/ui's components/ui/ directly.",
    " */",
    "export function DesignOsThemeProvider({ children, className }: DesignOsThemeProviderProps) {",
    "  return (",
    `    <div className={\`design-os-theme \${className ?? ''}\`}>`,
    "      {children}",
    "    </div>",
    "  );",
    "}",
    "",
  ].join("\n");

  await writeFile(
    join(componentsDir, "design-os-theme-provider.tsx"),
    themeProviderContent,
    "utf8"
  );

  return projectionPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter: tailwind-v4
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit the Tailwind v4 @theme adapter projection.
 * Strategy:
 *   - If projectRoot/app/globals.css exists with an @theme block → merge (additive only)
 *   - If exists without @theme → append new @theme block
 *   - If no globals.css → create it
 *
 * Writes to staging area first (D-52). --apply copies to project.
 *
 * @param {object} tokenTree
 * @param {string} stagingDir
 * @param {string} projectRoot
 * @returns {Promise<string>} projectionPath
 */
async function emitTailwindV4Adapter(tokenTree, stagingDir, projectRoot) {
  const colors = tokenTree.semantic.color;
  const dims = tokenTree.primitive.dimension;

  // Build @theme properties (Tailwind v4 CSS-first @theme syntax)
  const themeProps = [
    `  --color-primary: ${colors.primary.$value};`,
    `  --color-background: ${colors.background.$value};`,
    `  --color-foreground: ${colors.foreground.$value};`,
    `  --color-primary-foreground: ${colors["primary-foreground"].$value};`,
    `  --color-border: ${colors.border.$value};`,
    `  --color-muted: ${colors.muted.$value};`,
    `  --color-muted-foreground: ${colors["muted-foreground"].$value};`,
    `  --radius: ${dims["border-radius"].$value};`,
  ].join("\n");

  const designOsComment = "  /* design-os tokens — stage:5a-lite evidence:INFERRED */";

  // Read existing globals.css from projectRoot if present
  const existingGlobalsPath = join(projectRoot, "app/globals.css");
  let baseContent = "";
  if (existsSync(existingGlobalsPath)) {
    baseContent = await readFile(existingGlobalsPath, "utf8");
  }

  let mergedContent;

  if (baseContent.includes("@theme")) {
    // Merge: inject design-os props inside the existing @theme block (additive only)
    mergedContent = baseContent.replace(
      /(@theme\s*\{)/,
      `$1\n${designOsComment}\n${themeProps}`
    );
  } else if (baseContent) {
    // Existing globals.css but no @theme block — append
    mergedContent = baseContent.trimEnd() + "\n\n@theme {\n" + designOsComment + "\n" + themeProps + "\n}\n";
  } else {
    // No globals.css — create from scratch
    mergedContent = [
      '@import "tailwindcss";',
      "",
      "/* design-os generated — stage:5a-lite evidence:INFERRED */",
      "@theme {",
      designOsComment,
      themeProps,
      "}",
      "",
    ].join("\n");
  }

  // Write to staging area (D-52: preview path, not project root directly)
  const stagingAppDir = join(stagingDir, "app");
  await mkdir(stagingAppDir, { recursive: true });
  const projectionPath = join(stagingAppDir, "globals.css");
  await writeFile(projectionPath, mergedContent, "utf8");

  return projectionPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter: plain-css
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit the plain CSS adapter projection.
 * Emits :root { } CSS custom properties using OKLCH values (CSS Color 4).
 *
 * @param {object} tokenTree
 * @param {string} stagingDir
 * @returns {Promise<string>} projectionPath
 */
async function emitPlainCssAdapter(tokenTree, stagingDir) {
  const colors = tokenTree.semantic.color;
  const dims = tokenTree.primitive.dimension;
  const typo = tokenTree.primitive.typography;

  const rootVars = [
    "  /* Colors — CSS Color 4 OKLCH */",
    `  --color-primary: ${colors.primary.$value};`,
    `  --color-background: ${colors.background.$value};`,
    `  --color-foreground: ${colors.foreground.$value};`,
    `  --color-primary-foreground: ${colors["primary-foreground"].$value};`,
    `  --color-border: ${colors.border.$value};`,
    `  --color-muted: ${colors.muted.$value};`,
    `  --color-muted-foreground: ${colors["muted-foreground"].$value};`,
    "",
    "  /* Dimensions */",
    `  --radius: ${dims["border-radius"].$value};`,
    `  --font-family-base: ${typo["font-family-base"].$value};`,
  ].join("\n");

  const cssContent = [
    "/* design-os generated — stage:5a-lite evidence:INFERRED */",
    "/* Adapter: plain-css — CSS custom properties in :root */",
    "/* DO NOT EDIT: regenerate via node assets/scripts/tokens-project.mjs */",
    "",
    ":root {",
    rootVars,
    "}",
    "",
  ].join("\n");

  const projectionPath = join(stagingDir, "design-os-tokens.css");
  await mkdir(stagingDir, { recursive: true });
  await writeFile(projectionPath, cssContent, "utf8");

  return projectionPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main emitTokens export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit DTCG v2025.10 design tokens + adapter projection.
 *
 * @param {object} options
 * @param {string} options.adapter - 'shadcn' | 'tailwind-v4' | 'plain-css'
 * @param {string} options.colorPrimary - OKLCH primary color
 * @param {string} options.colorBackground - OKLCH background color
 * @param {string} options.colorForeground - OKLCH foreground color
 * @param {string} options.borderRadius - CSS dimension e.g. '0.5rem'
 * @param {string} options.fontFamilyBase - Font family stack
 * @param {number} options.spacingBase - Base spacing unit in pixels (e.g. 4)
 * @param {string} options.designDir - Path to the design directory (tokens.json is written here)
 * @param {string} options.projectRoot - Path to the project root (for adapter detection)
 * @param {string} [options.generatedAt] - ISO datetime for deterministic golden tests
 * @returns {Promise<{ tokensPath: string, projectionPath: string, adapterUsed: string }>}
 */
export async function emitTokens(options) {
  const {
    adapter,
    colorPrimary,
    colorBackground,
    colorForeground,
    borderRadius,
    fontFamilyBase,
    spacingBase,
    designDir,
    projectRoot,
    generatedAt,
  } = options;

  // Validate required inputs
  if (!adapter) throw new Error("emitTokens: options.adapter is required");
  if (!colorPrimary) throw new Error("emitTokens: options.colorPrimary is required");
  if (!colorBackground) throw new Error("emitTokens: options.colorBackground is required");
  if (!colorForeground) throw new Error("emitTokens: options.colorForeground is required");
  if (!borderRadius) throw new Error("emitTokens: options.borderRadius is required");
  if (!fontFamilyBase) throw new Error("emitTokens: options.fontFamilyBase is required");
  if (typeof spacingBase !== "number" || spacingBase <= 0) {
    throw new Error("emitTokens: options.spacingBase must be a positive number");
  }
  if (!designDir) throw new Error("emitTokens: options.designDir is required");
  if (!projectRoot) throw new Error("emitTokens: options.projectRoot is required");

  // Validate OKLCH color format (basic guard — T-02-03-01 threat mitigation)
  const oklchPattern = /^oklch\(/i;
  if (!oklchPattern.test(colorPrimary)) {
    throw new Error(`emitTokens: colorPrimary must be an OKLCH value (got: ${colorPrimary})`);
  }
  if (!oklchPattern.test(colorBackground)) {
    throw new Error(`emitTokens: colorBackground must be an OKLCH value (got: ${colorBackground})`);
  }
  if (!oklchPattern.test(colorForeground)) {
    throw new Error(`emitTokens: colorForeground must be an OKLCH value (got: ${colorForeground})`);
  }

  // Validate adapter is one of the known types
  const validAdapters = ["shadcn", "tailwind-v4", "plain-css"];
  if (!validAdapters.includes(adapter)) {
    throw new Error(`emitTokens: unknown adapter '${adapter}'. Valid: ${validAdapters.join(", ")}`);
  }

  const resolvedAt = generatedAt ?? new Date().toISOString();

  // Build DTCG token tree
  const tokenTree = buildTokenTree({
    colorPrimary,
    colorBackground,
    colorForeground,
    borderRadius,
    fontFamilyBase,
    spacingBase,
  });

  // Write design/tokens.json to designDir
  const tokensPath = join(designDir, "tokens.json");
  await writeDtcgTokensJson(tokenTree, tokensPath, resolvedAt);

  // Build staging dir path (.design-os/preview/run-<id>/)
  // Use a deterministic run-id when generatedAt is provided (golden test compatibility)
  const runId = generatedAt
    ? `run-${generatedAt.replace(/[:.]/g, "-")}`
    : `run-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const stagingDir = join(designDir, ".design-os", "preview", runId);

  // Dispatch to adapter (exhaustive switch with assertNever — D-48)
  let projectionPath;

  switch (adapter) {
    case "shadcn":
      projectionPath = await emitShadcnAdapter(tokenTree, stagingDir);
      break;
    case "tailwind-v4":
      projectionPath = await emitTailwindV4Adapter(tokenTree, stagingDir, projectRoot);
      break;
    case "plain-css":
      projectionPath = await emitPlainCssAdapter(tokenTree, stagingDir);
      break;
    default:
      assertNever(adapter);
  }

  return {
    tokensPath,
    projectionPath,
    adapterUsed: adapter,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI entry point
// ─────────────────────────────────────────────────────────────────────────────

const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("tokens-project.mjs"));

if (isMain) {
  // Parse CLI args
  const args = process.argv.slice(2);

  function getArg(name) {
    const idx = args.indexOf(name);
    return idx !== -1 ? args[idx + 1] : undefined;
  }

  const designDir = getArg("--design-dir") ?? "design";
  const adapterArg = getArg("--adapter");
  const generatedAt = getArg("--generated-at");
  const colorPrimary = getArg("--color-primary") ?? "oklch(60% 0.2 270)";
  const colorBackground = getArg("--color-background") ?? "oklch(98% 0.0 0)";
  const colorForeground = getArg("--color-foreground") ?? "oklch(15% 0.0 0)";
  const borderRadius = getArg("--border-radius") ?? "0.5rem";
  const fontFamilyBase = getArg("--font-family-base") ?? "Inter, system-ui";
  const spacingBase = parseInt(getArg("--spacing-base") ?? "4", 10);
  const projectRoot = getArg("--project-root") ?? process.cwd();

  // Detect adapter from registry if not provided
  let adapter = adapterArg;
  if (!adapter) {
    try {
      const registryPath = resolve(dirname(fileURLToPath(import.meta.url)), "routing/registry.mjs");
      const { detectStack } = await import(registryPath);
      const signals = detectStack(projectRoot);
      if (signals.nextjs && signals.tailwindV4 && signals.shadcn) {
        adapter = "shadcn";
      } else if (signals.tailwindV4) {
        adapter = "tailwind-v4";
      } else {
        adapter = "plain-css";
      }
      console.log(`Detected adapter: ${adapter} (from registry.mjs)`);
    } catch {
      adapter = "plain-css";
      console.log(`Adapter detection failed — defaulting to: ${adapter}`);
    }
  }

  try {
    const result = await emitTokens({
      adapter,
      colorPrimary,
      colorBackground,
      colorForeground,
      borderRadius,
      fontFamilyBase,
      spacingBase,
      designDir: resolve(designDir),
      projectRoot: resolve(projectRoot),
      generatedAt,
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
