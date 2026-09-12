import { getServerNow } from './offlineStorage';

export interface TimerDoc {
  _id: string;
  status?: string;
  parentId?: string;
  timerDuration?: number;
  timerDirection?: string;
  timerStartTime?: number;
  timeLeftAtPause?: number;
}

export interface RunUpdate {
  id: string;
  status: string;
  timerStartTime?: number | null;
  timeLeftAtPause?: number | null;
}

export const hasTimer = (t: TimerDoc): boolean =>
  t.timerDirection === 'up' || !!t.timerDuration;

// Every value is computed once, on the device, in server-corrected time, and
// then stored verbatim by `todos:setTimerRunState`. Replays can't recompute it
// against a later clock, so offline start/pause sequences survive sync.
export function startUpdate(t: TimerDoc): RunUpdate {
  const now = getServerNow();
  let startTime = now;
  if ((t.status === 'paused' || t.status === 'not_done') && t.timeLeftAtPause !== undefined) {
    if (t.timerDirection === 'up') {
      startTime = now - t.timeLeftAtPause;
    } else if (t.timerDuration) {
      startTime = now - (t.timerDuration - t.timeLeftAtPause);
    }
  } else if ((t.status === 'paused' || t.status === 'not_done') && t.timerStartTime) {
    // Paused without a frozen remaining value (legacy status-only pause):
    // preserve the original clock instead of restarting from full duration.
    startTime = t.timerStartTime;
  }
  return { id: t._id, status: 'in_progress', timerStartTime: startTime };
}

export function pauseUpdate(t: TimerDoc): RunUpdate | null {
  if (t.status !== 'in_progress') return null;
  if (!t.timerStartTime) {
    // Clock-less running doc (e.g. a roll-up parent with no own timer):
    // still flip the status so pause cascades uniformly.
    return { id: t._id, status: 'paused' };
  }
  const now = getServerNow();
  const elapsed = Math.max(0, now - t.timerStartTime);
  if (t.timerDirection === 'up') {
    return { id: t._id, status: 'paused', timeLeftAtPause: elapsed };
  }
  if (!t.timerDuration) return { id: t._id, status: 'paused' };
  return { id: t._id, status: 'paused', timeLeftAtPause: Math.max(0, t.timerDuration - elapsed) };
}

// Parent pause cascades to running subtasks (mirrors the old server-side
// cascade, but with values frozen at action time).
export function buildPauseUpdates(parent: TimerDoc, subtasks: TimerDoc[]): RunUpdate[] {
  const updates: RunUpdate[] = [];
  const pu = pauseUpdate(parent);
  if (pu) updates.push(pu);
  subtasks.forEach((s) => {
    const su = pauseUpdate(s);
    if (su) updates.push(su);
  });
  return updates;
}

// Subtask start auto-starts the parent when it has a timer and isn't running.
export function buildSubtaskStartUpdates(sub: TimerDoc, parent?: TimerDoc | null): RunUpdate[] {
  const updates = [startUpdate(sub)];
  if (parent && parent.status !== 'in_progress' && hasTimer(parent)) {
    updates.push(startUpdate(parent));
  }
  return updates;
}

// Parent start wakes paused subtasks: resuming the main timer resumes a
// subtask that was frozen with it. Only already-paused timed subtasks are
// touched — running ones keep their own clock.
export function buildParentStartUpdates(parent: TimerDoc, subtasks: TimerDoc[]): RunUpdate[] {
  const updates = [startUpdate(parent)];
  subtasks.forEach((s) => {
    if (s.status === 'paused' && hasTimer(s)) updates.push(startUpdate(s));
  });
  return updates;
}

// Roll-up model: a parent with no own timer displays the sum of its
// countdown subtasks. Total = sum of allocations; remaining derives per
// subtask from its own clock (running → live, paused → frozen,
// not_started/not_done → full allocation still owed, done → 0).
export function subRemaining(s: TimerDoc, now = getServerNow()): number {
  if (s.timerDirection === 'up' || !s.timerDuration) return 0;
  if (s.status === 'in_progress' && s.timerStartTime) {
    return Math.max(0, s.timerDuration - Math.max(0, now - s.timerStartTime));
  }
  if (s.status === 'paused' && s.timeLeftAtPause !== undefined) {
    return Math.max(0, s.timeLeftAtPause);
  }
  if (s.status === 'done') return 0;
  return s.timerDuration;
}

export interface Rollup {
  total: number;
  remaining: number;
}

export function rollupSubTimers(subs: TimerDoc[]): Rollup {
  let total = 0;
  let remaining = 0;
  for (const s of subs || []) {
    if (s.timerDirection === 'up' || !s.timerDuration) continue;
    total += s.timerDuration;
    remaining += subRemaining(s);
  }
  return { total, remaining: Math.max(0, remaining) };
}

// Subtask pause pauses the parent when no sibling keeps running.
export function buildSubtaskPauseUpdates(
  sub: TimerDoc,
  siblings: TimerDoc[],
  parent?: TimerDoc | null
): RunUpdate[] {
  const updates: RunUpdate[] = [];
  const su = pauseUpdate(sub);
  if (su) updates.push(su);
  const anyStillRunning = siblings.some(
    (s) => s._id !== sub._id && s.status === 'in_progress' && s.timerStartTime
  );
  if (!anyStillRunning && parent) {
    const pu = pauseUpdate(parent);
    if (pu) updates.push(pu);
  }
  return updates;
}
