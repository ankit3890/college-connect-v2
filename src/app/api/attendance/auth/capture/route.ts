import { NextRequest, NextResponse } from "next/server";
import { checkSession } from "@/lib/puppeteer-auth";
import { stopTunnel } from "@/lib/ngrok-tunnel";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // Check if user has logged in
    const result = await checkSession(sessionId);

    if (result) {
      // Login detected! Close the tunnel
      console.log(">> [Capture] Login detected, closing tunnel...");
      await stopTunnel();

      // Close the remote browser
      if ((globalThis as any).remoteBrowser) {
        try {
          await (globalThis as any).remoteBrowser.close();
          (globalThis as any).remoteBrowser = null;
        } catch (e) {
          console.error("Failed to close browser:", e);
        }
      }

      return NextResponse.json({
        loggedIn: true,
        token: result.token,
        uid: result.uid,
        authPref: result.authPref
      });
    }

    return NextResponse.json({ loggedIn: false });
  } catch (err: any) {
    console.error("[Capture Error]", err);
    return NextResponse.json(
      { error: err.message || "Capture failed" },
      { status: 500 }
    );
  }
}
