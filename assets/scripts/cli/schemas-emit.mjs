// assets/scripts/cli/schemas-emit.mjs
// CLI subcommand: complete-design schemas:emit
// Proxies to assets/scripts/schemas/emit.mjs.
// Auto-discovered by bin/complete-design.mjs.

export const command = {
  name: "schemas:emit",
  describe: "Emit versioned Draft 2020-12 JSON Schemas for all artifact types",

  builder: (cmd) => cmd,

  handler: async (_args) => {
    const { emitSchemas } = await import("../schemas/emit.mjs");
    await emitSchemas();
  },
};
