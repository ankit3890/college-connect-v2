import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { getAuthUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const community = searchParams.get("community");

    await connectDB();

    let filter = {};
    if (community) {
      filter = { community };
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(posts);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, content, community, image } = body;

    if (!title || !community) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    const newPost = await Post.create({
      title,
      content,
      community,
      author: user.username,
      image,
    });

    return NextResponse.json(newPost);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
