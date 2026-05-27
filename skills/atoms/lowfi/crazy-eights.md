---
name: "design-os/lowfi/crazy-eights"
description: "ATOM-08: Produce 8 skeleton IR objects for a screen, each with a distinct layout axis. IR only — never raw Excalidraw JSON."
stage: 3
type: atom
compatibility:
  - claude-code
  - codex-cli
  - cursor
allows-tools:
  - Read
  - Write
---

# crazy-eights — ATOM-08: Divergent Wireframe Skeleton Generator

Generates 8 skeleton IR objects for a single screen. Each represents a structurally
distinct layout approach — the Crazy 8s divergence discipline applied to lo-fi wireframes.

**Output format:** IR objects only. Never produce raw Excalidraw element JSON.
See emit discipline below.

---

## Standalone bootstrap

When invoked directly (without a stage-2 bundle or prior workflow context):

Ask the user these minimum questions:
1. "Which screen are we wireframing? (e.g., 'dashboard', 'search results', 'onboarding step 2')"
2. "What is the primary job the user is trying to complete on this screen?"
3. "Any layout constraints? (e.g., mobile-first, sidebar required, table data, etc.)"

Do not generate until all 3 answers are received.

---

## Workflow procedure

Steps for invocation from within the `sketch` workflow (Step 2):

**1. Identify the target screen**

Read the screen name from the Stage 2 sitemap. Match it to the user's primary JTBD.

**2. Generate 8 skeleton IR objects**

Each IR object must represent a structurally different layout approach for this screen.
Use each of these 8 layout axes (one per slot):

| Slot | Layout axis | Structural pattern |
|------|-------------|-------------------|
| v1 | Card-list | Vertical list of summary cards, no sidebar |
| v2 | Hero + CTA | Full-width hero image/banner + below-fold CTA sections |
| v3 | Table/grid | Data-dense table or CSS grid with many equal cells |
| v4 | Sidebar + content | Fixed sidebar navigation + fluid main content area |
| v5 | Bottom-nav | Mobile-first: bottom navigation bar + scrollable content |
| v6 | Wizard/stepper | Step indicator at top + single-step content below |
| v7 | Split-pane | Two equal-width panels (master-detail, compare, preview) |
| v8 | Dashboard | Multiple metric widgets + summary panels arranged spatially |

Each IR object follows this schema:
```json
{
  "type": "rectangle" | "text" | "frame",
  "x": <number>,
  "y": <number>,
  "w": <number>,
  "h": <number>,
  "label": "<semantic component name>",
  "children": [<nested IR objects>]   // optional
}
```

**3. Emit IR as skeleton-ir.json**

Write the 8-element array to:
```
.design-os/preview/<run-id>/wireframes/<screen>/skeleton-ir.json
```

**Emit discipline (strictly enforced by gate):**

Emit IR objects only. DO NOT produce raw Excalidraw element JSON with literal
`type: "excalidraw"`, `version`, `elements`, `appState`, or `files` fields.

The skeleton IR will be converted to Excalidraw format by `excalidraw-render.mjs`.

**4. Quality gate: diversity check**

Before finalizing, mentally verify:
- Each of the 8 slots uses a different layout axis (not two card-lists, not two tables)
- Layout axis diversity: ≥3 distinct information hierarchy patterns
- Navigation pattern diversity: ≥3 distinct primary navigation styles
- Density diversity: ≥2 "sparse" vs ≥2 "dense" layouts

Near-identical layouts will be rejected by `wireframe-diversity.mjs` with pairwise
structural distance < 0.35. If rejected, the gate returns `failed_after_repair/3-diversity-001`.

**Wire naming (OQ-4):** Variants are emitted as `v1.excalidraw` through `v8.excalidraw`
(numeric, sortable). The `excalidraw-render.mjs` CLI handles this naming automatically.

---

## References

- @${CLAUDE_SKILL_DIR}/references/sprint-crazy-eights.md — original Crazy 8s method (8 sketches, 8 minutes)
- @${CLAUDE_SKILL_DIR}/references/buxton-sketching.md — low-cost exploration = high divergence rate
- @${CLAUDE_SKILL_DIR}/references/shape-up-pitches.md — fat-marker sketches scope before investing
