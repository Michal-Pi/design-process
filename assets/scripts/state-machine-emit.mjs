// assets/scripts/state-machine-emit.mjs
// Single IR → Mermaid stateDiagram-v2 + conditional XState v5 machine emitter.
//
// INVARIANT-05: No LLM client imports — this is a deterministic emitter.
// Must pass lint-determinism.mjs.
//
// D-57: XState emitted ONLY when asyncOperations:true AND stateCount>=3 AND hasConditionalTransitions:true.
// D-58: Mermaid stateDiagram-v2 is the designer-canonical artifact (always emitted).
// D-59: Canonical artifact for Stage 4 gate checks.
//
// Source: CONTEXT.md D-57, D-58; PLAN.md 03-02 Task A
// Implements: ATOM-10, WF-05

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// ─────────────────────────────────────────────────────────────────────────────
// Type annotations (JSDoc only — no TypeScript at runtime)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   name: string,
 *   type: 'loading' | 'empty' | 'error' | 'success' | 'custom'
 * }} StateSpec
 *
 * @typedef {{
 *   from: string,
 *   to: string,
 *   event: string,
 *   guard?: string
 * }} TransitionSpec
 *
 * @typedef {{
 *   asyncOperations: boolean,
 *   stateCount: number,
 *   hasConditionalTransitions: boolean,
 *   states: StateSpec[],
 *   transitions: TransitionSpec[]
 * }} InteractionSpec
 *
 * @typedef {{
 *   mermaidSource: string,
 *   xstateSource: string | null
 * }} EmitFromSpecResult
 */

// ─────────────────────────────────────────────────────────────────────────────
// D-57: XState trigger heuristic (deterministic, no LLM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine whether XState v5 machine should be emitted for this spec.
 * D-57: All three conditions must be true.
 *
 * @param {InteractionSpec} spec
 * @returns {boolean}
 */
