/**
 * hooks/useAIGoalSession.ts
 * Unified conversational state machine and session hook for Nizam AI Goal Architect.
 * Implements Section 17-21, 26, 46-50, 71 of Nizam_AI_Goals_Implementation_Blueprint.md.
 */

import { useState, useRef, useCallback } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  AIGoalDraft,
  AIGoalMessage,
  AIGoalPresentation,
  AIGoalSessionState,
  MilestoneItem,
  ProjectCandidate,
  StagedGoal,
} from '@/types/aiGoals';
import {
  normalizeGoalArchitectResponse,
  removeDuplicateMilestones,
  sanitizeAIText,
  validateColorAndIcon,
} from '@/utils/aiGoalValidation';
import { findRelevantCategories } from '@/utils/aiGoalContext';

const MAX_UNDO_STACK = 15;

export interface UseAIGoalSessionProps {
  year: number;
  month?: number;
  day?: number;
  userId: string;
  isArabic?: boolean;
  existingCategories?: string[];
  onPlanApplied?: () => void;
}

export function useAIGoalSession({
  year,
  month,
  day,
  userId,
  isArabic = false,
  existingCategories = [],
  onPlanApplied,
}: UseAIGoalSessionProps) {
  const [sessionState, setSessionState] = useState<AIGoalSessionState>('idle');
  const [draft, setDraft] = useState<AIGoalDraft | null>(null);
  const [messages, setMessages] = useState<AIGoalMessage[]>([]);
  const [stagedGoals, setStagedGoals] = useState<StagedGoal[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Undo history stack
  const historyRef = useRef<AIGoalDraft[]>([]);

  // Convex actions & mutations
  const architectAction = useAction(api.aiGoals.architectGoalIntent);
  const refineAction = useAction(api.aiGoals.refineGoalIntent);
  const expandAction = useAction(api.aiGoals.expandGoalIntent);
  const saveGoalsMutation = useMutation(api.aiGoals.saveArchitectGoals);

  const pushHistory = useCallback((currentDraft: AIGoalDraft | null) => {
    if (!currentDraft) return;
    const cloned: AIGoalDraft = JSON.parse(JSON.stringify(currentDraft));
    historyRef.current = [...historyRef.current.slice(-(MAX_UNDO_STACK - 1)), cloned];
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return false;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setDraft(prev);
    return true;
  }, []);

  const canUndo = historyRef.current.length > 0;

  const timeframe: 'day' | 'month' | 'year' =
    day !== undefined ? 'day' : month !== undefined ? 'month' : 'year';

  /**
   * Starts a new goal architecture request from user's voice or text prompt.
   */
  const startGoal = useCallback(
    async (userPrompt: string) => {
      const cleanPrompt = sanitizeAIText(userPrompt);
      if (!cleanPrompt) return;

      setSessionState('analyzing');
      setErrorMessage(null);

      // Add user message to conversation
      const userMsg: AIGoalMessage = {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: cleanPrompt,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Deterministic category pre-filtering
        const { bestMatch, relevantList } = findRelevantCategories(
          cleanPrompt,
          existingCategories
        );

        // Previous goals in session to prevent duplicates
        const previousGoalsPayload = stagedGoals.map((g) => ({
          text: g.text,
          category: g.category,
          templateId: g.templateId,
        }));

        const rawResult = await architectAction({
          userMessage: cleanPrompt,
          timeframe,
          year,
          month,
          day,
          existingSections: relevantList.length > 0 ? relevantList : existingCategories,
          previousGoalsInSession: previousGoalsPayload,
          language: isArabic ? 'ar' : 'en',
        });

        // Deterministically normalize into AIGoalDraft
        const normalizedDraft = normalizeGoalArchitectResponse(rawResult, {
          rawInput: cleanPrompt,
          timeframe,
          existingCategories,
          isArabic,
        });

        // If hybrid pre-matcher found a confident match and AI suggested new, default to bestMatch
        if (bestMatch && normalizedDraft.category.isNew) {
          const matchLower = bestMatch.toLowerCase();
          const promptLower = cleanPrompt.toLowerCase();
          if (promptLower.includes(matchLower)) {
            normalizedDraft.category.selectedName = bestMatch;
            normalizedDraft.category.isNew = false;
          }
        }

        pushHistory(draft);
        setDraft(normalizedDraft);

        // Add assistant message with recommendations
        const assistantMsg: AIGoalMessage = {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          content:
            normalizedDraft.aiResponseText ||
            (isArabic
              ? 'صممت لك هذا الهدف. اختر طريقة العرض الأنسب لك لنبدأ:'
              : 'I shaped this goal for you. Choose how you want it to look:'),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        setSessionState('awaiting_template');
      } catch (err: any) {
        console.warn('startGoal failed:', err);
        setErrorMessage(
          isArabic
            ? 'تعذر إنشاء الهدف تلقائياً، يمكنك كتابته يدوياً أو المحاولة ثانية.'
            : 'Could not generate goal blueprint. Your input is safe, you can retry.'
        );
        setSessionState('error');
      }
    },
    [
      architectAction,
      draft,
      existingCategories,
      isArabic,
      pushHistory,
      stagedGoals,
      timeframe,
      year,
      month,
      day,
    ]
  );

  /**
   * Selects or changes the presentation (framework + visual style).
   */
  const selectPresentation = useCallback(
    (presentation: AIGoalPresentation) => {
      if (!draft) return;
      pushHistory(draft);

      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          presentation,
          dirtyByUser: true,
          userEditedFields: {
            ...prev.userEditedFields,
            presentation: true,
          },
        };
      });

      setSessionState('reviewing');
    },
    [draft, pushHistory]
  );

  /**
   * Updates an in-memory draft field with user-edit protection.
   */
  const updateGoalField = useCallback(
    (field: 'title' | 'description' | 'color' | 'icon', value: string) => {
      setDraft((prev) => {
        if (!prev) return prev;
        if (field === 'title') {
          return {
            ...prev,
            goal: { ...prev.goal, title: value },
            dirtyByUser: true,
            userEditedFields: { ...prev.userEditedFields, title: true },
          };
        }
        if (field === 'description') {
          return {
            ...prev,
            goal: { ...prev.goal, description: value },
            dirtyByUser: true,
            userEditedFields: { ...prev.userEditedFields, description: true },
          };
        }
        if (field === 'color') {
          return {
            ...prev,
            color: value,
            dirtyByUser: true,
            userEditedFields: { ...prev.userEditedFields, color: true },
          };
        }
        if (field === 'icon') {
          return {
            ...prev,
            icon: value,
            dirtyByUser: true,
            userEditedFields: { ...prev.userEditedFields, icon: true },
          };
        }
        return prev;
      });
    },
    []
  );

  /**
   * Selects or switches category.
   */
  const selectCategory = useCallback(
    (name: string, existingCategoryId?: string, proposedNew = false) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          category: {
            selectedName: name,
            existingCategoryId,
            isNew: proposedNew,
          },
          dirtyByUser: true,
          userEditedFields: {
            ...prev.userEditedFields,
            category: true,
          },
        };
      });
    },
    []
  );

  /**
   * Milestone operations.
   */
  const addMilestone = useCallback((text: string) => {
    const clean = sanitizeAIText(text);
    if (!clean) return;

    setDraft((prev) => {
      if (!prev) return prev;
      const newMs: MilestoneItem = {
        id: `ms_${Date.now()}_${prev.milestones.length}`,
        text: clean,
        isCompleted: false,
      };
      return {
        ...prev,
        milestones: [...prev.milestones, newMs],
        dirtyByUser: true,
        userEditedFields: { ...prev.userEditedFields, milestones: true },
      };
    });
  }, []);

  const updateMilestone = useCallback((id: string, text: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        milestones: prev.milestones.map((m) => (m.id === id ? { ...m, text } : m)),
        dirtyByUser: true,
        userEditedFields: { ...prev.userEditedFields, milestones: true },
      };
    });
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
        ),
      };
    });
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        milestones: prev.milestones.filter((m) => m.id !== id),
        dirtyByUser: true,
        userEditedFields: { ...prev.userEditedFields, milestones: true },
      };
    });
  }, []);

  const clearMilestones = useCallback(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        milestones: [],
        dirtyByUser: true,
        userEditedFields: { ...prev.userEditedFields, milestones: true },
      };
    });
  }, []);

  /**
   * Conversational Refinement via AI instruction.
   */
  const refineGoal = useCallback(
    async (instruction: string) => {
      if (!draft) return;
      const clean = sanitizeAIText(instruction);
      if (!clean) return;

      pushHistory(draft);
      setSessionState('refining');

      const userMsg: AIGoalMessage = {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: clean,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const rawResult = await refineAction({
          currentDraft: draft,
          instruction: clean,
          existingSections: existingCategories,
          language: isArabic ? 'ar' : 'en',
        });

        setDraft((prev) => {
          if (!prev) return prev;
          // Apply changes while respecting userEditedFields
          const updatedTitle =
            prev.userEditedFields?.title && rawResult.goalTitle !== prev.goal.title
              ? prev.goal.title
              : rawResult.goalTitle || prev.goal.title;

          const updatedDesc =
            prev.userEditedFields?.description && rawResult.description !== prev.goal.description
              ? prev.goal.description
              : rawResult.description !== undefined
              ? rawResult.description
              : prev.goal.description;

          const updatedCat =
            prev.userEditedFields?.category && rawResult.category !== prev.category.selectedName
              ? prev.category.selectedName
              : rawResult.category || prev.category.selectedName;

          const updatedFw =
            prev.userEditedFields?.presentation && rawResult.frameworkId !== prev.presentation.frameworkId
              ? prev.presentation.frameworkId
              : (rawResult.frameworkId as any) || prev.presentation.frameworkId;

          const updatedStyle =
            prev.userEditedFields?.presentation && rawResult.visualStyleId !== prev.presentation.visualStyleId
              ? prev.presentation.visualStyleId
              : (rawResult.visualStyleId as any) || prev.presentation.visualStyleId;

          const updatedMilestones = Array.isArray(rawResult.milestones)
            ? removeDuplicateMilestones(rawResult.milestones)
            : prev.milestones;

          const { color, icon } = validateColorAndIcon(rawResult.color, rawResult.icon);

          return {
            ...prev,
            goal: {
              title: updatedTitle,
              description: updatedDesc,
              timeframe: prev.goal.timeframe,
            },
            category: {
              ...prev.category,
              selectedName: updatedCat,
            },
            presentation: {
              frameworkId: updatedFw,
              visualStyleId: updatedStyle,
            },
            milestones: updatedMilestones,
            color: prev.userEditedFields?.color ? prev.color : color,
            icon: prev.userEditedFields?.icon ? prev.icon : icon,
            aiResponseText: rawResult.aiResponseText || '',
          };
        });

        const assistantMsg: AIGoalMessage = {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          content:
            rawResult.aiResponseText ||
            (isArabic ? 'تم تحديث الهدف وفقاً لتعليماتك.' : 'Goal updated according to your instruction.'),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        setSessionState('reviewing');
      } catch (err: any) {
        console.warn('refineGoal error:', err);
        setErrorMessage(
          isArabic ? 'تعذر تنفيذ التعديل، بيانات هدفك محفوظة.' : 'Refinement failed, current draft is safe.'
        );
        setSessionState('reviewing');
      }
    },
    [draft, existingCategories, isArabic, pushHistory, refineAction]
  );

  /**
   * Conversational Expansion: generate sub-goals or milestones on demand.
   */
  const expandWithAI = useCallback(
    async (instructions: string) => {
      if (!draft) return;
      const clean = sanitizeAIText(instructions);
      pushHistory(draft);
      setSessionState('expanding');

      const userMsg: AIGoalMessage = {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: clean || (isArabic ? 'اقترح مراحل للهدف' : 'Suggest milestones'),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await expandAction({
          goalTitle: draft.goal.title,
          description: draft.goal.description,
          category: draft.category.selectedName,
          timeframe,
          userInstructions: clean || 'Suggest realistic, sequential milestones to achieve this goal.',
          currentMilestones: draft.milestones,
          language: isArabic ? 'ar' : 'en',
        });

        setDraft((prev) => {
          if (!prev) return prev;
          const mergedMilestones = removeDuplicateMilestones(res.milestones || []);
          const mergedProjects: ProjectCandidate[] = [
            ...prev.suggestedProjects,
            ...(res.suggestedProjects || []).map((p: any, idx: number) => ({
              localDraftId: `proj_${Date.now()}_${idx}`,
              name: p.name,
              description: p.description,
            })),
          ];

          return {
            ...prev,
            milestones: mergedMilestones,
            suggestedProjects: mergedProjects,
            aiResponseText: res.aiResponseText || '',
          };
        });

        const assistantMsg: AIGoalMessage = {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          content:
            res.aiResponseText ||
            (isArabic ? 'تم تجهيز المراحل المقترحة لهدفك.' : 'Milestones prepared for your goal.'),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        setSessionState('reviewing');
      } catch (err: any) {
        console.warn('expandWithAI error:', err);
        setErrorMessage(
          isArabic ? 'تعذر اقتراح المراحل حالياً.' : 'Could not generate milestones right now.'
        );
        setSessionState('reviewing');
      }
    },
    [draft, expandAction, isArabic, pushHistory, timeframe]
  );

  /**
   * Project candidates handling.
   */
  const addProjectCandidate = useCallback((name: string, description?: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const newProj: ProjectCandidate = {
        localDraftId: `proj_${Date.now()}`,
        name: sanitizeAIText(name),
        description: description ? sanitizeAIText(description) : undefined,
      };
      return {
        ...prev,
        suggestedProjects: [...prev.suggestedProjects, newProj],
      };
    });
  }, []);

  const removeProjectCandidate = useCallback((localDraftId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suggestedProjects: prev.suggestedProjects.filter((p) => p.localDraftId !== localDraftId),
      };
    });
  }, []);

  /**
   * Stages the current draft into session batch.
   */
  const stageCurrentGoal = useCallback(() => {
    if (!draft || !draft.goal.title.trim()) return false;

    const staged: StagedGoal = {
      id: `staged_${Date.now()}`,
      text: draft.goal.title,
      description: draft.goal.description,
      category: draft.category.selectedName,
      color: draft.color,
      icon: draft.icon,
      templateId: draft.presentation.frameworkId,
      visualStyleId: draft.presentation.visualStyleId,
      milestones: draft.milestones,
      projects: draft.suggestedProjects,
    };

    setStagedGoals((prev) => [...prev, staged]);
    setDraft(null);
    setSessionState('idle');
    return true;
  }, [draft]);

  const removeStagedGoal = useCallback((id: string) => {
    setStagedGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  /**
   * Finalizes and saves all goals into database via saveArchitectGoals mutation.
   */
  const saveAllToGoals = useCallback(async () => {
    // Gather goals to save: staged goals + active draft if present
    const goalsToSave: Array<{
      text: string;
      description?: string;
      category: string;
      color?: string;
      icon?: string;
      templateId?: string;
      visualStyleId?: string;
      milestones?: MilestoneItem[];
    }> = stagedGoals.map((g) => ({
      text: g.text,
      description: g.description,
      category: g.category,
      color: g.color,
      icon: g.icon,
      templateId: g.templateId,
      visualStyleId: g.visualStyleId,
      milestones: g.milestones,
    }));

    if (draft && draft.goal.title.trim()) {
      goalsToSave.push({
        text: draft.goal.title,
        description: draft.goal.description,
        category: draft.category.selectedName,
        color: draft.color,
        icon: draft.icon,
        templateId: draft.presentation.frameworkId,
        visualStyleId: draft.presentation.visualStyleId,
        milestones: draft.milestones,
      });
    }

    if (goalsToSave.length === 0) return false;

    setSessionState('saving');
    try {
      await saveGoalsMutation({
        userId,
        year,
        month,
        day,
        goals: goalsToSave,
      });

      setSessionState('completed');
      if (onPlanApplied) {
        onPlanApplied();
      }
      return true;
    } catch (err: any) {
      console.warn('saveAllToGoals error:', err);
      setErrorMessage(
        isArabic ? 'فشل حفظ الأهداف، يرجى المحاولة مرة أخرى.' : 'Failed to save goals, please try again.'
      );
      setSessionState('reviewing');
      return false;
    }
  }, [day, draft, isArabic, month, onPlanApplied, saveGoalsMutation, stagedGoals, userId, year]);

  const reset = useCallback(() => {
    setSessionState('idle');
    setDraft(null);
    setMessages([]);
    setStagedGoals([]);
    setErrorMessage(null);
    historyRef.current = [];
  }, []);

  return {
    state: sessionState,
    draft,
    messages,
    stagedGoals,
    errorMessage,
    canUndo,
    undo,
    startGoal,
    selectPresentation,
    updateGoalField,
    selectCategory,
    addMilestone,
    updateMilestone,
    toggleMilestone,
    deleteMilestone,
    clearMilestones,
    refineGoal,
    expandWithAI,
    addProjectCandidate,
    removeProjectCandidate,
    stageCurrentGoal,
    removeStagedGoal,
    saveAllToGoals,
    reset,
  };
}
