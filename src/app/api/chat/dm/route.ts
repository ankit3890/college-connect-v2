import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DirectMessage from "@/models/DirectMessage";
import { getAuthUser } from "@/lib/serverAuth";
// Need User model to get username from ID
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const tokenPayload = await getAuthUser(req);
  if (!tokenPayload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  await connectDB();
  const user = await User.findById(tokenPayload.id);
  // Fallback to tokenPayload.studentId if username missing? No, chat needs username.
  if(!user || !user.username) return NextResponse.json({ error: "User not found or no username" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const partner = searchParams.get("partner");
  
  if(partner) {
      // Get messages between user and partner: (from=me AND to=partner) OR (from=partner AND to=me)
      const messages = await DirectMessage.find({
          $or: [
              { from: user.username, to: partner },
              { from: partner, to: user.username }
          ]
      }).sort({ createdAt: 1 });
      return NextResponse.json(messages);
  } else {
      // List conversations (unique partners)
      // 1. Sent messages
      const sent = await DirectMessage.find({ from: user.username }).distinct("to");
      // 2. Received messages
      const received = await DirectMessage.find({ to: user.username }).distinct("from");
      
      const allPartners = Array.from(new Set([...sent, ...received]));
      
      // Fetch last message for each partner
      const conversations = [];
      for(const p of allPartners) {
          const lastMsg = await DirectMessage.findOne({
              $or: [
                  { from: user.username, to: p },
                  { from: p, to: user.username }
              ]
          }).sort({ createdAt: -1 });
          
          if(lastMsg) {
              conversations.push({ 
                  partner: p, 
                  lastMessage: lastMsg.text, 
                  lastTime: lastMsg.createdAt,
                  read: lastMsg.to === user.username ? lastMsg.read : true
              });
          }
      }
      
      // Sort by lastTime desc
      conversations.sort((a,b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
      
      return NextResponse.json(conversations);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tokenPayload = await getAuthUser(req);
    if (!tokenPayload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { to, text, image } = body;

    // Must have either text or image
    if (!to || (!text && !image)) {
        return NextResponse.json({ error: "Missing 'to' or content ('text'/'image')" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(tokenPayload.id);
    if(!user || !user.username) return NextResponse.json({ error: "User profile incomplete" }, { status: 401 });

    const dm = await DirectMessage.create({
      from: user.username,
      to,
      text: text || "",
      image,
      read: false
    });

    return NextResponse.json(dm);
  } catch (err: any) {
    console.error("DM POST Error:", err);
    return NextResponse.json({ error: "Server Error: " + err.message }, { status: 500 });
  }
}
