"use client";

import { useEffect, useState } from "react";
import { dbClient } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import type { ChecklistItem, UserProgress } from "@/core/db";
import Item from "./Item";

interface ChecklistProps {
  checklistId: string;
  uid?: string;
}

export default function Checklist({ checklistId, uid }: ChecklistProps) {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<Record<string, ChecklistItem>>({});
  const [progress, setProgress] = useState<UserProgress>({});
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    const unsubItems = dbClient.subscribeItems(checklistId, setItems);
    let unsubProgress = () => {};

    if (uid) {
      unsubProgress = dbClient.subscribeUserProgress(uid, checklistId, setProgress);
    }

    return () => {
      unsubItems();
      unsubProgress();
    };
  }, [checklistId, uid]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newItemText.trim();
    if (!text) return;
    await dbClient.addItem(checklistId, text);
    setNewItemText("");
  };

  const sortedItems = Object.entries(items);

  return (
    <div className="mt-4">
      <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add new item..."
        />
        <button
          type="submit"
          className="bg-gray-800 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-900 disabled:opacity-50"
          disabled={!newItemText.trim()}
        >
          Add
        </button>
      </form>

      {sortedItems.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No items yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {sortedItems.map(([id, item]) => (
            <Item
              key={id}
              uid={uid}
              checklistId={checklistId}
              itemId={id}
              item={item}
              checked={!!progress[id]}
              disabled={isLoggedIn}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
