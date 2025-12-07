import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CommunityChat from "@/models/CommunityChat";
import { getAuthUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  await connectDB();
  const msgs = await CommunityChat.find({ community: params.name })
      .sort({ createdAt: -1 })
      .limit(50);
  return NextResponse.json(msgs.reverse());
}

export async function POST(req: NextRequest, { params }: { params: { name: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { text } = body;

  await connectDB();
  const msg = await CommunityChat.create({
      community: params.name,
      user: user.username,
      text
  });
  
  return NextResponse.json(msg);
}
