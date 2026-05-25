# Stage 5a gate operational checklist

Stage 5a covers the Hi-Fi + Interaction-complete checkpoint. This gate requires Stage 4 (Interaction Design) artifacts to be present. If design/interactions/ is empty or absent, the gate returns not_runnable with reason stage-4-artifacts-absent.

| Check | Required for PASS | Required for VALIDATED grade | Citation |
| ----- | ----------------- | ---------------------------- | -------- |
| design/interactions/ contains at least one canonical IxD spec | exists + non-empty (at least one .md or .json file; .gitkeep does not count) | All state catalogs complete: every XState machine has an explicit final state OR a Mermaid stateDiagram-v2 with all states enumerated (Phase 3 full check) | GATE-07 + GATE-08 (codex §16 BLOCKER fix); failure mode: not_runnable with reason stage-4-artifacts-absent |
