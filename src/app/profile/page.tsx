// src/app/profile/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import Navbar from "@/components/Navbar";

interface User {
    _id?: string;
    studentId: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    branch?: string;
    year?: number;
    cyberUserName?: string;
    mobileNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    role?: string;
    profilePhoto?: string;
    hasSyncedFromCyberVidya?: boolean;
    username?: string;
    // NEW
    hideContacts?: boolean;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [cyberId, setCyberId] = useState("");
    const [cyberPass, setCyberPass] = useState("");

    const [syncLoading, setSyncLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [showUploadButton, setShowUploadButton] = useState(false);

    const [usernameInput, setUsernameInput] = useState("");
    const [usernameLoading, setUsernameLoading] = useState(false);

    // edit profile state
    const [editMode, setEditMode] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [mobileInput, setMobileInput] = useState("");
    // NEW – single toggle for hiding both email & mobile
    const [hideContacts, setHideContacts] = useState(false);

    // show/hide small re-sync form when already synced
    const [showReSyncForm, setShowReSyncForm] = useState(false);

    // --- NEW: Popup Auth Logic ---
    function handleConnectCyberVidya() {
        // 1. Open Attendance page in new tab
        const width = 1000;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        window.open(
            "/attendance", 
            "CyberVidyaLogin", 
            `width=${width},height=${height},top=${top},left=${left},resizable,scrollbars`
        );
        
        setSyncLoading(true);
        setMessage("Waiting for login in the new window...");
        
        // 2. Poll for token in localStorage
        const interval = setInterval(() => {
            const token = localStorage.getItem("att_token");
            const uid = localStorage.getItem("att_uid");
            const authPref = localStorage.getItem("att_authPref");
            
            if (token && uid) {
                // Login detected!
                clearInterval(interval);
                setMessage("Login detected! Syncing profile...");
                
                // 3. Trigger Sync
                handleSync(new Event('submit') as any, { 
                    token, 
                    uid: Number(uid), 
                    authPref: authPref || "" 
                });
            }
        }, 1000);
        
        // Timeout after 2 minutes
        setTimeout(() => {
            clearInterval(interval);
            if (syncLoading) {
                 setSyncLoading(false);
                 setMessage("Login timed out. Please try again.");
            }
        }, 120000);
    }

    function extractUser(data: any): User | null {
        if (!data) return null;
        if (data.user) return data.user as User;
        return data as User;
    }

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/user/me");
                const raw = await res.json();
                console.log("/api/user/me response:", raw);

                if (res.ok) {
                    const u = extractUser(raw);
                    if (u) {
                        setUser(u);
                        if (u.username) setUsernameInput(u.username);
                        setEmailInput(u.email || "");
                        setMobileInput(u.mobileNumber || "");
                        setHideContacts(u.hideContacts ?? false);
                    } else {
                        setMessage("User not found in response");
                    }
                } else {
                    setMessage(raw.msg || "Failed to load user");
                }
            } catch (err) {
                console.error(err);
                setMessage("Error loading user");
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    async function reloadUserFromServer() {
        try {
            const res = await fetch("/api/user/me");
            const raw = await res.json();
            console.log("reload /api/user/me:", raw);

            if (res.ok) {
                const u = extractUser(raw);
                if (u) {
                    setUser(u);
                    if (u.username) setUsernameInput(u.username);
                    setEmailInput(u.email || "");
                    setMobileInput(u.mobileNumber || "");
                    setHideContacts(u.hideContacts ?? false);
                }
            } else {
                setMessage(raw.msg || "Failed to reload user");
            }
        } catch (err) {
            console.error(err);
            setMessage("Error reloading user");
        }
    }

    async function handleUpload(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const input = document.getElementById("photoInput") as HTMLInputElement | null;
        if (!input || !input.files || !input.files[0]) {
            alert("Please select an image");
            return;
        }

        const formData = new FormData();
        formData.append("photo", input.files[0]);

        try {
            const res = await fetch("/api/user/upload-photo", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.msg || "Upload failed");
                return;
            }

            setMessage("Profile photo updated");

            if (data.user) {
                setUser(data.user as User);
            } else {
                await reloadUserFromServer();
            }

            setShowUploadButton(false);
            input.value = "";
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        }
    }

