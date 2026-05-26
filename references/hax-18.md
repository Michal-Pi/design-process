# HAX-18: Guidelines for Human-AI Interaction

**Stage:** 4 (Interact)
**Topic:** 18 design guidelines for products that include AI/ML features

## Summary

Amershi et al. (2019) distilled 18 guidelines from Microsoft's experience shipping AI-powered
products across Office, Bing, Cortana, and Azure. These guidelines address the unique challenges
of AI systems: uncertainty, error recovery, and opacity of decisions.

## The 18 Guidelines (Selected Key Items)

**G1 — Make clear when the system uses AI features**
Users must know when AI is involved. Avoid hiding AI behind generic UI metaphors.
Example: "Suggested by AI" labels on recommendations.

**G2 — Make clear what the AI can do**
Set expectations before first use. Don't let users discover limitations through failures.

**G7 — Support efficient invocation for AI features**
AI features should be easy to trigger when users want them. Don't bury them in menus.

**G8 — Support efficient dismissal**
AI suggestions must be easy to ignore or dismiss. Never force users to engage.

**G11 — Make clear why the AI did what it did**
Provide lightweight explanations for AI actions when possible. "Because you viewed X."

**G14 — Encourage granular feedback**
Allow users to provide feedback on specific AI outputs (thumbs up/down, report incorrect).

**G16 — Convey the consequences of AI decisions**
When AI takes an action (auto-categorize, auto-send), be explicit about what happened.
Provide undo for consequential AI actions.

**G17 — Provide global controls**
Let users turn off AI features entirely. Respect this setting persistently.

**G18 — Notify users about changes**
When AI behavior changes (model update, new data), notify users proactively.

## Application to Stage 4

When `asyncOperations: true` AND the screen has AI-powered features:
- Cite this reference in the `.spec.md` body
- Ensure `loading` state communicates AI processing (not just generic spinner)
- Ensure `error` state handles AI failure gracefully (e.g., "AI unavailable, showing manual results")
- Consider adding `partial` state if AI results arrive incrementally

## Citations

Amershi, S., Weld, D., Vorvoreanu, M., Fourney, A., Nushi, B., Collisson, P., Suh, J.,
Iqbal, S., Bennett, P. N., Inkpen, K., Teevan, J., Kikin-Gil, R., & Horvitz, E. (2019).
Software engineering for machine learning: A case study. *Proceedings of the 41st International
Conference on Software Engineering: Software Engineering in Practice* (ICSE-SEIP 2019).

Also: Microsoft HAX Workbook (2020). https://www.microsoft.com/en-us/research/project/human-ai-experience/
CHI 2019 DOI: 10.1109/ICSE-SEIP.2019.00042
