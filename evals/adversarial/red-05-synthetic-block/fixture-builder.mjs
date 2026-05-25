// evals/adversarial/red-05-synthetic-block/fixture-builder.mjs
// Fixture builder for RED-05 adversarial CI suite.
//
// Exports buildSyntheticOnlyFixture(tmpDir, seed) — creates a minimal
// design/research/personas/ directory in tmpDir with exactly 2 synthetic personas
// (provenance:'generated', varying seed values so each fixture is distinct).
//
// Intentionally:
// - No interviews/ directory (so allSynthetic + no interviews path fires)
// - No ASSUMPTIONS.md (triggers finding 1-provenance-002 in addition to 001)
//
// Does NOT call an LLM. All persona content is hardcoded minimal JSON.
// Per D-37, Anti-Pattern 3: gate logic is pure script, no LLM calls.
//
// Source: CONTEXT.md D-50, RED-05
// Implements: RED-05, ACCEPT-02

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Persona name pool for seed-based selection.
 * 100 distinct names to give each fixture a unique identity.
 */
const PERSONA_NAMES = [
  "The Overloaded IC", "The Sprint Planner", "The Knowledge Hoarder",
  "The Context Switcher", "The Meeting Survivor", "The Async Worker",
  "The Deep Diver", "The Quick Scanner", "The Note Taker", "The Delegator",
  "The Tool Collector", "The Process Optimizer", "The Fire Fighter",
  "The Long-Term Planner", "The Stakeholder Juggler", "The Inbox Zero Seeker",
  "The Remote Collaborator", "The Deadline Chaser", "The System Thinker",
  "The Feedback Loop Closer", "The Documentation Skipper", "The API Integrator",
  "The Dashboard Watcher", "The Manual Overrider", "The Power User",
  "The Skeptical Adopter", "The Early Adopter", "The Reluctant Migrator",
  "The Compliance Checker", "The Privacy Guardian", "The Speed Optimizer",
  "The Thoroughness Advocate", "The Cross-Functional Liaison", "The Data Consumer",
  "The Insight Seeker", "The Pattern Recognizer", "The Edge Case Hunter",
  "The Workflow Designer", "The Template Builder", "The Reuse Advocate",
  "The Solo Founder", "The Startup CTO", "The Indie Hacker", "The PM Survivor",
  "The Design Token Skeptic", "The Figma Power User", "The Code-First Designer",
  "The Design System Maintainer", "The Component Library Curator",
  "The Style Guide Keeper", "The Brand Guardian", "The Accessibility Champion",
  "The Responsive Layout Expert", "The Dark Mode Advocate", "The Typography Nerd",
  "The Color System Architect", "The Icon System Curator", "The Animation Minimalist",
  "The Performance Budget Guardian", "The Bundle Size Watchdog",
  "The Test Coverage Advocate", "The CI Pipeline Engineer", "The Deployment Automator",
  "The Feature Flag Strategist", "The A/B Test Runner", "The Analytics Interpreter",
  "The Funnel Optimizer", "The Churn Reducer", "The Onboarding Designer",
  "The Empty State Writer", "The Error Message Humanizer", "The Loading State Designer",
  "The Progressive Disclosure Champion", "The Information Architect",
  "The Navigation Designer", "The Search Experience Designer",
  "The Mobile-First Designer", "The Touch Target Measurer", "The Scroll Behavior Designer",
  "The Form UX Optimizer", "The Validation Pattern Expert", "The Keyboard Navigator",
  "The Screen Reader Tester", "The Contrast Ratio Checker", "The Focus Indicator Designer",
  "The Internationalization Planner", "The RTL Layout Expert", "The Date Format Handler",
  "The Timezone Strategist", "The Locale Switcher", "The Content Strategist",
  "The Microcopy Editor", "The Tone of Voice Keeper", "The Help Text Writer",
  "The Tooltip Designer", "The Modal Dialog Minimalist", "The Alert Fatigue Reducer",
  "The Notification Designer", "The Status Page Maintainer", "The Changelog Writer",
  "The Release Notes Author", "The Deprecation Handler",
];

