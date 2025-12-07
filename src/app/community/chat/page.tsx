"use client";

import React, { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

export default function GlobalChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [me, setMe] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/user/me").then(r => r.json()).then(data => setMe(data.user));
    
    const load = () => {
        fetch("/api/chat/global").then(r => r.json()).then(setMessages);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!input.trim()) return;

      await fetch("/api/chat/global", {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ user: me?.username, text: input })
      });
      setInput("");
      fetch("/api/chat/global").then(r => r.json()).then(setMessages);
  };

  if (!me) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="h-[calc(100vh-100px)] bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 flex flex-col overflow-hidden max-w-5xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
            <div>
                <h1 className="font-bold text-xl text-zinc-800 dark:text-zinc-200">Global Live Chat</h1>
                <p className="text-xs text-zinc-500">Chat with everyone on College Connect</p>
            </div>
            <div className="flex gap-2 text-sm text-zinc-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live</span>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50">
            {messages.length === 0 && (
                <div className="text-center text-zinc-400 py-20 flex flex-col items-center gap-2">
                    <div className="text-4xl">💭</div>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            )}
            
            {messages.map((msg, i) => {
                const isMe = msg.user === me.username;
                return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                             {!isMe && <span className="font-bold text-xs text-zinc-600 dark:text-zinc-400">{msg.user}</span>}
                             <span className="text-[10px] text-zinc-400">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                        </div>
                        
                        <div className={`px-5 py-3 rounded-2xl max-w-[70%] text-sm shadow-sm leading-relaxed ${
                            isMe 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none' 
                            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-none'
                        }`}>
                            {msg.text}
                            {msg.image && <img src={msg.image} className="mt-2 rounded-lg max-w-full" />}
                        </div>
                    </div>
                );
            })}
            <div ref={endRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={send} className="p-4 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 flex gap-3 items-center">
            <button type="button" className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors" title="Upload Image">
                📷
            </button>
            <input 
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Type a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
            />
            <button 
                type="submit" 
                disabled={!input.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-md hover:shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Send
            </button>
        </form>
    </div>
  );
}
