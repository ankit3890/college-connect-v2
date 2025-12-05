"use client";

import Navbar from "@/components/Navbar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border-2 border-black p-6 space-y-6">
                    {/* Appearance Section */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            Appearance
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                onClick={() => setTheme("light")}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === "light" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
                            >
                                <div className="w-full aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Light</span>
                            </button>

                            <button
                                onClick={() => setTheme("dark")}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === "dark" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
                            >
                                <div className="w-full aspect-video bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                </div>
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Dark</span>
                            </button>

                            <button
                                onClick={() => setTheme("system")}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === "system" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
                            >
                                <div className="w-full aspect-video bg-gradient-to-r from-slate-100 to-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-400 mix-blend-difference" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">System</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