/**
 * Cognitive space pool for varied persona content.
 */
const COGNITIVE_SPACES = [
  "Thinks in terms of task completion and cognitive overhead reduction",
  "Maintains mental maps of team knowledge and information flow",
  "Optimizes for async collaboration and context preservation",
  "Focuses on reducing friction in daily workflows",
  "Prioritizes speed of retrieval over perfect organization",
  "Values predictable systems over flexible but complex ones",
  "Prefers progressive disclosure over feature completeness",
  "Seeks patterns and reusable solutions in every problem",
  "Thinks in terms of user flows and decision trees",
  "Optimizes for first-time understanding, not power-user efficiency",
];

/**
 * Build a minimal synthetic-only fixture in the given tmpDir.
 * Creates research/personas/ with exactly 2 synthetic personas.
 * No interviews/ directory, no ASSUMPTIONS.md.
 *
 * @param {string} tmpDir - Temporary directory to build fixture in
 * @param {number} seed - Seed value (0..99) for distinct fixture identity
 * @returns {Promise<void>}
 */
export async function buildSyntheticOnlyFixture(tmpDir, seed) {
  const personasDir = join(tmpDir, "research", "personas");
  await mkdir(personasDir, { recursive: true });

  // Select two persona names based on seed (distinct from each other)
  const name1 = PERSONA_NAMES[seed % PERSONA_NAMES.length];
  const name2 = PERSONA_NAMES[(seed + 50) % PERSONA_NAMES.length];
  const cogSpace1 = COGNITIVE_SPACES[seed % COGNITIVE_SPACES.length];
  const cogSpace2 = COGNITIVE_SPACES[(seed + 5) % COGNITIVE_SPACES.length];

  // Persona 1: synthetic
  const persona1Content = `---
artifact: persona
stage: "1"
schemaVersion: 1
provenance: generated
worstProvenance: generated
generated: "2026-05-25T00:00:00.000Z"
owner: design-os/red-05-adversarial
lastReviewedAt: "2026-05-25T00:00:00.000Z"
sourceHash: "sha256:${"a".repeat(64 - seed.toString().length)}${seed.toString().padStart(seed.toString().length, "0")}"
---
{
  "name": "${name1} (seed-${seed})",
  "jobsToBeDone": [
    "Complete primary task efficiently (seed ${seed})",
    "Reduce context-switching overhead"
  ],
  "thinkingStyle": {
    "cognitiveSpace": "${cogSpace1}",
    "emotionalReactions": [
      "Frustrated when workflows break unexpectedly",
      "Satisfied when systems behave predictably"
    ],
    "guidingPrinciples": [
      "Consistency reduces errors",
      "Good defaults beat flexible configuration"
    ]
  }
}
`;

  // Persona 2: also synthetic (different name, same generated provenance)
  const persona2Content = `---
artifact: persona
stage: "1"
schemaVersion: 1
provenance: generated
worstProvenance: generated
generated: "2026-05-25T00:00:00.000Z"
owner: design-os/red-05-adversarial
lastReviewedAt: "2026-05-25T00:00:00.000Z"
sourceHash: "sha256:${"b".repeat(64 - seed.toString().length)}${seed.toString().padStart(seed.toString().length, "0")}"
---
{
  "name": "${name2} (seed-${seed})",
  "jobsToBeDone": [
    "Collaborate effectively with distributed teammates (seed ${seed})",
    "Maintain context across async conversations"
  ],
  "thinkingStyle": {
    "cognitiveSpace": "${cogSpace2}",
    "emotionalReactions": [
      "Anxious when context is missing from shared artifacts",
      "Confident when documentation is current and complete"
    ],
    "guidingPrinciples": [
      "Documentation beats memory",
      "Explicit communication prevents misalignment"
    ]
  }
}
`;

  await writeFile(join(personasDir, "persona-a.persona.json"), persona1Content, "utf8");
  await writeFile(join(personasDir, "persona-b.persona.json"), persona2Content, "utf8");

  // Deliberately: no interviews/ directory, no ASSUMPTIONS.md
  // This ensures the allSynthetic branch fires and returns pass_with_warnings
}
