// assets/scripts/cli/eval-skillgrade.mjs
// CLI subcommand: complete-design eval skillgrade --skill <name> --triggers <path>
// Auto-discovered by bin/complete-design.mjs dispatcher (Plan 01 contract).
// Plan 03 does NOT modify bin/complete-design.mjs.
//
// Note: whitespace in `name` ('eval skillgrade') triggers the nested-group
// registration in bin/complete-design.mjs: first segment = parent command 'eval',
// remaining = subcommand 'skillgrade'. Results in: complete-design eval skillgrade ...
//
// Source: PLAN.md Task 2 action; bin/complete-design.mjs dispatcher contract
// Implements: TRIG-01, TRIG-02 (CLI entry point for per-skill trigger eval)

/**
 * @type {{ name: string, describe: string, builder: (cmd: import('commander').Command) => void, handler: (opts: Record<string, unknown>) => Promise<void> }}
 */
export const command = {
  name: "eval skillgrade",
  describe: "Per-skill trigger eval (recall ≥0.85, false-fire ≤0.15)",

  builder(cmd) {
    cmd
      .requiredOption("--skill <name>", "Skill name to evaluate (e.g., design)")
      .requiredOption(
        "--triggers <path>",
        "Path to triggers.yaml for the skill"
      )
      .option(
        "--skills-dir <path>",
        "Directory containing SKILL.md files to dispatch against"
      );
  },

  async handler({ skill, triggers, skillsDir }) {
    const { runSkillgrade } = await import("../../../evals/runners/skillgrade.mjs");
    const result = await runSkillgrade({
      skill: String(skill),
      triggersPath: String(triggers),
      skillsDir: skillsDir ? String(skillsDir) : undefined,
    });

    console.log(JSON.stringify(result, null, 2));

    if (!result.pass) {
      console.error(
        `\neval skillgrade: FAIL — ${result.skill}: recall=${result.recall.toFixed(3)}, falseFireRate=${result.falseFireRate.toFixed(3)}`
      );
      process.exit(1);
    } else {
      console.log(
        `\neval skillgrade: PASS — ${result.skill}: recall=${result.recall.toFixed(3)}, falseFireRate=${result.falseFireRate.toFixed(3)}`
      );
    }
  },
};
