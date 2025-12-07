
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function CommunityAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"admins" | "conversations" | "rooms">("admins");
  const [admins, setAdmins] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  // Chat Modal State
  const [openChat, setOpenChat] = useState<{ type: 'dm'|'room', id: string, name: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [me, setMe] = useState<any>(null);
  const [chatImage, setChatImage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/me").then(r => r.json()).then(data => setMe(data.user));
    loadAdmins();
  }, []);

  useEffect(() => {
    if (activeTab === 'conversations') loadConversations();
    if (activeTab === 'rooms') loadRooms();
  }, [activeTab]);

  const loadAdmins = () => {
    fetch("/api/verified-admins").then(r => r.json()).then(data => {
        if(Array.isArray(data)) setAdmins(data);
    });
  };

  const loadConversations = () => {
      fetch("/api/chat/dm").then(r => r.json()).then(data => {
          if(Array.isArray(data)) setConversations(data);
      });
  };

  const loadRooms = () => {
       fetch("/api/room").then(r => r.json()).then(data => {
           if(Array.isArray(data)) setRooms(data);
       });
  };
  
  const createRoom = async () => {
      const name = prompt("Enter room name:");
      if(!name) return;
      await fetch("/api/room", {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ name, members: [] })
      });
      loadRooms();
  };

  const openDirectMessage = (partner: string) => {
      setOpenChat({ type: 'dm', id: partner, name: partner });
      setChatLoading(true);
      fetch(`/api/chat/dm?partner=${partner}`)
        .then(r => {
             if(!r.ok) throw new Error("Failed to load");
             return r.json();
        })
        .then(data => {
            console.log("DM Data:", data);
            if(Array.isArray(data)) setChatMessages(data);
            else setChatMessages([]);
        })
        .catch(err => {
            console.error(err);
            setChatMessages([]);
        })
        .finally(() => setChatLoading(false));
  };
  
  const openRoomChat = (room: any) => {
      setOpenChat({ type: 'room', id: room._id, name: room.name });
      setChatLoading(true);
      fetch(`/api/room/${room._id}/messages`)
        .then(r => {
            if(!r.ok) throw new Error("Failed to load");
            return r.json();
        })
        .then(data => {
             console.log("Room Data:", data);
             if(Array.isArray(data)) setChatMessages(data);
             else setChatMessages([]);
        })
        .catch(err => {
             console.error(err);
             setChatMessages([]);
        })
        .finally(() => setChatLoading(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      
      const formData = new FormData();
      formData.append("file", file);
      
      try {
          // Optimistic UI could accept blob url, but let's upload first
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if(data.url) {
              // Send immediately as an image message
              await sendMessageInternal({ text: "", image: data.url });
          }
      } catch(err) {
          console.error("Upload failed", err);
          alert("Image upload failed");
      }
  };

  const sendMessageInternal = async (payload: { text?: string, image?: string }) => {
      if(!openChat) return;
      const url = openChat.type === 'dm' ? '/api/chat/dm' : `/api/room/${openChat.id}/send`;
      const body = openChat.type === 'dm' 
        ? { to: openChat.id, ...payload }
        : { ...payload };

      try {
          const res = await fetch(url, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(body)
          });
          if(res.ok) {
              setChatInput("");
              // Refresh
              if(openChat.type === 'dm') {
                  const r = await fetch(`/api/chat/dm?partner=${openChat.id}`);
                  const d = await r.json();
                  if(Array.isArray(d)) setChatMessages(d);
              } else {
                  const r = await fetch(`/api/room/${openChat.id}/messages`);
                  const d = await r.json();
                  if(Array.isArray(d)) setChatMessages(d);
              }
          } else {
             const err = await res.json().catch(() => ({}));
             throw new Error(err.error || "Request failed");
          }
      } catch(e) {
          console.error("Send failed", e);
          alert("Failed to send: " + (e as any).message);
      }
  };

  const sendChat = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim()) return;
      await sendMessageInternal({ text: chatInput });
  };

  const Badge = ({ type }: { type: 'verified' | 'admin' }) => {
     if(type==='verified') return <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold ml-1">✓</span>;
     if(type==='admin') return <span className="inline-flex items-center justify-center bg-red-600 text-white text-[10px] px-1 rounded ml-1">Admin</span>
     return null;
  };

  return (
    <div className="max-w-4xl mx-auto my-8 bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-700">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <span>👑</span> Admin Tools
          </h1>
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-2xl font-bold">
            ✕
          </button>
      </div>

      {/* Tabs */}
      <div className="flex px-6 border-b border-zinc-200 dark:border-zinc-700">
          <button 
             onClick={() => setActiveTab('admins')}
             className={`mr-8 py-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'admins' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
             Verified Admins
          </button>
          <button 
             onClick={() => setActiveTab('conversations')}
             className={`mr-8 py-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'conversations' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
             My Conversations
          </button>
          <button 
             onClick={() => setActiveTab('rooms')}
             className={`mr-8 py-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'rooms' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
             Private Rooms
          </button>
      </div>
      
      {/* Content */}
      <div className="p-6 min-h-[500px] bg-zinc-50 dark:bg-zinc-900/50">
          
          {/* Verified Admins */}
          {activeTab === 'admins' && (
              <div className="space-y-4">
                  {admins.map((admin, i) => (
                      <div key={i} className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-100">
                                   {admin.avatar ? (
                                       <img src={admin.avatar} alt={admin.username} className="w-full h-full object-cover"/>
                                   ) : (
                                       <span className="text-xl font-bold text-zinc-400">{admin.username[0]?.toUpperCase()}</span>
                                   )}
                              </div>
                              <div>
                                  <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                      {admin.username}
                                      <span className="bg-red-700 text-white text-[9px] px-1 rounded font-bold uppercase tracking-wider">Admin</span>
                                  </div>
                                  <div className="text-sm text-zinc-500 mt-0.5">
                                      Admin of: {admin.communities.map((c:string) => `r/${c}`).join(", ")}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                              <Link href={`/community/profile/${admin.username}`} className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-sm transition-colors">
                                  Profile
                              </Link>
                              <button 
                                  onClick={() => openDirectMessage(admin.username)}
                                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white font-bold rounded-lg text-sm transition-all flex items-center gap-2 shadow-md"
                              >
                                  <span>💬</span> Chat
                              </button>
                          </div>
                      </div>
                  ))}
                  {admins.length === 0 && <div className="text-center text-zinc-400 py-10">No verified admins found.</div>}
              </div>
          )}

          {/* Conversations */}
          {activeTab === 'conversations' && (
              <div className="space-y-4">
                   {conversations.map((c, i) => (
                       <div key={i} onClick={() => openDirectMessage(c.partner)} className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-300 transition-colors">
                            <div className="flex items-center gap-4">
                                {/* Avatar placeholder or real */}
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                                    {c.partner[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{c.partner}</div>
                                    <p className="text-sm text-zinc-500 line-clamp-1">{c.lastMessage}</p>
                                </div>
                            </div>
                            
                            {/* Unread Badge (Simulated for now as API might not allow unread count yet) */}
                            {/* In screenshot it's an orange circle with number */}
                            <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                                1
                            </div>
                       </div>
                   ))}
                   {conversations.length === 0 && <div className="text-center text-zinc-400 py-10">No conversations yet.</div>}
              </div>
          )}

          {/* Rooms */}
          {activeTab === 'rooms' && (
               <div className="space-y-4">
                   <div className="flex justify-end mb-2">
                       <button onClick={createRoom} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-green-700">
                           + Create Room
                       </button>
                   </div>
                   {rooms.map(room => (
                       <div key={room._id} onClick={() => openRoomChat(room)} className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-300 transition-colors">
                           <div>
                               <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                   🔒 {room.name}
                               </h4>
                               <p className="text-sm text-zinc-500">{room.members.length} members</p>
                           </div>
                           <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">Open</button>
                       </div>
                   ))}
               </div>
          )}

      </div>
      
      {/* Chat Popup */}
      {openChat && (
        <div className="fixed bottom-4 right-10 w-[450px] bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-300 dark:border-zinc-600 z-50 flex flex-col h-[650px]">
             <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white flex justify-between items-center rounded-t-xl">
                 <div className="font-bold flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                        {openChat.name[0]?.toUpperCase()}
                     </div>
                     {openChat.name}
                 </div>
                 <button onClick={() => setOpenChat(null)} className="hover:bg-white/20 p-1 rounded transition-colors">✕</button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900">
                 {chatLoading && <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div></div>}
                 
                 {!chatLoading && chatMessages.map((msg, i) => {
                       const isMe = (msg.sender || msg.from) === me?.username;
                       return (
                           <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                                    isMe 
                                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none'
                                }`}>
                                    {msg.image && (
                                        <div className="mb-2 rounded-lg overflow-hidden">
                                            <img src={msg.image} alt="attachment" className="max-w-full h-auto object-cover" />
                                        </div>
                                    )}
                                    {msg.text && <p>{msg.text}</p>}
                                </div>
                                <span className="text-[10px] text-zinc-400 mt-1 px-1">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                           </div>
                       );
                   })}
             </div>
             
             <div className="p-3 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
                 <form onSubmit={sendChat} className="flex items-center gap-2">
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/*"
                     />
                     <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
                        title="Upload Image"
                     >
                        📷
                     </button>
                     
                     <div className="flex-1 relative">
                        <input 
                            className="w-full border border-zinc-300 dark:border-zinc-600 rounded-full px-4 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-transparent transition-all" 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)} 
                            placeholder="Type a message..." 
                        />
                     </div>
                     
                     <button 
                        type="submit" 
                        className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 shadow-md transition-all flex items-center justify-center w-10 h-10"
                     >
                        ➤
                     </button>
                 </form>
             </div>
        </div>
      )}
    </div>
  );
}
