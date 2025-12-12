import { NextRequest, NextResponse } from "next/server";
import { captureToken } from "@/lib/remote-init";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    // Basic Auth Check (optional if capture is public, but safer to check)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid Token" }, { status: 401 });
    }

    const result = await captureToken(params.sessionId);
    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
