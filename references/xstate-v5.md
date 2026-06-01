# XState v5: Actor Model State Machines

**Stage:** 4 (Interact)
**Topic:** XState v5 setup() pattern, actor model, assign actions, conditional transitions

## Summary

XState v5 introduces the `setup()` pattern as the primary API, replacing the v4 approach
of calling `createMachine()` directly. The actor model enables composable, testable state
machines that can communicate via events.

## Key Change from v4: setup() Pattern

```typescript
import { setup, assign } from 'xstate';

// v5: setup() first, then createMachine()
export const machine = setup({
  types: {
    context: {} as { data: string | null; error: string | null },
    events: {} as
      | { type: 'SUBMIT' }
      | { type: 'DONE'; data: string }
      | { type: 'ERROR'; error: string },
  },
}).createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: { SUBMIT: 'loading' },
    },
    loading: {
      on: {
        DONE: {
          target: 'success',
          actions: assign({ data: ({ event }) => event.data }),
        },
        ERROR: {
          target: 'error',
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    success: {},
    error: {
      on: { SUBMIT: 'loading' }, // retry
    },
  },
});
```

## D-57: When XState is Emitted

complete-design emits XState ONLY when:
- `asyncOperations: true` — screen performs async operations
- `stateCount >= 3` — at least 3 distinct states
- `hasConditionalTransitions: true` — transitions depend on conditions (DONE vs ERROR)

For simpler screens, Mermaid stateDiagram-v2 is sufficient.

## assign() for DONE/ERROR Transitions

Use `assign()` to update context on successful or failed async transitions:
```typescript
DONE: {
  target: 'success',
  actions: assign({ data: ({ event }) => event.data }),
},
```

## Guards (Conditional Transitions)

```typescript
loading: {
  on: {
    RESPONSE: [
      { guard: ({ event }) => event.statusCode === 200, target: 'success' },
      { guard: ({ event }) => event.statusCode === 429, target: 'rateLimited' },
      { target: 'error' },
    ],
  },
},
```

## Citations

XState v5 Documentation. Stately.ai. https://statelyai.github.io/xstate/
Context7 library ID: `/statelyai/xstate` (verified with XState 5.20.1)
Changelog: https://github.com/statelyai/xstate/blob/main/CHANGELOG.md
