import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Follow from "@/models/Follow";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        await connectDB();
        const { username } = await params;
        const user = await User.findOne({
            $or: [
                { username: username },
                { studentId: username }
            ]
        });

        if (!user) {
            return NextResponse.json({ msg: "User not found" }, { status: 404 });
        }

        const following = await Follow.find({ followerId: user._id })
            .populate("followingId", "name displayName username studentId avatarUrl role")
            .sort({ createdAt: -1 })
            .limit(50);

        const users = following.map(f => f.followingId);

        return NextResponse.json({ users });
    } catch (err) {
        console.error("Get following error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
