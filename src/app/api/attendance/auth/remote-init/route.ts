import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { startTunnel } from "@/lib/ngrok-tunnel";

export async function POST(req: NextRequest) {
  try {
    console.log(">> [Remote Init] Starting remote browser session...");

    // 1. Launch Puppeteer with remote debugging enabled
    const browser = await puppeteer.launch({
      headless: false, // Show browser window on server
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--remote-debugging-port=9222", // Enable DevTools Protocol
        "--window-size=1280,800"
      ],
      dumpio: true
    });

    console.log(">> [Remote Init] Browser launched with remote debugging on port 9222");

    // 2. Navigate to CyberVidya
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto("https://kiet.cybervidya.net/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    console.log(">> [Remote Init] Navigated to CyberVidya");

    // 3. Start ngrok tunnel
    const sessionId = `remote_${Date.now()}`;
    const tunnelUrl = await startTunnel(sessionId);

    // Store browser reference globally for cleanup
    (globalThis as any).remoteBrowser = browser;

    return NextResponse.json({
      sessionId,
      tunnelUrl: `${tunnelUrl}/devtools/inspector.html`,
      message: "Remote browser started. Open the link in a new tab to control it."
    });
  } catch (err: any) {
    console.error("[Remote Init Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to start remote browser" },
      { status: 500 }
    );
  }
}
