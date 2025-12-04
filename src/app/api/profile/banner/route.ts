import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

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

        // Validate file type (image only)
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ msg: "File must be an image" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public/uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `banner-${decoded.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const filePath = path.join(uploadDir, filename);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFileSync(filePath, buffer);

        const publicUrl = `/uploads/${filename}`;

        // Update user bannerUrl
        await User.findByIdAndUpdate(
            decoded.id,
            { bannerUrl: publicUrl },
            { new: true }
        );

        return NextResponse.json({ msg: "Banner updated", bannerUrl: publicUrl });
    } catch (err) {
        console.error("Banner upload error:", err);
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

        // Update user bannerUrl to empty string
        await User.findByIdAndUpdate(
            decoded.id,
            { $unset: { bannerUrl: 1 } },
            { new: true }
        );

        return NextResponse.json({ msg: "Banner removed" });
    } catch (err) {
        console.error("Banner remove error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
