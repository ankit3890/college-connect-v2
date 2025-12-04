import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';


export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        await connectDB();
        const { username } = await params;

        // Find user by username OR studentId (both are unique identifiers)
        // We also need to check if profile is public
        const user = await User.findOne({
            $or: [
                { username: username },
                { studentId: username }
            ]
        });

        if (!user) {
            return NextResponse.json({ msg: "User not found" }, { status: 404 });
        }

        // Check privacy
        let isOwner = false;
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get("token")?.value;
            if (token) {
                const decoded = verifyToken<{ id: string }>(token);
                if (decoded && decoded.id === user._id.toString()) {
                    isOwner = true;
                }
            }
        } catch (e) {
            // Ignore token errors, treat as guest
        }

        if (user.isPublicProfile === false && !isOwner) {
            return NextResponse.json({ msg: "Profile is private" }, { status: 403 });
        }

        // Return safe fields only
        const publicProfile = {
            name: user.name, // college name (read-only)
            displayName: user.displayName || "",
            username: user.username,
            email: user.email, // Exposed as per user request for "college mail"
            studentId: user.studentId, // CyberVidya ID

            branch: user.branch,
            year: user.year,
            gender: user.gender,

            avatarUrl: user.avatarUrl,
            bannerUrl: user.bannerUrl,
            accentColor: user.accentColor,
            bio: user.bio,
            statusText: user.statusText,
            interests: user.interests || [],
            skills: user.skills || [],
            socials: user.socials || {},

            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0,

            createdAt: user.createdAt,
            updatedAt: user.updatedAt,

            // Include role for badges
            role: user.role,
            hasSyncedFromCyberVidya: user.hasSyncedFromCyberVidya,
            showBranchYear: user.showBranchYear,
        };

        return NextResponse.json({ profile: publicProfile });
    } catch (err) {
        console.error("GET /api/profile/[username] error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
