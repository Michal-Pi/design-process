// .eslintrc.cjs
// ESLint configuration for design-os.
//
// Key rules:
// 1. @typescript-eslint/switch-exhaustiveness-check — catches missing cases in GateResult
//    discriminated union switches at build time (Pitfall F mitigation handed off from Plan 02).
// 2. no-restricted-imports — defense-in-depth against LLM client imports inside assets/scripts/
//    (lint-determinism.mjs is the primary gate; ESLint catches at IDE level before CI).
//
// Source: PLAN.md Task 1 action; RESEARCH.md "Pitfall F" + "Pitfall G"
// Implements: Pitfall F mitigation (@typescript-eslint/switch-exhaustiveness-check)

"use strict";

module.exports = {
  root: true,

  parser: "@typescript-eslint/parser",

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    // project: './tsconfig.json' is required for type-aware rules.
    // Set this if you want full type-checking; omit if you only want syntax rules.
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },

  plugins: ["@typescript-eslint"],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],

  rules: {
    // === Pitfall F mitigation: switch exhaustiveness on GateResult discriminators ===
    // Catches missing `case` branches in switch statements on discriminated unions.
    // Required before per-stage gates receive real business logic in Phase 2.
    // Without this rule, adding a new GateResult kind silently allows missing handlers.
    "@typescript-eslint/switch-exhaustiveness-check": "error",

    // === Defense-in-depth: LLM client import guard (D-13) ===
    // lint-determinism.mjs is the primary CI gate; this rule catches violations at IDE level.
    // T-03-03: anyone going out of their way to bypass both layers is acting in bad faith.
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@anthropic-ai/*", "@openai/*", "anthropic*", "openai*"],
            message:
              "LLM client imports are forbidden inside assets/scripts/ per D-13 architecture rule.",
          },
          {
            group: ["langchain*", "llamaindex*"],
            message:
              "LLM framework imports are forbidden inside assets/scripts/ per D-13 architecture rule.",
          },
        ],
      },
    ],

    // === TypeScript strict rules ===
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
  },

  env: {
    node: true,
    es2022: true,
  },

  ignorePatterns: [
    "node_modules/",
    "schemas/dist/",
    "evals/",
    "*.config.{js,ts,cjs,mjs}",
    "vitest.config.ts",
  ],

  overrides: [
    {
      // Test files — relax some rules
      files: ["tests/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
      },
    },
    {
      // .mjs scripts — CJS module pattern not applicable
      files: ["assets/scripts/**/*.mjs"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
      },
    },
  ],
};
