"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

export default function CommunityHeader() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setUser(data.user));
    
    // Poll notifications
    const fetchNotifs = () => {
        fetch("/api/notifications").then(r => r.ok ? r.json() : []).then(data => {
            if(Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        });
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
      const handleClick = (e: MouseEvent) => {
          if(notifRef.current && !notifRef.current.contains(e.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
      await fetch("/api/notifications", {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ id })
      });
      // Update local state
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  const handleNotifClick = (n: any) => {
      if(!n.read) markRead(n._id);
      if(n.link) router.push(n.link);
      // Special handling for Invites? 
      // API invites link typically isn't stored, but we preserved invitationId.
      // We could redirect to a /community/invites pages? 
      // For now, simplicity: just close.
      setShowNotifications(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-600 to-blue-600 z-50 flex items-center justify-between px-6 shadow-md border-b border-purple-700">
      {/* Sidebar Toggle & Branding */}
      <div className="flex items-center gap-4">
         <Link href="/" className="flex items-center gap-2 text-white hover:text-white/90 transition-colors">
            <span className="text-xl font-bold flex items-center gap-2">
                 <span>☰ ⬅</span> College Connect
            </span>
         </Link>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-4">
          <input 
              type="text" 
              placeholder="Search communities..." 
              className="w-full px-4 py-2 rounded-full border-none focus:ring-2 focus:ring-blue-300 outline-none text-zinc-800 bg-white/95 backdrop-blur-sm shadow-inner"
              onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                      const val = e.currentTarget.value;
                      if(val.trim()){
                        router.push(`/community/search?q=${encodeURIComponent(val)}`);
                      }
                  }
              }}
          />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">

         <div className="relative" ref={notifRef}>
             <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="hidden md:flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors shadow-sm relative"
             >
                 <span>🔔 Messages</span>
                 {unreadCount > 0 && (
                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-white">
                         {unreadCount}
                     </span>
                 )}
             </button>

             {showNotifications && (
                 <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50">
                     <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                         <span className="font-bold text-sm">Notifications</span>
                         <button onClick={() => markRead('all')} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                     </div>
                     <div className="max-h-96 overflow-y-auto">
                         {notifications.length === 0 ? (
                             <div className="p-8 text-center text-zinc-500 text-sm">No notifications</div>
                         ) : (
                             notifications.map(n => (
                                 <div 
                                    key={n._id} 
                                    onClick={() => handleNotifClick(n)}
                                    className={`p-3 border-b border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                 >
                                     <p className="text-sm text-zinc-800 dark:text-zinc-200">{n.message}</p>
                                     <span className="text-[10px] text-zinc-400 block mt-1">{formatDistanceToNow(new Date(n.createdAt))} ago</span>
                                 </div>
                             ))
                         )}
                     </div>
                 </div>
             )}
         </div>
         
         {user && (
             <Link href={`/u/${user.username || user.studentId}`} className="hidden md:block bg-white text-zinc-800 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-zinc-100 transition-colors shadow-sm">
               Profile
             </Link>
         )}
         
         <button 
            onClick={() => {
                fetch("/api/auth/logout", { method: "POST" }).then(() => {
                    window.location.href = "/";
                });
            }}
            className="hidden md:block bg-white text-zinc-800 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-zinc-100 transition-colors shadow-sm"
         >
           Logout
         </button>
      </div>
    </header>
  );
}
