import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import { getAuthUser } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    await connectDB();

    if (q) {
      // Search
      const communities = await Community.find({
        name: { $regex: q, $options: "i" },
      })
        .select("name icon isVerified members isDevMember")
        .limit(10);
      return NextResponse.json(communities);
    }

    const communities = await Community.find({}).sort({ createdAt: -1 });
    return NextResponse.json(communities);
  } catch (err: any) {
    console.error("Error fetching communities:", err);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !user.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Community name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Community.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A community with this name already exists" },
        { status: 409 }
      );
    }

    const newCommunity = await Community.create({
      name,
      creator: user.username,
      description: description || "",
      icon: icon || "",
      members: [user.username],
    });

    return NextResponse.json({ success: true, community: newCommunity });
  } catch (err: any) {
    console.error("Error creating community:", err);
    return NextResponse.json(
      { error: "Failed to create community" },
      { status: 500 }
    );
  }
}
