"use client";

import Navbar from "@/components/Navbar";
import FeedbackForm from "@/components/FeedbackForm";

export default function FeedbackPage() {
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center border-2 border-black dark:border-slate-700">
                            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Share Your Feedback</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        We value your input! Help us improve by sharing feature requests, suggestions for improvements, or even proposing a name for our platform.
                    </p>
                </div>

                {/* Feedback Form Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border-2 border-black dark:border-slate-700">
                    <FeedbackForm />
                </div>

                {/* Info Section */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-semibold mb-1">Your feedback matters!</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>All feedback is reviewed by our team</li>
                                <li>We'll consider your suggestions for future updates</li>
                                <li>Your input helps shape the platform</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
