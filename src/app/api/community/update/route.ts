import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import { getAuthUser } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, toggleStatus } = body;

  await connectDB();
  const community = await Community.findOne({ name });
  
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (community.creator !== user.username) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (toggleStatus) {
      community.isClosed = !community.isClosed;
  }
  
  if (description !== undefined) community.description = description;

  await community.save();
  return NextResponse.json({ success: true, isClosed: community.isClosed });
}
