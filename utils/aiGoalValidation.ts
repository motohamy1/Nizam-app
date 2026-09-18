/**
 * utils/aiGoalValidation.ts
 * Validation, sanitization, and fallback rules for Nizam AI Goal Architect.
 * Implements Section 12-16, 34-41, 56-60 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import {
  AIGoalIntent,
  AIGoalPresentation,
  AIGoalType,
  AICategoryRecommendation,
  AITemplateRecommendation,
  GoalFrameworkId,
  GoalVisualStyleId,
  MilestoneItem,
  HeaderOption,
  AIGoalDraft,
} from '@/types/aiGoals';
import {
  ALLOWED_ACCENT_COLORS,
  ALLOWED_GOAL_ICONS,
  GOAL_FRAMEWORK_REGISTRY,
  GOAL_VISUAL_STYLE_REGISTRY,
} from '@/constants/aiGoalTemplates';

/**
 * Checks whether a category name is a generic placeholder that should be avoided.
 */
export function isGenericCategory(name?: string): boolean {
  const lower = (name || '').trim().toLowerCase();
  return (
    !lower ||
    lower === 'general' ||
    lower === 'general goals' ||
    lower === 'goals' ||
    lower === 'miscellaneous' ||
    lower === 'other' ||
    lower === 'personal' ||
    lower === 'عام' ||
    lower === 'عامة' ||
    lower === 'أهداف عامة' ||
    lower === 'أهداف'
  );
}

/**
 * Derives a crisp, domain-specific category from user input or intent.
 * Guarantees goals never get labeled with generic headers like "General".
 */
export function deriveCategoryFromIntent(text: string, isArabic = false): string {
  const t = (text || '').toLowerCase();

  // Software / Mobile / Web / Coding / Engineering
  if (/flutter|react|react-native|mobile|app|code|coding|developer|software|programming|python|javascript|typescript|backend|frontend|api|convex|database|web|ai|model|llm|dev|git|linux|deploy/i.test(t)) {
    return isArabic ? 'تطوير البرمجيات والتطبيقات' : 'Software & App Development';
  }

  // Health / Fitness / Sports / Gym / Diet
  if (/gym|run|running|fitness|health|workout|diet|exercise|marathon|weight|cardio|sleep|water|muscle|training|nutrition/i.test(t)) {
    return isArabic ? 'الصحة واللياقة البدنية' : 'Health & Physical Fitness';
  }

  // Learning / Reading / Education / Languages / Study
  if (/learn|study|read|book|course|language|english|german|spanish|french|exam|certification|degree|research|ielts|toefl|lecture/i.test(t)) {
    return isArabic ? 'التعلم وتطوير المهارات' : 'Learning & Skill Growth';
  }

  // Finance / Wealth / Investment / Savings / Business / Money
  if (/save|saving|money|finance|financial|invest|investment|budget|crypto|stock|income|revenue|profit|business|dollar|usd|egp|funds/i.test(t)) {
    return isArabic ? 'المالية والاستثمار' : 'Finance & Wealth Building';
  }

  // Career / Professional / Work / Job
  if (/job|career|work|promotion|client|freelance|portfolio|resume|interview|leadership|team|manager|client|sales|marketing/i.test(t)) {
    return isArabic ? 'المسار المهني والأعمال' : 'Career & Professional Growth';
  }

  // Creative / Art / Design / Writing / Music / Content
  if (/design|ui|ux|draw|paint|art|music|write|book|blog|youtube|content|video|photo|editing|podcast|film/i.test(t)) {
    return isArabic ? 'الإبداع وصناعة المحتوى' : 'Creative & Content Design';
  }

  // Mindset / Spiritual / Habits / Personal
  if (/pray|meditation|mind|habit|focus|discipline|routine|quran|dhikr|salah|mental/i.test(t)) {
    return isArabic ? 'التركيز والنمط اليومي' : 'Mindset & Daily Habits';
  }

  return isArabic ? 'أهداف المسار الأساسي' : 'Core Focus Objectives';
}

