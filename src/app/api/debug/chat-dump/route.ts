import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DirectMessage from "@/models/DirectMessage";
import RoomMessage from "@/models/RoomMessage";

export async function GET() {
  try {
    await connectDB();
    const dms = await DirectMessage.find({}).limit(50);
    const rooms = await RoomMessage.find({}).limit(50);
    return NextResponse.json({ 
        count_dms: dms.length, 
        dms,
        count_rooms: rooms.length,
        rooms 
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
