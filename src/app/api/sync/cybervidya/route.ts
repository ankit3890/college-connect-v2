// src/app/api/sync/cybervidya/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { getProfileFromCyberVidya } from "@/lib/cybervidya";

interface TokenPayload {
  id: string;
  studentId: string;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const jwtToken = cookieStore.get("token")?.value;

    if (!jwtToken) {
      return NextResponse.json({ msg: "Not logged in" }, { status: 401 });
    }

    const decoded = verifyToken<TokenPayload>(jwtToken);
    if (!decoded) {
      return NextResponse.json({ msg: "Invalid token" }, { status: 401 });
    }

    const { cyberId, cyberPass, token, uid, authPref } = await req.json();

    // We allow either Credentials OR Token
    if ( (!cyberId || !cyberPass) && (!token || !uid) ) {
      return NextResponse.json(
        { msg: "Missing CyberVidya credentials or session token" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch profile from CyberVidya
    let session = undefined;
    if (token && uid) {
        session = { token, uid, authPref: authPref || "GlobalEducation " };
    }
    
    const profile = await getProfileFromCyberVidya(cyberId || "", cyberPass || "", session);
    console.log("CyberVidya profile object:", profile);

    if (!profile) {
      return NextResponse.json(
        { msg: "Could not verify CyberVidya credentials or session" },
        { status: 400 }
      );
    }

    // The ID we want to bind to this user (studentId + cyberUserName)
    const cyberStudentId: string =
      profile.userName || cyberId; // userName: '202501100300040'

    // 2️⃣ Load current logged-in user
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    // 3️⃣ Check if this CyberVidya ID is already linked to another account
    const existing = await User.findOne({
      _id: { $ne: user._id }, // some OTHER user
      $or: [
        { studentId: cyberStudentId },
        { cyberUserName: cyberStudentId },
      ],
    });

    if (existing) {
      console.log(`⚠️ Conflict detected! Student ID ${cyberStudentId} is linked to User ${existing._id}. Unlinking old account.`);
      
      // Unlink the old account to allow the new one to take over
      existing.studentId = undefined;
      (existing as any).cyberUserName = undefined; // Create a type-safe interface if needed, or cast
      existing.hasSyncedFromCyberVidya = false;
      await existing.save();
      
      // We do NOT return error anymore. We proceed to link the current user.
    }

    // 4️⃣ Map CyberVidya fields → your User model
    if (profile.name) user.name = profile.name;
    if (profile.branch) user.branch = profile.branch;
    if (typeof profile.year === "number") user.year = profile.year;

    if (profile.firstName) (user as any).firstName = profile.firstName;
    if (profile.lastName) (user as any).lastName = profile.lastName;

    // ❌ Do NOT blindly overwrite email (to avoid duplicate key on email_1)
    // If you want to sync email later, do a uniqueness check first.
    // if (profile.email && profile.email !== user.email) { ... }

    if (profile.mobileNumber) user.mobileNumber = profile.mobileNumber;
    if (profile.dateOfBirth) (user as any).dateOfBirth = profile.dateOfBirth;
    if (profile.gender) user.gender = profile.gender;
    if (profile.profilePhoto) (user as any).profilePhoto = profile.profilePhoto;

    // 🔗 5️⃣ Force studentId & cyberUserName to be same as CyberVidya ID
    user.studentId = cyberStudentId;
    (user as any).cyberUserName = cyberStudentId;

    // 6️⃣ Map roles like "ROLE4STUDENT" → "student" etc.
    if (profile.roles) {
      const roleStr = String(profile.roles).toUpperCase();

      if (roleStr === "ROLE4STUDENT") {
        user.role = "student";
      } else if (roleStr.includes("ADMIN")) {
        user.role = roleStr.includes("SUPER") ? "superadmin" : "admin";
      } else {
        user.role = user.role || "student";
      }
    }

    user.hasSyncedFromCyberVidya = true;

    await user.save();

    // 7️⃣ Re-fetch without passwordHash before returning
    const safeUser = await User.findById(user._id).select("-passwordHash");

    console.log("Updated Mongo user (after sync):", safeUser);

    return NextResponse.json({
      msg: "Profile synced from CyberVidya",
      user: safeUser,
      profile,
    });
  } catch (err) {
    console.error("POST /api/sync/cybervidya error:", err);
    return NextResponse.json({ msg: "Server error" }, { status: 500 });
  }
}
