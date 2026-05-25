// sample.machine.ts — minimal XState v5 state machine for stage-4 eval fixture
import { setup } from 'xstate';

export const sampleMachine = setup({
  types: {} as { context: Record<string, never>; events: { type: 'NEXT' } }
}).createMachine({
  id: 'sample',
  initial: 'idle',
  states: {
    idle: { on: { NEXT: 'active' } },
    active: { on: { NEXT: 'done' } },
    done: { type: 'final' }
  }
});
