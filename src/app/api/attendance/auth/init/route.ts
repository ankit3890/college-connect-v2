import { NextResponse } from "next/server";
import { initSession } from "@/lib/puppeteer-auth";

export async function POST(req: Request) {
  try {
    const data = await initSession();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Init Session Error:", err);
    return NextResponse.json(
      { error: "Failed to initialize standard browser session: " + err.message },
      { status: 500 }
    );
  }
}
