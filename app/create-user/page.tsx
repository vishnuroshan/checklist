"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dbClient } from "@/lib/db";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function CreateUserPage() {
  const { isLoggedIn, isInitialized } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    await dbClient.createUser(trimmed);
    router.push("/");
  };

  if (!isInitialized) return null;

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <h1 className="text-xl font-semibold mb-6">Create User</h1>
        <p className="text-gray-400 mb-6">You must be logged in as an admin to create users.</p>
        <Link href="/" className="text-blue-600 hover:underline">Back to Admin</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-xl font-semibold mb-6">Create User</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          className="border border-gray-200 rounded px-4 py-2 text-sm outline-none focus:border-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          required
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-800 text-white rounded px-4 py-2 text-sm hover:bg-gray-900 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? "Creating..." : "Create User"}
        </button>
        <Link href="/" className="text-sm text-gray-400 text-center hover:text-gray-600">
          Cancel
        </Link>
      </form>
    </div>
  );
}
