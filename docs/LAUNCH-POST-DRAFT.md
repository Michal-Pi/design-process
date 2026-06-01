<!-- DRAFT — awaiting Brad Frost / Marty Cagan feedback before Wave B publication -->

# The 5 design stages every tool skips — and why your prototype struggles past month 3

---

Most tools that generate interfaces produce something that looks finished. The colors are polished. The layout is clean. In a demo, it holds together. Then someone actually uses it, and the cracks appear — inconsistent interaction patterns, token drift between components, personas that match no real user. By month 3, the prototype becomes a liability.

This is not a capability failure. The tools are technically impressive. It is a **process** failure. And the process failure was baked in at the start, because every popular interface generator starts at Stage 5 — the surface — and works nowhere else.

Jesse James Garrett named the problem in 2000. In *The Elements of User Experience*, he described five planes of design: Strategy, Scope, Structure, Skeleton, and Surface. Each plane depends on the one below it. "Each of these planes is dependent on the planes below it" — that's Garrett's §3.2. You cannot build a sound surface on an absent skeleton. You cannot build a skeleton on an absent structure. The dependencies are not optional.

Lovable, v0, Bolt, and Claude Design are all excellent at what they do: generating Stage 5 surfaces from a brief description. They are optimized for the demo moment. The cost of skipping Stages 1-4 is not visible at hour one. It is visible at month 3, when you discover that your interaction patterns don't cohere, your design tokens have no semantic tier, and your research consists of three made-up user personas that nobody validated.

**complete-design is the other four stages.**

---

## The 5 stages, and what happens when each one runs

### Stage 1: Research and Discovery

Before any interface decision, complete-design runs a structured research phase. It generates thinking-style personas in Indi Young's format — each with a provenance grade. If the personas are synthesized without real interview data, the provenance is `PROTO`, not `VALIDATED`. Stage 1 hard-blocks the `VALIDATED` grade when only synthetic personas are present. This is not a warning. It is a gate that will not open until the persona provenance is resolved.

The stage also generates Jobs-to-Be-Done in Torres OST format and an ASSUMPTIONS.md that makes every design hypothesis explicit. Competitive landscape is captured as structured evidence, not prose. The goal is: no wireframe is drawn until the strategy is grounded in something real.

**What tools that skip this produce:** A Stage 5 UI with user personas that are fictional archetypes. You will not discover this until a usability test.

### Stage 2: Information Architecture

With research grounded, Stage 2 generates 2-5 sitemap variants across diverse structural approaches (LATCH diversity: Location, Alphabetical, Time, Category, Hierarchy). It produces Mermaid flowcharts per Job-to-Be-Done — mapping where a user goes through the product for each need, not for each feature.

The stage enforces structural diversity: generating only one sitemap is not a pass. The gate requires multiple variants so the designer makes a deliberate choice, not a default.

**What tools that skip this produce:** A navigation structure that reflects the engineer's mental model of the codebase, not the user's mental model of their task.

### Stage 3: Low-Fidelity Wireframes

Stage 3 generates Excalidraw JSON wireframes using the Crazy 8s structural-diversity protocol: eight structurally distinct layout variants per screen. The fidelity cap is enforced by a gate: Excalidraw output that introduces color, typography, or brand styling is rejected. The wireframe validator calls this out with a `fid-03` finding.

This matters because once styling enters the wireframe, teams stop evaluating structure and start debating aesthetics. The low-fi phase exists to evaluate information hierarchy and content placement — not whether the button is teal or slate.

**What tools that skip this produce:** A Figma frame that skips the structural question entirely, arriving at a single layout as if it were inevitable.

### Stage 4: Interaction Design

Before any visual design renders, Stage 4 produces state machine specifications for each interactive component. The canonical format is Mermaid `stateDiagram-v2` — chosen specifically because it is readable by designers, not just engineers. XState v5 machines are generated only for components that require asynchronous operations, three or more distinct states, and conditional transitions. For everything else, Mermaid is sufficient.

The gate at Stage 4 is upstream of Stage 5. `gate/stage-5a-complete` returns `not_runnable, reason: stage-4-artifacts-absent` when `design/interactions/` is empty. Stage 5 hi-fi cannot render until interaction design exists. This is not a soft warning — the gate will not open.

**What tools that skip this produce:** A hi-fi prototype with buttons that have no defined failure states, loading states, or empty states. Users encounter them at runtime.

### Stage 5: Hi-Fi and Design System

Stage 5a generates three visual variants with a 6-axis distance metric — ensuring the variants are structurally and aesthetically distinct, not color swaps of the same layout. The axe-runner CI gate measures WCAG 2.2 AA contrast on every generated token and surface. It reports measured values: "WCAG 2.2 AA contrast 4.7 (pass)." It never claims conformance. The distinction matters legally and technically.

