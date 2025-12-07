"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface PostCardProps {
  post: any;
  showCommunity?: boolean;
}

export default function PostCard({ post, showCommunity = true }: PostCardProps) {
  const [votes, setVotes] = useState(post.upvotes.length - post.downvotes.length);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

  const handleVote = async (type: "up" | "down") => {
      let diff = 0;
      if (userVote === type) {
          setUserVote(null);
          diff = type === 'up' ? -1 : 1;
      } else {
           if (userVote === 'up' && type === 'down') diff = -2;
           else if (userVote === 'down' && type === 'up') diff = 2;
           else diff = type === 'up' ? 1 : -1;
           setUserVote(type);
      }
      setVotes(v => v + diff);

      await fetch(`/api/posts/${post._id}/vote`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ type })
      });
  };

  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors mb-4">
      
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 p-3 pb-1">
        {showCommunity && (
          <>
            <Link href={`/community/${post.community}`} className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline">
              r/{post.community}
            </Link>
            <span>•</span>
          </>
        )}
        <span>Posted by u/{post.author}</span>
        <span>•</span>
        <span>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) + " ago" : ""}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <Link href={`/community/${post.community}/post/${post._id}`}>
           <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2 leading-snug">{post.title}</h3>
           {post.image && (
                <div className="mb-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <img src={post.image} alt="Post image" className="max-h-[500px] w-full object-cover" />
                </div>
            )}
           {post.content && (
               <div className="text-sm text-zinc-800 dark:text-zinc-300 line-clamp-4 markdown-preview font-light leading-relaxed">
                 {post.content}
               </div>
           )}
        </Link>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/30 px-3 py-2 border-t border-zinc-100 dark:border-zinc-700/50">
        
        {/* Vote Buttons matches Screenshot: Blue/Red style or simple block */}
        <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-700 rounded p-1">
            <button 
                onClick={() => handleVote('up')} 
                className={`p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 ${userVote === 'up' ? 'text-orange-600 bg-orange-100' : 'text-zinc-500'}`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
            <span className={`text-sm font-bold min-w-[20px] text-center ${userVote === 'up' ? 'text-orange-600' : userVote === 'down' ? 'text-blue-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {votes}
            </span>
            <button 
                onClick={() => handleVote('down')} 
                className={`p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 ${userVote === 'down' ? 'text-blue-600 bg-blue-100' : 'text-zinc-500'}`}
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
        </div>

        <Link href={`/community/${post.community}/post/${post._id}`} className="flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-500 transition-colors text-xs font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span>Comments</span>
        </Link>
        
        <button className="flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-500 transition-colors text-xs font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span>Share</span>
        </button>

      </div>
    </div>
  );
}
