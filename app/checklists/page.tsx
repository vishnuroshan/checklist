"use client";

import Link from "next/link";
import ChecklistList from "@/components/ChecklistList";

export default function ChecklistsPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-xl font-semibold">All Checklists</h1>
          <p className="text-sm text-gray-400">Manage and view all system checklists</p>
        </div>
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 font-medium"
        >
          Back to Home
        </Link>
      </div>

      <section>
        <ChecklistList />
      </section>
    </div>
  );
}
