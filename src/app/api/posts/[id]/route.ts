import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  try {
      const post = await Post.findById(params.id);
      if(!post) return NextResponse.json({error: "Not found"}, {status: 404});
      return NextResponse.json(post);
  } catch {
      return NextResponse.json({error: "Invalid ID"}, {status: 400});
  }
}
