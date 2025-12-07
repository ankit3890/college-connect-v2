import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import { getAuthUser } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { communityName } = body;

  await connectDB();
  const community = await Community.findOne({ name: communityName });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  community.members = community.members.filter((m: string) => m !== user.username);
  await community.save();

  return NextResponse.json({ success: true, members: community.members });
}
