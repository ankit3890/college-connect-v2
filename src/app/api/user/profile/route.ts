import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username } = await req.json();
    
    if(!username) return NextResponse.json({ error: "Username required" }, { status: 400 });
    
    const user = await User.findOne({ username }).select("username avatar about hobbies");
    
    if(!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    return NextResponse.json({ success: true, data: user });
  } catch(e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
