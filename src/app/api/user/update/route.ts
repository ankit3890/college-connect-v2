import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const formData = await req.formData();
    const username = formData.get("username") as string;
    const about = formData.get("about") as string;
    const hobbies = formData.get("hobbies") as string;
    const avatar = formData.get("avatar") as File;
    
    if(!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

    const updateData: any = {};
    if(about !== undefined) updateData.about = about;
    if(hobbies !== undefined) updateData.hobbies = hobbies;

    if(avatar) {
        const bytes = await avatar.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}_${avatar.name}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await writeFile(path.join(uploadDir, filename), buffer);
        updateData.avatar = `/uploads/${filename}`;
    }

    await User.findOneAndUpdate({ username }, updateData);
    
    return NextResponse.json({ success: true, msg: "Profile updated" });
  } catch(e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