Stage 5b generates W3C DTCG v2025.10 design tokens across primitive, semantic, and component tiers. The Frost rule — named for Brad Frost's Atomic Design principle — requires a component to appear in upstream wireframes at least three times before it is promoted to the design system. Frost ≥3× recurrence is enforced as a gate finding, not a recommendation. A component that appears twice stays at the component level. Three appearances promote it.

The stage also emits Google DESIGN.md format with `$extensions.complete-design` metadata — a structured contract for engineering consumption that carries token references, composition rationale, and source provenance in a single file.

**What tools that skip this produce:** A design system with components that exist because they looked good, not because they recur across real user flows.

---

## Why the process exists

Garrett's insight was that user experience is not about what a product looks like. It is about how the decisions at each layer constrain and enable the layers above. Strategy constrains scope. Scope constrains structure. Structure constrains skeleton. Skeleton constrains surface.

When you skip Strategy and Scope, you do not save time. You borrow time from month 3, with interest.

Brad Frost's Atomic Design (2013) extended this to design systems: components are not designed in isolation. They emerge from recurrence in real flows. A component that appears once is a one-off. A component that appears three times is a pattern. Patterns belong in the system. This is the intellectual heritage complete-design implements as a gate.

Marty Cagan's INSPIRED framing for product teams is the same idea at the product level: build to discover, not to ship a predetermined answer. complete-design operationalizes the discovery-then-validate sequence with scaffolded AI output and explicit evidence grades at every stage.

These three bodies of work — Garrett, Frost, Cagan — are intellectual heritage, not endorsement. None of them have reviewed complete-design. Their frameworks are cited because complete-design implements the principles they described.

---

## The trust posture

complete-design is built for designers who have been burned by tools that claim more than they deliver.

Every output carries an evidence grade: `VALIDATED` means grounded in real data. `PROTO` means generated from synthetic input. `INFERRED` means reverse-engineered from existing artifacts. `MISSING` means the artifact does not exist. These grades are not cosmetic — they propagate downstream. A `PROTO`-grade persona produces a `PROTO`-grade sitemap. The system does not silently launder synthetic research into validated design decisions.

Every rule cites canon: Garrett §X, NN/g article number, WCAG 2.2 success criterion, Radix step role. If a rule does not cite canon, it is labeled `house heuristic`. There are no hidden heuristics pretending to be standards.

Every output requires `--apply` to write to the working tree. diff-by-default means the designer reviews every change before it lands in git.

The package never claims WCAG conformance. It reports measured contrast values. "WCAG 2.2 AA contrast 4.7 (pass)" is a measurement. "WCAG compliant" is a claim that no automated tool can make honestly.

---

## What shipped

complete-design v2.0-beta.0 is available today.

**The evidence:**

- 1,394 passing tests across 4 prior build phases
- 100/100 adversarial block rate on synthetic-persona Stage 1 completion
- 100/100 adversarial block rate on styled-wireframe Stage 3 gate bypass
- 100/100 adversarial block rate on hi-fi-without-state-maps Stage 5a gate bypass
- axe-runner CI measures WCAG 2.2 AA contrast on all 15 acceptance fixture outputs
- Frost ≥3× recurrence enforced as a gate finding in Stage 5b
- Aggregate coexistence eval (TRIG-03 release gate) is wired and blocking; calibration ongoing through Wave A — current measured recall 0.71, threshold 0.80
- PR submitted to anthropics/skills#1008 for DESIGN.md consume/produce support — connecting the design contract to Google's emerging DESIGN.md standard

None of this is vaporware. Every gate behavior described above is in the codebase, covered by tests, and enforced in CI.

---

## Try it

```bash
npm i -g @pm-musketeers/complete-design@beta
complete-design install
```

The install drops skills into `.claude/skills/` (Claude Code) or the equivalent for Codex CLI or Cursor. Start with:

```
design --route new-product
```

The workflow asks 3-5 intake questions. It does not silently pick defaults.

**Repo:** [https://github.com/Michal-Pi/design-process](https://github.com/Michal-Pi/design-process) — Apache-2.0

**PR for DESIGN.md support:** anthropics/skills#1008

Feedback welcome. Wave A is private outreach; after incorporating feedback from the design community, the post will publish broadly. If you are a designer or PM who has worked with generated interfaces and have thoughts on whether this approach addresses the real pain — I'd like to hear it.

After Wave A feedback, we'll publish broadly and cross-post to the community. The goal for this draft is honest feedback on framing from designers who know where the bodies are buried.

---

*complete-design is an open-source SKILL.md package. It does not replace the designer. It scaffolds the process that makes the designer's judgment legible to the agent.*
