import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PrivateRoom from "@/models/PrivateRoom";
import { getAuthUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const rooms = await PrivateRoom.find({ members: user.username });
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, members } = await req.json(); // members = array of usernames
  
  await connectDB();
  const allMembers = Array.from(new Set([user.username, ...(members || [])]));
  
  const room = await PrivateRoom.create({
      name,
      owner: user.username,
      members: allMembers
  });
  
  return NextResponse.json(room);
}
