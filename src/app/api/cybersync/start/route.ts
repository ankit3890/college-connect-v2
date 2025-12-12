import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/remote-init";
import { verifyToken } from "@/lib/auth"; // Assuming this exists based on previous context

export async function POST(req: NextRequest) {
  try {
    // Basic Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid Token" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, devtoolsUrl } = await startSession({
      ownerId: user.id || "unknown", // Adjust based on your AuthTokenPayload interface
      loginUrl: body.loginUrl
    });

    return NextResponse.json({ 
      ok: true, 
      sessionId, 
      devtoolsUrl, 
      note: "Open devtools URL to interact and solve CAPTCHA." 
    });

  } catch (err: any) {
    console.error("start session err", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
