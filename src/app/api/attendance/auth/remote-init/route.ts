import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/remote-init";

export async function POST(req: NextRequest) {
  try {
    console.log(">> [Remote Init] Starting remote browser session via lib/remote-init...");

    // Use our robust library implementation
    const { sessionId, devtoolsUrl } = await startSession({
      ownerId: "admin", // Default owner for this flow
      loginUrl: "https://kiet.cybervidya.net/"
    });

    return NextResponse.json({
      sessionId,
      tunnelUrl: `${devtoolsUrl}/devtools/inspector.html?wss=${devtoolsUrl.replace("https://", "")}/devtools/browser/${sessionId}`,
      // Note: devtoolsUrl from ngrok is https://... 
      // The inspector expects wss= param to connect to websocket. 
      // However, startSession returns the base URL. 
      // Let's just return the raw URL for now and let frontend handle or constructing simple inspector link.
      // Better yet, startSession returns { devtoolsUrl } which is the base inspector URL or the ngrok URL.
      // Let's inspect what startSession returns. It returns { devtoolsUrl: url } where url is https://<ngrok-id>.ngrok-free.app
      
      // Constructing a direct clickable link for the user:
      // Chrome DevTools Inspector URL pattern: 
      // https://<ngrok-url>/devtools/inspector.html?wss=<ngrok-url-no-protocol>/devtools/browser/<uuid>
      // But we don't have the browser UUID easily available here unless we fetch it.
      // Actually, relying on just the root URL is safer, let the user click the link in the UI.
      
      // Reverting to match previous API response shape as best as possible:
      message: "Remote browser started. Open the link below.",
      // Override tunnelUrl to be just the base URL if that's what works, or the full thing. 
      // The previous code returned `${tunnelUrl}/devtools/inspector.html` implies tunnelUrl was the root.
      inspectionUrl: devtoolsUrl 
    });
  } catch (err: any) {
    console.error("[Remote Init Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to start remote browser" },
      { status: 500 }
    );
  }
}
