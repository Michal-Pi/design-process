# Slop-Tell Heuristics

Pattern definitions for `assets/scripts/audit/slop-tells.mjs`.

Loaded at runtime via `readFileSync`. Updates here are visible in git diff.

Format: YAML block within the `patterns:` key below.

```yaml
patterns:
  - id: 5a-slop-001
    label: rainbow-gradient
    regex: "linear-gradient\\([^)]*(?:red|orange|yellow|green|blue|purple|indigo|violet)[^)]*,[^)]*(?:red|orange|yellow|green|blue|purple|indigo|violet)[^)]*,[^)]*(?:red|orange|yellow|green|blue|purple|indigo|violet)"
    severity: ERROR
    description: "Rainbow gradient: 3+ named color stops signals table-stakes AI CSS. Replace with a purposeful 2-color gradient using DTCG token values."
  - id: 5a-slop-002
    label: Inter-default
    regex: "font-family\\s*:\\s*['\"]?Inter['\"]?"
    severity: WARNING
    description: "Inter font hard-coded without brand intent. Use a font token variable (--font-body, --font-heading) from the DTCG token file."
  - id: 5a-slop-003
    label: glass-stack
    regex: "backdrop-filter\\s*:\\s*blur\\("
    severity: WARNING
    description: "Glass-morphism backdrop-filter blur is an overused default. Use intentional surface elevation tokens instead."
  - id: 5a-slop-004
    label: three-column-grid
    regex: "grid-template-columns\\s*:\\s*repeat\\s*\\(\\s*3\\s*,\\s*1fr\\s*\\)"
    severity: INFO
    description: "Three-column equal grid is the default Lovable/v0 layout. Verify this matches your Stage 2 structural IA."
  - id: 5a-slop-005
    label: linear-gradient-3plus-stops
    regex: "linear-gradient\\([^,]+,[^,]+,[^)]+"
    severity: WARNING
    description: "Linear gradient with 3+ colour stops. Likely an AI-generated gradient; use 2-stop purposeful gradients with DTCG primitive values."
```
