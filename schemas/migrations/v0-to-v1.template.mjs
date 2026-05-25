// schemas/migrations/v0-to-v1.template.mjs
// Template for per-artifact v0 → v1 migration scripts.
// Copy this file, rename to <artifact>-v0-to-v1.mjs, implement migrate().
// Source: CONTEXT.md D-27; PLAN.md Task 3 action.
// Implements: PERSIST-03, D-27

/**
 * The source schema version this migration reads from.
 * @type {number}
 */
export const fromVersion = 0;

/**
 * The target schema version this migration writes to.
 * @type {number}
 */
export const toVersion = 1;

/**
 * The artifact type this migration applies to.
 * Must match the artifact name in schemas/src/ and schemas/dist/.
 * @type {string}
 */
export const artifact = "<artifact>";

/**
 * Migrate an artifact from v0 to v1.
 *
 * CONTRACT:
 *   - input: a plain JS object representing the v0 artifact (parsed JSON/YAML)
 *   - output: a plain JS object conforming to the v1 schema
 *   - must return synchronously or as a Promise
 *   - must NOT mutate the input object
 *   - output must pass ajv validation against <artifact>.v1.json before being persisted
 *
 * Pitfall G prevention: any PR that changes schemas/src/<artifact>.ts and bumps
 * the major version MUST also add a migration script here. Enforce via CI rule
 * (shipped in Plan 03: design-os verify --golden checks for migration coverage).
 *
 * @param {Record<string, unknown>} input - v0 artifact data
 * @returns {Promise<Record<string, unknown>>} - v1 artifact data
 */
export async function migrate(input) {
  // TODO: implement v0 → v1 migration for this artifact.
  // Minimal pattern: add required v1 fields with conservative defaults.
  return {
    ...input,
    schemaVersion: 1,
    // Add any new required fields here with conservative defaults.
    // See persona-v0-to-v1.mjs for a concrete example.
  };
}
