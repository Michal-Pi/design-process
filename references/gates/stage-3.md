# Stage 3 gate operational checklist

Stage 3 covers Low-Fidelity Wireframes: Crazy 8s divergent sketching + convergence to a single chosen variant.

| Check | Required for PASS | Required for VALIDATED grade | Citation |
| ----- | ----------------- | ---------------------------- | -------- |
| Variant count ≥3 | At least 3 `.excalidraw` files present under `wireframes/**/` in the staged path | ≥8 variants covering distinct layout axes (Crazy 8s ideal) | WF-04 (Stage 3 count requirement); PLAN.md 03-01 |
| FID-03 fidelity cap | All `.excalidraw` elements have `strokeColor: "#1e1e1e"`, `backgroundColor: "transparent"`, `fontFamily: 1` (Virgil) — no color, no alternate fonts | Same — FID-03 is a hard cap at all grades; any color injection causes `not_runnable` | D-56 (FID-03 defaults); MRD §P3 (wireframes stay lo-fi until Stage 5) |
| Structural diversity ≥0.35 | All pairwise structural distances ≥ 0.35 (3-factor: grid-histogram cosine distance, element-count delta, max-depth ratio) | Same threshold — diversity is a quality floor | D-55 (wireframe-diversity metric); OQ-4 (threshold resolution) |
| CHOICE.md present | At least one `CHOICE.md` file exists under `wireframes/**/` in the staged path | CHOICE.md cites ≥2 specific layout reasons for selection and lists rejected variants | ATOM-09 (converge atom); WF-04 |
