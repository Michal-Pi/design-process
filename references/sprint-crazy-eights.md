# Sprint: Crazy 8s Exercise

The Crazy 8s exercise from Google Ventures' Sprint method — a rapid divergence technique
for generating layout concepts before committing to any single direction.

## Method

**Format:** 8 sketches, 8 minutes. One minute per sketch.

**Purpose:** Force quantity over quality during ideation. The time constraint prevents
attachment to any single idea and eliminates perfectionism.

**Execution:**
1. Fold a sheet of paper into 8 panels (or use 8 screen slots in a digital tool)
2. Set a timer for 8 minutes
3. Sketch one interface idea per panel — one minute each
4. Focus on layout and structure; skip detail and polish
5. No erasing — move forward

**Key insight: time constraint is the feature.** The 60-second limit forces designers
to externalize their existing mental models of possible layouts quickly, without
self-censorship. The best ideas often appear in sketches 5-8 (after the obvious solutions
are exhausted in sketches 1-4).

## Why quantity beats quality in ideation

Linus Pauling (Nobel laureate): "The best way to have a good idea is to have lots of ideas."

The Sprint book reports that in design sprints, the "final" chosen design concept frequently
originates from sketch 6 or 7 — not sketch 1. Teams that stop at 3 sketches never discover
what they would have found at 8.

## Diverge before converge

The Crazy 8s exercise is always followed by a convergence step (dot voting in Sprint;
CHOICE.md in design-os). The sequence matters:
- **Diverge first:** produce more options than you think you need
- **Converge second:** select from the expanded option set with explicit rationale

Skipping divergence (going straight to the "obvious" solution) anchors the team to
pre-existing mental models and forecloses better solutions.

## Application to design-os Stage 3

- 8 skeleton IR objects per screen (matching the 8 Crazy 8s slots)
- wireframe-diversity.mjs enforces structural diversity (pairwise distance ≥ 0.35)
  so slots 5-8 can't just repeat slots 1-4
- CHOICE.md captures the convergence rationale after all 8 options are evaluated

## Citations

Knapp, J., Zeratsky, J., & Kowitz, B. (2016). *Sprint: How to Solve Big Problems and
Test New Ideas in Just Five Days*. Simon & Schuster. ISBN 978-1501121746.
