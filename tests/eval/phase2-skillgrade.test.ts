// tests/eval/phase2-skillgrade.test.ts
// Phase 2 skillgrade recall ≥0.85 assertion for all 6 Phase 2 SKILL.md files.
// SC-5 (F-02) measurement harness: verifies trigger recall for each new Phase 2 skill.
//
// Uses the A2 static-analysis fallback (no LLM required).
//
// Tuned descriptions for recall ≥0.85 are documented in the trigger YAML files.
//
// Implements: SC-5, TRIG-01, TRIG-02, D-17

import { describe, it, expect } from 'vitest';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

// Phase 2 trigger YAML files and their corresponding skill names
const PHASE2_SKILLS = [
  { skill: 'complete-design/ingest', triggersPath: 'evals/triggers/ingest/triggers.yaml' },
  { skill: 'complete-design/discover', triggersPath: 'evals/triggers/discover/triggers.yaml' },
  { skill: 'complete-design/structure', triggersPath: 'evals/triggers/structure/triggers.yaml' },
  { skill: 'complete-design/style', triggersPath: 'evals/triggers/style/triggers.yaml' },
  { skill: 'complete-design/systematize', triggersPath: 'evals/triggers/systematize/triggers.yaml' },
  { skill: 'complete-design/audit', triggersPath: 'evals/triggers/audit/triggers.yaml' },
];

describe('Phase 2 skillgrade: trigger YAML file quality (SC-5)', () => {
  for (const { skill, triggersPath } of PHASE2_SKILLS) {
    it(`${skill}: triggers.yaml exists`, () => {
      const fullPath = join(ROOT, triggersPath);
      expect(existsSync(fullPath), `Missing triggers.yaml for ${skill}: ${triggersPath}`).toBe(true);
    });

    it(`${skill}: has ≥10 shouldFire prompts`, async () => {
      const fullPath = join(ROOT, triggersPath);
      const content = await readFile(fullPath, 'utf8');
      const parsed = parseYaml(content) as { shouldFire: Array<{ prompt: string }> };
      expect(Array.isArray(parsed.shouldFire)).toBe(true);
      expect(parsed.shouldFire.length).toBeGreaterThanOrEqual(10);
    });

    it(`${skill}: has ≥10 shouldNotFire prompts`, async () => {
      const fullPath = join(ROOT, triggersPath);
      const content = await readFile(fullPath, 'utf8');
      const parsed = parseYaml(content) as { shouldNotFire: Array<{ prompt: string }> };
      expect(Array.isArray(parsed.shouldNotFire)).toBe(true);
      expect(parsed.shouldNotFire.length).toBeGreaterThanOrEqual(10);
    });

    it(`${skill}: triggers.yaml skill field matches expected skill name`, async () => {
      const fullPath = join(ROOT, triggersPath);
      const content = await readFile(fullPath, 'utf8');
      const parsed = parseYaml(content) as { skill: string };
      expect(parsed.skill).toBe(skill);
    });

    it(`${skill}: all shouldFire prompts have string prompt field`, async () => {
      const fullPath = join(ROOT, triggersPath);
      const content = await readFile(fullPath, 'utf8');
      const parsed = parseYaml(content) as { shouldFire: Array<{ prompt: string }> };
      for (const entry of parsed.shouldFire) {
        expect(typeof entry.prompt).toBe('string');
        expect(entry.prompt.length).toBeGreaterThan(0);
      }
    });
  }
});

describe('Phase 2 skillgrade: recall ≥0.85 via static-analysis harness (SC-5)', () => {
  // NOTE: The A2 static-analysis fallback (keyword overlap) is used here.
  // Full LLM-based recall measurement is a Phase 4 GA release gate.
  // This test validates the harness structure and that recall is non-zero.
  //
  // The SKILL.md descriptions are front-loaded with trigger phrases per D-32
  // to achieve ≥0.85 recall in the static-analysis fallback.

  it('runSkillgrade is importable', async () => {
    // @ts-ignore TS7016
    const mod = await import('../../evals/runners/skillgrade.mjs');
    expect(typeof (mod as { runSkillgrade: unknown }).runSkillgrade).toBe('function');
  });

  for (const { skill, triggersPath } of PHASE2_SKILLS) {
    it(`${skill}: skillgrade recall ≥0.85 (static-analysis fallback)`, async () => {
      // @ts-ignore TS7016
      const { runSkillgrade } = await import('../../evals/runners/skillgrade.mjs') as {
        runSkillgrade: (opts: {
          skill: string;
          triggersPath: string;
          skillsDir?: string;
        }) => Promise<{
          skill: string;
          recall: number;
          falseFireRate: number;
          pass: boolean;
        }>;
      };

      const result = await runSkillgrade({
        skill,
        triggersPath: join(ROOT, triggersPath),
      });

      expect(typeof result.recall).toBe('number');
      expect(result.recall).toBeGreaterThanOrEqual(0.85);

      // Document the measurement in the test output (useful for CI logs)
      if (!result.pass || result.recall < 0.85) {
        console.warn(
          `SC-5 WARNING: ${skill} recall=${result.recall.toFixed(3)} falseFireRate=${result.falseFireRate.toFixed(3)}. ` +
          `If recall < 0.85: tune the SKILL.md description per D-32.`
        );
      }
    }, { timeout: 30000 }); // Allow up to 30s for 3 trials × ≥10 prompts
  }
});
