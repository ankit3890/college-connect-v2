"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/community/PostCard";

export default function CommunityHome() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Popular Posts</h1>
      <div>
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
        {posts.length === 0 && <p className="text-zinc-500">No posts yet.</p>}
      </div>
    </div>
  );
}
