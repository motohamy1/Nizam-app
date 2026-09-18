import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Seed Template Definitions for Goals
 */
export const SEED_TEMPLATES = [
  {
    templateId: "life_pillars",
    name: "Life Pillars & Balance",
    nameAr: "ركائز الحياة والتوازن",
    description: "Holistic monthly growth across career, health, mind, and personal wealth.",
    descriptionAr: "نمو متوازن وشامل يشمل المسار المهني، الصحة، الفكر، والمالية الشخصية.",
    icon: "layers-outline",
    badge: "Popular",
    badgeAr: "الأكثر اختياراً",
    bg: "#EDE8DB",
    ink: "#1E1B18",
    accent: "#EA580C",
    accentSecondary: "#C2410C",
    color: "#EA580C",
    gradientColors: ["#EDE8DB", "#EA580C"],
    artType: "halfCircles",
    order: 1,
    isDefault: true,
    categories: [
      {
        id: "career_tech",
        title: "Career & Projects",
        titleAr: "العمل والمشاريع",
        icon: "briefcase-outline",
        color: "#2563EB",
        description: "Core career milestones, shipped deliverables, and technical execution.",
        descriptionAr: "أهم الإنجازات المهنية، تسليم المشاريع، والأداء التقني.",
      },
      {
        id: "health_vitality",
        title: "Health & Vitality",
        titleAr: "الصحة واللياقة",
        icon: "fitness-outline",
        color: "#059669",
        description: "Physical workout targets, nutrition habits, and mental endurance.",
        descriptionAr: "أهداف التمارين الرياضية، التغذية الصحية، والنوم والنشاط.",
      },
      {
        id: "mind_learning",
        title: "Mind & Learning",
        titleAr: "الفكر والتعلم",
        icon: "book-outline",
        color: "#7C3AED",
        description: "Books to read, skills to acquire, and mental mastery.",
        descriptionAr: "الكتب المقروءة، المهارات الجديدة، وتوسيع المدارك.",
      },
      {
        id: "wealth_finance",
        title: "Finance & Wealth",
        titleAr: "المالية والاستثمار",
        icon: "wallet-outline",
        color: "#D97706",
        description: "Savings targets, smart budgeting, and investment tracking.",
        descriptionAr: "أهداف الادخار، ضبط الميزانية، والاستثمارات الذكية.",
      },
    ],
  },
  {
    templateId: "okr_engine",
    name: "OKR Ambition Engine",
    nameAr: "محرك الأهداف والنتائج (OKR)",
    description: "High-impact qualitative Objectives paired with quantifiable Key Results.",
    descriptionAr: "أهداف طموحة وواضحة مقترنة بنتائج رئيسية قابلة للقياس والتقييم.",
    icon: "speedometer-outline",
    badge: "Strategic",
    badgeAr: "استراتيجي",
    bg: "#C7D2FE",
    ink: "#1E1B4B",
    accent: "#4F46E5",
    accentSecondary: "#4338CA",
    color: "#4F46E5",
    gradientColors: ["#C7D2FE", "#4F46E5"],
    artType: "rings",
    order: 2,
    categories: [
      {
        id: "objective_1",
        title: "Objective 1: Prime Breakthrough",
        titleAr: "الهدف 1: الإنجاز الأكبر",
        icon: "trophy-outline",
        color: "#4F46E5",
        description: "The single most impactful objective that transforms this month.",
        descriptionAr: "الهدف الأهم والتحولي لهذا الشهر.",
      },
      {
        id: "objective_2",
        title: "Objective 2: Scale & Output",
        titleAr: "الهدف 2: الإنتاجية والتوسع",
        icon: "rocket-outline",
        color: "#7C3AED",
        description: "Scaling capacity, delivering major outputs, and building momentum.",
        descriptionAr: "مضاعفة الإنتاج وتسليم الأعمال ذات التأثير العالي.",
      },
      {
        id: "objective_3",
        title: "Objective 3: Foundation & Mastery",
        titleAr: "الهدف 3: الأساسيات والتمكين",
        icon: "shield-checkmark-outline",
        color: "#059669",
        description: "Strengthening core habits, health, and operational excellence.",
        descriptionAr: "تعزيز العادات الأساسية والصحة واستقرار الأداء.",
      },
    ],
  },
  {
    templateId: "weekly_sprint",
    name: "4-Week Sprint Roadmap",
    nameAr: "خارطة طريق الأسابيع الأربعة",
    description: "Decompose the month into 4 phased, actionable execution sprints.",
    descriptionAr: "تقسيم الشهر إلى 4 مراحل وتحديات أسبوعية واضحة ومترابطة.",
    icon: "calendar-outline",
    badge: "Agile",
    badgeAr: "مراحل أسبوعية",
    bg: "#86EFAC",
    ink: "#052E16",
    accent: "#15803D",
    accentSecondary: "#166534",
    color: "#15803D",
    gradientColors: ["#86EFAC", "#15803D"],
    artType: "stripes",
    order: 3,
    categories: [
      {
        id: "week_1",
        title: "Week 1: Setup & Kickoff",
        titleAr: "الأسبوع 1: التأسيس والانطلاق",
        icon: "flag-outline",
        color: "#059669",
        description: "Clarify scope, establish routines, and complete initial quick wins.",
        descriptionAr: "تجهيز المتطلبات، ترتيب الروتين، وتحقيق أولى المكاسب السريعة.",
      },
      {
        id: "week_2",
        title: "Week 2: Deep Build & Momentum",
        titleAr: "الأسبوع 2: البناء والزخم",
        icon: "construct-outline",
        color: "#2563EB",
        description: "Heavy lifting on core milestones and aggressive progress.",
        descriptionAr: "تنفيذ المهام المعقدة والتسارع في الإنجاز.",
      },
      {
        id: "week_3",
        title: "Week 3: Quality & Polish",
        titleAr: "الأسبوع 3: الصقل والتجويد",
        icon: "sparkles-outline",
        color: "#7C3AED",
        description: "Refining details, testing outputs, and fixing bottlenecks.",
        descriptionAr: "معالجة العقبات وصقل جودة المخرجات.",
      },
      {
        id: "week_4",
        title: "Week 4: Final Sprint & Review",
        titleAr: "الأسبوع 4: الحسم والمراجعة",
        icon: "checkmark-done-circle-outline",
        color: "#EA580C",
        description: "Crossing the finish line, celebrating wins, and retrospective analysis.",
        descriptionAr: "إنهاء التسليم، قياس النتائج، والاحتفال بالإنجاز.",
      },
    ],
  },
  {
    templateId: "atomic_habits",
    name: "Atomic Keystone Systems",
    nameAr: "منظومة العادات الذرية",
    description: "Focus on identity-based keystone habits and strict anti-goals boundaries.",
    descriptionAr: "التركيز على بناء الهوية عبر عادات يومية حاسمة وتجنب مشتتات التركيز.",
    icon: "infinite-outline",
    badge: "Habit System",
    badgeAr: "بناء العادات",
    bg: "#FED7AA",
    ink: "#431407",
    accent: "#EA580C",
    accentSecondary: "#C2410C",
    color: "#EA580C",
    gradientColors: ["#FED7AA", "#EA580C"],
    artType: "grid",
    order: 4,
    categories: [
      {
        id: "keystone_deliverable",
        title: "Prime Monthly Outcome",
        titleAr: "المخرج الأساسي للشهر",
        icon: "star-outline",
        color: "#EA580C",
        description: "The single milestone or project that anchors this month's identity.",
        descriptionAr: "الإنجاز الملموس الذي يمثل عنوان الشهر وهدفه الأكبر.",
      },
      {
        id: "daily_habits",
        title: "Daily Keystone Rituals",
        titleAr: "العادات اليومية الحاكمة",
        icon: "flame-outline",
        color: "#D97706",
        description: "Non-negotiable daily rituals that compound into victory.",
        descriptionAr: "الطقوس اليومية الثابتة التي تصنع الفرق التراكمي.",
      },
      {
        id: "anti_goals",
        title: "Anti-Goals & Boundaries",
        titleAr: "الممنوعات والحدود الذكية",
        icon: "close-circle-outline",
        color: "#E11D48",
        description: "Distractions and traps strictly eliminated this month.",
        descriptionAr: "المشتتات والسلوكيات السلبية التي ستتجنبها تماماً.",
      },
    ],
  },
  {
    templateId: "balance_wheel",
    name: "8-Dimension Life Wheel",
    nameAr: "عجلة الحياة (8 أبعاد)",
    description: "Complete harmony across mind, body, wealth, craft, and soul.",
    descriptionAr: "تناغم وتكامل تام يشمل الصحة، الفكر، العلاقات، والعمل.",
    icon: "disc-outline",
    badge: "Harmonious",
    badgeAr: "تكامل شامل",
    bg: "#DDD6FE",
    ink: "#2E1065",
    accent: "#7C3AED",
    accentSecondary: "#9333EA",
    color: "#7C3AED",
    gradientColors: ["#DDD6FE", "#7C3AED"],
    artType: "dualDiscs",
    order: 5,
    categories: [
      {
        id: "craft_career",
        title: "Craft & Career",
        titleAr: "المهنة والعمل",
        icon: "laptop-outline",
        color: "#2563EB",
      },
      {
        id: "vitality_body",
        title: "Vitality & Body",
        titleAr: "اللياقة والبدن",
        icon: "heart-outline",
        color: "#059669",
      },
      {
        id: "intellect_soul",
        title: "Intellect & Soul",
        titleAr: "الفكر والروح",
        icon: "sunny-outline",
        color: "#7C3AED",
      },
      {
        id: "social_relationships",
        title: "Relationships & Community",
        titleAr: "العلاقات والمجتمع",
        icon: "people-outline",
        color: "#DB2777",
      },
    ],
  },
  {
    templateId: "project_launch",
    name: "Deep Work & Launch",
    nameAr: "العمل العميق وإطلاق المشاريع",
    description: "Zero fluff. Laser focus on finishing and shipping an ambitious build.",
    descriptionAr: "تركيز فائق بدون تشتت لإنهاء وإطلاق مشروع أو منتج محدد.",
    icon: "hammer-outline",
    badge: "High Intensity",
    badgeAr: "تركيز عالي",
    bg: "#334155",
    ink: "#F8FAFC",
    accent: "#38BDF8",
    accentSecondary: "#0284C7",
    color: "#38BDF8",
    gradientColors: ["#334155", "#38BDF8"],
    artType: "curves",
    order: 6,
    categories: [
      {
        id: "core_scope",
        title: "Scope & Core MVP",
        titleAr: "نطاق العمل والنسخة الأساسية",
        icon: "cube-outline",
        color: "#0284C7",
      },
      {
        id: "qa_polish",
        title: "QA, Polish & Details",
        titleAr: "الجودة والصقل والتفاصيل",
        icon: "sparkles-outline",
        color: "#7C3AED",
      },
      {
        id: "launch_reach",
        title: "Launch & Go-to-Market",
        titleAr: "الإطلاق والنشر",
        icon: "megaphone-outline",
        color: "#EA580C",
      },
    ],
  },
  {
    templateId: "health_vitality_peak",
    name: "Peak Health & Energy",
    nameAr: "قمة اللياقة والطاقة البدنية",
    description: "Biohacking, nutrition discipline, endurance training, and deep rest.",
    descriptionAr: "اللياقة البدنية العالية، الانضباط الغذائي، والنشاط والحيوية.",
    icon: "fitness-outline",
    badge: "Vitality",
    badgeAr: "صحة وطاقة",
    bg: "#6EE7B7",
    ink: "#022C22",
    accent: "#059669",
    accentSecondary: "#047857",
    color: "#059669",
    gradientColors: ["#6EE7B7", "#059669"],
    artType: "waves",
    order: 7,
    categories: [
      {
        id: "workout_targets",
        title: "Workouts & Endurance",
        titleAr: "التمارين والتحمل",
        icon: "barbell-outline",
        color: "#059669",
      },
      {
        id: "nutrition_fuel",
        title: "Nutrition & Hydration",
        titleAr: "التغذية والترطيب",
        icon: "nutrition-outline",
        color: "#15803D",
      },
      {
        id: "recovery_sleep",
        title: "Sleep & Mind Recovery",
        titleAr: "النوم والتعافي الذهني",
        icon: "moon-outline",
        color: "#0D9488",
      },
    ],
  },
  {
    templateId: "wealth_finance_mastery",
    name: "Wealth & Finance Mastery",
    nameAr: "إدارة الثروة والمالية الذكية",
    description: "Financial discipline, savings targets, revenue goals, and asset allocation.",
    descriptionAr: "الانضباط المالي، أهداف الادخار، زيادة الدخل، والاستثمار.",
    icon: "cash-outline",
    badge: "Financial",
    badgeAr: "مالية واستثمار",
    bg: "#FDE047",
    ink: "#1C1917",
    accent: "#2563EB",
    accentSecondary: "#EAB308",
    color: "#2563EB",
    gradientColors: ["#FDE047", "#2563EB"],
    artType: "sunRays",
    order: 8,
    categories: [
      {
        id: "savings_invest",
        title: "Savings & Investments",
        titleAr: "الادخار والاستثمار",
        icon: "wallet-outline",
        color: "#2563EB",
      },
      {
        id: "income_streams",
        title: "Income & Revenue Goals",
        titleAr: "مصادر الدخل والنمو",
        icon: "trending-up-outline",
        color: "#059669",
      },
      {
        id: "budget_control",
        title: "Budget Optimization",
        titleAr: "ترشيد المصروفات والميزانية",
        icon: "pie-chart-outline",
        color: "#D97706",
      },
    ],
  },
];

