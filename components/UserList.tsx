import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { dbClient } from "@/lib/db";
import { computeStats, getChecklistStats, computeUserExtremes, computeGlobalChecklistExtremes } from "@/lib/analytics";
import type { User, Checklist, AllUserProgress } from "@/core/db";

export default function UserList() {
  const { isLoggedIn } = useAuth();
  const [users, setUsers] = useState<Record<string, User>>({});
  const [checklists, setChecklists] = useState<Record<string, Checklist>>({});
  const [allUsersProgress, setAllUsersProgress] = useState<
    Record<string, AllUserProgress>
  >({});

  useEffect(() => {
    const unsubUsers = dbClient.subscribeUsers(setUsers);
    const unsubLists = dbClient.subscribeChecklists(setChecklists);
    return () => {
      unsubUsers();
      unsubLists();
    };
  }, []);

  // Manage dynamic subscriptions for all users' progress
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const uids = Object.keys(users);

    uids.forEach((uid) => {
      const unsub = dbClient.subscribeAllUserProgress(uid, (progress) => {
        setAllUsersProgress((prev) => ({ ...prev, [uid]: progress }));
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [users]);

  const userEntries = Object.entries(users);
  const userExtremes = computeUserExtremes(users, checklists, allUsersProgress);
  const checklistExtremes = computeGlobalChecklistExtremes(checklists, allUsersProgress);

  if (userEntries.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">No users yet.</p>
    );
  }

  return (
    <div className="space-y-6">
      {checklistExtremes && Object.keys(checklists).length > 1 && (
        <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col gap-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Global Checklist Highlights
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">Most Mastered:</span>{" "}
            {checklistExtremes.most.name} ({checklistExtremes.most.pct}%)
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">Least Mastered:</span>{" "}
            {checklistExtremes.least.name} ({checklistExtremes.least.pct}%)
          </div>
        </div>
      )}

      {isLoggedIn && userExtremes && userEntries.length > 1 && (
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col gap-1">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
            User Performance Highlights (Admin Only)
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">Highest Completion:</span>{" "}
            {userExtremes.most.name} ({userExtremes.most.count} checklists)
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">Least Completion:</span>{" "}
            {userExtremes.least.name} ({userExtremes.least.count} checklists)
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {userEntries.map(([uid, user]) => (
          <UserRow
            key={uid}
            uid={uid}
            user={user}
            checklists={checklists}
            progress={allUsersProgress[uid] || {}}
          />
        ))}
      </ul>
    </div>
  );
}

function UserRow({
  uid,
  user,
  checklists,
  progress,
}: {
  uid: string;
  user: User;
  checklists: Record<string, Checklist>;
  progress: AllUserProgress;
}) {
  const { isLoggedIn } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

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
        <span className="text-[10px] text-gray-400 w-4 font-mono">
          {isExpanded ? "−" : "+"}
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
          open
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
