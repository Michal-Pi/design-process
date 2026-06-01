// assets/scripts/excalidraw-render.mjs
// Skeleton IR → Excalidraw JSON emitter.
//
// Per D-54: uses convertToExcalidrawElements() from @excalidraw/excalidraw when
// available. If the package is unavailable at runtime (Assumption A1 fallback),
// falls back to direct element construction with FID-03 safe defaults.
//
// The LLM NEVER writes raw Excalidraw element arrays — this is the sole script
// authorized to emit .excalidraw JSON.
//
// FID-03 defaults (D-56):
//   strokeColor: '#1e1e1e'
//   backgroundColor: 'transparent'
//   fontFamily: 1  (Virgil)
//
// Source: PLAN.md 03-01 Task A; CONTEXT.md D-54, D-56
// Implements: WF-04, ATOM-08

import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile as fsWriteFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** FID-03 safe defaults — gate-stage-3.mjs checks against these (D-56). */
export const FID03_DEFAULTS = {
  strokeColor: "#1e1e1e",
  backgroundColor: "transparent",
  fontFamily: 1, // Virgil
};

/**
 * Deterministic ID generation from a seed string.
 * Uses SHA-256 so the same IR always produces the same element IDs.
 * This enables byte-identical output for identical inputs.
 *
 * @param {string} seed
 * @returns {string} 20-char hex string
 */
function deterministicId(seed) {
  return createHash("sha256").update(seed).digest("hex").slice(0, 20);
}

/**
 * Recursively sort object keys for canonical JSON serialization.
 * Ensures byte-identical output regardless of insertion order.
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
        .map((k) => [k, canonicalize((value)[k])])
    );
  }
  return value;
}

/**
 * Convert a single skeleton IR node to an Excalidraw element.
 * Applies FID-03 safe defaults.
 *
 * @param {object} ir - IR node { type, x, y, w, h, label, children? }
 * @param {string} idSeed - Seed for deterministic ID generation
 * @param {number} depth - Nesting depth for group tracking
 * @returns {{ element: object, childElements: object[] }}
 */
function irNodeToElement(ir, idSeed, depth = 0) {
  const id = deterministicId(idSeed);
  const baseElement = {
    angle: 0,
    backgroundColor: FID03_DEFAULTS.backgroundColor,
    boundElements: null,
    fillStyle: "hachure",
    frameId: null,
    groupIds: [],
    height: ir.h,
    id,
    isDeleted: false,
    link: null,
    locked: false,
    opacity: 100,
    roughness: 1,
    roundness: null,
    seed: 1,
    strokeColor: FID03_DEFAULTS.strokeColor,
    strokeStyle: "solid",
    strokeWidth: 1,
    type: ir.type === "text" ? "text" : "rectangle",
    updated: 1,
    version: 1,
    versionNonce: 1,
    width: ir.w,
    x: ir.x,
    y: ir.y,
  };

  if (ir.type === "text") {
    Object.assign(baseElement, {
      autoResize: true,
      containerId: null,
      fontFamily: FID03_DEFAULTS.fontFamily,
      fontSize: 16,
      lineHeight: 1.25,
      originalText: ir.label ?? "",
      text: ir.label ?? "",
      textAlign: "left",
      verticalAlign: "top",
    });
  } else {
    // frame or rectangle — add label as a text binding
    Object.assign(baseElement, {
      label: {
        text: ir.label ?? "",
      },
    });
  }

  const childElements = [];

  // Recursively convert children
  if (Array.isArray(ir.children) && ir.children.length > 0) {
    for (let ci = 0; ci < ir.children.length; ci++) {
      const child = ir.children[ci];
      const { element: childEl, childElements: grandchildren } = irNodeToElement(
        child,
        `${idSeed}-child-${ci}`,
        depth + 1
      );
      childElements.push(childEl, ...grandchildren);
    }
  }

  return { element: baseElement, childElements };
}

/**
 * Render a skeleton IR array to an Excalidraw document.
 *
 * Per D-54: prefers convertToExcalidrawElements() from @excalidraw/excalidraw.
 * Falls back to direct element construction (Assumption A1) if the package
 * is unavailable (it requires a browser/React environment).
 *
 * @param {Array<{type: string, x: number, y: number, w: number, h: number, label: string, children?: Array}>} irArray
 * @returns {{ type: string, version: number, source: string, elements: object[], appState: object, files: object }}
 */
export function renderSkeletonIR(irArray) {
  if (!Array.isArray(irArray) || irArray.length === 0) {
    throw new Error("renderSkeletonIR: irArray must be a non-empty array");
  }

  // Attempt A1 fallback: direct element construction.
  // convertToExcalidrawElements() from @excalidraw/excalidraw requires a
  // browser/React environment and is not usable in pure Node. We construct
  // the canonical element shape directly using FID-03 defaults.
  const elements = [];
  for (let i = 0; i < irArray.length; i++) {
    const ir = irArray[i];
    const seed = `ir-${i}-${ir.type}-${ir.label ?? ""}`;
    const { element, childElements } = irNodeToElement(ir, seed, 0);
    elements.push(element, ...childElements);
  }

  const doc = {
    appState: {},
    elements,
    files: {},
    source: "complete-design",
    type: "excalidraw",
    version: 2,
  };

  // canonicalize() ensures byte-identical output for identical inputs
  return canonicalize(doc);
}

// CLI usage when invoked via `node bin/complete-design.mjs excalidraw-render`
// (CLI module at assets/scripts/cli/excalidraw-render.mjs wires Commander flags)
