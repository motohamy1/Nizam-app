/**
 * constants/aiGoalTemplates.ts
 * Registries for Goal Frameworks and Visual Styles.
 * Implements Section 11, 12, 38, 40 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import {
  GoalFrameworkId,
  GoalVisualStyleId,
  GoalFrameworkDefinition,
  GoalVisualStyleDefinition,
  AIGoalPresentation,
} from '@/types/aiGoals';

export const GOAL_FRAMEWORK_REGISTRY: Record<GoalFrameworkId, GoalFrameworkDefinition> = {
  roadmap: {
    id: 'roadmap',
    name: 'Milestone Roadmap',
    nameAr: 'خارطة طريق مرحلية',
    description: 'Step-by-step progress roadmap with connected milestones track.',
    descriptionAr: 'مسار تصاعدي متسلسل ممتاز للكورسات والمشاريع التدريجية.',
    icon: 'git-commit-outline',
    badge: 'Sequential',
    badgeAr: 'مرحلي',
    color: '#3B82F6',
    intendedFor: ['learning', 'project', 'academic', 'career'],
  },
  checklist: {
    id: 'checklist',
    name: 'Clean Checklist',
    nameAr: 'قائمة إنجاز أنيقة',
    description: 'Modern, focused checklist layout with quick status toggles.',
    descriptionAr: 'تصميم أنيق وسريع للمهام المباشرة والأهداف التنفيذية.',
    icon: 'checkmark-circle-outline',
    badge: 'Actionable',
    badgeAr: 'تنفيذي',
    color: '#10B981',
    intendedFor: ['project', 'habit', 'personal', 'creative'],
  },
  metric: {
    id: 'metric',
    name: 'Target Metric & Counter',
    nameAr: 'مقياس رقمي وإحصائي',
    description: 'Progress gauge with target stats, percentage counters, and numerical goals.',
    descriptionAr: 'شريط نسبة مئوية ومؤشرات رقمية للأهداف المقاسة بالأرقام أو الكميات.',
    icon: 'analytics-outline',
    badge: 'Quantifiable',
    badgeAr: 'رقمي',
    color: '#F59E0B',
    intendedFor: ['financial', 'fitness', 'academic', 'habit'],
  },
  sprint: {
    id: 'sprint',
    name: 'Sprint Capsule',
    nameAr: 'كبسولة السبرنت السريعة',
    description: 'High-intensity agile card with sprint phase badges and high focus.',
    descriptionAr: 'بطاقة رشيقة ومحفزة للأهداف المحددة بوقت وتحديات الأسبوع واليوم.',
    icon: 'flash-outline',
    badge: 'High Energy',
    badgeAr: 'رشيق',
    color: '#EF4444',
    intendedFor: ['project', 'fitness', 'personal'],
  },
  pillar: {
    id: 'pillar',
    name: 'Deep Focus Pillar',
    nameAr: 'ركيزة التركيز الاستراتيجي',
    description: 'Strategic pillar card with colored focus spine and foundational sub-habits.',
    descriptionAr: 'بطاقة استراتيجية راقية للأهداف المحورية والعادات التأسيسية الكبرى.',
    icon: 'shield-checkmark-outline',
    badge: 'Strategic',
    badgeAr: 'استراتيجي',
    color: '#8B5CF6',
    intendedFor: ['habit', 'health', 'career', 'personal'],
  },
};

export const GOAL_VISUAL_STYLE_REGISTRY: Record<GoalVisualStyleId, GoalVisualStyleDefinition> = {
  book: {
    id: 'book',
    name: 'Book & Chapter',
    nameAr: 'كتاب وفصول معرفية',
    description: 'Editorial reading aesthetic with spine accent and structured chapters.',
    descriptionAr: 'مظهر كتاب أنيق مع عمود لوني وفصول معرفية متناسقة.',
    icon: 'book-outline',
    accentFallback: '#3B82F6',
  },
  paper: {
    id: 'paper',
    name: 'Warm Paper',
    nameAr: 'ورق ناعم كلاسيكي',
    description: 'Warm tactile texture, gentle borders, and clean minimalist hierarchy.',
    descriptionAr: 'تصميم ورقي دافئ بحواف ناعمة وتسلسل بصري مريح.',
    icon: 'document-text-outline',
    accentFallback: '#10B981',
  },
  glass: {
    id: 'glass',
    name: 'Frosted Glass',
    nameAr: 'زجاج عصري ناصع',
    description: 'Translucent glassmorphism with subtle borders and ambient glow.',
    descriptionAr: 'طبقات زجاجية شفافة أنيقة بإضاءة محيطية عصرية.',
    icon: 'cube-outline',
    accentFallback: '#8B5CF6',
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial Magazine',
    nameAr: 'مجلة تحريرية راقية',
    description: 'High contrast, bold typography, and sophisticated layout accents.',
    descriptionAr: 'طباعة عريضة وخطوط مميزة للأهداف الإبداعية والكبرى.',
    icon: 'newspaper-outline',
    accentFallback: '#EA580C',
  },
  minimal: {
    id: 'minimal',
    name: 'Pure Minimal',
    nameAr: 'بساطة هادئة',
    description: 'Distraction-free clarity with essential typography and quiet accents.',
    descriptionAr: 'أناقة مطلقة خالية من التشتيت مع تركيز تام على الهدف.',
    icon: 'ellipse-outline',
    accentFallback: '#64748B',
  },
  'dark-capsule': {
    id: 'dark-capsule',
    name: 'Dark Capsule',
    nameAr: 'كبسولة ليلية أنيقة',
    description: 'Deep contrast dark card with vibrant neon accents and sharp edges.',
    descriptionAr: 'تصميم داكن عالي التباين مع لمسات مضيئة وعصرية.',
    icon: 'moon-outline',
    accentFallback: '#06B6D4',
  },
  notebook: {
    id: 'notebook',
    name: 'Ruled Notebook',
    nameAr: 'دفتر ملاحظات مسطر',
    description: 'Notebook lines with ring binder touches for practical daily planning.',
    descriptionAr: 'أسطر ناعمة مع لمسات مفكرة يومية للتنفيذ السريع.',
    icon: 'pencil-outline',
    accentFallback: '#F59E0B',
  },
  default: {
    id: 'default',
    name: 'Standard Clean',
    nameAr: 'التصميم القياسي',
    description: 'Nizam standard clean responsive card design.',
    descriptionAr: 'التصميم القياسي المعتمد في نظام.',
    icon: 'sparkles-outline',
    accentFallback: '#EA580C',
  },
};

export const ALLOWED_GOAL_ICONS: string[] = [
  'flag-outline',
  'rocket-outline',
  'school-outline',
  'book-outline',
  'git-branch-outline',
  'terminal-outline',
  'barbell-outline',
  'flame-outline',
  'water-outline',
  'trending-up-outline',
  'cash-outline',
  'heart-outline',
  'bulb-outline',
  'shield-checkmark-outline',
  'calendar-outline',
  'time-outline',
  'trophy-outline',
  'fitness-outline',
  'code-slash-outline',
  'briefcase-outline',
  'medkit-outline',
  'compass-outline',
];

export const ALLOWED_ACCENT_COLORS: string[] = [
  '#2563EB', // Blue
  '#16A34A', // Green
  '#EA580C', // Orange
  '#E11D48', // Crimson Rose
  '#8B5CF6', // Purple
  '#D97706', // Amber
  '#0D9488', // Teal
  '#4F46E5', // Indigo
  '#DB2777', // Pink
  '#059669', // Emerald
  '#6366F1', // Violet
];

/**
 * Normalizes any legacy or arbitrary template ID to a valid AIGoalPresentation.
 * Backward compatible with existing stored goals where templateId was "roadmap", "checklist", etc.
 */
export function normalizeLegacyTemplate(
  templateId?: string,
  visualStyleId?: string
): AIGoalPresentation {
  const frameworkId: GoalFrameworkId =
    templateId && templateId in GOAL_FRAMEWORK_REGISTRY
      ? (templateId as GoalFrameworkId)
      : 'roadmap';

  const styleId: GoalVisualStyleId =
    visualStyleId && visualStyleId in GOAL_VISUAL_STYLE_REGISTRY
      ? (visualStyleId as GoalVisualStyleId)
      : 'default';

  return {
    frameworkId,
    visualStyleId: styleId,
  };
}

export function getFrameworkDefinition(frameworkId: GoalFrameworkId): GoalFrameworkDefinition {
  return GOAL_FRAMEWORK_REGISTRY[frameworkId] || GOAL_FRAMEWORK_REGISTRY.roadmap;
}

export function getVisualStyleDefinition(visualStyleId: GoalVisualStyleId): GoalVisualStyleDefinition {
  return GOAL_VISUAL_STYLE_REGISTRY[visualStyleId] || GOAL_VISUAL_STYLE_REGISTRY.default;
}
