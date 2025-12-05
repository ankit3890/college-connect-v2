import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ users: [] });
        }

        const regex = new RegExp(query.trim(), "i"); // case-insensitive

        const users = await User.find({
            $or: [
                { name: { $regex: regex } },
                { username: { $regex: regex } },
                { studentId: { $regex: regex } },
                { firstName: { $regex: regex } },
                { lastName: { $regex: regex } }
            ]
        })
            .select("name username studentId avatarUrl profilePhoto role")
            .limit(8)
            .lean();

        // Map profilePhoto to avatarUrl if needed, consistent with other endpoints
        const formattedUsers = users.map(user => ({
            _id: user._id,
            name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            username: user.username,
            studentId: user.studentId,
            avatarUrl: user.profilePhoto || user.avatarUrl, // Handle both fields
            role: user.role
        }));

        return NextResponse.json({ users: formattedUsers });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ users: [] }, { status: 500 });
    }
}
