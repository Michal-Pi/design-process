# Rapid-Response Plan: Anthropic 5-Stage Equivalent Ships During Build Window

## Trigger

A `[competitive-watch]` issue lands AND the linked release/post describes a feature overlap
of ≥3 of:
- Research synthesis
- Information architecture
- Low-fidelity wireframing
- Interaction design
- Token generation / design system extraction
- Stage-gated workflow enforcement

The maintainer named in [MAINTAINERS.md](MAINTAINERS.md) owns the call to invoke this plan.

## 72-Hour Response

### Step 1 — Assess (first 4 hours)

- Read the competitive release / post in full.
- Count the overlap areas (list above).
- If overlap ≥3: invoke Steps 2–4 below.
- If overlap < 3: close the issue with a note ("partial overlap; no immediate action").

### Step 2 — Positioning pivot

Reframe design-os from "5-stage design process facilitator" to (pivot framing: interoperability with Claude Design):

> **"Interoperability with Claude Design (and any 5-stage equivalent) — bring your own stage
> outputs, or use design-os end-to-end."**

Key differentiators to emphasize:

1. `audit --reverse-engineer-stages` (Lovable refugee path) — reverse-engineer stage artifacts
   from any existing prototype. Ships v2.0b.
2. Gate-runner with `not_runnable` terminal state — explicit, cited, non-silent blocking. Not
   just "AI-assisted" — evidence-graded.
3. Evidence-graded provenance system (`VALIDATED` / `PROTO` / `INFERRED` / `MISSING`) — every
   artifact carries its epistemic status. No silent synthetic-persona substitution (TRUST-01).
4. Deterministic CI gates (`design-os verify --golden`) — byte-identical output from every
   deterministic script. LLM "picks"; scripts emit. Auditable.
5. OSS Apache-2.0, installed into the agent the user already uses (.claude/skills/, .codex/).

### Step 3 — Marketplace copy variants (8 marketplaces)

| Marketplace | Emphasis |
|-------------|----------|
| skills.sh | OSS Apache-2.0 heritage + Garrett/Torres/JTBD canon citations |
| claudemarketplaces.com | `audit` verb + slop-tells library (Stage 5a fidelity cap detection) |
| mcpmarket.com | Deterministic CI gates + schema migration guard |
| smithery.ai | Evidence-graded provenance + gate-runner terminal states |
| lobehub | Interoperability with Claude Design / Stitch |
| fastmcp.me | Host-agnostic (Claude Code + Codex CLI + Cursor) |
| playbooks.com | Full 5-stage walkthrough with designer-readable Mermaid state diagrams |
| Tessl Registry | PR-audit route — review design regression in CI |

### Step 4 — Outreach list

- **Brad Frost** (design-systems-as-AI-context heritage)
  - DM via Twitter/Bluesky
  - Cross-post on Frostapalooza Slack if invited
  - Frame: "design-os + your design tokens = full Garrett spine in the agent loop"

- **Marty Cagan** (build-to-learn intellectual heritage — frame as inspiration, not endorsement)
  - Frame: "design-os operationalizes the discovery-then-build sequence with AI scaffolding
    and explicit evidence grades — it is not 'AI design', it is disciplined product thinking
    with AI as the drafting assistant"

- **Lenny Rachitsky** (PRD pattern, newsletter pitch)
  - Pitch: "Your one-pager PRD format is the Stage 0 fallback in design-os — 50k+ installs
    cite Lenny's format as the interview-mode template"

### Decision Authority

The maintainer named in [MAINTAINERS.md](MAINTAINERS.md) owns the call to invoke this plan
and posts the pivot announcement within 72 hours of the trigger.
