import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Id } from '@/convex/_generated/dataModel';

export interface TaskItem {
  _id: Id<'todos'>;
  text: string;
  status: string;
  priority?: string;
  dueDate?: number;
  timerDuration?: number;
  timerDirection?: string;
  timerStartTime?: number;
  timeLeftAtPause?: number;
  projectId?: string;
  categoryId?: string;
  goalId?: string;
  description?: string;
  hashtags?: string[];
  [key: string]: any;
}

interface ActiveTaskContextValue {
  /** The tasks of the day currently shown on the home page. */
  tasks: TaskItem[];
  /** The task the user is working on right now. */
  activeTask: TaskItem | null;
  /** Id of the task the user pinned (kept stable across pause/resume). */
  selectedTaskId: Id<'todos'> | null;
  /** Pin a task as the active one. Pass `null` to release the pin. */
  selectTask: (task: TaskItem | Id<'todos'> | null) => void;
  /**
   * Called when the active task is completed: the pin moves to the next
   * unfinished task so the home page always has something to show.
   */
  advanceAfterComplete: (task: TaskItem) => void;
}

const ActiveTaskContext = createContext<ActiveTaskContextValue | null>(null);

/**
 * Owns "which task is active" for the whole home page.
 *
 * The active task card lives in the card stack at the top of the page while
 * the task list modal lives at the bottom, so the selection has to be shared
 * between them: pinning a task in one place has to be visible in the other.
 */
export const ActiveTaskProvider: React.FC<{
  tasks: TaskItem[];
  children: React.ReactNode;
}> = ({ tasks, children }) => {
  // The task the user explicitly pinned. It survives a pause/resume cycle,
  // which is what keeps the active task from jumping to another one.
  const [pinnedTaskId, setPinnedTaskId] = useState<Id<'todos'> | null>(null);

  const activeTask = useMemo(() => {
    // 1. A running task always wins.
    const inProg = tasks.find((t) => t.status === 'in_progress');
    if (inProg) return inProg;

    // 2. The pinned task stays pinned while it is not finished.
    if (pinnedTaskId) {
      const pinned = tasks.find((t) => t._id === pinnedTaskId);
      if (pinned && pinned.status !== 'done') {
        return pinned;
      }
    }

    // 3. A paused task.
    const paused = tasks.find((t) => t.status === 'paused');
    if (paused) return paused;

    // 4. The first unfinished task.
    const notDone = tasks.find((t) => t.status !== 'done');
    if (notDone) return notDone;

    // 5. Everything is done — show the first task so the card is not empty.
    return tasks[0] || null;
  }, [tasks, pinnedTaskId]);

  const selectTask = useCallback((task: TaskItem | Id<'todos'> | null) => {
    if (task === null) {
      setPinnedTaskId(null);
      return;
    }
    setPinnedTaskId(typeof task === 'string' ? task : task._id);
  }, []);

  const advanceAfterComplete = useCallback(
    (task: TaskItem) => {
      const nextIncomplete = tasks.find(
        (t) => t._id !== task._id && t.status !== 'done'
      );
      setPinnedTaskId(nextIncomplete ? nextIncomplete._id : null);
    },
    [tasks]
  );

  const value = useMemo<ActiveTaskContextValue>(
    () => ({
      tasks,
      activeTask,
      selectedTaskId: pinnedTaskId,
      selectTask,
      advanceAfterComplete,
    }),
    [tasks, activeTask, pinnedTaskId, selectTask, advanceAfterComplete]
  );

  return (
    <ActiveTaskContext.Provider value={value}>
      {children}
    </ActiveTaskContext.Provider>
  );
};

/** Reads the shared active task. Returns `null` outside a provider. */
export const useActiveTask = (): ActiveTaskContextValue | null =>
  useContext(ActiveTaskContext);

export default ActiveTaskContext;
