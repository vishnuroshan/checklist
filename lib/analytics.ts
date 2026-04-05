import type { Checklist, ChecklistItem, UserProgress, AllUserProgress } from "@/core/db";

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
