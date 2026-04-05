"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dbClient } from "@/lib/db";
import { getChecklistStats } from "@/lib/analytics";
import type { Checklist, ChecklistItem } from "@/core/db";

import { useAuth } from "@/hooks/useAuth";

interface ChecklistListProps {
  /** If provided, links will include the user ID in the path */
  userId?: string;
}

export default function ChecklistList({ userId }: ChecklistListProps) {
  const { isLoggedIn } = useAuth();
  const [checklists, setChecklists] = useState<Record<string, Checklist>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = dbClient.subscribeChecklists((data) => {
      setChecklists(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleRename = (e: React.MouseEvent, cid: string, currentName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newName = prompt("Rename checklist to:", currentName);
    if (newName && newName !== currentName) {
      dbClient.renameChecklist(cid, newName);
    }
  };

  const handleDelete = (e: React.MouseEvent, cid: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete checklist "${name}"?`)) {
      dbClient.deleteChecklist(cid);
    }
  };

  const sorted = Object.entries(checklists).sort(
    ([, a], [, b]) => b.createdAt - a.createdAt
  );

  if (loading) {
    return <p className="text-sm text-gray-400 py-4 text-center">Loading checklists...</p>;
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No checklists yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {sorted.map(([id, cl]) => {
        const stats = getChecklistStats(cl.items || {});
        const href = userId
          ? `/user/${userId}/checklist/${id}`
          : `/checklist/${id}`; // Fixed fallback to use global route
        
        return (
          <li key={id} className="border border-gray-200 rounded overflow-hidden">
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 bg-white group">
              <Link href={href} className="flex-1 flex justify-between items-center mr-4">
                <span className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                  {cl.name}
                </span>
                {stats.total > 0 && (
                  <span className="text-[10px] text-gray-400">
                    {stats.done}/{stats.total} done · {stats.pct}%
                  </span>
                )}
              </Link>
              
              {isLoggedIn && (
                <div className="flex gap-3">
                  <button
                    onClick={(e) => handleRename(e, id, cl.name)}
                    className="text-[10px] text-gray-400 hover:text-blue-600 font-medium"
                  >
                    (rename)
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, id, cl.name)}
                    className="text-[10px] text-gray-400 hover:text-red-500 font-medium"
                  >
                    (delete)
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
