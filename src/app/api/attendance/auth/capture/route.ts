import { NextRequest, NextResponse } from "next/server";
import { cleanupSession, captureToken } from "@/lib/remote-init";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // Attempt to capture token
    const result = await captureToken(sessionId);
    
    if (result.ok && result.token) {
       // Login success! Clean up resources
       console.log(`>> [Capture] Token captured for ${sessionId}, cleaning up...`);
       await cleanupSession(sessionId);
       
       return NextResponse.json({
         loggedIn: true,
         token: result.token,
         uid: "admin", // Mock/Default
         authPref: "token"
       });
    }

    // Not logged in yet
    return NextResponse.json({ loggedIn: false });

  } catch (err: any) {
    console.error("[Capture Error]", err);
    return NextResponse.json(
      { error: err.message || "Capture failed" },
      { status: 500 }
    );
  }
}
