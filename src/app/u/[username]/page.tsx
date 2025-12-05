"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Profile {
    _id?: string;
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
    followersCount?: number;
    followingCount?: number;
    role?: string;
    hasSyncedFromCyberVidya?: boolean;
    studentId?: string;
    email?: string;
    showBranchYear?: boolean;
}

interface UserList {
    _id: string;
    name: string;
    displayName?: string;
    username?: string;
    studentId?: string;
    avatarUrl?: string;
    role?: string;
}

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);

    // Follow System State
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showUserListModal, setShowUserListModal] = useState<"followers" | "following" | null>(null);
    const [userList, setUserList] = useState<UserList[]>([]);
    const [userListLoading, setUserListLoading] = useState(false);

    useEffect(() => {
        // Fetch current user to check if we should show "Edit Profile"
        fetch("/api/profile/me", { cache: "no-store" })
            .then((res) => {
                if (res.ok) return res.json();
                return null;
            })
            .then((data) => {
                if (data && data.profile) {
                    setCurrentUserUsername(data.profile.username);
                }
            })
            .catch(() => { }); // ignore error if not logged in

        // Fetch public profile
        fetch(`/api/profile/${username}?t=${Date.now()}`, { cache: "no-store" })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.msg || "Failed to load profile");
                }
                return res.json();
            })
            .then((data) => {
                setProfile(data.profile);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });

        // Check follow status
        fetch(`/api/users/${username}/follow?t=${Date.now()}`, { cache: "no-store" })
            .then(res => res.json())
            .then(data => {
                setIsFollowing(data.isFollowing);
            })
            .catch(() => { });

        // Log View Profile
        // We use a small timeout to ensure we don't log if the profile doesn't exist (handled by error check above, but this is safer)
        // Actually, better to just fire and forget.
        const logView = async () => {
            try {
                await fetch("/api/log/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "VIEW_PROFILE",
                        details: `Viewed profile of ${username}`
                    })
                });
            } catch (e) {
                // ignore logging errors
            }
        };
        logView();

    }, [username]);

    const handleFollowToggle = async () => {
        if (!currentUserUsername) {
            router.push("/login");
            return;
        }
        setFollowLoading(true);
        try {
            const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                setIsFollowing(data.isFollowing);
                // Update counts locally
                setProfile(prev => prev ? {
                    ...prev,
                    followersCount: (prev.followersCount || 0) + (data.isFollowing ? 1 : -1)
                } : null);
            } else {
                alert(data.msg || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update follow status");
        } finally {
            setFollowLoading(false);
        }
    };

    const fetchUserList = async (type: "followers" | "following") => {
        setUserListLoading(true);
        setShowUserListModal(type);
        try {
            const res = await fetch(`/api/users/${username}/${type}`);
            const data = await res.json();
            if (res.ok) {
                setUserList(data.users);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUserListLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            document.cookie = "token=; Max-Age=0; path=/";
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            window.location.href = "/";
        } catch (err) {
            console.error("Logout failed:", err);
            window.location.href = "/";
        }
    };

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

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-6 text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">Profile not found</h1>
                    <p className="text-slate-600 mb-6">{error || "The user you are looking for does not exist or is private."}</p>
                    <div className="flex flex-col items-center gap-4">
                        <Link href="/dashboard" className="text-blue-600 hover:underline font-bold">
                            Go back to Dashboard
                        </Link>
                        <div className="text-sm text-slate-500">
                            <span>Know this person? </span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin + "/register");
                                    alert("Registration link copied to clipboard!");
                                }}
                                className="text-blue-600 hover:underline font-bold"
                            >
                                Invite them to join
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUserUsername === profile.username;
    const accentColor = profile.accentColor || "#3b82f6";

    return (
        <div className="min-h-screen bg-slate-100 pb-4">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 space-y-3">
                {/* HEADER CARD */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-black">
                    {/* Banner */}
                    <div
                        className="h-24 sm:h-32 w-full bg-cover bg-center relative"
                        style={{
                            backgroundColor: accentColor,
                            backgroundImage: profile.bannerUrl ? `url(${profile.bannerUrl})` : undefined,
                        }}
                    >
                        {!profile.bannerUrl && (
                            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                        )}
                    </div>

                    <div className="px-4 pb-4 sm:px-6 sm:pb-6 relative">
                        {/* Avatar */}
                        <div className="absolute -top-10 left-4 sm:left-6">
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.displayName || profile.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {(profile.displayName || profile.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Header Actions */}
                        <div className="flex justify-end pt-2 min-h-[40px] gap-2">
                            {isOwnProfile ? (
                                <>
                                    <Link
                                        href="/profile/edit"
                                        className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Edit Profile
                                    </Link>
                                </>
                            ) : (
                                <button
                                    onClick={handleFollowToggle}
                                    disabled={followLoading}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm border ${isFollowing
                                        ? "bg-white border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                        : "bg-black border-black text-white hover:bg-slate-800"
                                        }`}
                                >
                                    {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                                </button>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="mt-3 sm:mt-12">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-3">
                                <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
                                    {profile.name}
                                </h1>
                                {profile.hasSyncedFromCyberVidya && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 mb-1 border border-green-200">
                                        Synced ✅
                                    </span>
                                )}
                            </div>

                            <p className="text-slate-500 font-medium text-xs sm:text-sm">@{profile.username}</p>

                            {profile.statusText && (
                                <p className="text-slate-600 mt-1 italic text-xs sm:text-sm">"{profile.statusText}"</p>
                            )}

                            {/* Follow Counts */}
                            <div className="flex gap-3 sm:gap-5 mt-2 text-xs sm:text-sm">
                                <button onClick={() => fetchUserList("following")} className="hover:underline">
                                    <span className="font-bold text-slate-900">{profile.followingCount || 0}</span> <span className="text-slate-500">Following</span>
                                </button>
                                <button onClick={() => fetchUserList("followers")} className="hover:underline">
                                    <span className="font-bold text-slate-900">{profile.followersCount || 0}</span> <span className="text-slate-500">Followers</span>
                                </button>
                            </div>

                            {/* Chips Row */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {profile.role && profile.role !== "student" && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200 capitalize">
                                        {profile.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* DETAILS CARD (Split Layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* LEFT: College Details (Locked) */}
                    <div className="bg-white rounded-xl shadow-md border-2 border-black p-4 sm:col-span-1 h-fit">
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h2 className="font-bold text-sm text-slate-900">College Details</h2>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Branch</label>
                                <p className="font-medium text-slate-900 text-sm">{profile.branch || "Not set"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Year</label>
                                <p className="font-medium text-slate-900 text-sm">{profile.year || "Not set"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Student ID</label>
                                <p className="font-medium text-slate-900 font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    {profile.studentId}
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">College Email</label>
                                <p className="font-medium text-slate-900 text-xs break-all">{profile.email}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gender</label>
                                <p className="font-medium text-slate-900 text-sm capitalize">{profile.gender || "Not set"}</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Personal Profile */}
                    <div className="bg-white rounded-xl shadow-md border-2 border-black p-4 sm:col-span-2">
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h2 className="font-bold text-sm text-slate-900">About</h2>
                        </div>

                        <div className="space-y-3">
                            {/* Username in About */}
                            <div>
                                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Username</h3>
                                <p className="font-medium text-slate-900 text-sm">@{profile.username}</p>
                            </div>
                            <div className="border-b border-slate-50"></div>

                            {/* Bio */}
                            <div>
                                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Bio</h3>
                                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">
                                    {profile.bio || "No bio added yet."}
                                </p>
                            </div>
                            <div className="border-b border-slate-50"></div>

                            {/* Interests & Skills */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Interests</h3>
                                    {profile.interests && profile.interests.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.interests.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">None added</p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Skills</h3>
                                    {profile.skills && profile.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.skills.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">None added</p>
                                    )}
                                </div>
                            </div>
                            <div className="border-b border-slate-50"></div>

                            {/* Socials */}
                            <div>
                                <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Connect</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.socials?.github && (
                                        <a href={profile.socials.github} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-black hover:shadow-sm transition-all bg-white group">
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-black">GitHub</span>
                                        </a>
                                    )}
                                    {profile.socials?.linkedin && (
                                        <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#0077b5] hover:shadow-sm transition-all bg-white group">
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-[#0077b5]">LinkedIn</span>
                                        </a>
                                    )}
                                    {profile.socials?.twitter && (
                                        <a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#1DA1F2] hover:shadow-sm transition-all bg-white group">
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-[#1DA1F2]">Twitter</span>
                                        </a>
                                    )}
                                    {profile.socials?.instagram && (
                                        <a href={profile.socials.instagram} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#E1306C] hover:shadow-sm transition-all bg-white group">
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-[#E1306C]">Instagram</span>
                                        </a>
                                    )}
                                    {profile.socials?.website && (
                                        <a href={profile.socials.website} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-600 hover:shadow-sm transition-all bg-white group">
                                            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Website</span>
                                        </a>
                                    )}

                                    {!profile.socials?.github && !profile.socials?.linkedin && !profile.socials?.twitter && !profile.socials?.instagram && !profile.socials?.website && (
                                        <p className="text-xs text-slate-400 italic">No social links added</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Actions (Bottom) */}
                {isOwnProfile && (
                    <div className="bg-white rounded-xl shadow-md border-2 border-black p-4">
                        <h2 className="text-base font-bold text-slate-900 mb-3">Account Actions</h2>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                                href="/profile/change-password"
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-center"
                            >
                                Change Password
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* User List Modal */}
            {showUserListModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 capitalize">{showUserListModal}</h2>
                            <button onClick={() => setShowUserListModal(null)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3 flex-1">
                            {userListLoading ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : userList.length > 0 ? (
                                userList.map((user) => {
                                    const displayName = user.displayName || user.name || "User";
                                    return (
                                        <Link key={user._id} href={`/u/${user.username || user.studentId}`} onClick={() => setShowUserListModal(null)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                                        {displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{displayName}</p>
                                                <p className="text-xs text-slate-500">@{user.username || user.studentId}</p>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-500 text-sm py-4">No users found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