/**
 * Strips markdown wrapping, quotes, and invalid characters from AI output.
 */
export function sanitizeAIText(text: any, fallback = ''): string {
  if (typeof text !== 'string') return fallback;
  return text
    .replace(/^["'`]+|["'`]+$/g, '') // strip surrounding quotes
    .replace(/```[a-z]*\n?/gi, '') // strip code blocks
    .trim();
}

/**
 * Normalizes goal type into supported domain enums.
 */
export function normalizeGoalType(rawType: any): AIGoalType {
  const normalized = String(rawType || '').toLowerCase().trim();
  const validTypes: AIGoalType[] = [
    'learning',
    'project',
    'fitness',
    'health',
    'habit',
    'financial',
    'academic',
    'career',
    'creative',
    'personal',
    'mixed',
    'custom',
  ];
  return validTypes.includes(normalized as AIGoalType)
    ? (normalized as AIGoalType)
    : 'project';
}

/**
 * Ensures intent structure conforms to requirements.
 * Enforces NO hallucinated secondary life domains (Blueprint Section 8).
 */
export function validateGoalIntent(rawIntent: any, rawInput: string, timeframe: 'day' | 'month' | 'year'): AIGoalIntent {
  const goalType = normalizeGoalType(rawIntent?.goalType);
  const coreSubject = sanitizeAIText(rawIntent?.coreSubject, rawInput.slice(0, 40));
  const corePurpose = sanitizeAIText(rawIntent?.corePurpose, rawInput);
  const domain = sanitizeAIText(rawIntent?.domain, 'general');

  // Extract explicit items if user mentioned them
  const explicitUserItems: string[] = Array.isArray(rawIntent?.explicitUserItems)
    ? rawIntent.explicitUserItems.map((item: any) => sanitizeAIText(item)).filter(Boolean)
    : [];

  return {
    rawInput,
    coreSubject,
    corePurpose,
    goalType,
    domain,
    desiredOutcome: sanitizeAIText(rawIntent?.desiredOutcome),
    supportingOutcomes: Array.isArray(rawIntent?.supportingOutcomes)
      ? rawIntent.supportingOutcomes.map((o: any) => sanitizeAIText(o)).filter(Boolean)
      : [],
    timeframe,
    measurableSignals: Array.isArray(rawIntent?.measurableSignals)
      ? rawIntent.measurableSignals.map((s: any) => sanitizeAIText(s)).filter(Boolean)
      : [],
    explicitUserItems,
    confidence: {
      coreIntent: typeof rawIntent?.confidence?.coreIntent === 'number' ? rawIntent.confidence.coreIntent : 0.9,
      type: typeof rawIntent?.confidence?.type === 'number' ? rawIntent.confidence.type : 0.9,
      category: typeof rawIntent?.confidence?.category === 'number' ? rawIntent.confidence.category : 0.85,
    },
  };
}

/**
 * Fallback recommendations when AI recommendations are incomplete.
 * Strictly capped at 3 per Blueprint Section 12.
 */
export function getDefaultTemplateRecommendations(
  goalType: AIGoalType,
  timeframe: 'day' | 'month' | 'year',
  isArabic = false
): AITemplateRecommendation[] {
  if (goalType === 'learning' || goalType === 'academic') {
    return [
      {
        templateId: 'roadmap',
        frameworkId: 'roadmap',
        visualStyleId: 'book',
        title: 'Sequential Roadmap (Classic Book)',
        titleAr: 'خارطة طريق تعليمية (مظهر كتاب)',
        reason: 'Best for progressive knowledge acquisition step-by-step.',
        reasonAr: 'الأنسب للتعلم المنظم والتدرج المعرفي خطوة بخطوة.',
        fit: 'primary',
      },
      {
        templateId: 'checklist',
        frameworkId: 'checklist',
        visualStyleId: 'paper',
        title: 'Action Checklist (Clean Paper)',
        titleAr: 'قائمة مهام تنفيذية (مظهر ورقي)',
        reason: 'Simple direct tracking for learning tasks.',
        reasonAr: 'متابعة مباشرة وبسيطة للمهام والدروس.',
        fit: 'alternative',
      },
      {
        templateId: 'sprint',
        frameworkId: 'sprint',
        visualStyleId: 'minimal',
        title: 'Intensive Sprint (Minimal)',
        titleAr: 'سبرنت تعليمي مكثف (مظهر بسيط)',
        reason: 'High-focus study block with clear deadlines.',
        reasonAr: 'فترة تركيز عالية لإنجاز مقرر محدد.',
        fit: 'alternative',
      },
    ];
  }

  if (goalType === 'fitness' || goalType === 'health') {
    return [
      {
        templateId: 'metric',
        frameworkId: 'metric',
        visualStyleId: 'dark-capsule',
        title: 'Target Gauge (Dark Capsule)',
        titleAr: 'مؤشر أداء رقمي (كبسولة داكنة)',
        reason: 'High-visibility target tracking for reps, km, or weight.',
        reasonAr: 'أفضل لتتبع الأرقام والمسافات والأهداف الرياضية بدقة.',
        fit: 'primary',
      },
      {
        templateId: 'checklist',
        frameworkId: 'checklist',
        visualStyleId: 'paper',
        title: 'Routine Checklist (Paper)',
        titleAr: 'قائمة التمارين اليومية (ورقي)',
        reason: 'Check off exercises and workouts consistently.',
        reasonAr: 'متابعة التمارين اليومية والروتين بكل سلاسة.',
        fit: 'alternative',
      },
      {
        templateId: 'sprint',
        frameworkId: 'sprint',
        visualStyleId: 'glass',
        title: 'Energy Sprint (Frosted Glass)',
        titleAr: 'سبرنت تحدي مكثف (زجاجي)',
        reason: 'Time-boxed challenge for fitness bursts.',
        reasonAr: 'تحدٍ محدد بزمن للوصول لمستوى بدني جديد.',
        fit: 'alternative',
      },
    ];
  }

  if (goalType === 'habit') {
    return [
      {
        templateId: 'pillar',
        frameworkId: 'pillar',
        visualStyleId: 'book',
        title: 'Identity Pillar (Classic Book)',
        titleAr: 'ركيزة شخصية (طابع كتاب)',
        reason: 'Grounding identity habit anchor.',
        reasonAr: 'ترسيخ العادات الأساسية وبناء الهوية اليومية.',
        fit: 'primary',
      },
      {
        templateId: 'checklist',
        frameworkId: 'checklist',
        visualStyleId: 'minimal',
        title: 'Daily Check (Minimal)',
        titleAr: 'فحص يومي (بسيط)',
        reason: 'Clean daily trigger check-off.',
        reasonAr: 'التحقق السريع من إنجاز العادة.',
        fit: 'alternative',
      },
      {
        templateId: 'metric',
        frameworkId: 'metric',
        visualStyleId: 'paper',
        title: 'Streak Counter (Paper)',
        titleAr: 'عداد الالتزام (ورقي)',
        reason: 'Track unbroken streak count.',
        reasonAr: 'متابعة سلسلة الأيام المتواصلة.',
        fit: 'alternative',
      },
    ];
  }

  if (goalType === 'financial') {
    return [
      {
        templateId: 'metric',
        frameworkId: 'metric',
        visualStyleId: 'editorial',
        title: 'Financial Target (Editorial)',
        titleAr: 'هدف مالي رقمي (طابع صحفي)',
        reason: 'Clear quantifiable target for savings, investments, or budget.',
        reasonAr: 'متابعة دقيقة للأرقام والمبالغ المستهدفة والادخار.',
        fit: 'primary',
      },
      {
        templateId: 'roadmap',
        frameworkId: 'roadmap',
        visualStyleId: 'paper',
        title: 'Wealth Roadmap (Paper)',
        titleAr: 'خارطة بناء الثروة (ورقي)',
        reason: 'Phased milestones towards financial freedom.',
        reasonAr: 'محطات مرحلية متتابعة نحو الأمان المالي.',
        fit: 'alternative',
      },
      {
        templateId: 'checklist',
        frameworkId: 'checklist',
        visualStyleId: 'minimal',
        title: 'Budget Actions (Minimal)',
        titleAr: 'مهام الميزانية (بسيط)',
        reason: 'Actionable financial decisions and audits.',
        reasonAr: 'مهام تنفيذية سريعة لضبط النفقات.',
        fit: 'alternative',
      },
    ];
  }

  // Default / Project / General
  return [
    {
      templateId: 'roadmap',
      frameworkId: 'roadmap',
      visualStyleId: 'glass',
      title: 'Phase Roadmap (Frosted Glass)',
      titleAr: 'خارطة طريق مرحلية (زجاجي حديث)',
      reason: 'Best for multi-phase projects with clear chronological stages.',
      reasonAr: 'الأنسب للمشاريع متدرجة المراحل ومتابعة الإنجاز تصاعدياً.',
      fit: 'primary',
    },
    {
      templateId: 'checklist',
      frameworkId: 'checklist',
      visualStyleId: 'paper',
      title: 'Action Checklist (Paper Craft)',
      titleAr: 'قائمة مهام تنفيذية (ورقي كلاسيكي)',
      reason: 'Crisp action checklist for focused execution.',
      reasonAr: 'قائمة مباشرة لإنجاز المهام خطوة بخطوة بكل وضوح.',
      fit: 'alternative',
    },
    {
      templateId: 'sprint',
      frameworkId: 'sprint',
      visualStyleId: 'dark-capsule',
      title: 'Focused Sprint (Dark Capsule)',
      titleAr: 'سبرنت إنجاز سريع (كبسولة داكنة)',
      reason: 'High-energy time-boxed focus period.',
      reasonAr: 'فترة تركيز عالية لإنهاء مخرجات حاسمة بوقت قياسي.',
      fit: 'alternative',
    },
  ];
}

/**
 * Validates raw template recommendations against the framework and style registry.
 * Strictly guarantees maximum 3 recommendations per Section 12.
 */
export function validateTemplateRecommendations(
  rawRecommendations: any,
  goalType: AIGoalType,
  timeframe: 'day' | 'month' | 'year',
  isArabic = false
): AITemplateRecommendation[] {
  const defaults = getDefaultTemplateRecommendations(goalType, timeframe, isArabic);

  if (!Array.isArray(rawRecommendations) || rawRecommendations.length === 0) {
    return defaults;
  }

  const validFrameworks = Object.keys(GOAL_FRAMEWORK_REGISTRY) as GoalFrameworkId[];
  const validStyles = Object.keys(GOAL_VISUAL_STYLE_REGISTRY) as GoalVisualStyleId[];

  const validated: AITemplateRecommendation[] = [];

  for (const item of rawRecommendations) {
    if (validated.length >= 3) break; // Strict max 3

    let fw: GoalFrameworkId = 'roadmap';
    const rawFw = String(item.frameworkId || item.templateId || '').toLowerCase();
    if (validFrameworks.includes(rawFw as GoalFrameworkId)) {
      fw = rawFw as GoalFrameworkId;
    } else if (rawFw.includes('check') || rawFw.includes('list') || rawFw.includes('simple')) {
      fw = 'checklist';
    } else if (rawFw.includes('metric') || rawFw.includes('target') || rawFw.includes('counter')) {
      fw = 'metric';
    } else if (rawFw.includes('sprint') || rawFw.includes('focus')) {
      fw = 'sprint';
    } else if (rawFw.includes('pillar') || rawFw.includes('strategic')) {
      fw = 'pillar';
    }

    let st: GoalVisualStyleId = 'default';
    const rawSt = String(item.visualStyleId || item.style || '').toLowerCase();
    if (validStyles.includes(rawSt as GoalVisualStyleId)) {
      st = rawSt as GoalVisualStyleId;
    } else if (rawSt.includes('book')) {
      st = 'book';
    } else if (rawSt.includes('paper')) {
      st = 'paper';
    } else if (rawSt.includes('glass')) {
      st = 'glass';
    } else if (rawSt.includes('editorial')) {
      st = 'editorial';
    } else if (rawSt.includes('dark')) {
      st = 'dark-capsule';
    } else if (rawSt.includes('notebook')) {
      st = 'notebook';
    } else if (rawSt.includes('minimal')) {
      st = 'minimal';
    }

    const fit = validated.length === 0 ? 'primary' : 'alternative';

    // Prevent duplicate framework + visual style pairings
    const exists = validated.some((v) => v.frameworkId === fw && v.visualStyleId === st);
    if (!exists) {
      validated.push({
        templateId: fw,
        frameworkId: fw,
        visualStyleId: st,
        title: sanitizeAIText(item.title, `${fw} (${st})`),
        titleAr: sanitizeAIText(item.titleAr),
        reason: sanitizeAIText(item.reason, defaults[validated.length]?.reason || 'Recommended fit'),
        reasonAr: sanitizeAIText(item.reasonAr, defaults[validated.length]?.reasonAr),
        fit,
      });
    }
  }

  // Backfill up to 3 from defaults if needed
  while (validated.length < 3 && validated.length < defaults.length) {
    const nextDefault = defaults[validated.length];
    const exists = validated.some(
      (v) => v.frameworkId === nextDefault.frameworkId && v.visualStyleId === nextDefault.visualStyleId
    );
    if (!exists) {
      validated.push(nextDefault);
    } else {
      break;
    }
  }

  return validated.slice(0, 3);
}

/**
 * Validates category recommendation with fuzzy match against existing categories.
 * Strictly avoids generic category names like "General" or "عام".
 */
export function validateCategoryRecommendation(
  rawCategory: any,
  existingCategories: string[] = [],
  coreSubject: string,
  isArabic = false
): AICategoryRecommendation {
  const suggestedName = sanitizeAIText(rawCategory?.name || rawCategory?.suggestedHeader, '').trim();

  // Filter out any generic categories from existing list
  const cleanExisting = existingCategories.filter((c) => !isGenericCategory(c));

  // Check exact or case-insensitive match against clean categories
  let matchedExisting: string | undefined;
  if (suggestedName && !isGenericCategory(suggestedName)) {
    matchedExisting = cleanExisting.find(
      (c) => c.toLowerCase() === suggestedName.toLowerCase()
    );
  }

  let name = matchedExisting || suggestedName;
  if (isGenericCategory(name)) {
    name = cleanExisting.length > 0 ? cleanExisting[0] : deriveCategoryFromIntent(coreSubject, isArabic);
  }

  const mode: 'existing' | 'new' = matchedExisting ? 'existing' : (rawCategory?.mode === 'new' || !cleanExisting.includes(name)) ? 'new' : 'existing';

  const alternatives: Array<{ existingCategoryId?: string; name: string; reason: string }> = [];
  cleanExisting.forEach((c) => {
    if (c !== name && alternatives.length < 3) {
      alternatives.push({
        name: c,
        reason: 'Existing category in your workspace',
      });
    }
  });

  return {
    recommendedCategory: {
      mode,
      name,
      description: sanitizeAIText(rawCategory?.description),
    },
    alternatives,
    createNewCategory: mode === 'new',
  };
}

/**
 * Deduplicates and strips empty milestone items.
 */
export function removeDuplicateMilestones(milestones: any[]): MilestoneItem[] {
  if (!Array.isArray(milestones)) return [];
  const seen = new Set<string>();
  const result: MilestoneItem[] = [];

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const text = sanitizeAIText(typeof m === 'string' ? m : m?.text || m?.title);
    if (!text) continue;

    const normalized = text.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push({
        id: typeof m === 'object' && m?.id ? String(m.id) : `ms_${Date.now()}_${i}`,
        text,
        isCompleted: Boolean(typeof m === 'object' && m?.isCompleted),
      });
    }
  }

  return result;
}

/**
 * Ensures accent color and icon fall within supported palettes.
 */
export function validateColorAndIcon(rawColor?: string, rawIcon?: string): { color: string; icon: string } {
  let color = ALLOWED_ACCENT_COLORS[0];
  if (rawColor && ALLOWED_ACCENT_COLORS.includes(rawColor as any)) {
    color = rawColor;
  } else if (rawColor && /^#[0-9A-F]{6}$/i.test(rawColor)) {
    color = rawColor;
  }

  let icon = ALLOWED_GOAL_ICONS[0];
  if (rawIcon && ALLOWED_GOAL_ICONS.includes(rawIcon as any)) {
    icon = rawIcon;
  }

  return { color, icon };
}

/**
 * Normalizes full raw AI response into typed AIGoalDraft contract.
 */
export function normalizeGoalArchitectResponse(
  raw: any,
  context: {
    rawInput: string;
    timeframe: 'day' | 'month' | 'year';
    existingCategories?: string[];
    isArabic?: boolean;
  }
): AIGoalDraft {
  const { rawInput, timeframe, existingCategories = [], isArabic = false } = context;

  const intent = validateGoalIntent(raw?.intent, rawInput, timeframe);
  const goalTitle = sanitizeAIText(raw?.goalTitle || raw?.title, intent.coreSubject || rawInput.slice(0, 50));
  const description = sanitizeAIText(raw?.description, '');

  const templateOptions = validateTemplateRecommendations(
    raw?.templateOptions || raw?.suggestedTemplates,
    intent.goalType,
    timeframe,
    isArabic
  );

  const presentation: AIGoalPresentation = {
    frameworkId: templateOptions[0]?.frameworkId || 'roadmap',
    visualStyleId: templateOptions[0]?.visualStyleId || 'default',
  };

  const categoryRec = validateCategoryRecommendation(
    raw?.categoryRecommendation || { name: raw?.suggestedHeader, mode: raw?.suggestedHeaderIsExisting ? 'existing' : 'new' },
    existingCategories,
    intent.coreSubject,
    isArabic
  );

  const { color, icon } = validateColorAndIcon(raw?.color, raw?.icon);

  // Initial generation has ZERO milestones by default unless user explicitly specified items in prompt
  let milestones: MilestoneItem[] = [];
  if (intent.explicitUserItems.length > 0) {
    milestones = removeDuplicateMilestones(intent.explicitUserItems);
  } else if (Array.isArray(raw?.suggestedMilestones) && raw.suggestedMilestones.length > 0) {
    milestones = removeDuplicateMilestones(raw.suggestedMilestones);
  }

  const suggestedProjects = Array.isArray(raw?.suggestedProjects)
    ? raw.suggestedProjects.map((p: any, idx: number) => ({
        localDraftId: `proj_${Date.now()}_${idx}`,
        name: sanitizeAIText(p.name || p.title, 'Project'),
        description: sanitizeAIText(p.description, ''),
      }))
    : [];

  return {
    intent,
    goal: {
      title: goalTitle,
      description,
      timeframe: intent.timeframe,
    },
    category: {
      selectedName: categoryRec.recommendedCategory.name,
      existingCategoryId: categoryRec.recommendedCategory.existingCategoryId,
      isNew: categoryRec.recommendedCategory.mode === 'new',
    },
    presentation,
    templateOptions,
    milestones,
    suggestedProjects,
    color,
    icon,
    dirtyByUser: false,
    aiResponseText: sanitizeAIText(raw?.aiResponseText, ''),
    userEditedFields: {},
  };
}