/**
 * Clean LLM response helper
 */
function cleanJsonOutput(text: string): string {
  if (!text) return "{}";
  let cleaned = text;
  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "");
  cleaned = cleaned.replace(/<thought>[\s\S]*?(?:<\/thought>|$)/gi, "");
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?(?:<\/reasoning>|$)/gi, "");

  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch && jsonMatch[1]) {
    cleaned = jsonMatch[1].trim();
  } else {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }
  return cleaned.trim();
}

/**
 * Robust Multi-Provider LLM Caller for Goals
 */
async function callLLMForGoals(systemPrompt: string, userPrompt: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const enforcedSystem = `${systemPrompt}\n\nSTRICT INSTRUCTION: Output ONLY valid raw JSON without markdown code fences or conversational text.`;

  // 1. Try Groq
  if (groqApiKey) {
    const groqModels = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "qwen/qwen3.6-27b",
      "allam-2-7b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ];

    for (const model of groqModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: enforcedSystem },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            return cleanJsonOutput(content);
          }
        }
      } catch (err) {
        console.warn(`Groq ${model} failed for goal generation:`, err);
      }
    }
  }

  // 2. Try Gemini
  if (geminiApiKey) {
    const geminiModels = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-3.6-flash",
    ];
    for (const model of geminiModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: enforcedSystem }] },
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return cleanJsonOutput(text);
          }
        }
      } catch (err) {
        console.warn(`Gemini ${model} failed for goal generation:`, err);
      }
    }
  }

  throw new Error("Could not generate goals plan: No LLM service responded successfully.");
}

