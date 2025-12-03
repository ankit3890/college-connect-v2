import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import User from "../../../../models/User";
import AdminLog from "../../../../models/AdminLog";

interface TokenPayload {
    id: string;
    studentId: string;
}

function getTokenFromRequest(req: Request): string | null {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return null;

    const parts = cookieHeader.split(";").map((p) => p.trim());
    for (const part of parts) {
        if (part.startsWith("token=")) {
            return decodeURIComponent(part.substring("token=".length));
        }
    }
    return null;
}

export async function POST(req: Request) {
    try {
        await connectDB();

        const token = getTokenFromRequest(req);
        if (!token) {
            return NextResponse.json({ msg: "Not logged in" }, { status: 401 });
        }

        const decoded = verifyToken<TokenPayload>(token);
        if (!decoded) {
            return NextResponse.json({ msg: "Invalid token" }, { status: 401 });
        }

        const adminUser = await User.findById(decoded.id);
        if (!adminUser || adminUser.role !== "superadmin") {
            return NextResponse.json(
                { msg: "Only superadmin can delete users" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ msg: "userId is required" }, { status: 400 });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json({ msg: "User not found" }, { status: 404 });
        }

        // 🔒 Security: Super Admin CANNOT delete other Admins or Super Admins
        if (targetUser.role === "admin" || targetUser.role === "superadmin") {
            return NextResponse.json(
                { msg: "Cannot delete admin or superadmin accounts" },
                { status: 403 }
            );
        }

        await User.findByIdAndDelete(userId);

        // Log DELETE_USER
        await AdminLog.create({
            action: "DELETE_USER",
            actorId: adminUser._id,
            actorStudentId: adminUser.studentId,
            actorRole: adminUser.role,
            targetUserId: targetUser._id,
            targetStudentId: targetUser.studentId,
            details: `Deleted user ${targetUser.studentId} (${targetUser.email})`,
            metadata: {
                deletedUserRole: targetUser.role,
            },
        });

        return NextResponse.json({ msg: "User deleted successfully" });
    } catch (err) {
        console.error("POST /api/admin/delete-user error:", err);
        return NextResponse.json({ msg: "Server error" }, { status: 500 });
    }
}
