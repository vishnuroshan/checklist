"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { dbClient } from "@/lib/db";
import { computeStats, getChecklistStats } from "@/lib/analytics";
import type { User, Checklist, AllUserProgress } from "@/core/db";

export default function UserList() {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [checklists, setChecklists] = useState<Record<string, Checklist>>({});

  useEffect(() => {
    const unsub1 = dbClient.subscribeUsers(setUsers);
    const unsub2 = dbClient.subscribeChecklists(setChecklists);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const userEntries = Object.entries(users);

  if (userEntries.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">No users yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {userEntries.map(([uid, user]) => (
        <UserRow
          key={uid}
          uid={uid}
          user={user}
          checklists={checklists}
        />
      ))}
    </ul>
  );
}

function UserRow({
  uid,
  user,
  checklists,
}: {
  uid: string;
  user: User;
  checklists: Record<string, Checklist>;
}) {
  const { isLoggedIn } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState<AllUserProgress>({});

  useEffect(() => {
    if (isExpanded || true) { // Always subscribe for stats
      const unsub = dbClient.subscribeAllUserProgress(uid, setProgress);
      return unsub;
    }
  }, [uid, isExpanded]);

  const handleRename = (
    e: React.MouseEvent,
    uid: string,
    currentName: string
  ) => {
    e.stopPropagation();
    const newName = prompt("Rename user to:", currentName);
    if (newName && newName !== currentName) {
      dbClient.renameUser(uid, newName);
    }
  };

  const handleDelete = (e: React.MouseEvent, uid: string, name: string) => {
    e.stopPropagation();
    if (
      confirm(`Are you sure you want to delete user "${name}" and all their context?`)
    ) {
      dbClient.deleteUser(uid);
    }
  };

  const stats = computeStats(checklists, progress);
  const sortedChecklists = Object.entries(checklists).sort(
    ([, a], [, b]) => b.createdAt - a.createdAt
  );

  return (
    <li className="border border-gray-200 rounded overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 select-none bg-white"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-[10px] text-gray-400 w-4">
          {isExpanded ? "v" : ">"}
        </span>
        <span className="font-medium flex-1 text-sm">{user.name}</span>

        <div className="flex gap-3 mr-2">
          {isLoggedIn && (
            <>
              <button
                onClick={(e) => handleRename(e, uid, user.name)}
                className="text-[10px] text-gray-400 hover:text-blue-600 font-medium"
              >
                (rename)
              </button>
              <button
                onClick={(e) => handleDelete(e, uid, user.name)}
                className="text-[10px] text-gray-400 hover:text-red-500 font-medium"
              >
                (delete)
              </button>
            </>
          )}
          <span className="text-xs text-gray-400">
            {stats.completedChecklists} completed · {stats.completionPct}% done
          </span>
        </div>

        <Link
          href={`/user/${uid}`}
          className="text-blue-600 text-sm hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          open user
        </Link>
      </div>
      {isExpanded && (
        <ul className="border-t border-gray-100 bg-gray-50/30">
          {sortedChecklists.length === 0 ? (
            <li className="p-3 pl-10 text-xs text-gray-400">
              No checklists yet.
            </li>
          ) : (
            sortedChecklists.map(([cid, cl]) => {
              const cStats = getChecklistStats(cl.items || {}, progress[cid] || {});
              return (
                <li key={cid}>
                  <Link
                    href={`/user/${uid}/checklist/${cid}`}
                    className="flex justify-between items-center p-2 pl-10 hover:bg-gray-100 text-sm text-gray-700"
                  >
                    <span>{cl.name}</span>
                    {cStats.total > 0 && (
                      <span className="text-[11px] text-gray-400">
                        {cStats.done}/{cStats.total} done
                      </span>
                    )}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      )}
    </li>
  );
}
