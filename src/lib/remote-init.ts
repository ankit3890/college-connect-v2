import { spawn, ChildProcess } from "child_process";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";

puppeteer.use(StealthPlugin());
// @ts-ignore
import waitPort from "wait-port";

// Interface for active session data
interface ActiveSession {
  browser: Browser;
  page: Page;
  ngrokProc: ChildProcess;
  ngrokUrl: string;
  ownerId: string;
  createdAt: number;
}

const activeSessions = new Map<string, ActiveSession>();

async function startPuppeteerBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable",
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--remote-debugging-port=9222",
      "--window-size=1920,1080"
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });
  return browser;
}

// start ngrok CLI and resolve when public url appears (short TTL is caller's responsibility)
function startNgrok(port = 9222): Promise<{ proc: ChildProcess; url: string }> {
  return new Promise((resolve, reject) => {
    // Support both naming conventions
    const authtoken = process.env.NGROK_AUTHTOKEN || process.env.NGROK_AUTH_TOKEN;
    if (!authtoken) return reject(new Error("NGROK_AUTHTOKEN not set in env"));

    const args = ["http", String(port), `--authtoken=${authtoken}`, "--scheme=https", "--log=stdout"];
    // Using default linux path or fallback
    const ngrokPath = "/usr/local/bin/ngrok"; 
    
    console.log(`[Ngrok] Spawning ${ngrokPath} with args:`, args);
    const proc = spawn(ngrokPath, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("ngrok did not produce a public URL in time (15s timeout)"));
    }, 15000);

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
      // ngrok writes a line with "url=" in some versions; also check for "url=https://..."
      const m = stdout.match(/(https?:\/\/[0-9a-z\-\.]+ngrok\.io[^\s]*)/i) || 
                stdout.match(/url=(https?:\/\/[^\s]+)/i) ||
                stdout.match(/(https:\/\/[0-9a-z-]+\.ngrok-free\.app)/i);
      
      if (m) {
        clearTimeout(timeout);
        // Clean up if it captured 'url=' prefix in group
        let url = m[1];
        if (url.startsWith('url=')) url = url.substring(4);
        
        console.log(`[Ngrok] Tunnel established at ${url}`);
        resolve({ proc, url });
      }
    });

    proc.stderr.on("data", (d) => console.error("[ngrok err]", d.toString()));
    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function startSession({ ownerId, loginUrl }: { ownerId: string; loginUrl?: string }) {
  console.log(`[Remote] Starting session for ${ownerId}...`);
  const browser = await startPuppeteerBrowser();
  const pages = await browser.pages();
  const page = pages.length ? pages[0] : await browser.newPage();

  // navigate to login page so user can interact
  const targetUrl = loginUrl || process.env.CYBER_LOGIN_URL || "https://google.com";
  console.log(`[Remote] Navigating to ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  // ensure devtools remote port listening
  console.log("[Remote] Waiting for port 9222...");
  await waitPort({ host: "127.0.0.1", port: 9222, timeout: 15000 });

  // start ngrok to expose devtools
  console.log("[Remote] Starting Ngrok...");
  const { proc, url } = await startNgrok(9222);

  const sessionId = Math.random().toString(36).slice(2, 10);
  activeSessions.set(sessionId, { browser, page, ngrokProc: proc, ngrokUrl: url, ownerId, createdAt: Date.now() });

  // set an automatic cleanup (e.g., 6 minutes)
  setTimeout(() => cleanupSession(sessionId), 1000 * 60 * 6);

  console.log(`[Remote] Session ready: ${sessionId} -> ${url}`);
  return { sessionId, devtoolsUrl: url };
}

export async function captureToken(sessionId: string) {
  const s = activeSessions.get(sessionId);
  if (!s) throw new Error("session not found");

  try {
    const pages = await s.browser.pages();
    const main = pages[0];

    // try cookies
    const cookies = await main.cookies();
    const tokenCookie = cookies.find(c => /token|session|auth/i.test(c.name));
    let token = tokenCookie?.value;

    // try localStorage if not found
    if (!token) {
      try {
        token = await main.evaluate(() => {
          try {
            return localStorage.getItem("authToken") || localStorage.getItem("token") || null;
          } catch (e) { return null; }
        });
      } catch (e) { /* ignore */ }
    }

    if (token) {
      // TODO: securely store token (DB) — not implemented here
      await cleanupSession(sessionId);
      return { ok: true, token };
    } else {
      return { ok: false, message: "token not found yet" };
    }
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function cleanupSession(sessionId: string) {
  const s = activeSessions.get(sessionId);
  if (!s) return;
  
  console.log(`[Remote] Cleaning up session ${sessionId}`);
  try { await s.browser.close(); } catch (e) {}
  try { s.ngrokProc.kill(); } catch (e) {}
  activeSessions.delete(sessionId);
}
