import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RoomMessage from "@/models/RoomMessage";
import { getAuthUser } from "@/lib/serverAuth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
      const user = await getAuthUser(req);
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { id } = await params;
      const { text } = await req.json();

      if(!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

      await connectDB();
      
      const msg = await RoomMessage.create({
          room: id,
          sender: user.username,
          text
      });
      
      return NextResponse.json(msg);
  } catch (err: any) {
      console.error("Room POST Error:", err);
      return NextResponse.json({ error: "Server Error: " + err.message }, { status: 500 });
  }
}
