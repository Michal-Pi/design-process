---
artifact: interaction-spec
stage: "4"
generated: "2026-05-25T00:00:00.000Z"
schemaVersion: 1
---

# Sample Interaction Spec

## stateDiagram-v2

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> active : NEXT
  active --> done : NEXT
  done --> [*]
```

## States

| State | Description |
|-------|-------------|
| idle | Initial state — awaiting user action |
| active | User has initiated the flow |
| done | Flow complete |
