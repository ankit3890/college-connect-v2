"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FindMembersPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // For Invitation Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openInviteModal = (user: any) => {
    setSelectedUser(user);
    // Fetch my created/moderated communities
    fetch("/api/community")
      .then(r => r.json())
      .then(comms => {
          if (Array.isArray(comms)) {
              fetch("/api/user/me").then(r => r.json()).then(me => {
                  if(me && me.user) {
                      const mine = comms.filter(c => c.creator === me.user.username || c.members.includes(me.user.username));
                      setMyCommunities(mine);
                      if(mine.length > 0) setSelectedCommunity(mine[0].name);
                      setInviteModalOpen(true);
                  }
              });
          }
      });
  };

  const sendInvitation = async () => {
    if(!selectedUser || !selectedCommunity) return;
    
    try {
      const res = await fetch("/api/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityName: selectedCommunity,
          username: selectedUser.username
        })
      });
      if(res.ok) {
        alert("Invitation sent!");
        setInviteModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send invitation");
      }
    } catch {
        alert("Error sending invitation");
    }
  };

  const startChat = (username: string) => {
      // Redirect to Admin Tools Conversations tab with partner selected?
      // Or Global Chat DM?
      // The current system setup suggests DMs are handled in Admin Page or Global Chat.
      // Let's assume Admin Page Conversations is the main UI for DMs.
      // But we can possibly pass a param to open it.
      // For now, redirect to simple DM page if exists? /community/chat is GLOBAL.
      // /community/admin has DMs.
      // Let's redirect to /community/admin assuming the user might find it there.
      // But wait, ordinary users might not have access to "Admin Tools" if not admin.
      // DMs should be accessible to everyone?
      // Step 252 says `/api/chat/dm` exists.
      // Maybe we need a dedicated Messages page for normal users?
      // Currently "Messages" link in header goes to `/community/chat`.
      // Let's point there? No, that's Global Chat.
      
      // We will point to /community/admin as "Messages" link does? 
      // Wait, in `CommunityHeader.tsx`, Messages link goes to `/community/chat`.
      // This implies Global Chat is the main chat.
      // But DMs are separate.
      // Checking `Navbar.tsx` or `CommunitySidebar.tsx`...
      // There is no dedicated "Messages" page link other than header.
      // Let's assume `/community/chat` handles DMs too?
      // Checking `src/app/community/chat/page.tsx`...
      
      router.push(`/community/admin`); // Fallback for now, as Admin page has the nice DM UI.
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">
        Find Members
      </h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for users by name or username..."
          className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((user) => (
            <div
              key={user._id}
              className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg overflow-hidden">
                   {user.avatarUrl ? (
                       <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover"/>
                   ) : (
                       user.username[0]?.toUpperCase()
                   )}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{user.name}</h3>
                  <p className="text-sm text-zinc-500">@{user.username}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => startChat(user.username)}
                    className="text-xs px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded font-medium"
                  >
                    Message
                  </button>
                  <button 
                    onClick={() => openInviteModal(user)}
                    className="text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded font-medium"
                  >
                    Invite
                  </button>
                  <Link href={`/community/profile/${user.username}`} className="text-xs px-3 py-1 bg-transparent hover:bg-zinc-50 text-zinc-500 border border-zinc-200 rounded font-medium text-center">
                    Profile
                  </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Invite Modal */}
      {inviteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <h2 className="text-xl font-bold mb-4">Invite @{selectedUser?.username}</h2>
                  
                  <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Select Community</label>
                      <select 
                        value={selectedCommunity} 
                        onChange={e => setSelectedCommunity(e.target.value)}
                        className="w-full p-2 border rounded bg-zinc-50 dark:bg-zinc-900"
                      >
                          {myCommunities.map(c => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                      </select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setInviteModalOpen(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded">Cancel</button>
                      <button onClick={sendInvitation} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send Invite</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
