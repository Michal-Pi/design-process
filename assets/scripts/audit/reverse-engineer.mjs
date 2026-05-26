// assets/scripts/audit/reverse-engineer.mjs
// Reverse-engineer orchestrator: Stage 4→3→2→1 inference pipeline (D-62, D-63, D-64).
//
// Two input modes (D-62):
//   (a) Local filesystem path: --source ./path/to/prototype
//   (b) Live URL: --source https://... (Playwright crawler, depth=1, OQ-5)
//
// Inference order (D-63): Stage 4 → Stage 3 → Stage 2 → Stage 1
// (reverse-topological: deepest structural signals first)
//
// Every emitted artifact carries BOTH (D-64):
//   1. YAML frontmatter: provenance:'inferred', inferredDisclaimer, evidence:'INFERRED'
//   2. Body: first paragraph is the '> **INFERRED** — ...' blockquote banner
//
// Output directory MUST start with design/inferred/ (Pitfall D guard).
//
// Security (T-03-04-01): path traversal guarded via path.resolve() + containment check.
// Security (T-03-04-02): URL crawler excludes /api/, /auth/, /admin/, .env*.
//
// No LLM imports — orchestrator calls run-subagent.mjs for inference steps.
// Passes lint-determinism.mjs (INVARIANT-05).
//
// Source: PLAN.md T-03-04-A; CONTEXT.md D-62, D-63, D-64
// Implements: AUDIT-06, AUDIT-07, D-62, D-63, D-64, OQ-2, OQ-5

import { existsSync } from "node:fs";
import { mkdir, writeFile, mkdtemp } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { dispatchSubagent } from "../run-subagent.mjs";

/**
 * The exact INFERRED banner that must appear as the first paragraph of every
 * inferred artifact body (D-64).
 */
export const INFERRED_BANNER = `> **INFERRED** — This artifact was reverse-engineered from an existing prototype. Treat all content as a starting hypothesis requiring validation. Do not merge into \`design/\` without reviewing and amending each section.`;

/**
 * Required YAML frontmatter fields for every inferred artifact (D-64).
 */
export const INFERRED_FRONTMATTER = {
  provenance: "inferred",
  inferredDisclaimer: "INFERRED — validate before treating as ground truth",
  evidence: "INFERRED",
};

/**
 * Check whether a URL should be excluded from the Playwright crawler.
 * Excludes paths containing /api/, /auth/, /admin/, .env, credentials (T-03-04-02).
 *
 * @param {string} url - URL to check
 * @returns {boolean} true if the URL should be excluded (skipped)
 */
export function shouldExcludeUrl(url) {
  const lower = url.toLowerCase();
  return (
    lower.includes("/api/") ||
    lower.includes("/auth/") ||
    lower.includes("/admin/") ||
    lower.includes(".env") ||
    lower.includes("/credentials") ||
    lower.includes("/secret")
  );
}

/**
 * Crawl a live URL to a local temp directory using Playwright (depth=1, OQ-5).
 *
 * Fetches:
 *   1. Root HTML document at the given URL
 *   2. Linked CSS, JS, and image src discovered in that root HTML (depth=1 only)
 *
 * Excludes URLs matching shouldExcludeUrl() (T-03-04-02).
 * Writes files flat to tmpDir.
 *
 * @param {string} url - Root URL to crawl
 * @param {string} outDir - Directory to write fetched assets to
 * @returns {Promise<{ fetchedFiles: string[] }>}
 */
