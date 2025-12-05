"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<"system" | "user">("system");

  // System Logs State
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [systemLoading, setSystemLoading] = useState(true);

  // User Logs State
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userStats, setUserStats] = useState<any>({ uniqueVisitors: 0, newVisitors: 0, returningVisitorLogs: 0 });
  const [userLogTotalPages, setUserLogTotalPages] = useState(1);
  const [userLogPage, setUserLogPage] = useState(1);

  // Filters
  const [userLogSearch, setUserLogSearch] = useState("");
  const [userLogDate, setUserLogDate] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (activeTab === "system") {
      fetchSystemLogs();
    } else {
      fetchUserLogs();
    }
  }, [activeTab, userLogPage, userLogSearch, userLogDate, category]);

  async function fetchUserLogs() {
    setUserLoading(true);
    try {
      const params = new URLSearchParams({
        page: userLogPage.toString(),
        limit: "20",
        category: category
      });
      if (userLogSearch) params.append("search", userLogSearch);
      if (userLogDate) params.append("date", userLogDate);

      const res = await fetch(`/api/admin/user-logs?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUserLogs(data.logs || []);
        setUserStats(data.stats || { uniqueVisitors: 0, newVisitors: 0, returningVisitorLogs: 0 });
        setUserLogTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch user logs:", err);
    } finally {
      setUserLoading(false);
    }
  }

  async function fetchSystemLogs() {
    setSystemLoading(true);
    try {
      const res = await fetch("/api/admin/logs?limit=100");
      const data = await res.json();
      if (res.ok) {
        setSystemLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch system logs:", err);
    } finally {
      setSystemLoading(false);
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes("BAN")) return "text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800";
    if (action.includes("UPDATE")) return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-800";
    if (action === "USER_LOGIN") return "text-green-600 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-800";
    if (action === "USER_LOGOUT") return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800";
    return "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-700 dark:border-slate-600";
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">System Logs</h1>
          <p className="text-slate-600 dark:text-slate-400">Monitor system activity and user interactions</p>
        </div>

        {/* Main Tabs */}
        <div className="flex justify-center mb-4">
          <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 inline-flex">
            <button
              onClick={() => setActiveTab("system")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === "system"
                ? "bg-slate-900 dark:bg-slate-700 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              System Logs
            </button>
            <button
              onClick={() => setActiveTab("user")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === "user"
                ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              User Activity
            </button>
          </div>
        </div>

        {activeTab === "user" ? (
          <div className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border-2 border-black dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Unique Visitors</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{userStats.uniqueVisitors}</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border-2 border-black dark:border-slate-700">
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider mb-1">New Visitors</div>
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-500">{userStats.newVisitors}</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border-2 border-black dark:border-slate-700">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider mb-1">Returning Visitor Logs</div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-500">{userStats.returningVisitorLogs}</div>
              </div>
            </div>

            {/* Filters & Categories */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border-2 border-black dark:border-slate-700 space-y-4">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
                {[
                  { id: "all", label: "All Activity" },
                  { id: "auth", label: "Login/Logout" },
                  { id: "attendance", label: "Attendance" },
                  { id: "syllabus", label: "Syllabus" },
                  { id: "profile", label: "Profile" },
                  { id: "follow", label: "Follows" },
                  { id: "view_profile", label: "Views" },
                  { id: "search_profile", label: "Searches" },
                  { id: "settings", label: "Settings" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat.id
                      ? "bg-slate-900 dark:bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={userLogSearch}
                    onChange={(e) => setUserLogSearch(e.target.value)}
                    placeholder="Search Student ID, Name, or IP..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="date"
                  value={userLogDate}
                  onChange={(e) => setUserLogDate(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* User Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border-2 border-black dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">User / IP</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Visitor Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {userLoading ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Loading activity...</td></tr>
                    ) : userLogs.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No activity found</td></tr>
                    ) : (
                      userLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{log.name || log.studentId || "Guest"}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{log.ipAddress}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{log.details}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.isNewVisitor ? (
                              <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">New</span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">Returning</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* SYSTEM LOGS VIEW */
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border-2 border-black dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Actor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {systemLoading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Loading logs...</td></tr>
                  ) : systemLogs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No logs found</td></tr>
                  ) : (
                    systemLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4"><span className="text-sm text-slate-900 dark:text-white">{log.details}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{log.actorId?.name || log.actorStudentId || "System"}</div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${log.actorRole === "superadmin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
                            log.actorRole === "admin" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            }`}>
                            {log.actorRole === "superadmin" ? "Super Admin" : log.actorRole === "admin" ? "Admin" : "Student"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-slate-900 dark:text-white">{log.targetStudentId || "-"}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-slate-500 dark:text-slate-400">{new Date(log.createdAt).toLocaleString()}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
