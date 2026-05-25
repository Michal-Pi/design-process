// evals/watcher/keyword-filter.mjs
// Keyword filter for the Anthropic-Labs watcher (D-30, GTM-06).
// Extracted as a unit-testable ESM module from the GitHub Actions workflow logic.
//
// Heuristic (Open Q4 — Phase 1 ships 6 keywords + ≥2 keyword or 1 keyword + design-stem):
//   Include a title+body pair only if:
//     (a) keyword_count >= 2, OR
//     (b) keyword_count >= 1 AND /\bdesign(?:ed|er|ing)?\b/i.test(body)
//
// This heuristic correctly disambiguates "audit" (security audit — reject) from
// "design process" mentions (competitive threat — match).
//
// Sources: RESEARCH.md "GitHub Actions Cron for Anthropic-Labs Watcher (D-30)",
//          CONTEXT.md D-30, Open Q4 (tune in week 2 based on first week hits).

/**
 * The 6 keywords that trigger competitive-watch monitoring.
 * Tune in week 2 based on first week's false-positive / false-negative rate (Open Q4).
 */
export const KEYWORDS = [
  '5-stage',
  'design process',
  ' IA ',
  'wireframe',
  'state machine',
  'audit',
];

/**
 * Count how many keywords appear in the given text (case-insensitive).
 *
 * @param text  Text to search (typically a title or title+body combination)
 * @returns     Number of keyword matches found
 */
export function countKeywords(text) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const kw of KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      count++;
    }
  }
  return count;
}

/**
 * Determine whether a feed item matches the watcher criteria.
 *
 * Heuristic (Open Q4 calibration baseline):
 *   Match if keyword_count >= 2
 *   OR (keyword_count >= 1 AND body contains design-stem word)
 *
 * @param title  The feed item title
 * @param body   The feed item body/description (may be empty)
 * @returns      true if the item should trigger a competitive-watch issue
 */
export function matchesWatcherCriteria(title, body) {
  const keywordCount = countKeywords(title);

  // Quick reject — no keywords at all
  if (keywordCount === 0) {
    return false;
  }

  // Strong signal: 2+ keywords in the title
  if (keywordCount >= 2) {
    return true;
  }

  // Weak signal: 1 keyword + design-stem in body (not just "audit" alone)
  const DESIGN_STEM = /\bdesign(?:ers?|ed|ing|s)?\b/i;
  return keywordCount >= 1 && DESIGN_STEM.test(body);
}