    async function handleUsernameSubmit(e: FormEvent) {
        e.preventDefault();
        if (!usernameInput.trim()) {
            alert("Please enter a username");
            return;
        }

        setUsernameLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/user/username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: usernameInput }),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage(data.msg || "Failed to set username");
                return;
            }

            setMessage(data.msg || "Username set successfully");
            await reloadUserFromServer();
        } catch (err) {
            console.error(err);
            setMessage("Failed to set username");
        } finally {
            setUsernameLoading(false);
        }
    }

    async function handleSync(e: FormEvent, providedSession?: { token: string, uid: number, authPref: string }) {
        if (e && e.preventDefault) e.preventDefault();
        setMessage(null);
        
        let body: any = { cyberId, cyberPass };
        
        if (providedSession) {
             body = providedSession;
        } else {
            const token = localStorage.getItem("att_token"); 
            const uidStr = localStorage.getItem("att_uid");
            const authPref = localStorage.getItem("att_authPref"); 
            
            if (token && uidStr) {
                 body = { token, uid: Number(uidStr), authPref };
            }
        }

        setSyncLoading(true);

        try {
            const res = await fetch("/api/sync/cybervidya", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const raw = await res.json();
            console.log("/api/sync/cybervidya response:", raw);

            if (!res.ok) {
                setMessage(raw.msg || "Sync failed. Try connecting via the popup.");
                return;
            }

            setMessage(raw.msg || "Synced from CyberVidya");

            if (raw.user) {
                setUser(raw.user as User);
            }
            
            await reloadUserFromServer();
            setShowReSyncForm(false); 
        } catch (err) {
            console.error(err);
            setMessage("Sync request failed");
        } finally {
            setSyncLoading(false);
        }
    }

    // save email + mobile + hideContacts
    async function handleProfileSave(e: FormEvent) {
        e.preventDefault();
        setMessage(null);

        try {
            const res = await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput,
                    mobileNumber: mobileInput,
                    hideContacts, 
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage(data.msg || "Failed to update profile");
                return;
            }

            setMessage(data.msg || "Profile updated successfully");
            if (data.user) {
                const u = data.user as User;
                setUser(u);
                setHideContacts(u.hideContacts ?? hideContacts);
            } else {
                await reloadUserFromServer();
            }

            setEditMode(false);
        } catch (err) {
            console.error(err);
            setMessage("Failed to update profile");
        }
    }

    function handleEditCancel() {
        if (user) {
            setEmailInput(user.email || "");
            setMobileInput(user.mobileNumber || "");
            setHideContacts(user.hideContacts ?? false);
        }
        setEditMode(false);
        setShowUploadButton(false);
        const input = document.getElementById("photoInput") as HTMLInputElement | null;
        if (input) input.value = "";
    }

    function handleChangePassword() {
        window.location.href = "/profile/change-password";
    }

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            document.cookie = "token=; Max-Age=0; path=/";
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            window.location.href = "/";
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 py-10">
                    <p className="text-sm text-slate-700">Loading profile…</p>
                </main>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-100">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 py-10">
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {message || "Not logged in. Please go to /login."}
                    </p>
                </main>
            </div>
        );
    }

    const displayName =
        user.name ||
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        "Not set";

    // role badge styling
    let roleBadgeLabel: string | null = null;
    let roleBadgeClass =
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium";

    if (user.role === "superadmin") {
        roleBadgeLabel = "Super Admin";
        roleBadgeClass += " bg-purple-50 border-purple-300 text-purple-800";
    } else if (user.role === "admin") {
        roleBadgeLabel = "Admin";
        roleBadgeClass += " bg-blue-50 border-blue-300 text-blue-800";
    } else {
        roleBadgeLabel = "Student";
        roleBadgeClass += " bg-emerald-50 border-emerald-300 text-emerald-800";
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {/* heading */}
                <header className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Profile</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Manage your CollegeConnect account and sync with CyberVidya.
                    </p>
                    {user?.username && (
                        <a href={`/u/${user.username}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors">
                            View New Public Profile &rarr;
                        </a>
                    )}
                </header>

                {/* global message */}
                {message && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        {message}
                    </div>
                )}

                {/* TOP CARD: avatar + quick info */}
                <section className="rounded-xl border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                        {/* avatar */}
                        <div className="flex items-center gap-3">
                            {user.profilePhoto ? (
                                <img
                                    src={user.profilePhoto}
                                    alt="Profile photo"
                                    className="h-16 w-16 rounded-full border object-cover"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-full border bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                                    No photo
                                </div>
                            )}
                        </div>

                        {/* main info */}
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {displayName}
                                </p>
                                {roleBadgeLabel && (
                                    <span className={roleBadgeClass}>{roleBadgeLabel}</span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-[2px]">
                                    ID: <span className="font-mono">{user.studentId}</span>
                                </span>
                                {user.branch && (
                                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-[2px]">
                                        {user.branch}
                                    </span>
                                )}
                                {user.year != null && (
                                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-[2px]">
                                        Year {user.year}
                                    </span>
                                )}
                                {user.gender && (
                                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-[2px]">
                                        {user.gender}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* edit / change photo controls */}
                        <div className="flex flex-col gap-2">
                            {!editMode ? (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="rounded-md bg-slate-900 dark:bg-black px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-900"
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleEditCancel}
                                    className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                            )}

                            {editMode && (
                                <form
                                    onSubmit={handleUpload}
                                    className="flex flex-wrap gap-2 text-xs sm:text-sm"
                                >
                                    <input
                                        id="photoInput"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setShowUploadButton(true);
                                            } else {
                                                setShowUploadButton(false);
                                            }
                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            document.getElementById("photoInput")?.click()
                                        }
                                        className="rounded-md bg-slate-100 px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-200"
                                    >
                                        Change Photo
                                    </button>

                                    {showUploadButton && (
                                        <button
                                            type="submit"
                                            className="rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700"
                                        >
                                            Upload
                                        </button>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                </section>

                {/* DETAILS + EDITABLE FIELDS */}
                <section className="rounded-xl border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 shadow-lg">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Account details
                    </h2>

                    <form
                        onSubmit={handleProfileSave}
                        className="space-y-3 text-sm text-slate-800 dark:text-slate-200"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
                                <p>{displayName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Cybervidya ID</p>
                                <p className="font-mono">{user.studentId}</p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Username</p>
                                <p>{user.username ? `@${user.username}` : "Not set"}</p>
                            </div>
                             {/* REMOVED: Credential inputs */}
                        </div>

                         {/* REMOVED: Sync button (we use the other section for sync) */}
                         {/* We only keep the Save button for profile details if edit mode is on? 
                            Wait, handleProfileSave saves mobile/email which were separate inputs.
                            In my previous read, emailInput also seemed missing from the form!
                         */}
                    </form>
                    
                     {/* Username setup (only if not set yet) */}
                    {!user.username && (
                        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
                            <h3 className="text-sm font-semibold mb-1 text-slate-900 dark:text-white">
                                Set your unique username (for chat)
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                You can set this only once. Use 3–20 characters: lowercase
                                letters, numbers, "." or "_".
                            </p>
                            <form
                                onSubmit={handleUsernameSubmit}
                                className="flex flex-col sm:flex-row gap-2 max-w-sm"
                            >
                                <input
                                    className="border rounded-md px-2 py-1 text-sm flex-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                                    value={usernameInput}
                                    onChange={(e) =>
                                        setUsernameInput(e.target.value.toLowerCase())
                                    }
                                    placeholder="e.g. ankit_2006"
                                />
                                <button
                                    type="submit"
                                    disabled={usernameLoading}
                                    className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-purple-700"
                                >
                                    {usernameLoading ? "Saving…" : "Save Username"}
                                </button>
                            </form>
                        </div>
                    )}
                </section>

                {/* Synced + Re-sync */}
                {user.hasSyncedFromCyberVidya && (
                    <>
                        <section className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 px-4 py-3 flex items-center justify-between text-sm text-emerald-800 dark:text-emerald-200">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span>Profile is synced with CyberVidya ✅</span>
                                {user.cyberUserName && (
                                    <span className="text-xs">
                                        Linked ID:{" "}
                                        <span className="font-mono">{user.cyberUserName}</span>
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setShowReSyncForm((v) => !v)}
                                disabled={syncLoading}
                                className="ml-3 rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {showReSyncForm
                                    ? "Close"
                                    : syncLoading
                                        ? "Re-syncing…"
                                        : "Re-sync"}
                            </button>
                        </section>

                        {showReSyncForm && (
                            <section className="rounded-xl border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 shadow-lg space-y-3">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Re-sync from CyberVidya</h2>
                                <div className="text-center py-2">
                                     <p className="text-xs text-slate-500 mb-3">
                                        Connect to verify your identity directly with CyberVidya.
                                     </p>
                                     <button
                                        onClick={handleConnectCyberVidya}
                                        type="button"
                                        disabled={syncLoading}
                                        className="w-full rounded-md bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-bold disabled:opacity-50"
                                     >
                                        {syncLoading ? "Connecting..." : "Connect to CyberVidya"}
                                     </button>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* First-time sync */}
                {!user.hasSyncedFromCyberVidya && (
                    <section className="rounded-xl border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 shadow-lg space-y-3">
                        <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
                            Sync from CyberVidya
                        </h2>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Connect to CyberVidya to verify your identity and pull official details.
                        </p>

                         <div className="py-2">
                             <button
                                onClick={handleConnectCyberVidya}
                                type="button"
                                disabled={syncLoading}
                                className="w-full sm:max-w-md rounded-md bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-3 text-sm font-bold disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                             >
                                {syncLoading ? "Connecting..." : "Connect to CyberVidya"}
                             </button>
                         </div>
                    </section>
                )}

                {/* bottom buttons */}
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                    <button
                        onClick={handleChangePassword}
                        className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-6 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        Change Password
                    </button>
                    <button
                        onClick={handleLogout}
                        className="rounded-md bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>
            </main>
        </div >
    );
}
