
import { NextRequest, NextResponse } from "next/server";
import { handleInteraction } from "@/lib/puppeteer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, action, x, y } = body;

    if (!sessionId || !action || x === undefined || y === undefined) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const result = await handleInteraction(sessionId, action, x, y);
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Interact API]", err);
    return NextResponse.json({ error: err.message || "Interaction failed" }, { status: 500 });
  }
}
