import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "evals/adversarial/**/*.test.ts"],
    environment: "node",
  },
});
