/**
 * types/aiGoals.ts
 * Type definitions for the Nizam AI Goal Architect system.
 * Implements the normalized data models specified in Nizam_AI_Goals_Implementation_Blueprint.md.
 */

export type AIGoalType =
  | 'learning'
  | 'project'
  | 'fitness'
  | 'health'
  | 'habit'
  | 'financial'
  | 'academic'
  | 'career'
  | 'creative'
  | 'personal'
  | 'mixed'
  | 'custom';

export interface AIGoalIntent {
  rawInput: string;
  coreSubject: string;
  corePurpose: string;
  goalType: AIGoalType;
  domain: string;
  desiredOutcome?: string;
  supportingOutcomes?: string[];
  timeframe: 'day' | 'month' | 'year';
  measurableSignals?: string[];
  explicitUserItems: string[];
  confidence?: {
    coreIntent: number;
    type: number;
    category: number;
  };
}

export interface AICategoryRecommendation {
  recommendedCategory: {
    mode: 'existing' | 'new';
    existingCategoryId?: string;
    name: string;
    description?: string;
  };
  alternatives: Array<{
    existingCategoryId?: string;
    name: string;
    reason: string;
  }>;
  createNewCategory: boolean;
}

export type GoalFrameworkId = 'roadmap' | 'checklist' | 'metric' | 'sprint' | 'pillar';
export type AIGoalFrameworkId = GoalFrameworkId;

export type GoalVisualStyleId =
  | 'paper'
  | 'book'
  | 'glass'
  | 'editorial'
  | 'minimal'
  | 'dark-capsule'
  | 'notebook'
  | 'default';
export type AIGoalVisualStyleId = GoalVisualStyleId;

export interface AIGoalPresentation {
  frameworkId: GoalFrameworkId;
  visualStyleId: GoalVisualStyleId;
}

export interface AITemplateRecommendation {
  templateId: string; // compatibility with legacy framework ID
  frameworkId: GoalFrameworkId;
  visualStyleId: GoalVisualStyleId;
  title?: string;
  titleAr?: string;
  reason: string;
  reasonAr?: string;
  fit: 'primary' | 'alternative';
}

export interface MilestoneItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface ProjectCandidate {
  localDraftId: string;
  name: string;
  description?: string;
  confirmed?: boolean;
}

export interface HeaderOption {
  title: string;
  isExisting: boolean;
  categoryId?: string;
}

export interface StagedGoal {
  id: string;
  text: string;
  description?: string;
  category: string;
  color?: string;
  icon?: string;
  templateId: string;
  visualStyleId?: string;
  milestones: MilestoneItem[];
  projects?: ProjectCandidate[];
}

export interface AIGoalDraft {
  intent: AIGoalIntent;
  category: {
    selectedName: string;
    existingCategoryId?: string;
    isNew: boolean;
    confidence?: number;
  };
  goal: {
    title: string;
    description: string;
    measurableOutcome?: string;
    timeframe: 'day' | 'month' | 'year';
  };
  presentation: AIGoalPresentation;
  templateOptions: AITemplateRecommendation[];
  milestones: MilestoneItem[];
  suggestedProjects: ProjectCandidate[];
  color: string;
  icon: string;
  dirtyByUser: boolean;
  aiResponseText?: string;
  userEditedFields: {
    title?: boolean;
    description?: boolean;
    category?: boolean;
    presentation?: boolean;
    milestones?: boolean;
    color?: boolean;
    icon?: boolean;
  };
}

export type AIGoalSessionState =
  | 'idle'
  | 'analyzing'
  | 'awaiting_template'
  | 'reviewing'
  | 'asking_expansion'
  | 'expanding'
  | 'refining'
  | 'final_review'
  | 'saving'
  | 'completed'
  | 'error';

export interface AIGoalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  operation?: AIGoalOperation;
}

export interface AIGoalOperation {
  type:
    | 'initial_intent'
    | 'template_change'
    | 'category_change'
    | 'refine_goal'
    | 'expand_milestones'
    | 'expand_projects'
    | 'manual_edit';
  targetField?: string;
  previousValue?: any;
  newValue?: any;
}

export interface AIGoalConversationState {
  state: AIGoalSessionState;
  messages: AIGoalMessage[];
  draft: AIGoalDraft | null;
  stagedGoals: StagedGoal[];
  error?: string;
}

export interface GoalFrameworkDefinition {
  id: GoalFrameworkId;
  name: string;
  nameAr: string;
  icon: string;
  badge: string;
  badgeAr: string;
  description: string;
  descriptionAr: string;
  color?: string;
  intendedFor?: string[] | string;
}

export interface GoalVisualStyleDefinition {
  id: GoalVisualStyleId;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon?: string;
  accentFallback?: string;
}
