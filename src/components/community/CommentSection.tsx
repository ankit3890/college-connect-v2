"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  const fetchComments = () => {
    fetch(`/api/comments?postId=${postId}`)
      .then((res) => res.json())
      .then((data) => setComments(data));
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newComment.trim()) return;

    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, text: newComment }),
    });
    setNewComment("");
    fetchComments();
  };

  return (
    <div className="mt-6 bg-white dark:bg-zinc-800 rounded-md p-4 border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-sm font-bold text-zinc-500 mb-4">Comments</h3>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-transparent"
          rows={3}
          placeholder="What are your thoughts?"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            Comment
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="flex gap-2">
             <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0"></div>
             <div className="flex-1">
                 <div className="flex items-center gap-2 text-xs text-zinc-500">
                     <Link href={`/u/${comment.user}`} className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline">{comment.user}</Link>
                     <span>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                 </div>
                 <div className="text-sm text-zinc-800 dark:text-zinc-300 mt-1">
                     {comment.text}
                 </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
