import type { Checklist, ChecklistItem, UserProgress, AllUserProgress, User } from "@/core/db";

export type Stats = {
  totalChecklists: number;
  completedChecklists: number;
  totalItems: number;
  completedItems: number;
  completionPct: number;
};

/**
 * Global aggregate stats across a collection of checklists for a specific user.
 */
export function computeStats(
  checklists: Record<string, Checklist>,
  allProgress: AllUserProgress = {}
): Stats {
  let totalChecklists = 0;
  let completedChecklists = 0;
  let totalItems = 0;
  let completedItems = 0;

  for (const cid in checklists) {
    const items = checklists[cid].items || {};
    const progress = allProgress[cid] || {};
    const itemList = Object.values(items);

    const total = itemList.length;
    const done = Object.keys(items).filter((id) => progress[id]).length;

    totalChecklists++;
    totalItems += total;
    completedItems += done;

    if (total > 0 && done === total) {
      completedChecklists++;
    }
  }

  const completionPct =
    totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  return {
    totalChecklists,
    completedChecklists,
    totalItems,
    completedItems,
    completionPct,
  };
}

/**
 * Detailed stats for a single checklist based on user progress.
 */
export function getChecklistStats(
  items: Record<string, ChecklistItem>,
  progress: UserProgress = {}
) {
  const itemIds = Object.keys(items || {});
  const total = itemIds.length;
  const done = itemIds.filter((id) => progress[id]).length;

  return {
    total,
    done,
    remaining: total - done,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export type Extreme = {
  name: string;
  pct: number;
};

export type Extremes = {
  most: Extreme;
  least: Extreme;
};

/**
 * Finds the most and least completed checklists from a user's progress.
 */
export function computeExtremes(
  checklists: Record<string, Checklist>,
  allProgress: AllUserProgress
): Extremes | null {
  const entries = Object.entries(checklists);
  if (entries.length === 0) return null;

  let most: Extreme | null = null;
  let least: Extreme | null = null;

  for (const [id, cl] of entries) {
    const stats = getChecklistStats(cl.items || {}, allProgress[id] || {});
    
    if (!most || stats.pct > most.pct) {
      most = { name: cl.name, pct: stats.pct };
    }
    
    if (!least || stats.pct < least.pct) {
      least = { name: cl.name, pct: stats.pct };
    }
  }

  return most && least ? { most, least } : null;
}

export type UserExtreme = {
  name: string;
  count: number;
};

export type UserExtremes = {
  most: UserExtreme;
  least: UserExtreme;
};

/**
 * Finds the user with most and least completed checklists.
 */
export function computeUserExtremes(
  users: Record<string, User>,
  checklists: Record<string, Checklist>,
  allUsersProgress: Record<string, AllUserProgress>
): UserExtremes | null {
  const userEntries = Object.entries(users);
  if (userEntries.length === 0) return null;

  let most: UserExtreme | null = null;
  let least: UserExtreme | null = null;

  for (const [uid, user] of userEntries) {
    const progress = allUsersProgress[uid] || {};
    let completedCount = 0;

    for (const cid in checklists) {
      const items = checklists[cid].items || {};
      const itemIds = Object.keys(items);
      if (itemIds.length === 0) continue;

      const userCidProgress = progress[cid] || {};
      const isDone = itemIds.every((id) => userCidProgress[id]);
      
      if (isDone) completedCount++;
    }

    if (!most || completedCount > most.count) {
      most = { name: user.name, count: completedCount };
    }

    if (!least || completedCount < least.count) {
      least = { name: user.name, count: completedCount };
    }
  }
  return most && least ? { most, least } : null;
}

/**
 * Finds the most and least mastered checklists by averaging performance across all users.
 */
export function computeGlobalChecklistExtremes(
  checklists: Record<string, Checklist>,
  allUsersProgress: Record<string, AllUserProgress>
): Extremes | null {
  const entries = Object.entries(checklists);
  const uids = Object.keys(allUsersProgress);
  if (entries.length === 0 || uids.length === 0) return null;

  let most: Extreme | null = null;
  let least: Extreme | null = null;

  for (const [cid, cl] of entries) {
    let totalPct = 0;
    let count = 0;

    for (const uid of uids) {
      const progress = allUsersProgress[uid]?.[cid];
      if (progress) {
        const stats = getChecklistStats(cl.items || {}, progress);
        totalPct += stats.pct;
        count++;
      }
    }

    if (count > 0) {
      const avgPct = Math.round(totalPct / count);
      if (!most || avgPct > most.pct) {
        most = { name: cl.name, pct: avgPct };
      }
      if (!least || avgPct < least.pct) {
        least = { name: cl.name, pct: avgPct };
      }
    }
  }

  return most && least ? { most, least } : null;
}
