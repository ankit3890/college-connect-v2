import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        await connectDB();

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return NextResponse.json({ msg: "Not logged in" }, { status: 401 });

        const decoded = verifyToken<{ id: string }>(token);
        if (!decoded) return NextResponse.json({ msg: "Invalid token" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) return NextResponse.json({ msg: "No file uploaded" }, { status: 400 });

        // 1. Validate file size (Max 2MB)
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ msg: "File too large. Max 2MB allowed." }, { status: 400 });
        }

        // 2. Validate file type (image only)
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ msg: "File must be an image" }, { status: 400 });
        }

        // 3. Convert to Base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64Image}`;

        // 4. Update user avatarUrl in MongoDB
        await User.findByIdAndUpdate(
            decoded.id,
            { avatarUrl: dataUrl },
            { new: true }
        );

        return NextResponse.json({ msg: "Avatar updated", avatarUrl: dataUrl });
    } catch (err) {
        console.error("Avatar upload error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();

        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return NextResponse.json({ msg: "Not logged in" }, { status: 401 });

        const decoded = verifyToken<{ id: string }>(token);
        if (!decoded) return NextResponse.json({ msg: "Invalid token" }, { status: 401 });

        // Update user avatarUrl to empty string
        await User.findByIdAndUpdate(
            decoded.id,
            { $unset: { avatarUrl: 1 } },
            { new: true }
        );

        return NextResponse.json({ msg: "Avatar removed" });
    } catch (err) {
        console.error("Avatar remove error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
