import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await connectDB();
    const { name } = await params;
    
    // Case insensitive search
    const community = await Community.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json(community);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
