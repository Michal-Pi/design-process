# The Elements of User Experience — Jesse James Garrett

<!-- complete-design reference: garrett-elements -->

## Purpose

Garrett's 5-plane model (Strategy → Scope → Structure → Skeleton → Surface) is the primary
structural spine of the complete-design workflow. The 5 design stages map directly to the 5 planes.

## Citations

- Garrett, J.J. (2011). *The Elements of User Experience*, 2nd ed. New Riders.
- §1.1, p.19: "User experience is not about the inner workings of a product or service. User
  experience is about how it works on the outside, where a person comes into contact with it."
- §2.1, p.23: Strategy Plane — user needs + product objectives precede all other decisions.
- §4.1, p.62: Scope Plane — functional specifications and content requirements define scope
  from the strategy layer; never start with wireframes.
- §5.1, p.87: Structure Plane — interaction design (behavioral logic) + IA (structural patterns);
  structure creates the framework within which scope is realized.
- §6.1, p.109: Skeleton Plane — interface design (visual form of interactivity), navigation design,
  and information design (the invisible page geometry the user navigates).
- §7.1, p.129: Surface Plane — sensory design; color, typography, and imagery create the look and
  feel that users actually see.
- §3.2, p.45: "Each of these planes is dependent on the planes below it." Non-negotiable sequencing
  is central to the Garrett model.

## How complete-design uses it

- SPINE-01: `stage:` frontmatter field maps artifacts to Garrett planes 1:1.
- Gate runners enforce forward-only promotion (no skipping planes).
- References checklist items cite `Garrett §X.Y, p.NN` format per D-24.

## Drift watch

**Stability: HIGH** — The Garrett model is a 2011 2nd-edition book. The model itself is stable;
no upstream changes expected. The agentskills.io v1 SKILL.md spec and Garrett's framework
converge on the same abstraction — this is by design.
