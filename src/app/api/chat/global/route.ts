import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GlobalChat from "@/models/GlobalChat";
import { getAuthUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  await connectDB();
  // Return last 50 messages
  const messages = await GlobalChat.find({}).sort({ createdAt: -1 }).limit(50);
  return NextResponse.json(messages.reverse());
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { text, image } = body;

  await connectDB();
  const message = await GlobalChat.create({
    user: user.username,
    text,
    image,
  });

  return NextResponse.json(message);
}
