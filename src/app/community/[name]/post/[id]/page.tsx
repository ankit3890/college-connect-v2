"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/community/PostCard";
import CommentSection from "@/components/community/CommentSection";

export default function PostPage({ params }: { params: { name: string; id: string } }) {
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    // We don't have a single post API by ID easily in the restored routes (oops, I did not create /api/posts/[id]).
    // I created /api/posts?community=... and GET /api/posts returns list.
    // I need to fetch all and find, or assume I need to restore /api/posts/[id]/route.ts
    // Looking at deleted files list in Step 344: /api/posts/[id]/route.ts was deleted.
    // I did NOT restore it in Step 386 (only /api/posts).
    // I should create a quick inline fetch here or fix the API. 
    // Ideally fix the API, but for now let's reuse the list endpoint if possible or create the missing API.
    // Actually, I should probably restore /api/posts/[id] in the next step.
    // For now, let's implement the UI assuming the API exists or I will simulate it.
    
    // Attempt to fetch from list filtered? No inefficient.
    // I will write the API in the next tool call.
    // Here is the UI code.
    fetch(`/api/posts/${params.id}`).then(r => {
        if(r.ok) return r.json();
        return null;
    }).then(setPost);
  }, [params.id]);

  if (!post) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
        <PostCard post={post} />
        <CommentSection postId={post._id} />
    </div>
  );
}
