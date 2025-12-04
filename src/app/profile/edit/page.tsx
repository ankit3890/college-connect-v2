"use client";

import { useEffect, useState, FormEvent } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

interface Profile {
    _id: string;
    name?: string;
    displayName?: string;
    username?: string;
    branch?: string;
    year?: number;
    gender?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    accentColor?: string;
    bio?: string;
    statusText?: string;
    interests?: string[];
    skills?: string[];
    socials?: {
        github?: string;
        linkedin?: string;
        website?: string;
        instagram?: string;
        twitter?: string;
    };
    mobileNumber?: string;
    isPublicProfile?: boolean;
    showBranchYear?: boolean;
    hasSyncedFromCyberVidya?: boolean;
    cyberUserName?: string; // Added for sync info
    studentId?: string;
    email?: string;
}

export default function EditProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Sync State
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [cyberId, setCyberId] = useState("");
    const [cyberPass, setCyberPass] = useState("");
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        displayName: "",
        username: "",
        bio: "",
        statusText: "",
        mobileNumber: "",
        accentColor: "#3b82f6",
        interests: "", // comma separated
        skills: "", // comma separated
        github: "",
        linkedin: "",
        website: "",
        instagram: "",
        twitter: "",
        isPublicProfile: true,
        showBranchYear: true,
    });

    useEffect(() => {
        fetch("/api/profile/me?t=" + Date.now(), { cache: "no-store" })
            .then(async (res) => {
                if (res.status === 401) {
                    router.push("/login");
                    throw new Error("Not logged in");
                }
                if (!res.ok) throw new Error("Failed to load profile");
                return res.json();
            })
            .then((data) => {
                const p = data.profile;
                setProfile(p);
                setFormData({
                    displayName: p.displayName || "",
                    username: p.username || "",
                    bio: p.bio || "",
                    statusText: p.statusText || "",
                    mobileNumber: p.mobileNumber || "",
                    accentColor: p.accentColor || "#3b82f6",
                    interests: p.interests?.join(", ") || "",
                    skills: p.skills?.join(", ") || "",
                    github: p.socials?.github || "",
                    linkedin: p.socials?.linkedin || "",
                    website: p.socials?.website || "",
                    instagram: p.socials?.instagram || "",
                    twitter: p.socials?.twitter || "",
                    isPublicProfile: p.isPublicProfile ?? true,
                    showBranchYear: p.showBranchYear ?? true,
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                // Only set loading false if not redirected
                if (err.message !== "Not logged in") setLoading(false);
            });
    }, [router]);

    const handleFileUpload = async (type: "avatar" | "banner", file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/api/profile/${type}`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.msg || "Upload failed");

            // Update local state
            setProfile((prev) => prev ? { ...prev, [`${type}Url`]: data[`${type}Url`] } : null);
            setMessage({ type: "success", text: `${type === "avatar" ? "Avatar" : "Banner"} updated successfully!` });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        }
    };

    const handleRemoveFile = async (type: "avatar" | "banner") => {
        if (!confirm(`Are you sure you want to remove your ${type}?`)) return;

        try {
            const res = await fetch(`/api/profile/${type}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.msg || "Removal failed");

            // Update local state
            setProfile((prev) => prev ? { ...prev, [`${type}Url`]: "" } : null);
            setMessage({ type: "success", text: `${type === "avatar" ? "Avatar" : "Banner"} removed successfully!` });
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const payload = {
                displayName: formData.displayName,
                username: formData.username,
                bio: formData.bio,
                statusText: formData.statusText,
                mobileNumber: formData.mobileNumber,
                accentColor: formData.accentColor,
                interests: formData.interests.split(",").map(s => s.trim()).filter(Boolean),
                skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
                socials: {
                    github: formData.github,
                    linkedin: formData.linkedin,
                    website: formData.website,
                    instagram: formData.instagram,
                    twitter: formData.twitter,
                },
                isPublicProfile: formData.isPublicProfile,
                showBranchYear: formData.showBranchYear,
            };

            const res = await fetch("/api/profile/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || "Update failed");

            setMessage({ type: "success", text: "Profile updated successfully!" });

        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    // Sync Handler
    async function handleSync(e: FormEvent) {
        e.preventDefault();
        setSyncMessage(null);
        setSyncLoading(true);

        try {
            const res = await fetch("/api/sync/cybervidya", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cyberId, cyberPass }),
            });

            const raw = await res.json();

            if (!res.ok) {
                setSyncMessage(raw.msg || "Sync failed");
                return;
            }

            setSyncMessage("Synced successfully! Reloading...");

            // Reload page to fetch fresh data
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            console.error(err);
            setSyncMessage("Sync request failed");
        } finally {
            setSyncLoading(false);
        }
    }

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            // Clear client-side storage if any
            document.cookie = "token=; Max-Age=0; path=/";
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            window.location.href = "/";
        } catch (err) {
            console.error("Logout failed:", err);
            window.location.href = "/";
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 pb-12">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
                    <button
                        onClick={() => router.push(`/u/${profile?.username}`)}
                        className="text-sm font-bold text-blue-600 hover:underline"
                    >
                        View Public Profile
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl border-2 ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {message.text}
                    </div>
                )}



                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Images & Locked Info */}
                    <div className="space-y-6">
                        {/* Banner & Avatar Upload */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-black overflow-hidden">
                            <div
                                className="h-32 bg-slate-100 relative group bg-cover bg-center"
                                style={{
                                    backgroundColor: formData.accentColor || "#3b82f6",
                                    backgroundImage: profile?.bannerUrl ? `url(${profile.bannerUrl})` : undefined
                                }}
                            >
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <label className="cursor-pointer">
                                            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm hover:bg-black/70 transition-colors">Change</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload("banner", e.target.files[0])} />
                                        </label>
                                        {profile?.bannerUrl && (
                                            <button
                                                onClick={() => handleRemoveFile("banner")}
                                                className="text-white text-xs font-bold bg-red-600/80 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm hover:bg-red-700 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 pb-4 relative">
                                <div className="absolute -top-12 left-4 w-24 h-24 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden group z-10">
                                    {profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                                            style={{ backgroundColor: formData.accentColor || "#3b82f6" }}
                                        >
                                            {(profile?.displayName || profile?.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full gap-1">
                                        <label className="cursor-pointer">
                                            <span className="text-white text-[10px] font-bold bg-black/50 px-2 py-1 rounded hover:bg-black/70 transition-colors">Change</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload("avatar", e.target.files[0])} />
                                        </label>
                                        {profile?.avatarUrl && (
                                            <button
                                                onClick={() => handleRemoveFile("avatar")}
                                                className="text-white text-[10px] font-bold bg-red-600/80 px-2 py-1 rounded hover:bg-red-700 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <br></br>
                                <div className="mt-16">
                                    <p className="text-lg font-bold text-slate-900 break-words">{profile?.name}</p>
                                    <p className="text-sm text-slate-500 break-all">@{profile?.username}</p>
                                </div>
                            </div>
                        </div>

                        {/* College Details (Locked) */}
                        <div className="bg-white rounded-xl shadow-lg border-2 border-black p-5">
                            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold border-b border-slate-100 pb-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                <h3 className="text-sm">College Details (Locked)</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1 font-bold">Official Name</label>
                                    <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-slate-500 cursor-not-allowed select-none">{profile?.name}</div>
                                </div>
                                <div className="border-b border-slate-300 my-2"></div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1 font-bold">CyberVidya ID</label>
                                    <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-slate-500 cursor-not-allowed select-none font-mono">{profile?.studentId || "N/A"}</div>
                                </div>
                                <div className="border-b border-slate-300 my-2"></div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1 font-bold">College Email</label>
                                    <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-slate-500 cursor-not-allowed select-none break-all">{profile?.email || "N/A"}</div>
                                </div>
                                <div className="border-b border-slate-300 my-2"></div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1 font-bold">Branch</label>
                                    <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-slate-500 cursor-not-allowed select-none">{profile?.branch}</div>
                                </div>
                                <div className="border-b border-slate-300 my-2"></div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1 font-bold">Year</label>
                                    <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-slate-500 cursor-not-allowed select-none">{profile?.year}</div>
                                </div>

                                {/* Sync Button */}
                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowSyncModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Sync with CyberVidya
                                    </button>
                                    <p className="text-[10px] text-slate-400 text-center mt-1">
                                        {profile?.hasSyncedFromCyberVidya
                                            ? `Last synced. Linked ID: ${profile.cyberUserName || 'Unknown'}`
                                            : "Update your college data"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Account Actions Removed - Moved to Public Profile */}




                    </div>

                    {/* RIGHT COLUMN: Edit Form */}
                    < div className="lg:col-span-2" >
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border-2 border-black p-6 space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Basic Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Display Name REMOVED as per request */}

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            readOnly={!!profile?.username}
                                            className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${profile?.username ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" : "bg-white border-slate-300 text-slate-900 focus:border-black"}`}
                                            placeholder="Choose a unique username"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            {profile?.username ? "Username cannot be changed." : "Choose wisely! You can only set this once."}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Status Text</label>
                                        <input
                                            type="text"
                                            value={formData.statusText}
                                            onChange={(e) => setFormData({ ...formData, statusText: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="What's on your mind?"
                                            maxLength={80}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Bio</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="Tell us about yourself..."
                                            maxLength={280}
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-200" />

                            {/* Contact & Socials */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Contact & Socials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Number</label>
                                        <input
                                            type="text"
                                            value={formData.mobileNumber}
                                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Website</label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="https://"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">GitHub</label>
                                        <input
                                            type="url"
                                            value={formData.github}
                                            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="GitHub Profile URL"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">LinkedIn</label>
                                        <input
                                            type="url"
                                            value={formData.linkedin}
                                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="LinkedIn Profile URL"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Twitter (X)</label>
                                        <input
                                            type="url"
                                            value={formData.twitter}
                                            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="Twitter Profile URL"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Instagram</label>
                                        <input
                                            type="url"
                                            value={formData.instagram}
                                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="Instagram Profile URL"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-200" />

                            {/* Interests & Skills */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Interests & Skills</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Interests (comma separated)</label>
                                        <input
                                            type="text"
                                            value={formData.interests}
                                            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="Coding, Music, Travel..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Skills (comma separated)</label>
                                        <input
                                            type="text"
                                            value={formData.skills}
                                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-black focus:outline-none"
                                            placeholder="React, Node.js, Python..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-200" />

                            {/* Appearance & Privacy */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Appearance & Privacy</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Accent Color</label>
                                        <div className="flex gap-2">
                                            {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"].map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, accentColor: color })}
                                                    className={`w-8 h-8 rounded-full border-2 ${formData.accentColor === color ? "border-slate-900 scale-110" : "border-transparent"}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isPublicProfile}
                                                onChange={(e) => setFormData({ ...formData, isPublicProfile: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-bold text-slate-700">Make Profile Public</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.showBranchYear}
                                                onChange={(e) => setFormData({ ...formData, showBranchYear: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-bold text-slate-700">Show Branch & Year</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-2 border-2 border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-black text-white border-2 border-black rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>

                        </form>


                    </div>
                </div>

            </main >

            {/* Sync Modal */}
            {
                showSyncModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border-2 border-black">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-900">Sync with CyberVidya</h2>
                                <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <p className="text-sm text-slate-600">
                                Enter your CyberVidya credentials to update your official details (Name, Branch, Year).
                                Credentials are not stored.
                            </p>

                            {syncMessage && (
                                <div className={`text-sm p-2 rounded ${syncMessage.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                    {syncMessage}
                                </div>
                            )}

                            <form onSubmit={handleSync} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">CyberVidya ID</label>
                                    <input
                                        className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none"
                                        value={cyberId}
                                        onChange={(e) => setCyberId(e.target.value)}
                                        placeholder="e.g. 202412345678901"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        className="w-full border-2 border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none"
                                        value={cyberPass}
                                        onChange={(e) => setCyberPass(e.target.value)}
                                        placeholder="Your CyberVidya password"
                                        required
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowSyncModal(false)}
                                        className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-700 text-sm font-bold hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={syncLoading}
                                        className="flex-1 px-4 py-2 bg-blue-600 border-2 border-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {syncLoading ? "Syncing..." : "Sync Now"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