export function needsXState(spec) {
  return (
    spec.asyncOperations === true &&
    spec.stateCount >= 3 &&
    spec.hasConditionalTransitions === true
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mermaid stateDiagram-v2 emitter (D-58)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map state type to a simple annotation comment for Mermaid output.
 * @param {'loading'|'empty'|'error'|'success'|'custom'} type
 * @returns {string}
 */
function stateTypeAnnotation(type) {
  switch (type) {
    case 'loading':
      return ' %% loading';
    case 'empty':
      return ' %% empty';
    case 'error':
      return ' %% error';
    case 'success':
      return ' %% success';
    default:
      return '';
  }
}

/**
 * Emit a deterministic Mermaid stateDiagram-v2 string from an interaction spec.
 * Output is canonicalized (transitions sorted alphabetically) for byte-identical
 * determinism.
 *
 * @param {InteractionSpec} spec
 * @returns {string}
 */
export function emitMermaid(spec) {
  const lines = ['stateDiagram-v2'];

  // Emit state annotations (sorted by name for determinism)
  const sortedStates = [...spec.states].sort((a, b) => a.name.localeCompare(b.name));
  for (const state of sortedStates) {
    const annotation = stateTypeAnnotation(state.type);
    if (annotation) {
      lines.push(`  ${state.name} :${annotation}`);
    }
  }

  // Entry transition: [*] → first state (first in the original array order, as declared)
  if (spec.states.length > 0) {
    lines.push(`  [*] --> ${spec.states[0].name}`);
  }

  // Emit transitions (sorted for determinism: "from --> to : event" alphabetically)
  const sortedTransitions = [...spec.transitions].sort((a, b) => {
    const keyA = `${a.from}-->${a.to}:${a.event}`;
    const keyB = `${b.from}-->${b.to}:${b.event}`;
    return keyA.localeCompare(keyB);
  });

  for (const t of sortedTransitions) {
    const guardClause = t.guard ? ` [${t.guard}]` : '';
    lines.push(`  ${t.from} --> ${t.to} : ${t.event}${guardClause}`);
  }

  return lines.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// XState v5 machine emitter (D-57 conditional)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit an XState v5 TypeScript machine string using the setup() pattern.
 * Only called when needsXState(spec) is true.
 *
 * Uses assign() for DONE/ERROR transitions per Context7 /statelyai/xstate pattern.
 *
 * @param {InteractionSpec} spec
 * @returns {string}
 */
export function emitXState(spec) {
  // Build states object
  const sortedStates = [...spec.states].sort((a, b) => a.name.localeCompare(b.name));

  // Build per-state on: transition maps
  const stateMap = new Map();
  for (const state of spec.states) {
    stateMap.set(state.name, { type: state.type, transitions: [] });
  }
  for (const t of spec.transitions) {
    const entry = stateMap.get(t.from);
    if (entry) {
      entry.transitions.push(t);
    }
  }

  // Generate states object entries (sorted for determinism)
  const stateEntries = sortedStates.map((state) => {
    const entry = stateMap.get(state.name);
    if (!entry || entry.transitions.length === 0) {
      return `    ${state.name}: {},`;
    }

    // Sort transitions by event for determinism
    const sortedTrans = [...entry.transitions].sort((a, b) => a.event.localeCompare(b.event));

    const onEntries = sortedTrans.map((t) => {
      const isDoneOrError = t.event === 'DONE' || t.event === 'ERROR';
      if (isDoneOrError) {
        return `        ${t.event}: {
          target: '${t.to}',
          actions: assign({}),
        },`;
      }
      return `        ${t.event}: '${t.to}',`;
    }).join('\n');

    return `    ${state.name}: {
      on: {
${onEntries}
      },
    },`;
  }).join('\n');

  // Build events union type (sorted for determinism)
  const eventTypes = [...new Set(spec.transitions.map((t) => t.event))].sort();
  const eventsUnion = eventTypes.map((e) => `  | { type: '${e}' }`).join('\n');

  const ts = `import { setup, assign } from 'xstate';

export const machine = setup({
  types: {
    context: {} as Record<string, unknown>,
    events: {} as ${eventsUnion || '{ type: string }'},
  },
}).createMachine({
  initial: '${spec.states[0]?.name ?? 'idle'}',
  states: {
${stateEntries}
  },
});
`;

  return ts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined emitter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit both Mermaid (always) and XState (conditionally per D-57) from a spec object.
 *
 * @param {InteractionSpec} spec
 * @returns {EmitFromSpecResult}
 */
export function emitFromSpec(spec) {
  const mermaidSource = emitMermaid(spec);
  const xstateSource = needsXState(spec) ? emitXState(spec) : null;

  return { mermaidSource, xstateSource };
}

// ─────────────────────────────────────────────────────────────────────────────
// File-based emitter (for CLI use)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read, parse, and emit from a .spec.md file (with YAML frontmatter).
 * Validates path for security (no .. traversal).
 *
 * @param {string} specPath - Path to the .spec.md file
 * @param {string} outputDir - Directory to write outputs to
 * @param {string} [screenName] - Override screen name (defaults to stem of specPath)
 * @returns {Promise<{ diagramPath: string, machinePath: string | null, mermaidSource: string, xstateSource: string | null, repairNeeded: boolean, repairError?: string }>}
 */
export async function emitToFiles(specPath, outputDir, screenName) {
  // T-03-02-01 security: validate --spec path
  const resolvedSpec = resolve(specPath);

  // Reject paths with .. traversal attempts
  if (specPath.includes('..')) {
    throw new Error(`Security: --spec path must not contain '..': ${specPath}`);
  }

  // Reject absolute paths that look like injection attempts (must be .spec.md)
  if (!resolvedSpec.endsWith('.spec.md')) {
    throw new Error(`Security: --spec path must end in .spec.md: ${specPath}`);
  }

  if (!existsSync(resolvedSpec)) {
    throw new Error(`Spec file not found: ${resolvedSpec}`);
  }

  // Derive screen name from file stem if not provided
  const stem = basename(resolvedSpec, '.spec.md');
  const screen = screenName ?? stem;

  // Parse spec file — extract YAML frontmatter using gray-matter
  let matter;
  try {
    const { default: grayMatter } = await import('gray-matter');
    const raw = readFileSync(resolvedSpec, 'utf8');
    matter = grayMatter(raw);
  } catch (err) {
    throw new Error(`Failed to parse spec file: ${err.message}`);
  }

  // Build spec object from frontmatter data
  const data = matter.data;
  const spec = /** @type {InteractionSpec} */ ({
    asyncOperations: Boolean(data.asyncOperations),
    stateCount: Number(data.stateCount ?? 0),
    hasConditionalTransitions: Boolean(data.hasConditionalTransitions),
    states: Array.isArray(data.states) ? data.states : [],
    transitions: Array.isArray(data.transitions) ? data.transitions : [],
  });

  // Validate spec fields via ajv
  const { validate } = await import('./schemas/validate.mjs');
  const specForValidation = {
    artifact: 'interaction-spec',
    stage: '4',
    schemaVersion: 1,
    sourceHash: `sha256:${'0'.repeat(64)}`,
    generated: new Date().toISOString(),
    provenance: 'generated',
    owner: 'design-os',
    lastReviewedAt: new Date().toISOString(),
    screen,
    states: spec.states,
    mermaidStateDiagram: 'placeholder',
    ...data,
  };

  // Note: we don't hard-fail on schema validation here — partial specs during
  // iterative editing are common. Log warning but continue.
  const validationResult = await validate('interaction-spec', specForValidation);
  if (!validationResult.valid) {
    process.stderr.write(`Warning: spec validation issues in ${specPath}: ${JSON.stringify(validationResult.errors.slice(0, 3))}\n`);
  }

  // Emit
  const { mermaidSource, xstateSource } = emitFromSpec(spec);

  // Validate Mermaid output via mermaid-render.mjs
  const { validateMermaidSource } = await import('./mermaid-render.mjs');
  let repairNeeded = false;
  let repairError;

  try {
    await validateMermaidSource(mermaidSource);
  } catch (err) {
    // Max-2-retry signal — caller (SKILL.md) handles re-generation
    repairNeeded = true;
    repairError = String(err.message ?? err);
    process.stderr.write(`Mermaid validation failed for ${screen}: ${repairError}\n`);
    process.stderr.write('Signal: repair-needed. SKILL.md caller must re-generate diagram and re-run.\n');
  }

  // Write output files
  const { mkdir: mkdirAsync, writeFile } = await import('node:fs/promises');
  await mkdirAsync(outputDir, { recursive: true });

  const resolvedOutputDir = resolve(outputDir);
  const diagramPath = join(resolvedOutputDir, `${screen}.diagram.mmd`);
  const machinePath = xstateSource ? join(resolvedOutputDir, `${screen}.machine.ts`) : null;

  await writeFile(diagramPath, mermaidSource, 'utf8');
  if (xstateSource && machinePath) {
    await writeFile(machinePath, xstateSource, 'utf8');
  }

  return { diagramPath, machinePath, mermaidSource, xstateSource, repairNeeded, repairError };
}
