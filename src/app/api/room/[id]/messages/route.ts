import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RoomMessage from "@/models/RoomMessage";
import { getAuthUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params; // Unwrapping params for Next 15

  await connectDB();
  
  // could verify membership here too
  const messages = await RoomMessage.find({ room: id }).sort({ createdAt: 1 });
  
  return NextResponse.json(messages);
}