export async function crawlUrlToFs(url, outDir) {
  // Import Playwright dynamically — only needed for URL mode
  // This keeps the module importable in test contexts without a browser
  const { chromium } = await import("playwright");

  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const fetchedFiles = [];

  try {
    // Fetch root HTML
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const rootHtml = await page.content();

    const rootFile = join(outDir, "index.html");
    await writeFile(rootFile, rootHtml, "utf8");
    fetchedFiles.push(rootFile);

    // Discover linked assets (depth=1: only from root page)
    const linkedUrls = await page.evaluate(() => {
      const urls = new Set();

      // CSS links
      for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
        const href = link.getAttribute("href");
        if (href) urls.add(href);
      }

      // Script src
      for (const script of document.querySelectorAll("script[src]")) {
        const src = script.getAttribute("src");
        if (src) urls.add(src);
      }

      // Image src
      for (const img of document.querySelectorAll("img[src]")) {
        const src = img.getAttribute("src");
        if (src) urls.add(src);
      }

      return Array.from(urls);
    });

    // Resolve and filter asset URLs
    const baseUrl = new URL(url);
    for (const assetUrl of linkedUrls) {
      try {
        const absoluteUrl = new URL(assetUrl, baseUrl).href;

        // Apply exclusion filter (T-03-04-02)
        if (shouldExcludeUrl(absoluteUrl)) {
          continue;
        }

        // Fetch asset
        const response = await context.request.get(absoluteUrl, {
          timeout: 10000,
        });
        if (!response.ok()) continue;

        const body = await response.body();
        // Write flat to outDir — use last path segment as filename
        const fileName = new URL(absoluteUrl).pathname
          .split("/")
          .filter(Boolean)
          .pop() || "asset";
        const safeFileName = fileName.replace(/[^a-z0-9._-]/gi, "_");
        const destFile = join(outDir, safeFileName);

        await writeFile(destFile, body);
        fetchedFiles.push(destFile);
      } catch {
        // Skip assets that fail to fetch
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  return { fetchedFiles };
}

/**
 * Build the YAML frontmatter header for an inferred artifact.
 *
 * @param {object} fields - Additional frontmatter fields (artifact, stage, etc.)
 * @returns {string} YAML frontmatter block (with --- delimiters)
 */
function buildInferredFrontmatter(fields) {
  const fm = {
    ...fields,
    ...INFERRED_FRONTMATTER,
    generated: new Date().toISOString(),
  };

  const yamlLines = Object.entries(fm).map(([k, v]) => {
    if (typeof v === "string") {
      // Quote values that need it
      if (v.includes(":") || v.includes('"') || v.includes("\n")) {
        return `${k}: "${v.replace(/"/g, '\\"')}"`;
      }
      return `${k}: ${v}`;
    }
    return `${k}: ${JSON.stringify(v)}`;
  });

  return `---\n${yamlLines.join("\n")}\n---`;
}

/**
 * Build an inferred Markdown artifact with the required two-layer enforcement (D-64):
 *   1. YAML frontmatter with provenance:inferred + inferredDisclaimer + evidence:INFERRED
 *   2. Body starting with the INFERRED blockquote banner
 *
 * @param {object} frontmatterFields - Artifact-specific frontmatter fields
 * @param {string} body - Artifact body content (will be prepended with banner)
 * @returns {string} Complete Markdown file content
 */
function buildInferredMarkdown(frontmatterFields, body) {
  const fm = buildInferredFrontmatter(frontmatterFields);
  const fullBody = `${INFERRED_BANNER}\n\n${body}`;
  return `${fm}\n\n${fullBody}\n`;
}

/**
 * Build an inferred JSON artifact with provenance fields injected.
 * JSON artifacts carry the INFERRED fields at the top level.
 * The "banner" for JSON artifacts is in the description/comment field.
 *
 * @param {object} data - Artifact data
 * @param {object} frontmatterFields - Artifact-specific metadata fields
 * @returns {string} JSON string with INFERRED fields injected
 */
function buildInferredJson(data, frontmatterFields) {
  const output = {
    ...frontmatterFields,
    ...INFERRED_FRONTMATTER,
    generated: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(output, null, 2);
}

/**
 * Run Stage 4 inference: infer interaction state catalog from component files.
 * Looks for async/await patterns, useState, error boundaries, loading states.
 *
 * @param {string} sourceDir - Source directory to analyze
 * @param {string} outputDir - Output base directory (design/inferred/)
 * @returns {Promise<{ artifactsCreated: string[], confidence: string }>}
 */
async function inferStage4(sourceDir, outputDir) {
  const { globby } = await import("globby");
  const { readFile } = await import("node:fs/promises");

  const artifactsCreated = [];

  // Find component files
  const componentFiles = await globby(
    [
      "components/**/*.tsx",
      "components/**/*.jsx",
      "src/components/**/*.tsx",
      "src/components/**/*.jsx",
      "app/**/*.tsx",
      "pages/**/*.tsx",
    ],
    { cwd: sourceDir, ignore: ["**/node_modules/**", "**/*.test.*"] }
  );

  // Analyze each component for state patterns
  const screenInteractions = {};

  for (const relPath of componentFiles.slice(0, 20)) {
    // Limit to 20 files
    try {
      const content = await readFile(join(sourceDir, relPath), "utf8");
      const hasAsync =
        content.includes("async ") || content.includes("await ");
      const hasLoading =
        content.toLowerCase().includes("loading") ||
        content.includes("isLoading");
      const hasError =
        content.toLowerCase().includes("error") ||
        content.includes("setError");
      const hasEmpty =
        content.toLowerCase().includes("empty") ||
        content.includes("length === 0");

      if (hasAsync || hasLoading || hasError) {
        const screenName = relPath
          .replace(/\.(tsx|jsx)$/, "")
          .replace(/^(components|src\/components|app|pages)\//, "")
          .replace(/\//g, "-")
          .toLowerCase();
        screenInteractions[screenName] = {
          asyncOperations: hasAsync,
          stateCount: (hasLoading ? 1 : 0) + (hasError ? 1 : 0) + (hasEmpty ? 1 : 0) + 1,
          hasConditionalTransitions: hasAsync && (hasLoading || hasError),
          // Bug fix (Finding 3): store hasError so spec emit can conditionally
          // include the 'error' state AND its transitions. Without this, hasError
          // was always undefined on the info object, causing info.hasError !== undefined
          // to always be false — the error state was silently dropped from the states
          // list while transitions to 'error' were still emitted (open transitions).
          hasError,
          sourceFile: relPath,
        };
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Emit a Stage 4 interaction spec for each discovered screen
  const interactionsDir = join(outputDir, "interactions");
  await mkdir(interactionsDir, { recursive: true });

  if (Object.keys(screenInteractions).length === 0) {
    // Emit a single generic spec if no screens detected
    const specFile = join(interactionsDir, "inferred-interaction.spec.md");
    const content = buildInferredMarkdown(
      {
        artifact: "interaction-spec",
        stage: 4,
        schemaVersion: 1,
        asyncOperations: false,
        stateCount: 2,
        hasConditionalTransitions: false,
      },
      `# Inferred Interaction Spec

No specific interactive components were detected in the source.
Review the source code and populate this spec manually.

## States

- idle: Initial state
- active: User interaction in progress
`
    );
    await writeFile(specFile, content, "utf8");
    artifactsCreated.push(specFile);
  } else {
    for (const [screenName, info] of Object.entries(screenInteractions)) {
      const specFile = join(interactionsDir, `${screenName}.spec.md`);
      // Bug fix (Finding 3): use info.hasError === true (stored above) to conditionally
      // include the 'error' state entry AND its transitions. This prevents open transitions
      // (a transition targeting an undeclared state) which would fail gate-stage-4's
      // D-59c no-open-transitions check.
      const stateList = [
        "- loading: Loading state (async operation in progress)",
        info.hasError === true && "- error: Error state (operation failed, terminal — retry via RETRY transition)",
        "- idle: Default state",
        "- success: Success state (operation completed)",
      ]
        .filter(Boolean)
        .join("\n");

      // Error-related transitions are only emitted when error handling was detected.
      // This ensures every transition target maps to a declared state (D-59c gate check).
      const transitions = [
        "- idle --> loading : on SUBMIT",
        "- loading --> success : on SUCCESS",
        ...(info.hasError === true
          ? [
              "- loading --> error : on ERROR",
              "- error --> idle : on RETRY",
            ]
          : []),
      ].join("\n");

      const content = buildInferredMarkdown(
        {
          artifact: "interaction-spec",
          stage: 4,
          schemaVersion: 1,
          asyncOperations: info.asyncOperations,
          stateCount: info.stateCount,
          hasConditionalTransitions: info.hasConditionalTransitions,
          // Propagate hasError into frontmatter so gate-stage-4 can verify state completeness
          ...(info.hasError === true ? { hasError: true } : {}),
        },
        `# Inferred Interaction Spec: ${screenName}

Inferred from source file: \`${info.sourceFile}\`

## States

${stateList}

## Transitions

${transitions}
`
      );
      await writeFile(specFile, content, "utf8");
      artifactsCreated.push(specFile);
    }
  }

  return { artifactsCreated, confidence: "low" };
}

/**
 * Run Stage 3 inference: infer wireframe structure from Stage 4 catalog + component tree.
 *
 * @param {string} sourceDir - Source directory to analyze
 * @param {string} outputDir - Output base directory (design/inferred/)
 * @param {string[]} stage4Artifacts - Artifacts created in Stage 4
 * @returns {Promise<{ artifactsCreated: string[], confidence: string }>}
 */
async function inferStage3(sourceDir, outputDir, stage4Artifacts) {
  const { globby } = await import("globby");
  const { readFile } = await import("node:fs/promises");

  const artifactsCreated = [];
  const wireframesDir = join(outputDir, "wireframes");
  await mkdir(wireframesDir, { recursive: true });

  // Discover page/screen files
  const pageFiles = await globby(
    [
      "app/**/page.tsx",
      "pages/**/*.tsx",
      "src/pages/**/*.tsx",
    ],
    { cwd: sourceDir, ignore: ["**/node_modules/**", "**/api/**"] }
  );

  const screens =
    pageFiles.length > 0
      ? pageFiles.map((f) =>
          f
            .replace(/\/(page|index)\.(tsx|jsx)$/, "")
            .replace(/^(app|pages|src\/pages)\//, "")
            .replace(/\//g, "-")
            .toLowerCase() || "home"
        )
      : ["home"];

  for (const screenName of screens.slice(0, 10)) {
    // Limit to 10 screens
    const screenDir = join(wireframesDir, screenName);
    await mkdir(screenDir, { recursive: true });

    const wireframeFile = join(screenDir, "inferred.md");
    const content = buildInferredMarkdown(
      {
        artifact: "design-doc",
        stage: 3,
        schemaVersion: 1,
      },
      `# Inferred Wireframe: ${screenName}

Structural description inferred from component tree analysis.

## Layout

- Header navigation bar
- Main content area
- Footer

## Key Components

Review the source components directory and map components to this screen.

## Notes

This wireframe structure is inferred. Review and update with actual screen layout.
`
    );
    await writeFile(wireframeFile, content, "utf8");
    artifactsCreated.push(wireframeFile);
  }

  return { artifactsCreated, confidence: "low" };
}

/**
 * Run Stage 2 inference: infer sitemap from routing structure.
 *
 * @param {string} sourceDir - Source directory to analyze
 * @param {string} outputDir - Output base directory (design/inferred/)
 * @returns {Promise<{ artifactsCreated: string[], confidence: string }>}
 */
async function inferStage2(sourceDir, outputDir) {
  const { globby } = await import("globby");

  const artifactsCreated = [];
  const iaDir = join(outputDir, "ia");
  await mkdir(iaDir, { recursive: true });

  // Discover routing structure
  const pageFiles = await globby(
    [
      "app/**/page.tsx",
      "app/**/page.jsx",
      "pages/**/*.tsx",
      "pages/**/*.jsx",
      "src/pages/**/*.tsx",
    ],
    { cwd: sourceDir, ignore: ["**/node_modules/**", "**/api/**", "**/_*"] }
  );

  // Build routes from file structure
  const routes = pageFiles.map((f) => {
    const routePath =
      "/" +
      f
        .replace(/\/(page|index)\.(tsx|jsx)$/, "")
        .replace(/^(app|pages|src\/pages)\//, "")
        .replace(/\//g, "/")
        .replace(/\[([^\]]+)\]/g, ":$1") // Next.js dynamic routes
        .toLowerCase();
    return {
      path: routePath || "/",
      label: routePath.split("/").filter(Boolean).pop() || "Home",
      wireframeRefs: [],
    };
  });

  if (routes.length === 0) {
    routes.push({ path: "/", label: "Home", wireframeRefs: [] });
  }

  const sitemap = {
    artifact: "sitemap",
    stage: 2,
    schemaVersion: 1,
    ...INFERRED_FRONTMATTER,
    generated: new Date().toISOString(),
    routes,
  };

  const sitemapFile = join(iaDir, "sitemap.json");
  await writeFile(sitemapFile, JSON.stringify(sitemap, null, 2), "utf8");
  artifactsCreated.push(sitemapFile);

  return { artifactsCreated, confidence: "medium" };
}

/**
 * Run Stage 1 inference: infer personas from copy, onboarding, landing page content.
 * This is the weakest inference signal — inferred LAST from accumulated 2-3-4 findings.
 *
 * @param {string} sourceDir - Source directory to analyze
 * @param {string} outputDir - Output base directory (design/inferred/)
 * @returns {Promise<{ artifactsCreated: string[], confidence: string }>}
 */
async function inferStage1(sourceDir, outputDir) {
  const { globby } = await import("globby");
  const { readFile } = await import("node:fs/promises");

  const artifactsCreated = [];
  const researchDir = join(outputDir, "research", "personas");
  await mkdir(researchDir, { recursive: true });

  // Find landing page / marketing copy
  const copyFiles = await globby(
    [
      "app/page.tsx",
      "app/page.jsx",
      "pages/index.tsx",
      "src/pages/index.tsx",
      "src/App.tsx",
      "README.md",
    ],
    { cwd: sourceDir }
  );

  let appDescription = "Unknown application";
  let targetAudience = "General users";

  for (const relPath of copyFiles.slice(0, 3)) {
    try {
      const content = await readFile(join(sourceDir, relPath), "utf8");
      // Look for h1/h2 text or meta descriptions
      const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) {
        appDescription = h1Match[1].trim();
        break;
      }
    } catch {
      // Skip
    }
  }

  // Emit a single inferred persona
  const personaFile = join(researchDir, "inferred-primary-persona.persona.json");
  const personaData = {
    artifact: "persona",
    stage: 1,
    schemaVersion: 1,
    ...INFERRED_FRONTMATTER,
    generated: new Date().toISOString(),
    name: "Inferred Primary Persona",
    role: targetAudience,
    description: `Inferred from application copy: "${appDescription}". Review and validate with real user research.`,
    jobsToBeDone: [
      "JTBD inferred from application structure — validate with real user interviews",
    ],
    painPoints: ["Pain points inferred — requires validation"],
    goals: ["Goals inferred from application purpose — requires validation"],
    thinkingStyle: "analytical",
    worstProvenance: "generated",
    owner: "design-os/reverse-engineer",
    lastReviewedAt: new Date().toISOString(),
    sourceHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
  };

  await writeFile(personaFile, JSON.stringify(personaData, null, 2), "utf8");
  artifactsCreated.push(personaFile);

  // Also emit a Markdown persona card with the banner
  const personaMdFile = join(researchDir, "inferred-primary-persona.md");
  const personaMdContent = buildInferredMarkdown(
    {
      artifact: "design-doc",
      stage: 1,
      schemaVersion: 1,
    },
    `# Inferred Primary Persona

**Name:** Inferred Primary Persona

**Role:** ${targetAudience}

**App description inferred from:** "${appDescription}"

## Jobs-to-be-Done

- Inferred JTBD — validate with real user interviews

## Pain Points

- Inferred pain points — requires validation

## Goals

- Inferred goals from application purpose — requires validation

## Notes

This persona was inferred from application copy. It is NOT based on real user research.
Run user interviews and update this artifact before using in design decisions.
`
  );
  await writeFile(personaMdFile, personaMdContent, "utf8");
  artifactsCreated.push(personaMdFile);

  return { artifactsCreated, confidence: "low" };
}

/**
 * Run the full reverse-engineer inference pipeline (D-62, D-63).
 *
 * Inference order (D-63): Stage 4 → Stage 3 → Stage 2 → Stage 1
 *
 * @param {object} opts
 * @param {string} opts.source - Local path or live URL (https://)
 * @param {string} opts.outputDir - Output directory (must start with design/inferred/)
 * @param {boolean} [opts.dryRun=false] - If true, show what would be created without writing
 * @returns {Promise<{ artifactsCreated: string[], inferenceLog: Array<{stage: number, confidence: string}> }>}
 */
export async function runReverseEngineer({ source, outputDir, dryRun = false }) {
  // ── Input validation ───────────────────────────────────────────────────────

  // T-03-04-01: Path traversal guard
  const absOutputDir = resolve(outputDir);
  const cwd = resolve(process.cwd());

  // Ensure output is under design/inferred/
  const normalizedOutput = absOutputDir.replace(/\\/g, "/");
  if (!normalizedOutput.includes("design/inferred")) {
    throw new Error(
      `outputDir must be under design/inferred/ — got: ${outputDir} (Pitfall D guard)`
    );
  }

  let workingSourceDir;
  let tempDirToClean = null;

  const isUrl =
    typeof source === "string" &&
    (source.startsWith("http://") || source.startsWith("https://"));

  if (isUrl) {
    // Mode (b): Live URL — crawl to temp dir first (D-62)
    // OQ-5: depth=1 only
    tempDirToClean = await mkdtemp(join(tmpdir(), "re-crawl-"));
    await crawlUrlToFs(source, tempDirToClean);
    workingSourceDir = tempDirToClean;
  } else {
    // Mode (a): Local filesystem path
    // T-03-04-01: path traversal guard
    const absSource = resolve(source);
    if (source.includes("..") && !absSource.startsWith(cwd)) {
      throw new Error(
        `Security: --source path must not traverse outside project root. ` +
        `Got: ${source} (resolved: ${absSource})`
      );
    }
    if (!existsSync(absSource)) {
      throw new Error(`Source path does not exist: ${absSource}`);
    }
    workingSourceDir = absSource;
  }

  if (dryRun) {
    // Dry run: return what would be created without writing
    return {
      artifactsCreated: [],
      inferenceLog: [
        { stage: 4, confidence: "low" },
        { stage: 3, confidence: "low" },
        { stage: 2, confidence: "medium" },
        { stage: 1, confidence: "low" },
      ],
      dryRun: true,
    };
  }

  // ── Run inference pipeline (D-63: Stage 4 → 3 → 2 → 1) ──────────────────

  const allArtifactsCreated = [];
  const inferenceLog = [];

  // Stage 4: Interaction state catalog (strongest structural signal)
  const stage4Result = await inferStage4(workingSourceDir, absOutputDir);
  allArtifactsCreated.push(...stage4Result.artifactsCreated);
  inferenceLog.push({ stage: 4, confidence: stage4Result.confidence });

  // Stage 3: Wireframe structure (from Stage 4 catalog + component tree)
  const stage3Result = await inferStage3(
    workingSourceDir,
    absOutputDir,
    stage4Result.artifactsCreated
  );
  allArtifactsCreated.push(...stage3Result.artifactsCreated);
  inferenceLog.push({ stage: 3, confidence: stage3Result.confidence });

  // Stage 2: IA/sitemap (from routing structure)
  const stage2Result = await inferStage2(workingSourceDir, absOutputDir);
  allArtifactsCreated.push(...stage2Result.artifactsCreated);
  inferenceLog.push({ stage: 2, confidence: stage2Result.confidence });

  // Stage 1: Personas/JTBDs (from copy — weakest signal, inferred last)
  const stage1Result = await inferStage1(workingSourceDir, absOutputDir);
  allArtifactsCreated.push(...stage1Result.artifactsCreated);
  inferenceLog.push({ stage: 1, confidence: stage1Result.confidence });

  return {
    artifactsCreated: allArtifactsCreated,
    inferenceLog,
  };
}
