import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const notifications = await Notification.find({ user: user.username })
    .sort({ createdAt: -1 })
    .limit(20);
    
  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
    // Mark as read
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await req.json();
  await connectDB();
  
  if(id === 'all') {
      await Notification.updateMany({ user: user.username }, { read: true });
  } else {
      await Notification.findByIdAndUpdate(id, { read: true });
  }
  
  return NextResponse.json({ success: true });
}
