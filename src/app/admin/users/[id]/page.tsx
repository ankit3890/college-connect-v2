// src/app/admin/users/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface AdminUser {
  _id: string;
  studentId: string;
  name?: string;
  email?: string;
  username?: string;
  role?: "student" | "admin" | "superadmin";
  isBanned?: boolean;
  bannedReason?: string | null;
  bannedUntil?: string | null;
  lastActiveAt?: string;
  branch?: string;
  year?: number;
  mobileNumber?: string;
  createdAt?: string;
  profilePhoto?: string;
}

export default function AdminUserProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // ✅ don't call API until we have a real id
    if (!id || id === "undefined") {
      setMsg("Invalid user id in URL");
      setLoading(false);
      return;
    }

    async function loadUser() {
      setLoading(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setMsg(data.msg || "Failed to load user");
          setUser(null);
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error(err);
        setMsg("Failed to load user");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-xs mb-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline"
        >
          ← Back to admin dashboard
        </button>

        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          User Profile (admin view)
        </h1>

        {loading && <p className="text-sm text-slate-600 dark:text-slate-400">Loading…</p>}

        {msg && !loading && (
          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {msg}
          </div>
        )}

        {!loading && !msg && !user && (
          <p className="text-sm text-slate-600 dark:text-slate-400">User not found.</p>
        )}

        {user && (
          <section className="rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 shadow-sm space-y-4">
            <div className="flex gap-3 items-center">
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {user.name || "No name"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  CyberVidya ID: <span className="font-mono">{user.studentId}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Username: {user.username ? `@${user.username}` : "Not set"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-900 dark:text-slate-200">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p>{user.email || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mobile</p>
                <p>{user.mobileNumber || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Branch</p>
                <p>{user.branch || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Year</p>
                <p>{user.year ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                <p>{user.role || "student"}</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
