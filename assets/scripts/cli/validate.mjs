// assets/scripts/cli/validate.mjs
// CLI subcommand: complete-design validate --artifact <name> --file <path>
// Source: PLAN.md Task 2 action block; D-03 structured error on exit 1.
// Auto-discovered by bin/complete-design.mjs.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validate } from "../schemas/validate.mjs";

export const command = {
  name: "validate",
  describe: "Validate an artifact JSON/YAML file against its versioned JSON Schema",

  builder: (cmd) =>
    cmd
      .requiredOption("--artifact <type>", "Artifact type (e.g. persona, sitemap, manifest, interaction-spec, audit-report, handoff-bundle)")
      .requiredOption("--file <path>", "Path to the artifact file to validate"),

  handler: async (args) => {
    const { artifact, file } = args;
    const filePath = resolve(file);

    let data;
    try {
      const raw = await readFile(filePath, "utf8");
      data = JSON.parse(raw);
    } catch (err) {
      process.stderr.write(
        `[validate] Failed to read/parse ${filePath}: ${err.message}\n`
      );
      process.exit(1);
    }

    const result = await validate(artifact, data);

    if (result.valid) {
      process.stdout.write(
        `[validate] OK — ${artifact} at ${filePath} is valid.\n`
      );
      process.exit(0);
    } else {
      process.stderr.write(
        `[validate] INVALID — ${artifact} at ${filePath} has ${result.errors.length} error(s):\n`
      );
      for (const err of result.errors) {
        process.stderr.write(
          `  schemaPath: ${err.schemaPath}, instancePath: ${err.instancePath}, keyword: ${err.keyword}, message: ${err.message}\n`
        );
        if (err.params && Object.keys(err.params).length > 0) {
          process.stderr.write(
            `    dataPath: ${err.instancePath}, params: ${JSON.stringify(err.params)}\n`
          );
        }
      }
      process.exit(1);
    }
  },
};
