import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import Post from "@/models/Post";
import { getAuthUser } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  
  await connectDB();
  const community = await Community.findOne({ name });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (community.creator !== user.username) {
      return NextResponse.json({ error: "Only creator can delete" }, { status: 403 });
  }

  await Community.deleteOne({ name });
  // Clean up posts
  await Post.deleteMany({ community: name });

  return NextResponse.json({ success: true });
}
