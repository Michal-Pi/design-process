// tests/types.d.ts
// Ambient module declaration for .mjs scripts imported from test files.
//
// The project ships deterministic scripts as plain ES modules (.mjs) without
// TypeScript declaration files. Test files import these scripts to exercise
// their exported functions. Without this declaration, tsc TS7016-errors on
// every import because no .d.ts exists for any .mjs file.
//
// This is intentional: .mjs scripts are the source of truth; we do not emit
// .d.ts alongside them. The ambient wildcard here tells tsc "trust the import
// at the test boundary; vitest/tsx handles the runtime resolution."
//
// CLAUDE.md: no unannotated @ts-ignore. This is the canonical alternative to
// per-import @ts-ignore annotations for the entire .mjs surface.

declare module "*.mjs";
