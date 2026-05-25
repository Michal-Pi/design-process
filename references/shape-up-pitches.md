# Shape Up: Fat Marker Sketches and Pitches

Basecamp's Shape Up method introduces fat-marker sketches and pitch format as
appetite-bounded scope documents — a complementary perspective on lo-fi wireframes
as communication and commitment tools.

## Fat Marker Sketches

**Definition:** A sketch drawn with a marker thick enough that detail is physically
impossible. The constraint forces high-level structural thinking.

**Purpose:** Show the layout concept without implying finality. Fat-marker sketches
communicate "this is the shape of the solution" — not the implementation details.

**Key principle: breadboards and fat-marker sketches signal appetite, not spec.**
A fat-marker sketch shows "this is approximately how much UI complexity is involved",
which anchors the time appetite for the work. A 3-element sketch costs 1 week; an
8-panel multi-step wizard costs 6 weeks. The sketch is scope communication.

## Pitch Format

A Shape Up pitch accompanies the fat-marker sketch with:
1. **Problem:** What job is the user trying to complete?
2. **Appetite:** How much time is the team willing to spend? (1 week, 6 weeks)
3. **Solution:** The fat-marker sketch + a short description
4. **Rabbit holes:** What corners could the team get stuck in? Name them upfront.
5. **No-gos:** What's explicitly out of scope?

**Rabbit hole discipline:** Naming rabbit holes in the pitch preemptively closes them.
A wireframe that doesn't answer "what happens when there are 0 results?" leaves a rabbit
hole. The sketch-stage discipline is to name these as no-gos or skeleton placeholders.

## Application to design-os Stage 3

Fat-marker sketches map directly to Stage 3 lo-fi wireframes:
- The Excalidraw hand-drawn style achieves the "fat marker" communication signal
- FID-03 prevents the sketch from acquiring implied spec status (no colors = no commitment)
- CHOICE.md captures the rationale: which solution shape was chosen and why

The "rabbit holes" concept informs CHOICE.md's `## Rejected Variants` section:
each rejected variant explains WHY it was rejected — which is the design-equivalent
of naming rabbit holes.

## Citations

Singer, R. (2019). *Shape Up: Stop Running in Circles and Ship Work that Matters*.
Basecamp. Available free at: [basecamp.com/shapeup](https://basecamp.com/shapeup).
