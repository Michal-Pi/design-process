// schemas/migrations/persona-v0-to-v1.mjs
// Persona v0 → v1 migration.
//
// v0 personas lacked:
//   - provenance field (introduced in v1 for RED-04 provenance gating)
//   - worstProvenance field (RED-04 carrier)
//   - schemaVersion field
//
// Conservative defaults:
//   - provenance: 'generated' — any v0 persona is treated as generated since
//     no provenance was tracked; the user should review and update if appropriate
//   - worstProvenance: 'generated' — conservative worst-case, same reasoning
//   - schemaVersion: 1
//
// Source: CONTEXT.md D-27; PLAN.md Task 3 behavior block.
// Implements: PERSIST-03, D-27

/**
 * Source schema version.
 * @type {number}
 */
export const fromVersion = 0;

/**
 * Target schema version.
 * @type {number}
 */
export const toVersion = 1;

/**
 * Artifact type this migration applies to.
 * @type {string}
 */
export const artifact = "persona";

/**
 * Migrate a v0 persona to v1.
 *
 * @param {Record<string, unknown>} input - v0 persona data
 * @returns {Promise<Record<string, unknown>>} - v1 persona data
 */
export async function migrate(input) {
  const output = { ...input };

  // Bump schemaVersion to 1.
  output.schemaVersion = 1;

  // Add provenance fields with conservative defaults.
  // v0 had no provenance tracking; 'generated' is the safest default.
  if (!output.provenance) {
    output.provenance = "generated";
  }
  if (!output.worstProvenance) {
    output.worstProvenance = "generated";
  }

  // Ensure generated timestamp exists (v0 may have used 'createdAt' or similar).
  if (!output.generated && output.createdAt) {
    output.generated = output.createdAt;
    delete output.createdAt;
  }
  if (!output.generated) {
    output.generated = new Date().toISOString();
  }

  // Ensure lastReviewedAt exists.
  if (!output.lastReviewedAt) {
    output.lastReviewedAt = output.generated;
  }

  // Ensure owner exists.
  if (!output.owner) {
    output.owner = "unknown@complete-design.dev";
  }

  // Ensure sourceHash exists (set to a placeholder; real hash should be computed).
  if (!output.sourceHash) {
    // Compute a deterministic placeholder; real migration scripts should hash the
    // upstream content. This placeholder is clearly identifiable as synthetic.
    output.sourceHash =
      "sha256:0000000000000000000000000000000000000000000000000000000000000000";
  }

  return output;
}
