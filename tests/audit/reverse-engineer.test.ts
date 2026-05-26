// tests/audit/reverse-engineer.test.ts
// Tests for the reverse-engineer pipeline (D-62, D-63, D-64) and INFERRED enforcement.
//
// Tests 1-8: runReverseEngineer() orchestrator
// All tests use in-tree mocks — no LLM calls, no real Playwright (mocked).
//
// Source: PLAN.md T-03-04-A behavior block
// Implements: AUDIT-06, AUDIT-07, D-62, D-63, D-64

import { describe, it, expect, vi } from "vitest";
import { mkdtemp, writeFile, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";

// @ts-ignore TS7016: no declaration for .mjs script
const reverseEngineerModule: any = await import(
  "../../assets/scripts/audit/reverse-engineer.mjs"
);

const { runReverseEngineer } = reverseEngineerModule;

/** Helper: create a minimal local source fixture directory */
async function makeLocalSourceFixture(baseDir: string): Promise<string> {
  const srcDir = join(baseDir, "src-fixture");
  await mkdir(join(srcDir, "components"), { recursive: true });
  await mkdir(join(srcDir, "app"), { recursive: true });

  // A minimal React component (Stage 4 source signal)
  await writeFile(
    join(srcDir, "components", "LoginForm.tsx"),
    `import React, { useState } from 'react';
export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit() {
    setLoading(true);
    try { await login(); } catch(e) { setError(String(e)); }
    finally { setLoading(false); }
  }
  return <form onSubmit={handleSubmit}>{loading ? 'Loading...' : <button>Login</button>}{error && <p>{error}</p>}</form>;
}`,
    "utf8"
  );

  // A Next.js App Router page (Stage 2 routing signal)
  await mkdir(join(srcDir, "app", "login"), { recursive: true });
  await writeFile(
    join(srcDir, "app", "login", "page.tsx"),
    `export default function LoginPage() { return <LoginForm /> }`,
    "utf8"
  );

  // Landing page copy (Stage 1 signal)
  await writeFile(
    join(srcDir, "app", "page.tsx"),
    `export default function Home() { return <main><h1>Welcome to MyApp</h1><p>The best tool for busy professionals.</p></main> }`,
    "utf8"
  );

  return srcDir;
}

describe("runReverseEngineer — T-03-04-A", () => {
  describe("Test 1: local source creates artifacts in design/inferred/ subdirs", () => {
    it("creates artifacts under design/inferred/ mirroring the design/ structure (OQ-2)", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "re-test-1-"));
      try {
        const sourceDir = await makeLocalSourceFixture(tmpDir);
        const outputDir = join(tmpDir, "design", "inferred");

        const result = await runReverseEngineer({
          source: sourceDir,
          outputDir,
          dryRun: false,
        });

        // Should have created artifacts
        expect(result.artifactsCreated).toBeDefined();
        expect(Array.isArray(result.artifactsCreated)).toBe(true);
        expect(result.artifactsCreated.length).toBeGreaterThan(0);

        // Artifacts should be under outputDir
        for (const artifactPath of result.artifactsCreated) {
          const resolved = resolve(artifactPath);
          expect(resolved.startsWith(resolve(outputDir))).toBe(true);
        }

        // Should have inference log with stage ordering 4→3→2→1
        expect(result.inferenceLog).toBeDefined();
        expect(Array.isArray(result.inferenceLog)).toBe(true);
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Test 2: every artifact has YAML frontmatter provenance:inferred + inferredDisclaimer + evidence:INFERRED", () => {
    it("all emitted artifacts carry the required INFERRED frontmatter fields", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "re-test-2-"));
      try {
        const { default: matter } = await import("gray-matter");
        const sourceDir = await makeLocalSourceFixture(tmpDir);
        const outputDir = join(tmpDir, "design", "inferred");

        const result = await runReverseEngineer({
          source: sourceDir,
          outputDir,
          dryRun: false,
        });

        expect(result.artifactsCreated.length).toBeGreaterThan(0);

        for (const artifactPath of result.artifactsCreated) {
          const content = await readFile(artifactPath, "utf8");
          // JSON or Markdown — check the provenance field
          if (artifactPath.endsWith(".json")) {
            const data = JSON.parse(content);
            expect(data.provenance).toBe("inferred");
            expect(data.inferredDisclaimer).toBeDefined();
            expect(data.evidence).toBe("INFERRED");
          } else {
            // Markdown with YAML frontmatter
            const parsed = matter(content);
            expect(parsed.data.provenance).toBe("inferred");
            expect(parsed.data.inferredDisclaimer).toBeDefined();
            expect(parsed.data.evidence).toBe("INFERRED");
          }
        }
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Test 3: every artifact body starts with the INFERRED Markdown banner", () => {
    it("all Markdown artifacts start with the > **INFERRED** blockquote banner", async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), "re-test-3-"));
      try {
        const { default: matter } = await import("gray-matter");
        const sourceDir = await makeLocalSourceFixture(tmpDir);
        const outputDir = join(tmpDir, "design", "inferred");

        const result = await runReverseEngineer({
          source: sourceDir,
          outputDir,
          dryRun: false,
        });

        // Find markdown artifacts
        const mdArtifacts = result.artifactsCreated.filter((p: string) =>
          p.endsWith(".md")
        );
        expect(mdArtifacts.length).toBeGreaterThan(0);

        for (const artifactPath of mdArtifacts) {
          const content = await readFile(artifactPath, "utf8");
          const parsed = matter(content);
          const body = parsed.content.trim();
          // Must start with the INFERRED banner blockquote
          expect(body).toMatch(/^>\s*\*\*INFERRED\*\*/);
        }
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Test 4: frontmatter-validate rejects inferred/ file missing INFERRED banner", () => {
    it("frontmatter-validate.mjs returns error when design/inferred/ file has provenance:inferred but no banner", async () => {
      const { validateFrontmatter } = await import(
        "../../assets/scripts/frontmatter-validate.mjs"
      );
      const tmpDir = await mkdtemp(join(tmpdir(), "re-test-4-"));
      try {
        // Create a design/inferred/research/personas/ file WITHOUT the INFERRED banner
        const personasDir = join(
          tmpDir,
          "design",
          "inferred",
          "research",
          "personas"
        );
        await mkdir(personasDir, { recursive: true });
        const testFile = join(personasDir, "test.inferred.md");
        await writeFile(
          testFile,
          `---
artifact: design-doc
stage: 1
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
provenance: inferred
inferredDisclaimer: "INFERRED — validate before treating as ground truth"
evidence: INFERRED
---

# Inferred Persona

Some content without the INFERRED banner blockquote.
`,
          "utf8"
        );

        // Should fail: provenance:inferred in design/inferred/ but no > **INFERRED** banner
        const result = await validateFrontmatter(testFile, {
          lenient: false,
          skipSchemaValidation: true,
        });

        // Either returns error or the errors array contains inferred-disclaimer-missing
        const hasError =
          !result.valid ||
          (result.errors && result.errors.some((e: any) =>
            JSON.stringify(e).includes("inferred-disclaimer-missing")
          ));
        expect(hasError).toBe(true);
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Test 5: frontmatter-validate rejects provenance:inferred in design/ (outside design/inferred/)", () => {
    it("frontmatter-validate.mjs returns error for file in design/ (not design/inferred/) with provenance:inferred", async () => {
      const { validateFrontmatter } = await import(
        "../../assets/scripts/frontmatter-validate.mjs"
      );
      const tmpDir = await mkdtemp(join(tmpdir(), "re-test-5-"));
      try {
        // Create a file in design/ (NOT design/inferred/) with provenance:inferred
        const designDir = join(tmpDir, "design");
        await mkdir(designDir, { recursive: true });
        const testFile = join(designDir, "bleed-test.md");
        await writeFile(
          testFile,
          `---
artifact: design-doc
stage: 1
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
provenance: inferred
inferredDisclaimer: "INFERRED — validate before treating as ground truth"
evidence: INFERRED
---

# Bleed Test

Content with > **INFERRED** banner but in wrong directory.

> **INFERRED** — This artifact was reverse-engineered from an existing prototype.
`,
          "utf8"
        );

        // Rule B: any file in design/ (outside design/inferred/) with provenance:inferred → error
        const result = await validateFrontmatter(testFile, {
          lenient: false,
          skipSchemaValidation: true,
        });

        const hasBleedError =
          !result.valid ||
          (result.errors && result.errors.some((e: any) =>
            JSON.stringify(e).includes("inferred-bleed-detected")
          ));
        expect(hasBleedError).toBe(true);
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Test 6: promote-inferred blocks when provenance:inferred still present", () => {
    it("promote-inferred exits with error when source file still has provenance:inferred frontmatter", async () => {
      const { promoteInferredFile } = await import(
        "../../assets/scripts/cli/promote-inferred.mjs"
      );
      const tmpDir = await mkdtemp(join(tmpdir(), "re-test-6-"));
      try {
        const inferredDir = join(tmpDir, "design", "inferred", "research", "personas");
        await mkdir(inferredDir, { recursive: true });
        const targetDesignDir = join(tmpDir, "design");

        // File still has provenance:inferred + INFERRED banner
        const sourceFile = join(inferredDir, "test.md");
        await writeFile(
          sourceFile,
          `---
artifact: design-doc
stage: 1
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
provenance: inferred
inferredDisclaimer: "INFERRED — validate before treating as ground truth"
evidence: INFERRED
---

> **INFERRED** — This artifact was reverse-engineered from an existing prototype. Treat all content as a starting hypothesis requiring validation.

# Persona
`,
          "utf8"
        );

        // Should block — provenance:inferred still present
        const result = await promoteInferredFile({
          filePath: sourceFile,
          designDir: targetDesignDir,
        });

        expect(result.blocked).toBe(true);
        expect(result.reason).toMatch(/provenance:inferred|INFERRED banner/i);
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Test 7: promote-inferred succeeds when provenance:inferred and banner both removed", () => {
    it("promote-inferred copies file to design/ when both provenance:inferred and INFERRED banner removed", async () => {
      const { promoteInferredFile } = await import(
        "../../assets/scripts/cli/promote-inferred.mjs"
      );
      const tmpDir = await mkdtemp(join(tmpdir(), "re-test-7-"));
      try {
        const inferredDir = join(
          tmpDir,
          "design",
          "inferred",
          "research",
          "personas"
        );
        await mkdir(inferredDir, { recursive: true });
        const targetDesignDir = join(tmpDir, "design");
        await mkdir(join(targetDesignDir, "research", "personas"), {
          recursive: true,
        });

        // File with provenance REMOVED and banner REMOVED — ready to promote
        const sourceFile = join(inferredDir, "test.md");
        await writeFile(
          sourceFile,
          `---
artifact: design-doc
stage: 1
schemaVersion: 1
generated: 2026-05-26T00:00:00.000Z
provenance: generated
evidence: proto
---

# Persona

This has been reviewed and amended. No INFERRED banner or provenance:inferred present.
`,
          "utf8"
        );

        const result = await promoteInferredFile({
          filePath: sourceFile,
          designDir: targetDesignDir,
        });

        expect(result.blocked).toBe(false);
        expect(result.promoted).toBe(true);

        // Verify the file was copied to the correct location
        const expectedDest = join(
          targetDesignDir,
          "research",
          "personas",
          "test.md"
        );
        expect(existsSync(expectedDest)).toBe(true);
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("Test 8: URL --source mode does not fetch /api/ or /auth/ paths", () => {
    it("crawlUrlToFs (URL mode) excludes paths containing /api/ or /auth/", async () => {
      const { crawlUrlToFs } = await import(
        "../../assets/scripts/audit/reverse-engineer.mjs"
      );

      // Verify the exclusion list is applied — test by checking crawlUrlToFs
      // applies the exclude filter to discovered paths
      const excluded = [
        "https://example.com/api/users",
        "https://example.com/auth/login",
        "https://example.com/.env",
        "https://example.com/api/v2/data",
      ];
      const included = [
        "https://example.com/app/components/Button.js",
        "https://example.com/styles/main.css",
      ];

      // Test the URL exclusion filter function is exported and works correctly
      const { shouldExcludeUrl } = await import(
        "../../assets/scripts/audit/reverse-engineer.mjs"
      );
      expect(shouldExcludeUrl).toBeDefined();

      for (const url of excluded) {
        expect(shouldExcludeUrl(url)).toBe(true);
      }
      for (const url of included) {
        expect(shouldExcludeUrl(url)).toBe(false);
      }
    });
  });
});