// ─── Queries & Mutations ───────────────────────────────────────────────────

/**
 * Get all available goal templates from database.
 */
export const getTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("goalTemplates").collect();
    if (templates.length === 0) {
      return SEED_TEMPLATES;
    }
    return templates.sort((a, b) => a.order - b.order);
  },
});

/**
 * Seed or update the template database.
 */
export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("goalTemplates").collect();
    const existingMap = new Map(existing.map((t) => [t.templateId, t._id]));

    for (const item of SEED_TEMPLATES) {
      if (existingMap.has(item.templateId)) {
        await ctx.db.patch(existingMap.get(item.templateId)!, item);
      } else {
        await ctx.db.insert("goalTemplates", item);
      }
    }
    return { success: true, count: SEED_TEMPLATES.length };
  },
});

/**
 * Get Blueprint theme & meta for a given user/year/month (or annual if month is omitted).
 */
export const getMonthlyBlueprint = query({
  args: {
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.month !== undefined) {
      return await ctx.db
        .query("monthlyBlueprints")
        .withIndex("by_user_year_month", (q) =>
          q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month)
        )
        .first();
    } else {
      const allForYear = await ctx.db
        .query("monthlyBlueprints")
        .withIndex("by_user_year", (q) =>
          q.eq("userId", args.userId).eq("year", args.year)
        )
        .collect();
      return allForYear.find((b) => b.month === undefined) || null;
    }
  },
});

/**
 * Generate Structured Monthly or Annual Goals Plan with AI.
 */
