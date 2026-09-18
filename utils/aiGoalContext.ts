/**
 * utils/aiGoalContext.ts
 * Deterministic context filtering, hybrid category matching, and compact prompt context building.
 * Implements Section 62, 63, 64 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

export interface GoalContextInput {
  existingCategories?: string[];
  existingSubCategories?: string[];
  existingProjects?: string[];
  existingRelatedGoals?: string[];
  previousGoalsInSession?: Array<{ text: string; category: string; templateId?: string }>;
}

/**
 * Deterministic domain keyword matching to find highest-overlap existing categories.
 */
export function findRelevantCategories(
  userText: string,
  categories: string[] = []
): { bestMatch?: string; relevantList: string[] } {
  if (!categories || categories.length === 0) {
    return { relevantList: [] };
  }

  const normalizedInput = userText.toLowerCase();
  const words = normalizedInput.split(/\s+/).filter((w) => w.length > 2);

  const scored = categories.map((cat) => {
    const catLower = cat.toLowerCase();
    let score = 0;

    // Direct inclusion
    if (normalizedInput.includes(catLower)) {
      score += 10;
    }

    // Word token overlap
    for (const word of words) {
      if (catLower.includes(word)) {
        score += 3;
      }
    }

    return { cat, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const bestMatch = scored[0]?.score > 0 ? scored[0].cat : undefined;
  // Limit to top 8 categories to preserve prompt tokens and avoid LLM hallucinations
  const relevantList = scored.slice(0, 8).map((s) => s.cat);

  return { bestMatch, relevantList };
}

/**
 * Formats pruned context for the LLM prompt.
 */
export function buildPromptContextString(params: {
  timeframe: 'day' | 'month' | 'year';
  year: number;
  month?: number;
  day?: number;
  context: GoalContextInput;
}): string {
  const { timeframe, year, month, day, context } = params;

  const timeframeDesc =
    timeframe === 'day'
      ? `Day ${day}, Month ${(month ?? 0) + 1}, Year ${year} (Execution scope: immediate, today focus)`
      : timeframe === 'month'
      ? `Month ${(month ?? 0) + 1}, Year ${year} (Monthly scope: 2-4 week achievement and deliverables)`
      : `Year ${year} (Annual vision scope: strategic major milestones)`;

  const categoriesStr =
    context.existingCategories && context.existingCategories.length > 0
      ? `Known Categories: [${context.existingCategories.slice(0, 10).map((c) => `"${c}"`).join(', ')}]`
      : 'No prior categories.';

  const projectsStr =
    context.existingProjects && context.existingProjects.length > 0
      ? `Known Projects: [${context.existingProjects.slice(0, 6).map((p) => `"${p}"`).join(', ')}]`
      : '';

  const previousGoalsStr =
    context.previousGoalsInSession && context.previousGoalsInSession.length > 0
      ? `Previous Goals In Session:\n${context.previousGoalsInSession
          .map((g) => `- "${g.text}" (${g.category})`)
          .join('\n')}`
      : '';

  return [
    `Current Timeframe: ${timeframeDesc}`,
    categoriesStr,
    projectsStr,
    previousGoalsStr,
  ]
    .filter(Boolean)
    .join('\n');
}
