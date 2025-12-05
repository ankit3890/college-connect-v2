"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
    _id: string;
    name: string;
    username?: string;
    studentId: string;
    avatarUrl?: string;
    role?: string;
}

export default function UserSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
                    const data = await res.json();
                    setResults(data.users || []);
                    setShowDropdown(true);
                } catch (error) {
                    console.error("Search failed", error);
                    setResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        // Log Search Activity
        try {
            await fetch("/api/log/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "SEARCH_PROFILE",
                    details: `Searched for ${query.trim()}`
                })
            });
        } catch (err) {
            // ignore
        }

        // Redirect to the profile page of the searched user
        router.push(`/u/${query.trim()}`);
        setShowDropdown(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border-2 border-black dark:border-slate-700 relative" ref={searchRef}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Friends
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2 relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!showDropdown && e.target.value.trim().length >= 2) setShowDropdown(true);
                    }}
                    onFocus={() => {
                        if (query.trim().length >= 2) setShowDropdown(true);
                    }}
                    placeholder="Enter Username or Student ID..."
                    className="flex-1 px-3 py-2 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                />
                <button
                    type="submit"
                    disabled={!query.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Search
                </button>
            </form>

            {/* Dropdown Results */}
            {showDropdown && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden z-50 mx-4">
                    {isSearching ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
                    ) : results.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                            {results.map((user) => (
                                <Link
                                    key={user._id}
                                    href={`/u/${user.username || user.studentId}`}
                                    onClick={() => setShowDropdown(false)}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username || user.studentId}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : query.trim().length >= 2 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">No users found</div>
                    ) : null}
                </div>
            )}

            <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">Search for other students to view their profile and connect.</p>
                <button
                    type="button"
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + "/register");
                        alert("Registration link copied to clipboard!");
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                >
                    Invite Friend
                </button>
            </div>
        </div>
    );
}