export const generateMonthlyPlan = action({
  args: {
    userPrompt: v.string(),
    templateId: v.string(),
    month: v.optional(v.number()),
    year: v.number(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isArabic = args.language === "ar";
    const isYearly = args.month === undefined;
    
    // 1. Resolve template metadata
    const templates: any[] = await ctx.runQuery(api.aiGoals.getTemplates, {});
    const template = templates.find((t) => t.templateId === args.templateId) || templates[0] || SEED_TEMPLATES[0];

    const categorySpecs = template.categories
      .map(
        (c: any) =>
          `- ID: "${c.id}" | Title: "${isArabic ? c.titleAr || c.title : c.title}" | Description: "${
            isArabic ? c.descriptionAr || c.description || "" : c.description || ""
          }"`
      )
      .join("\n");

    const targetPeriodText = isYearly
      ? `Full Year ${args.year} (Annual Vision & Grand Milestones)`
      : `Month index ${args.month} (0=Jan..11=Dec), Year ${args.year}`;

    const systemPrompt = `You are an elite productivity strategist and goal architect.
Your mission is to transform the user's stated goals into a clear, realistic, and inspiring ${
      isYearly ? "Annual Blueprint" : "Monthly Blueprint"
    } organized using the chosen framework archetype.

======================================================================
CRITICAL PRINCIPLE — USER INPUT IS THE ONLY SOURCE OF TRUTH:
1. Base all goals and milestones EXCLUSIVELY on what the user explicitly specified.
2. NEVER invent, hallucinate, or force unrelated life categories. For example:
   - If the user talks about coding or building an app, DO NOT invent health courses, financial goals, or random hobbies.
   - If the user talks about fitness, DO NOT invent software or business goals.
   - NEVER add generic filler topics that the user never asked for.
3. If the user only specified ONE goal, generate goals ONLY for that specific topic. Break that single goal down into smart, actionable milestones.
4. If the user specified MULTIPLE goals, generate goals covering only those specific stated goals.
======================================================================

Selected Framework Archetype: "${template.name}" (${template.description})
Target Period: ${targetPeriodText}
Language: ${isArabic ? "Arabic (العربية الفصحى)" : "English"}

Framework Category Reference:
${categorySpecs}

Strict JSON Output Schema:
{
  "themeTitle": "${isYearly ? "Short 3-6 word grand annual motto" : "Short 3-6 word punchy theme"}",
  "motivationalQuote": "A memorable 1-sentence driving principle directly relevant to user's goals",
  "sections": [
    {
      "categoryId": "Matching category ID from framework or a clean snake_case ID matching user's topic",
      "title": "Category title in ${isArabic ? "Arabic" : "English"}",
      "goals": [
        {
          "text": "Specific, actionable, outcome-driven goal statement directly matching user's input",
          "description": "Optional 1-sentence context or definition of done",
          "milestones": [
            "Actionable milestone / sub-step 1",
            "Actionable milestone / sub-step 2",
            "Actionable milestone / sub-step 3"
          ]
        }
      ]
    }
  ]
}`;

    const userContent = `User Aspirations & Goals for ${isYearly ? `Year ${args.year}` : `Month ${args.month}, ${args.year}`}:
"""
${args.userPrompt.trim()}
"""

Format these exact goals into the "${template.name}" framework JSON now.`;

    const rawJson = await callLLMForGoals(systemPrompt, userContent);
    const parsed = JSON.parse(rawJson);

    return {
      templateId: template.templateId,
      templateName: isArabic ? template.nameAr || template.name : template.name,
      themeTitle: parsed.themeTitle || (isArabic ? (isYearly ? `رؤية عام ${args.year}` : "خطة الشهر الطموحة") : (isYearly ? `${args.year} Annual Vision` : "Monthly Focus Blueprint")),
      motivationalQuote: parsed.motivationalQuote || "",
      sections: parsed.sections || [],
    };
  },
});

/**
 * Refine an existing generated plan through conversation.
 */
export const refineMonthlyPlan = action({
  args: {
    currentPlanJson: v.string(),
    instruction: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isArabic = args.language === "ar";
    const systemPrompt = `You are an elite productivity strategist.
The user has an existing goals blueprint and wants to tweak or refine it based on their instructions.

Language: ${isArabic ? "Arabic (العربية الفصحى)" : "English"}

CRITICAL RULES:
1. Apply the user's requested adjustments to the existing goals and milestones.
2. Strictly maintain the user's focused scope — NEVER invent unrelated life domains, medical courses, or generic filler.
3. Output ONLY the updated valid JSON matching the identical schema:
   {
     "themeTitle": "...",
     "motivationalQuote": "...",
     "sections": [
       {
         "categoryId": "...",
         "title": "...",
         "goals": [
           {
             "text": "...",
             "description": "...",
             "milestones": ["..."]
           }
         ]
       }
     ]
   }`;

    const userPrompt = `Existing Plan:
${args.currentPlanJson}

Refinement Instruction:
"""
${args.instruction}
"""

Return the refined JSON now.`;

    const rawJson = await callLLMForGoals(systemPrompt, userPrompt);
    return JSON.parse(rawJson);
  },
});

/**
 * Save / Apply Generated Blueprint & Goals to Database in batch.
 */
export const saveMonthlyBlueprint = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.optional(v.number()),
    templateId: v.string(),
    themeTitle: v.string(),
    motivationalQuote: v.optional(v.string()),
    goals: v.array(
      v.object({
        text: v.string(),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        milestones: v.optional(
          v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              isCompleted: v.boolean(),
            })
          )
        ),
      })
    ),
    achievements: v.optional(
      v.array(
        v.object({
          text: v.string(),
          description: v.optional(v.string()),
          category: v.optional(v.string()),
          color: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    let existingBlueprint = null;
    if (args.month !== undefined) {
      existingBlueprint = await ctx.db
        .query("monthlyBlueprints")
        .withIndex("by_user_year_month", (q) =>
          q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month)
        )
        .first();
    } else {
      const allForYear = await ctx.db
        .query("monthlyBlueprints")
        .withIndex("by_user_year", (q) =>
          q.eq("userId", args.userId).eq("year", args.year)
        )
        .collect();
      existingBlueprint = allForYear.find((b) => b.month === undefined) || null;
    }

    if (existingBlueprint) {
      await ctx.db.patch(existingBlueprint._id, {
        templateId: args.templateId,
        themeTitle: args.themeTitle,
        motivationalQuote: args.motivationalQuote,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("monthlyBlueprints", {
        userId: args.userId,
        year: args.year,
        month: args.month,
        templateId: args.templateId,
        themeTitle: args.themeTitle,
        motivationalQuote: args.motivationalQuote,
        updatedAt: Date.now(),
      });
    }

    const now = Date.now();
    for (let i = 0; i < args.goals.length; i++) {
      const g = args.goals[i];
      await ctx.db.insert("yearlyGoals", {
        userId: args.userId,
        year: args.year,
        month: args.month,
        text: g.text,
        description: g.description,
        category: g.category,
        color: g.color,
        icon: g.icon,
        templateId: args.templateId,
        visualStyleId: "default",
        milestones: g.milestones,
        order: i,
        isCompleted: false,
        createdAt: now + i,
      });
    }

    if (args.achievements && args.achievements.length > 0) {
      for (let j = 0; j < args.achievements.length; j++) {
        const a = args.achievements[j];
        await ctx.db.insert("yearlyAchievements", {
          userId: args.userId,
          year: args.year,
          month: args.month,
          text: a.text,
          description: a.description,
          category: a.category,
          color: a.color,
          visualStyleId: "default",
          isCompleted: false,
          createdAt: now + j,
        });
      }
    }

    return {
      success: true,
      addedGoals: args.goals.length,
      addedAchievements: args.achievements ? args.achievements.length : 0,
    };
  },
});

/**
 * Visual Layout Registry for Goal Cards (Section 11-13).
 */
export const GOAL_VISUAL_TEMPLATES = [
  {
    frameworkId: "roadmap",
    name: "Sequential Roadmap",
    nameAr: "خارطة طريق مرحلية",
    description: "Step-by-step progress rail with chronological milestone nodes.",
    descriptionAr: "مسار مرحلي متتابع مع نقاط إنجاز مرتبطة بخط تقدم.",
    icon: "git-commit-outline",
    badge: "Structured",
    badgeAr: "منظم ومرحلي",
    color: "#2563EB",
  },
  {
    frameworkId: "checklist",
    name: "Executive Checklist",
    nameAr: "قائمة مهام تنفيذية",
    description: "Crisp checkboxes with strikethrough and completion counter.",
    descriptionAr: "مربعات تحقق واضحة وسريعة مع عداد إنجاز تفاعلي.",
    icon: "checkbox-outline",
    badge: "Direct",
    badgeAr: "مباشر وسريع",
    color: "#059669",
  },
  {
    frameworkId: "metric",
    name: "Target Gauge & Counter",
    nameAr: "مؤشر أداء رقمي",
    description: "Horizontal progress gauge, percentage pill, and target fraction.",
    descriptionAr: "مؤشر قياس أفقي، نسبة مئوية، وعداد كسري للنتائج الرقمية.",
    icon: "speedometer-outline",
    badge: "Quantifiable",
    badgeAr: "رقمي ومقاس",
    color: "#D97706",
  },
  {
    frameworkId: "sprint",
    name: "High-Energy Sprint",
    nameAr: "سبرنت تركيز مكثف",
    description: "Time-boxed focus card with intensity accent and sprint badge.",
    descriptionAr: "بطاقة إنجاز سريعة ومكثفة مع شارة سبرنت وأولوية زمنية.",
    icon: "flash-outline",
    badge: "High Tempo",
    badgeAr: "زخم عالٍ",
    color: "#EA580C",
  },
  {
    frameworkId: "pillar",
    name: "Deep Focus Pillar",
    nameAr: "ركيزة التركيز الاستراتيجي",
    description: "Strategic pillar card with colored focus spine and foundational sub-habits.",
    descriptionAr: "بطاقة استراتيجية راقية للأهداف المحورية والعادات التأسيسية الكبرى.",
    icon: "shield-checkmark-outline",
    badge: "Strategic",
    badgeAr: "استراتيجي",
    color: "#8B5CF6",
  },
];

/**
 * Detects generic category names that must never be assigned to goals.
 */
export function isGenericCategory(name?: string): boolean {
  const lower = (name || "").trim().toLowerCase();
  return (
    !lower ||
    lower === "general" ||
    lower === "general goals" ||
    lower === "goals" ||
    lower === "miscellaneous" ||
    lower === "other" ||
    lower === "personal" ||
    lower === "عام" ||
    lower === "عامة" ||
    lower === "أهداف عامة" ||
    lower === "أهداف"
  );
}

/**
 * Derives a domain-specific category from user text.
 */
export function deriveCategoryFromIntent(text: string, isArabic = false): string {
  const t = (text || "").toLowerCase();

  // Software / Mobile / Web / Coding / Engineering
  if (/flutter|react|react-native|mobile|app|code|coding|developer|software|programming|python|javascript|typescript|backend|frontend|api|convex|database|web|ai|model|llm|dev|git|linux|deploy/i.test(t)) {
    return isArabic ? "تطوير البرمجيات والتطبيقات" : "Software & App Development";
  }

  // Health / Fitness / Sports / Gym / Diet
  if (/gym|run|running|fitness|health|workout|diet|exercise|marathon|weight|cardio|sleep|water|muscle|training|nutrition/i.test(t)) {
    return isArabic ? "الصحة واللياقة البدنية" : "Health & Physical Fitness";
  }

  // Learning / Reading / Education / Languages / Study
  if (/learn|study|read|book|course|language|english|german|spanish|french|exam|certification|degree|research|ielts|toefl|lecture/i.test(t)) {
    return isArabic ? "التعلم وتطوير المهارات" : "Learning & Skill Growth";
  }

  // Finance / Wealth / Investment / Savings / Business / Money
  if (/save|saving|money|finance|financial|invest|investment|budget|crypto|stock|income|revenue|profit|business|dollar|usd|egp|funds/i.test(t)) {
    return isArabic ? "المالية والاستثمار" : "Finance & Wealth Building";
  }

  // Career / Professional / Work / Job
  if (/job|career|work|promotion|client|freelance|portfolio|resume|interview|leadership|team|manager|client|sales|marketing/i.test(t)) {
    return isArabic ? "المسار المهني والأعمال" : "Career & Professional Growth";
  }

  // Creative / Art / Design / Writing / Music / Content
  if (/design|ui|ux|draw|paint|art|music|write|book|blog|youtube|content|video|photo|editing|podcast|film/i.test(t)) {
    return isArabic ? "الإبداع وصناعة المحتوى" : "Creative & Content Design";
  }

  // Mindset / Spiritual / Habits / Personal
  if (/pray|meditation|mind|habit|focus|discipline|routine|quran|dhikr|salah|mental/i.test(t)) {
    return isArabic ? "التركيز والنمط اليومي" : "Mindset & Daily Habits";
  }

  return isArabic ? "أهداف المسار الأساسي" : "Core Focus Objectives";
}

/**
 * Intelligent Conversational Goal Architect Action.
 * Transforms user natural language (voice/text) into a tailored goal, intent analysis,
 * hybrid category mapping, and up to 3 template recommendations.
 * Implements Section 1-15, 35, 36, 53-55 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */
export const architectGoalIntent = action({
  args: {
    userMessage: v.string(),
    timeframe: v.string(), // "day" | "month" | "year"
    year: v.number(),
    month: v.optional(v.number()),
    day: v.optional(v.number()),
    existingSections: v.optional(v.array(v.string())),
    existingCategories: v.optional(v.array(v.string())),
    existingSubCategories: v.optional(v.array(v.string())),
    existingProjects: v.optional(v.array(v.string())),
    existingRelatedGoals: v.optional(v.array(v.string())),
    previousGoalsInSession: v.optional(
      v.array(
        v.object({
          text: v.string(),
          category: v.string(),
          templateId: v.optional(v.string()),
        })
      )
    ),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isArabic = args.language === "ar";
    const timeframe = args.timeframe || (args.day !== undefined ? "day" : args.month !== undefined ? "month" : "year");

    const timeframeContext =
      timeframe === "day"
        ? `Day ${args.day}, Month ${(args.month ?? 0) + 1}, Year ${args.year} (Daily execution scope: immediate, focused single-day outcome)`
        : timeframe === "month"
        ? `Month ${(args.month ?? 0) + 1}, Year ${args.year} (Monthly scope: 2-4 week concrete deliverables and milestones)`
        : `Full Year ${args.year} (Annual vision scope: strategic direction, macro milestones)`;

    // Consolidate known categories (strictly filtering out any generic names)
    const allCategories = Array.from(
      new Set([
        ...(args.existingCategories || []),
        ...(args.existingSections || []),
      ])
    ).filter((c) => Boolean(c && c.trim() && !isGenericCategory(c)));

    const existingSecsStr =
      allCategories.length > 0
        ? `Known User Categories in Nizam: [${allCategories.map((s) => `"${s}"`).join(", ")}]`
        : "No existing categories yet.";

    const knownProjectsStr =
      args.existingProjects && args.existingProjects.length > 0
        ? `Known Existing Projects: [${args.existingProjects.map((p) => `"${p}"`).join(", ")}]`
        : "";

    const prevGoalsStr =
      args.previousGoalsInSession && args.previousGoalsInSession.length > 0
        ? `Previous goals created in this architect session:\n${args.previousGoalsInSession
            .map((g) => `- "${g.text}" (Section: "${g.category}")`)
            .join("\n")}`
        : "";

    const systemPrompt = `You are an elite AI Goal Architect and executive productivity coach in Nizam.
Your mission is to understand the user's natural language goal intent (in Arabic or English) and convert it into a precise, beautifully structured goal blueprint.

======================================================================
SECTION A: INTENT & BOUNDARY RULES (CRITICAL)
1. USER INTENT IS THE SOLE SOURCE OF TRUTH:
   - Base the goal STRICTLY and EXCLUSIVELY on what the user stated.
   - NEVER invent, hallucinate, or add unrelated domains.
   - ANTI-EXAMPLE: If user says "Learn Flutter and build small apps", DO NOT invent gym workouts, dieting, reading 10 books, or saving money.
   - Separate core intent from supporting practice: e.g. Core = "Flutter Mastery", Practice = "Build small apps".
2. STRICT SUB-GOALS POLICY (NO AUTOMATIC MILESTONES):
   - DO NOT generate milestones or sub-goals automatically.
   - ALWAYS return "suggestedMilestones": [] unless the user explicitly provided numbered steps in their message.
   - The user will interactively choose to add or expand milestones later.
3. TIMEFRAME SCOPE:
   - ${timeframeContext}
   - Adapt outcome scope to the timeframe without altering intent.

======================================================================
SECTION B: CATEGORY INTELLIGENCE (STRICT DOMAIN CLASSIFICATION)
- STRICT PROHIBITION: NEVER output generic, lazy, or placeholder category names like "General", "General Goals", "عام", "أهداف عامة", "Miscellaneous", "Other", or "Personal".
- If any existing category in ${existingSecsStr} accurately reflects the user's specific domain, use it.
- Otherwise, generate a crisp, domain-specific category name describing the life or professional sphere (e.g. "Mobile & App Development", "Health & Physical Fitness", "Language & Learning", "Financial Growth", "Creative Arts", "Career & Leadership").
- In Arabic: "تطوير البرمجيات والتطبيقات", "الصحة واللياقة البدنية", "التعلم وتطوير المهارات", "المالية والاستثمار", "المسار المهني والأعمال", etc.
- Provide "categoryRecommendation" with:
  {
    "mode": "existing" | "new",
    "name": "Category Name",
    "reason": "Why this category fits the purpose"
  }

======================================================================
SECTION C: TEMPLATE RECOMMENDATION RULES (MAX 3)
- Recommend MAXIMUM 3 template choices separating Framework from Visual Style:
  * Frameworks (Data Structure):
    - "roadmap" -> for courses, sequential learning, phased projects.
    - "checklist" -> for standard deliverables, actionable tasks, check-off lists.
    - "metric" -> for quantifiable metrics (e.g. read 100 pages, save $1000, 30km run).
    - "sprint" -> for urgent, high-energy sprints, time-boxed challenges.
    - "pillar" -> for foundational habits, identity grounding, core focus.
  * Visual Styles (Appearance):
    - "book", "paper", "glass", "editorial", "minimal", "dark-capsule", "notebook"
- Recommendations MUST have:
  - Exactly 1 "primary" fit (best match).
  - Up to 2 "alternative" fits.
  - Clear rationale explaining why each layout fits the user's goal.

======================================================================
SECTION D: LANGUAGE FIDELITY
- Respond strictly in ${isArabic ? "Arabic (العربية الفصحى الواضحة والراقية)" : "English"}.
- Preserve technical terms like Flutter, React, Firebase, Docker as proper nouns.
- Provide a brief, motivating, friendly 1-2 sentence "aiResponseText".

======================================================================
Strict JSON Output Schema:
{
  "intent": {
    "coreSubject": "Primary subject (e.g. Flutter, Marathon, Budget)",
    "corePurpose": "Purpose/why (e.g. Learn through practice, Prepare for race)",
    "goalType": "learning | project | fitness | health | habit | financial | academic | career | creative | personal | custom",
    "domain": "e.g. Technology, Sports, Personal Finance",
    "desiredOutcome": "Target outcome definition",
    "supportingOutcomes": ["Supporting deliverable or practice item"]
  },
  "goal": {
    "title": "Punchy, specific outcome title",
    "description": "1 sentence definition of done or target clarity"
  },
  "categoryRecommendation": {
    "mode": "existing | new",
    "name": "Recommended Category Name",
    "reason": "Why this category was chosen"
  },
  "templateRecommendations": [
    {
      "frameworkId": "roadmap | checklist | metric | sprint | pillar",
      "visualStyleId": "book | paper | glass | editorial | minimal | dark-capsule | notebook",
      "title": "${isArabic ? "عنوان القالب بالعربية" : "Template combination title"}",
      "reason": "${isArabic ? "سبب ملاءمة هذا التنسيق للهدف" : "Why this layout fits the goal"}",
      "fit": "primary"
    },
    {
      "frameworkId": "...",
      "visualStyleId": "...",
      "title": "...",
      "reason": "...",
      "fit": "alternative"
    }
  ],
  "suggestedMilestones": [],
  "suggestedProjects": [
    {
      "name": "Project Name (only if user explicitly mentioned buildable deliverables)",
      "description": "Brief description"
    }
  ],
  "suggestedExpansionQuestion": "${isArabic ? "هل ترغب في إضافة مهام فرعية، مشاريع، أو حفظ الهدف هكذا؟" : "Would you like to add milestones, projects, or keep it focused?"}",
  "color": "#2563EB",
  "icon": "school-outline",
  "aiResponseText": "${isArabic ? "رسالة موجزة تشرح ما صممه الذكاء الاصطناعي ولماذا اختار هذا القالب" : "Brief friendly explanation of how the goal was architected"}"
}`;

    const userPrompt = `User Goal Request:
"""
${args.userMessage.trim()}
"""

${existingSecsStr}
${knownProjectsStr}
${prevGoalsStr}

Architect this goal into valid JSON now.`;

    let parsed: any = {};
    try {
      const rawJson = await callLLMForGoals(systemPrompt, userPrompt);
      parsed = JSON.parse(rawJson);
    } catch (e) {
      console.warn("architectGoalIntent fallback triggered:", e);
      const fallbackDomain = deriveCategoryFromIntent(args.userMessage, isArabic);
      parsed = {
        goal: { title: args.userMessage.slice(0, 40), description: "" },
        intent: { coreSubject: args.userMessage.slice(0, 30), corePurpose: args.userMessage, goalType: "custom", domain: fallbackDomain },
        categoryRecommendation: { mode: allCategories.length > 0 ? "existing" : "new", name: allCategories[0] || fallbackDomain, reason: "Inferred domain category" },
        templateRecommendations: [
          { frameworkId: "roadmap", visualStyleId: "glass", reason: "Standard milestone roadmap", fit: "primary" },
          { frameworkId: "checklist", visualStyleId: "paper", reason: "Clean execution checklist", fit: "alternative" },
        ],
        suggestedMilestones: [],
      };
    }

    // Resolve category and compatibility values
    const goalTitle = parsed.goal?.title || parsed.goalTitle || (isArabic ? "هدف جديد" : "New Goal");
    const description = parsed.goal?.description || parsed.description || "";
    
    let catRecName = (parsed.categoryRecommendation?.name || parsed.suggestedHeader || "").trim();
    if (isGenericCategory(catRecName)) {
      catRecName = allCategories[0] || deriveCategoryFromIntent(args.userMessage, isArabic);
    }

    const isExistingCat = parsed.categoryRecommendation?.mode === "existing" || allCategories.includes(catRecName);

    // Build header options for backward compatibility
    const headerOptions = [
      { title: catRecName, isExisting: isExistingCat },
      ...allCategories.filter((c) => c !== catRecName).map((c) => ({ title: c, isExisting: true })),
    ];

    const primaryTpl = Array.isArray(parsed.templateRecommendations) && parsed.templateRecommendations[0]
      ? parsed.templateRecommendations[0].frameworkId || parsed.templateRecommendations[0].templateId
      : parsed.suggestedTemplateId || "roadmap";

    return {
      // New Architect Blueprint fields
      intent: parsed.intent || {
        coreSubject: goalTitle,
        corePurpose: description,
        goalType: "custom",
        domain: catRecName,
      },
      goal: {
        title: goalTitle,
        description,
      },
      categoryRecommendation: {
        recommendedCategory: {
          mode: isExistingCat ? "existing" : "new",
          name: catRecName,
          reason: parsed.categoryRecommendation?.reason || "",
        },
        alternatives: allCategories.filter((c) => c !== catRecName).map((c) => ({ name: c, reason: "Existing category" })),
        createNewCategory: !isExistingCat,
      },
      templateRecommendations: Array.isArray(parsed.templateRecommendations)
        ? parsed.templateRecommendations.slice(0, 3)
        : [
            {
              frameworkId: primaryTpl,
              visualStyleId: "glass",
              reason: "Recommended layout for this goal",
              fit: "primary",
            },
          ],
      suggestedExpansionQuestion:
        parsed.suggestedExpansionQuestion ||
        (isArabic
          ? "هل ترغب في إضافة مهام فرعية، مشاريع، أو حفظ الهدف هكذا؟"
          : "Would you like to add milestones, projects, or keep it focused?"),
      suggestedProjects: Array.isArray(parsed.suggestedProjects) ? parsed.suggestedProjects : [],
      aiResponseText: parsed.aiResponseText || "",

      // Backward compatibility fields
      goalTitle,
      description,
      suggestedHeader: catRecName,
      suggestedHeaderIsExisting: isExistingCat,
      headerOptions,
      suggestedMilestones: Array.isArray(parsed.suggestedMilestones)
        ? parsed.suggestedMilestones.map((m: any, idx: number) => ({
            id: m.id || `m_${Date.now()}_${idx}`,
            text: typeof m === "string" ? m : m.text || "",
            isCompleted: false,
          }))
        : [],
      suggestedTemplateId: primaryTpl,
      color: parsed.color || "#2563EB",
      icon: parsed.icon || "flag-outline",
    };
  },
});

/**
 * Conversational Refinement of the active goal draft.
 * Refines the goal while protecting user edits and preserving untouched fields.
 * Implements Section 30-32 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */
export const refineGoalIntent = action({
  args: {
    currentDraft: v.any(), // accepts legacy or normalized draft
    instruction: v.string(),
    existingSections: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isArabic = args.language === "ar";
    const draft = args.currentDraft;

    const goalTitle = draft.goal?.title || draft.goalTitle || draft.text || "";
    const description = draft.goal?.description || draft.description || "";
    const category = draft.category?.selectedName || draft.category || "";
    const frameworkId = draft.presentation?.frameworkId || draft.templateId || "roadmap";
    const visualStyleId = draft.presentation?.visualStyleId || "default";
    const milestones = draft.milestones || [];

    const systemPrompt = `You are an elite AI Goal Architect.
The user wants to tweak or refine their current goal draft via natural language instruction.

Current Draft:
- Title: "${goalTitle}"
- Description: "${description}"
- Category: "${category}"
- Framework Layout: "${frameworkId}"
- Visual Style: "${visualStyleId}"
- Milestones Count: ${milestones.length}
- Milestones: ${JSON.stringify(milestones)}

Language: ${isArabic ? "Arabic (العربية الفصحى)" : "English"}

CRITICAL REFINEMENT RULES:
1. ONLY modify what the user explicitly requested to adjust (e.g. shortening title, changing layout style, removing/adding a specific milestone).
2. DO NOT overwrite or delete untouched user data.
3. If user requests visual style change (e.g. "make it book style" or "use paper style"), update "visualStyleId".
4. If user asks to remove an item, remove only that item.
5. Return ONLY valid JSON matching this schema:
{
  "goalTitle": "...",
  "description": "...",
  "category": "...",
  "frameworkId": "roadmap | checklist | metric | sprint | pillar",
  "visualStyleId": "book | paper | glass | editorial | minimal | dark-capsule | notebook",
  "milestones": [
    { "id": "...", "text": "...", "isCompleted": false }
  ],
  "color": "...",
  "icon": "...",
  "aiResponseText": "${isArabic ? "رسالة توضيحية لما تم تعديله" : "Brief sentence explaining what was refined"}"
}`;

    const userPrompt = `Refinement Instruction:
"""
${args.instruction.trim()}
"""

Return the refined goal JSON now.`;

    let parsed: any = {};
    try {
      const rawJson = await callLLMForGoals(systemPrompt, userPrompt);
      parsed = JSON.parse(rawJson);
    } catch (e) {
      console.warn("refineGoalIntent error:", e);
      parsed = {};
    }

    const finalTitle = parsed.goalTitle || goalTitle;
    const finalDesc = parsed.description !== undefined ? parsed.description : description;
    const finalCat = parsed.category || category;
    const finalFw = parsed.frameworkId || parsed.templateId || frameworkId;
    const finalStyle = parsed.visualStyleId || visualStyleId;
    const finalMilestones = Array.isArray(parsed.milestones)
      ? parsed.milestones.map((m: any, idx: number) => ({
          id: m.id || `m_${Date.now()}_${idx}`,
          text: typeof m === "string" ? m : m.text || "",
          isCompleted: Boolean(m.isCompleted),
        }))
      : milestones;

    return {
      goalTitle: finalTitle,
      description: finalDesc,
      category: finalCat,
      templateId: finalFw,
      frameworkId: finalFw,
      visualStyleId: finalStyle,
      milestones: finalMilestones,
      color: parsed.color || draft.color || "#2563EB",
      icon: parsed.icon || draft.icon || "flag-outline",
      aiResponseText:
        parsed.aiResponseText ||
        (isArabic ? "تم تحديث الهدف وفقاً لطلبك." : "Goal updated according to your instruction."),
    };
  },
});

/**
 * Conversational Goal Expansion Action.
 * Breaks down goal into milestones, sub-goals, or project suggestions on demand.
 * Implements Section 17-21 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */
export const expandGoalIntent = action({
  args: {
    goalTitle: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    timeframe: v.string(), // "day" | "month" | "year"
    userInstructions: v.string(), // e.g. "suggest milestones", "break into 4 weeks", "add Firebase"
    currentMilestones: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          isCompleted: v.boolean(),
        })
      )
    ),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isArabic = args.language === "ar";
    const existingMs = args.currentMilestones || [];

    const systemPrompt = `You are an elite productivity architect in Nizam.
The user wants to expand their goal with structured milestones, sub-goals, or project candidates.

Goal Context:
- Title: "${args.goalTitle}"
- Description: "${args.description || ""}"
- Category: "${args.category}"
- Timeframe: ${args.timeframe}
- Existing Milestones: ${JSON.stringify(existingMs)}
- Language: ${isArabic ? "Arabic (العربية الفصحى)" : "English"}

RULES:
1. Base all expansion items STRICTLY on the user's instructions and the core goal outcome.
2. Provide 2 to 5 high-impact, realistic milestones or concrete sub-goals.
3. If the user mentions existing items, PRESERVE them and append/modify accordingly.
4. Detect any deliverable that qualifies as a standalone project (e.g. apps, websites, launches) and suggest them in "suggestedProjects".
5. Return valid JSON only:
{
  "milestones": [
    { "id": "m1", "text": "Specific milestone outcome", "isCompleted": false }
  ],
  "suggestedProjects": [
    { "name": "Project Name", "description": "Scope description" }
  ],
  "aiResponseText": "${isArabic ? "رسالة توضح الهيكل المقترح" : "Brief explanation of the suggested structure"}"
}`;

    const userPrompt = `User Expansion Request:
"""
${args.userInstructions.trim()}
"""

Expand this goal now in valid JSON.`;

    let parsed: any = {};
    try {
      const rawJson = await callLLMForGoals(systemPrompt, userPrompt);
      parsed = JSON.parse(rawJson);
    } catch (e) {
      console.warn("expandGoalIntent error:", e);
      parsed = {};
    }

    const milestones = Array.isArray(parsed.milestones)
      ? parsed.milestones.map((m: any, idx: number) => ({
          id: m.id || `ms_${Date.now()}_${idx}`,
          text: typeof m === "string" ? m : m.text || "",
          isCompleted: Boolean(m.isCompleted),
        }))
      : existingMs;

    const suggestedProjects = Array.isArray(parsed.suggestedProjects)
      ? parsed.suggestedProjects.map((p: any) => ({
          name: typeof p === "string" ? p : p.name || "",
          description: p.description || "",
        }))
      : [];

    return {
      milestones,
      suggestedProjects,
      aiResponseText:
        parsed.aiResponseText ||
        (isArabic ? "تم تجهيز المراحل المقترحة لهدفك." : "Structure prepared for your goal."),
    };
  },
});

