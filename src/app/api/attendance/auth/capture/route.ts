import { cleanupSession, captureToken } from "@/lib/remote-init";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // Check if user has logged in (using our new logic)
    // Actually, captureToken does exactly this: checks page URL/cookies.
    // However, the previous logic used checkSession from puppeteer-auth.
    // Let's stick to the new system.
    
    // We can try to capture the token.
    const result = await captureToken(sessionId);
    
    if (result.ok && result.token) {
       // Login success! Clean up resources
       console.log(`>> [Capture] Token captured for ${sessionId}, cleaning up...`);
       await cleanupSession(sessionId);
       
       return NextResponse.json({
         loggedIn: true,
         token: result.token,
         // Mapping new result shape to old response shape
         uid: "admin", // The new logic doesn't return UID yet, mocking for now or extracting if available
         authPref: "token"
       });
    }

    // If captureToken returned ok:false, likely not logged in yet or session invalid.
    return NextResponse.json({ loggedIn: false });


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
