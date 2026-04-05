"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { dbClient } from "@/lib/db";

function CreateChecklistForm() {
  const { isLoggedIn, isInitialized } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryUid = searchParams.get("uid");
    if (queryUid) {
      setUid(queryUid);
      return;
    }

    const unsub = dbClient.subscribeUsers((users) => {
      const firstUid = Object.keys(users)[0];
      if (firstUid) {
        setUid(firstUid);
      }
    });
    return unsub;
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    const trimmed = name.trim();
    if (!trimmed || !uid) return;

    setLoading(true);
    try {
      const cid = await dbClient.createChecklist(trimmed);
      router.push(`/user/${uid}/checklist/${cid}`);
    } catch (error) {
      console.error("Failed to create checklist:", error);
      setLoading(false);
    }
  };

  if (!isInitialized) return null;

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <h1 className="text-xl font-semibold mb-6">Create Checklist</h1>
        <p className="text-gray-400 mb-6">You must be logged in as an admin to create checklists.</p>
        <Link href="/" className="text-blue-600 hover:underline">Back to Admin</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-xl font-semibold mb-6">Create Checklist</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          className="border border-gray-200 rounded px-4 py-2 text-sm outline-none focus:border-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter checklist name"
          required
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !uid}
          className="bg-gray-800 text-white rounded px-4 py-2 text-sm hover:bg-gray-900 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? "Creating..." : "Create Checklist"}
        </button>
        {!uid && !loading && (
          <p className="text-xs text-red-500 text-center">
            No user selected. Please create a user first.
          </p>
        )}
        <Link href="/" className="text-sm text-gray-400 text-center hover:text-gray-600">
          Cancel
        </Link>
      </form>
    </div>
  );
}

export default function CreateChecklistPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <CreateChecklistForm />
    </Suspense>
  );
}