/**
 * On-Demand Sub-Goals Generation (Backward Compatibility).
 */
export const generateSubGoalsAction = action({
  args: {
    goalTitle: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    timeframe: v.string(), // "day" | "month" | "year"
    userInstructions: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isArabic = args.language === "ar";
    const systemPrompt = `You are an elite productivity coach and goal architect.
The user wants to break down a specific goal into concrete, high-impact sub-goals / milestones.

Goal Details:
- Goal: "${args.goalTitle}"
- Description: "${args.description || ""}"
- Category: "${args.category}"
- Timeframe: ${args.timeframe}
- Language: ${isArabic ? "Arabic (العربية الفصحى)" : "English"}

CRITICAL RULES:
1. Base all sub-goals STRICTLY on the user's instructions regarding how they want this goal broken down.
2. DO NOT generate generic boilerplate or unrelated advice.
3. Make each sub-goal a clear, concrete, outcome-oriented step (between 2 to 5 items).
4. Output JSON:
{
  "milestones": [
    { "id": "m1", "text": "Specific, actionable milestone 1" }
  ],
  "aiExplanation": "Brief message"
}`;

    const userPrompt = `User Instructions for Sub-Goals:
"""
${args.userInstructions.trim()}
"""

Generate the sub-goals JSON now.`;

    const rawJson = await callLLMForGoals(systemPrompt, userPrompt);
    const parsed = JSON.parse(rawJson);

    return {
      milestones: Array.isArray(parsed.milestones)
        ? parsed.milestones.map((m: any, idx: number) => ({
            id: m.id || `ms_${Date.now()}_${idx}`,
            text: typeof m === "string" ? m : m.text || "",
            isCompleted: false,
          }))
        : [],
      aiExplanation: parsed.aiExplanation || "",
    };
  },
});

