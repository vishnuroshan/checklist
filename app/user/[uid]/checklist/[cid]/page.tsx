"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dbClient } from "@/lib/db";
import { getChecklistStats } from "@/lib/analytics";
import type { User, Checklist as ChecklistType } from "@/core/db";
import ChecklistComponent from "@/components/Checklist";

export default function ChecklistPage({
  params,
}: {
  params: Promise<{ uid: string; cid: string }>;
}) {
  const { isLoggedIn } = useAuth();
  const { uid, cid } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [checklist, setChecklist] = useState<ChecklistType | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    dbClient.getUser(uid).then((u) => {
      setUser(u);
      setLoading(false);
    });

    const unsubCl = dbClient.subscribeChecklist(cid, setChecklist);
    const unsubProg = dbClient.subscribeUserProgress(uid, cid, setProgress);

    return () => {
      unsubCl();
      unsubProg();
    };
  }, [uid, cid]);

  const handleRename = () => {
    if (!checklist) return;
    const newName = prompt("Rename checklist to:", checklist.name);
    if (newName && newName !== checklist.name) {
      dbClient.renameChecklist(cid, newName);
    }
  };

  const handleDelete = () => {
    if (!checklist) return;
    if (confirm(`Are you sure you want to delete checklist "${checklist.name}"?`)) {
      dbClient.deleteChecklist(cid);
      router.push(`/user/${uid}`);
    }
  };

  if (loading) {
    return (
      <div className="page-container p-8 text-center text-gray-400">
        <p>Loading...</p>
      </div>
    );
  }

  const cStats = checklist ? getChecklistStats(checklist.items || {}, progress) : null;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link
        href={`/user/${uid}`}
        className="text-sm text-gray-400 hover:text-gray-600 inline-block mb-8"
      >
        Back to checklists
      </Link>

      <div className="mb-8">
        {user && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
            {user.name}
          </span>
        )}
        {checklist ? (
          <div>
            <div className="flex items-baseline gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{checklist.name}</h1>
              {isLoggedIn && (
                <div className="flex gap-2">
                  <button
                    onClick={handleRename}
                    className="text-xs text-gray-400 hover:text-blue-600 font-medium"
                  >
                    (rename)
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-xs text-gray-400 hover:text-red-500 font-medium"
                  >
                    (delete)
                  </button>
                </div>
              )}
            </div>
            {cStats && cStats.total > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <span>{cStats.done} / {cStats.total} tasks done</span>
                <span className="text-gray-300">·</span>
                <span>{cStats.remaining} remaining</span>
                <span className="text-gray-300">·</span>
                <span className="text-blue-600">{cStats.pct}%</span>
              </div>
            )}
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-gray-900">
            Checklist not found
          </h1>
        )}
      </div>

      {checklist && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <ChecklistComponent checklistId={cid} uid={uid} />
        </div>
      )}
    </div>
  );
}
