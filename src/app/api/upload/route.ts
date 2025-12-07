import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Sanitize filename
    const filename = Date.now() + "_" + file.name.replace(/\s/g, '_');
    
    // Save to the shared backend uploads folder
    const uploadDir = path.join(process.cwd(), "community-chat", "backend", "uploads");
    
    await writeFile(path.join(uploadDir, filename), buffer);

    // Return the URL that our new proxy route handles
    const fileUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ url: fileUrl });
  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