/**
 * Save Architect Goals directly to database in batch.
 * Inserts into yearlyGoals and optionally links/updates monthlyBlueprints.
 * Implements Section 48-50 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */
export const saveArchitectGoals = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    year: v.number(),
    month: v.optional(v.number()),
    day: v.optional(v.number()),
    goals: v.array(
      v.object({
        text: v.string(),
        description: v.optional(v.string()),
        category: v.string(),
        categoryId: v.optional(v.id("projectCategories")),
        subCategoryId: v.optional(v.id("projectSubCategories")),
        projectId: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        templateId: v.optional(v.string()),
        visualStyleId: v.optional(v.string()),
        milestones: v.optional(
          v.array(
            v.object({
              id: v.string(),
              text: v.string(),
              isCompleted: v.boolean(),
            })
          )
        ),
      })
    ),
    themeTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdIds: string[] = [];

    for (let i = 0; i < args.goals.length; i++) {
      const g = args.goals[i];
      const sanitizedCategory = isGenericCategory(g.category)
        ? deriveCategoryFromIntent(g.text)
        : g.category;

      const id = await ctx.db.insert("yearlyGoals", {
        userId: args.userId,
        year: args.year,
        month: args.month,
        day: args.day,
        text: g.text,
        description: g.description,
        category: sanitizedCategory,
        categoryId: g.categoryId,
        subCategoryId: g.subCategoryId,
        projectId: g.projectId,
        color: g.color || "#2563EB",
        icon: g.icon || "flag-outline",
        templateId: g.templateId || "roadmap",
        visualStyleId: g.visualStyleId || "default",
        milestones: g.milestones,
        order: i,
        isCompleted: false,
        createdAt: now + i,
      });
      createdIds.push(id);
    }

    if (args.themeTitle && args.day === undefined) {
      let existingBlueprint = null;
      if (args.month !== undefined) {
        existingBlueprint = await ctx.db
          .query("monthlyBlueprints")
          .withIndex("by_user_year_month", (q) =>
            q.eq("userId", args.userId).eq("year", args.year).eq("month", args.month)
          )
          .first();
      } else {
        const allForYear = await ctx.db
          .query("monthlyBlueprints")
          .withIndex("by_user_year", (q) =>
            q.eq("userId", args.userId).eq("year", args.year)
          )
          .collect();
        existingBlueprint = allForYear.find((b) => b.month === undefined) || null;
      }

      if (existingBlueprint) {
        await ctx.db.patch(existingBlueprint._id, {
          themeTitle: args.themeTitle,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("monthlyBlueprints", {
          userId: args.userId,
          year: args.year,
          month: args.month,
          templateId: args.goals[0]?.templateId || "roadmap",
          themeTitle: args.themeTitle,
          updatedAt: now,
        });
      }
    }

    return {
      success: true,
      addedGoals: createdIds.length,
      createdIds,
    };
  },
});
