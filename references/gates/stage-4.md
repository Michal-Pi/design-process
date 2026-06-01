# Stage 4 Gate Checklist

Checks performed by `gate-stage-4.mjs` (D-59). All checks run against the **staged** path
(`.complete-design/preview/<run-id>/`) per INVARIANT-01 — never against `design/` directly.

| Check | Required for PASS | Required for VALIDATED | Citation |
|-------|-------------------|------------------------|----------|
| sitemap-coverage | Every route in `ia/sitemap.json` has a corresponding `interactions/<screen>.spec.md` | Same as PASS | D-59(a), MRD §3.22, MVPB-08 |
| state-completeness | Each `.spec.md` enumerates at least `loading`, `empty`, `error`, `success` state types | Same as PASS | D-59(b), MRD §3.22, FID-04 |
| no-open-transitions | No transition in `.diagram.mmd` targets a state name not declared in the diagram | Same as PASS | D-59(c), MRD §3.22 |
| mermaid-present | Each screen has a `.diagram.mmd` (Mermaid stateDiagram-v2) as canonical artifact | Same as PASS | D-58, MRD §3.22 |
| xstate-conditional | XState `.machine.ts` exists IFF `asyncOperations:true AND stateCount≥3 AND hasConditionalTransitions:true` (D-57 trigger) | Same as PASS | D-57, MRD §3.22, STACK.md |

## Finding IDs

| Finding | Severity | Description |
|---------|----------|-------------|
| `4-coverage-001` | BLOCKER | A sitemap route has no corresponding `.spec.md` in staged `interactions/` |
| `4-states-001` | BLOCKER | A `.spec.md` is missing one or more of: `loading`, `empty`, `error`, `success` state types |
| `4-open-transition-001` | BLOCKER | A `.diagram.mmd` contains a transition to a state name not declared in the diagram |

## PR Detector Findings

| Finding | Severity | Detector |
|---------|----------|---------|
| `3-pr-choice-001` | WARN | `stage-3-pr.mjs`: new screen in sitemap without `CHOICE.md` in wireframes/ |
| `3-pr-layout-001` | INFO | `stage-3-pr.mjs`: significant layout drift (`.excalidraw` modified in PR diff) |
| `4-pr-states-001` | ERROR | `stage-4-pr.mjs`: async `.spec.md` missing `loading` or `error` state |
| `4-pr-hax18-001` | INFO | `stage-4-pr.mjs`: async `.spec.md` without HAX-18 guideline citation |

## Citations

- D-59: Stage 4 gate state-completeness check (03-CONTEXT.md)
- D-57: XState v5 emit trigger heuristic (03-CONTEXT.md)
- D-58: Mermaid stateDiagram-v2 canonical artifact (03-CONTEXT.md)
- MRD §3.22: gate/stage-4 "complete state set; loading/empty/error/success required; no 'open' transition targets"
- FID-04: Stage 4 Mermaid only; no hi-fi interaction specs
- MVPB-08: State completeness gate requirement
