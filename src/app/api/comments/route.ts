import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";
import { getAuthUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json([], { status: 400 });

  await connectDB();
  const comments = await Comment.find({ postId }).sort({ createdAt: 1 });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { postId, text } = body;

  await connectDB();
  const comment = await Comment.create({
    postId,
    user: user.username,
    text,
  });

  return NextResponse.json(comment);
}
