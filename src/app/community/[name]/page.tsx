"use client";

import React, { useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import PostCard from "@/components/community/PostCard";

export default function CommunityPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = React.use(params);
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tabs: feed | chat
  const [activeTab, setActiveTab] = useState<"feed" | "chat">("feed");

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // New Post State
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  useEffect(() => {
    // Fetch community
    fetch(`/api/community/${name}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setCommunity(data);
        // Check if joined
        fetch("/api/user/me").then(r => r.json()).then(me => {
           if(me.user && data.members.includes(me.user.username)) {
               setIsJoined(true);
           }
        });
        
        // Fetch posts
        fetch(`/api/posts?community=${name}`)
          .then(r => r.json())
          .then(setPosts);
      })
      .catch(() => setCommunity(null))
      .finally(() => setLoading(false));
  }, [name]);

  // Poll Chat if active
  useEffect(() => {
      if (activeTab !== 'chat') return;
      
      const fetchChat = () => {
          fetch(`/api/community/${name}/chat`)
             .then(r => r.json())
             .then(setChatMessages);
      };
      
      fetchChat();
      const interval = setInterval(fetchChat, 3000);
      return () => clearInterval(interval);
  }, [activeTab, name]);

  useEffect(() => {
      if(activeTab === 'chat' && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [chatMessages, activeTab]);

  const handleJoin = async () => {
      const url = isJoined ? "/api/community/leave" : "/api/community/join";
      await fetch(url, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ communityName: name })
      });
      setIsJoined(!isJoined);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
      e.preventDefault();
      await fetch("/api/posts", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ ...newPost, community: name })
      });
      setNewPost({ title: "", content: "" });
      setIsPosting(false);
      fetch(`/api/posts?community=${name}`).then(r => r.json()).then(setPosts);
  };

  const sendChatMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim()) return;
      
      await fetch(`/api/community/${name}/chat`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ text: chatInput })
      });
      setChatInput("");
      // Immediate fetch
      fetch(`/api/community/${name}/chat`).then(r => r.json()).then(setChatMessages);
  };

  if (loading) return <div>Loading...</div>;
  if (!community) return notFound();

  return (
    <div>
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl mb-4 relative">
          <div className="absolute -bottom-6 left-6 flex items-end gap-4">
              <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full p-1 shadow-md">
                 <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-3xl font-bold text-zinc-500">
                     {community.name[0].toUpperCase()}
                 </div>
              </div>
              <div className="mb-2">
                  <h1 className="text-2xl font-bold text-white drop-shadow-md flex items-center gap-2">
                      r/{community.name}
                      {community.isVerified && <span className="text-blue-200 bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] border border-white">✓</span>}
                  </h1>
              </div>
          </div>
          <div className="absolute bottom-4 right-6">
              <button 
                onClick={handleJoin}
                className={`px-6 py-1.5 rounded-full font-bold shadow-md transition-all ${isJoined ? 'bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-100' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
              >
                  {isJoined ? "Joined" : "Join"}
              </button>
          </div>
      </div>
      
      {/* Tabs */}
      <div className="mt-10 flex gap-4 border-b border-zinc-200 dark:border-zinc-700 mb-6">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'feed' ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
              Posts
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'chat' ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
              Chat Room
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
               
               {activeTab === 'feed' ? (
                   <>
                        {/* Create Post Input */}
                       {isJoined && (
                           <div className="bg-white dark:bg-zinc-800 p-4 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm mb-6">
                               <input 
                                  type="text" 
                                  placeholder="Create Post" 
                                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-md px-4 py-2 cursor-pointer hover:bg-zinc-200 transition-colors outline-none"
                                  onClick={() => setIsPosting(true)}
                               />
                               {isPosting && (
                                   <form onSubmit={handleCreatePost} className="mt-4 space-y-3">
                                       <input 
                                          value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                                          placeholder="Title"
                                          className="w-full p-2 border rounded"
                                          required
                                       />
                                       <textarea
                                          value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})}
                                          placeholder="Body"
                                          className="w-full p-2 border rounded h-24"
                                          required
                                       />
                                       <div className="flex justify-end gap-2">
                                           <button type="button" onClick={() => setIsPosting(false)} className="text-sm px-3 py-1 text-zinc-500">Cancel</button>
                                           <button type="submit" className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded font-bold">Post</button>
                                       </div>
                                   </form>
                               )}
                           </div>
                       )}

                       {posts.map(post => <PostCard key={post._id} post={post} showCommunity={false} />)}
                       {posts.length === 0 && <div className="text-center py-10 text-zinc-500">No posts yet. Be the first!</div>}
                   </>
               ) : (
                   /* CHAT ROOM UI */
                   <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 h-[600px] flex flex-col">
                       {!isJoined && (
                           <div className="bg-yellow-50 p-3 text-center text-sm text-yellow-800 border-b border-yellow-200">
                               Join this community to chat!
                           </div>
                       )}
                       <div className="flex-1 overflow-y-auto p-4 space-y-3">
                           {chatMessages.map(msg => (
                               <div key={msg._id} className="flex flex-col gap-1">
                                   <div className="flex items-baseline gap-2">
                                       <span className="font-bold text-sm">{msg.user}</span>
                                       <span className="text-[10px] text-zinc-400">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                                   </div>
                                   <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded-lg text-sm inline-block self-start max-w-[90%]">
                                       {msg.text}
                                   </div>
                               </div>
                           ))}
                           <div ref={chatEndRef} />
                       </div>
                       
                       {isJoined && (
                           <form onSubmit={sendChatMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
                               <input 
                                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                                  placeholder={`Message r/${community.name}...`}
                                  className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                               />
                               <button type="submit" disabled={!chatInput.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm disabled:opacity-50">Send</button>
                           </form>
                       )}
                   </div>
               )}
          </div>

          {/* Sidebar Info */}
          <div className="hidden lg:block space-y-4">
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-md border border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-bold text-zinc-500 text-sm uppercase mb-2">About Community</h3>
                  <p className="text-sm text-zinc-800 dark:text-zinc-300 mb-4">{community.description || "No description."}</p>
                  <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="font-bold">{community.members.length}</span>
                      <span className="text-zinc-500">Members</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
