"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Feedback {
    _id: string;
    userId?: {
        name?: string;
        studentId?: string;
        email?: string;
    };
    ipAddress?: string;
    type: "feature" | "improvement" | "name_suggestion";
    message: string;
    status: "pending" | "reviewed" | "implemented";
    createdAt: string;
}

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const res = await fetch("/api/admin/feedback");
            if (res.ok) {
                const data = await res.json();
                setFeedbacks(data.feedbacks);
            }
        } catch (error) {
            console.error("Failed to fetch feedbacks:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (feedbackId: string, status: string) => {
        try {
            const res = await fetch("/api/admin/feedback", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedbackId, status }),
            });

            if (res.ok) {
                fetchFeedbacks();
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const filteredFeedbacks = feedbacks.filter((fb) => {
        const statusMatch = filter === "all" || fb.status === filter;
        const typeMatch = typeFilter === "all" || fb.type === typeFilter;
        return statusMatch && typeMatch;
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case "feature":
                return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
            case "improvement":
                return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
            case "name_suggestion":
                return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
            default:
                return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
            case "reviewed":
                return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
            case "implemented":
                return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
            default:
                return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Feedback Management</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            View and manage user feedback submissions
                        </p>
                    </div>
                    <Link
                        href="/admin"
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                    >
                        ← Back to Admin
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 mb-6 border-2 border-black dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Filter by Status
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {["all", "pending", "reviewed", "implemented"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${filter === status
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Filter by Type
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {["all", "feature", "improvement", "name_suggestion"].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${typeFilter === type
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                                            }`}
                                    >
                                        {type === "name_suggestion" ? "Name Idea" : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border-2 border-black dark:border-slate-700">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{feedbacks.length}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Total Feedback</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border-2 border-black dark:border-slate-700">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {feedbacks.filter((f) => f.status === "pending").length}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Pending</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border-2 border-black dark:border-slate-700">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {feedbacks.filter((f) => f.status === "reviewed").length}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Reviewed</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border-2 border-black dark:border-slate-700">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {feedbacks.filter((f) => f.status === "implemented").length}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Implemented</div>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading feedback...</div>
                    ) : filteredFeedbacks.length === 0 ? (
                        <div className="text-center py-12 text-slate-600 dark:text-slate-400">No feedback found</div>
                    ) : (
                        filteredFeedbacks.map((feedback) => (
                            <div
                                key={feedback._id}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 border-2 border-black dark:border-slate-700"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Header */}
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getTypeColor(feedback.type)}`}>
                                                {feedback.type === "name_suggestion" ? "Name Idea" : feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}
                                            </span>
                                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(feedback.status)}`}>
                                                {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(feedback.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Message */}
                                        <p className="text-sm text-slate-900 dark:text-white mb-3 whitespace-pre-wrap">{feedback.message}</p>

                                        {/* User Info */}
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            {feedback.userId ? (
                                                <span>
                                                    👤 {feedback.userId.name || "Unknown"} ({feedback.userId.studentId || "N/A"})
                                                </span>
                                            ) : (
                                                <span>🌐 Anonymous (IP: {feedback.ipAddress || "Unknown"})</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <select
                                            value={feedback.status}
                                            onChange={(e) => updateStatus(feedback._id, e.target.value)}
                                            className="px-3 py-1 text-xs border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="implemented">Implemented</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
