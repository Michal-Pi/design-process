# Rapid-Response Plan: Anthropic 5-Stage Equivalent Ships During Build Window

## Anthropic-Labs Watcher Trigger Conditions (D-79)

Weekly check during Phase 4; bi-daily during Wave B public launch window.
Check signals: `.complete-design/watcher/anthropic-labs-*.json` (from Phase 1 GTM-06 watcher cron).

### Severity 1 — Interop Pivot (invoke within 72 hours of detection)

**Trigger:** Anthropic Labs ships a tool with ≥3 of the following capabilities:
- Stage 2 sitemap generation
- Stage 3 wireframe generation (structured, not hi-fi)
- Stage 4 state machine / interaction spec generation
- Stage 5b DTCG design token emission

AND ≥1 of the following distribution characteristics:
- Open-source under Apache-2.0 or MIT
- DESIGN.md spec consumer or producer
- Distributed as a `.claude/skills/` SKILL.md package (runs in Claude Code)

**Action:** Invoke 72-hour pivot plan (below). Reposition complete-design as "the bridge between Claude Design and DESIGN.md spec consumers" — interop-first messaging replaces the current standalone-spine framing.

### Severity 2 — No Pivot Needed

**Trigger:** Anthropic ships a tool with Stage 5b token emission only (DTCG overlap), but NOT ≥3 of the Severity 1 capabilities.

**Action:** Continue as planned. Update marketplace copy to note "complements Anthropic's token tools with the full 5-stage design process."

### Severity 3 — Out of Scope (No Change)

**Trigger:** Anthropic ships a hi-fi-only generator (current Claude Design state as of May 2026: image generation → UI mockup, no Garrett spine).

**Action:** None. Claude Design is positioned at Stage 5a hi-fi; complete-design covers Stages 1-4 that precede it. Complementary framing holds.

---

## Trigger (legacy — defers to D-79 above)

The original simple trigger ("[competitive-watch] issue with ≥3 stage overlap") has been REFINED by D-79 above into Severity 1/2/3 conditions. **Use the D-79 framework for all trigger assessments.** Severity 1 (interop pivot) requires BOTH ≥3 stage capabilities AND ≥1 distribution characteristic (Apache-2.0 / MIT, DESIGN.md consumer, or SKILL.md package). Severity 2 and 3 do not trigger the 72-hour pivot.

The 72-hour response plan below applies ONLY to Severity 1 invocations per D-79.

The maintainer named in [MAINTAINERS.md](MAINTAINERS.md) owns the call to invoke this plan.

## 72-Hour Response

### Step 1 — Assess (first 4 hours)

- Read the competitive release / post in full.
- Count the overlap areas (list above).
- If overlap ≥3: invoke Steps 2–4 below.
- If overlap < 3: close the issue with a note ("partial overlap; no immediate action").

### Step 2 — Positioning pivot

Reframe complete-design from "5-stage design process facilitator" to (pivot framing: interoperability with Claude Design):

> **"Interoperability with Claude Design (and any 5-stage equivalent) — bring your own stage
> outputs, or use complete-design end-to-end."**

Key differentiators to emphasize:

1. `audit --reverse-engineer-stages` (Lovable refugee path) — reverse-engineer stage artifacts
   from any existing prototype. Ships v2.0b.
2. Gate-runner with `not_runnable` terminal state — explicit, cited, non-silent blocking. Not
   just "AI-assisted" — evidence-graded.
3. Evidence-graded provenance system (`VALIDATED` / `PROTO` / `INFERRED` / `MISSING`) — every
   artifact carries its epistemic status. No silent synthetic-persona substitution (TRUST-01).
4. Deterministic CI gates (`complete-design verify --golden`) — byte-identical output from every
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
  - Frame: "complete-design + your design tokens = full Garrett spine in the agent loop"

- **Marty Cagan** (build-to-learn intellectual heritage — frame as inspiration, not endorsement)
  - Frame: "complete-design operationalizes the discovery-then-build sequence with AI scaffolding
    and explicit evidence grades — it is not 'AI design', it is disciplined product thinking
    with AI as the drafting assistant"

- **Lenny Rachitsky** (PRD pattern, newsletter pitch)
  - Pitch: "Your one-pager PRD format is the Stage 0 fallback in complete-design — 50k+ installs
    cite Lenny's format as the interview-mode template"

### Decision Authority

The maintainer named in [MAINTAINERS.md](MAINTAINERS.md) owns the call to invoke this plan
and posts the pivot announcement within 72 hours of the trigger.
