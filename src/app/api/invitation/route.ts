import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Invitation from "@/models/Invitation";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/lib/serverAuth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { username, communityName } = body;

  await connectDB();
  const invitation = await Invitation.create({
    from: user.username,
    to: username,
    community: communityName,
    status: "pending",
  });
  
  // Create notification
  await Notification.create({
      user: username,
      type: "invite",
      message: `You have been invited to join r/${communityName}`,
      invitationId: invitation._id.toString()
  });

  return NextResponse.json({ success: true });
}
