"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import UserSearch from "@/components/UserSearch";

export default function DashboardPage() {
  const logActivity = async (action: string, details: string) => {
    try {
      await fetch("/api/log/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, details }),
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Welcome to CollegeConnect
          </p>
        </div>

        {/* User Search */}
        <div className="mb-4">
          <UserSearch />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Attendance Card */}
          <Link
            href="/attendance"
            onClick={() => logActivity("ACCESS_ATTENDANCE", "Accessed Attendance")}
            className="group bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 border-2 border-black hover:border-blue-500"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                  Attendance
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  View your attendance records
                </p>
              </div>
            </div>
          </Link>

          {/* Syllabus Card */}
          <Link
            href="/syllabus/search"
            onClick={() => logActivity("ACCESS_SYLLABUS", "Accessed Syllabus")}
            className="group bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 border-2 border-black hover:border-emerald-500"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                  Syllabus
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Search course syllabi
                </p>
              </div>
            </div>
          </Link>

          {/* Profile Card */}
          <Link
            href="/profile"
            onClick={() => logActivity("ACCESS_PROFILE", "Accessed Profile")}
            className="group bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 border-2 border-black hover:border-purple-500"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                  Profile
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Manage your account
                </p>
              </div>
            </div>
          </Link>

          {/* Settings Card */}
          <Link
            href="/settings"
            onClick={() => logActivity("ACCESS_SETTINGS", "Accessed Settings")}
            className="group bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 border-2 border-black hover:border-slate-500"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900 mb-1 group-hover:text-slate-600 transition-colors">
                  Settings
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  App preferences
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
