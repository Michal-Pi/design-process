# Stage 2 gate operational checklist

Stage 2 covers Information Architecture: sitemap with LATCH-diverse variants and Mermaid flows per JTBD.

| Check | Required for PASS | Required for VALIDATED grade | Citation |
| ----- | ----------------- | ---------------------------- | -------- |
| Sitemap has ≥2 LATCH-diverse variants | At least 2 sitemap variants present in design/ia/ with different organizational axes | ≥2 variants each passing sitemap.v1.json schema validation with distinct LATCH categories annotated | Rosenfeld §2 (LATCH: Location, Alphabet, Time, Category, Hierarchy) |
| Mermaid flows emitted per JTBD | At least one Mermaid flowchart or stateDiagram-v2 file present per JTBD in personas | All Mermaid flows render without syntax errors via @mermaid-js/mermaid-cli | WF-03 (JTBD → Mermaid user flow requirement) |
