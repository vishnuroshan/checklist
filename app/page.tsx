"use client";

import Link from "next/link";
import UserList from "@/components/UserList";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { isLoggedIn, login, logout } = useAuth();

  const handleLogin = () => {
    const pass = prompt("Enter admin password:");
    if (pass) {
      if (!login(pass)) {
        alert("Incorrect password");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-xl font-semibold">Checklist Admin</h1>
          <div className="flex gap-4 mt-2">
            <Link
              href="/checklists"
              className="text-xs text-gray-400 hover:text-blue-600 font-medium"
            >
              All Checklists
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="text-xs text-red-500 hover:underline font-medium"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
            >
              Admin Login
            </button>
          )}
          <div className="h-4 w-[1px] bg-gray-200 mx-1" />
          {isLoggedIn && (
            <>
              <Link
                href="/create-user"
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200 transition-colors font-medium"
              >
                + User
              </Link>
              <Link
                href="/create"
                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200 transition-colors font-medium"
              >
                + Checklist
              </Link>
            </>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          Active Users
        </h2>
        <UserList />
      </section>
    </div>
  );
}
