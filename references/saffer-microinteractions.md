# Saffer: Microinteractions

**Stage:** 4 (Interact)
**Topic:** Interaction design at the detail level — triggers, rules, feedback, loops & modes

## Summary

Dan Saffer's core argument: the details of a product — its microinteractions — often define the
user experience more than its major features do. A microinteraction is a contained product moment
centered on a single task.

## The 4-Part Anatomy of a Microinteraction

**1. Trigger** — What initiates the microinteraction (user-initiated or system-initiated).
- User triggers: clicking a button, swiping, hovering, speaking
- System triggers: an event, a status change, a timer expiration

**2. Rules** — What happens once the trigger fires; the logic governing the interaction.
- Define the sequence of actions
- Handle edge cases (what if the user triggers again mid-animation?)
- Rules are invisible to users but felt through behavior

**3. Feedback** — What the user sees, hears, or feels as the rules execute.
- Visual: animation, color change, badge, progress bar
- Auditory: click sound, success chime, error buzz
- Haptic: vibration pattern (mobile)
- Feedback should be appropriate — not every action needs a celebration

**4. Loops & Modes** — Meta-rules governing over time and across interactions.
- Loops: Does the microinteraction repeat? For how long?
- Modes: Does the interface enter a different state that changes the rules?

## Key Principles

- **Details matter more than features.** A buggy share button destroys trust more than a missing
  share button.
- **Make rules invisible.** Users experience the outcome (feedback), not the rules.
- **Animate purposefully.** Every animation should serve the rules — not decorate them.
- **Avoid mode errors.** Modes (e.g., caps lock) are a common source of user confusion. Minimize them.

## Citations

Saffer, D. (2013). *Microinteractions: Designing with Details*. O'Reilly Media.
ISBN: 978-1492945635
