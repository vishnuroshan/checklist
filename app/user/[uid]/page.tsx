"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { dbClient } from "@/lib/db";
import { getChecklistStats } from "@/lib/analytics";
import type { User, Checklist, UserProgress, AllUserProgress } from "@/core/db";

export default function UserPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { isLoggedIn } = useAuth();
  const { uid } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [checklists, setChecklists] = useState<Record<string, Checklist>>({});
  const [allProgress, setAllProgress] = useState<AllUserProgress>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    dbClient.getUser(uid).then((u) => {
      setUser(u);
      setLoading(false);
    });

    const unsub1 = dbClient.subscribeChecklists(setChecklists);
    const unsub2 = dbClient.subscribeAllUserProgress(uid, setAllProgress);
    return () => {
      unsub1();
      unsub2();
    };
  }, [uid]);

  const handleRename = () => {
    if (!user) return;
    const newName = prompt("Rename user to:", user.name);
    if (newName && newName !== user.name) {
      dbClient.renameUser(uid, newName);
    }
  };

  const handleDelete = () => {
    if (!user) return;
    if (confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      dbClient.deleteUser(uid);
      router.push("/");
    }
  };

  const sorted = Object.entries(checklists).sort(
    ([, a], [, b]) => b.createdAt - a.createdAt
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-xl font-semibold mb-4">User not found</h1>
        <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-bold">{user.name}</h1>
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
          <p className="text-sm text-gray-500">Select a checklist to view or edit:</p>
        </div>
        {isLoggedIn && (
          <Link
            href={`/create?uid=${uid}`}
            className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200 transition-colors font-medium"
          >
            + Checklist
          </Link>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
          <p className="text-gray-400">No checklists yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map(([id, cl]) => {
            const stats = getChecklistStats(cl.items || {}, allProgress[id] || {});
            return (
              <li key={id} className="border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all bg-white overflow-hidden">
                <Link href={`/user/${uid}/checklist/${id}`} className="flex justify-between items-center p-4">
                  <span className="font-semibold text-gray-800">{cl.name}</span>
                  {stats.total > 0 && (
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                      {stats.done}/{stats.total} done · {stats.pct}%
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-8 flex justify-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
          Back to Admin
        </Link>
      </div>
    </div>
  );
}
