"use client";

import { useState } from "react";

export default function FeedbackForm() {
    const [type, setType] = useState<"feature" | "improvement" | "name_suggestion">("feature");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            setError("Please enter your feedback");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, message }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setMessage("");
                setTimeout(() => setSuccess(false), 5000);
            } else {
                setError(data.error || "Failed to submit feedback");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type Selector */}
            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Feedback Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setType("feature")}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${type === "feature"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                    >
                        ✨ Feature Request
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("improvement")}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${type === "improvement"
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                    >
                        🔧 Improvement
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("name_suggestion")}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${type === "name_suggestion"
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                    >
                        💡 Name Idea
                    </button>
                </div>
            </div>

            {/* Message Input */}
            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Your Feedback
                </label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                        type === "feature"
                            ? "Describe the feature you'd like to see..."
                            : type === "improvement"
                                ? "How can we improve the platform?"
                                : "Suggest a name for our platform..."
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors resize-none"
                    rows={4}
                    maxLength={1000}
                    disabled={loading}
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                    {message.length}/1000
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        ✓ Thank you! Your feedback has been submitted successfully.
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors disabled:cursor-not-allowed text-sm"
            >
                {loading ? "Submitting..." : "Submit Feedback"}
            </button>
        </form>
    );
}
