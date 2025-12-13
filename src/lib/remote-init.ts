import { spawn, ChildProcess } from "child_process";
import http from "http";
import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";

// puppeteer.use(StealthPlugin());
// @ts-ignore
import waitPort from "wait-port";

// Interface for active session data
interface ActiveSession {
  browser: Browser;
  page: Page;
  ngrokProc: ChildProcess;
  ngrokUrl: string;
  proxyServer: http.Server;
  ownerId: string;
  createdAt: number;
}

const activeSessions = new Map<string, ActiveSession>();

async function startPuppeteerBrowser(): Promise<Browser> {
  // force display env var to ensure chrome finds Xvfb
  process.env.DISPLAY = ":99";
  
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--remote-debugging-port=9222",
      "--display=:99",
      "--remote-allow-origins=*",
      "--window-size=1280,1400"
    ],
    defaultViewport: { width: 1280, height: 1400 },
    timeout: 60000,
    dumpio: true
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
      reject(new Error(`ngrok did not produce a public URL in time (45s timeout). Output: ${stdout.slice(0, 500)}`));
    }, 45000);

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
// Proxy to bypass Host header check
function startProxy(targetPort: number): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const options = {
        hostname: "127.0.0.1",
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `localhost:${targetPort}` }
      };
      
      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      });

      req.pipe(proxyReq);
      proxyReq.on("error", () => { res.writeHead(500); res.end(); });
    });

    server.on("upgrade", (req, socket, head) => {
      const options = {
        hostname: "127.0.0.1",
        port: targetPort,
        path: req.url,
        method: "GET",
        headers: { ...req.headers, host: `localhost:${targetPort}`, origin: `http://localhost:${targetPort}` }
      };

      const proxyReq = http.request(options);
      proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
        let headers = "HTTP/1.1 101 Switching Protocols\r\n";
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (Array.isArray(value)) {
            value.forEach(v => headers += `${key}: ${v}\r\n`);
          } else {
            headers += `${key}: ${value}\r\n`;
          }
        }
        headers += "\r\n";
        
        socket.write(headers);
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
      });
      proxyReq.on("error", () => socket.end());
      proxyReq.end();
    });

    // Listen on a random port or fixed, let's use 0 for random (ngrok finds it)
    // Actually fixed 9223 is safer for now to align with known range
    server.listen(9223, () => {
      console.log(`[Proxy] Listening on 9223 -> Rewriting Host to localhost:${targetPort}`);
      resolve(server);
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
  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch (err: any) {
    console.error(`[Remote] Warning: Navigation to ${targetUrl} failed or timed out:`, err.message);
    // Continue anyway - user can interact manually
  }

  // ensure devtools remote port listening
  console.log("[Remote] Waiting for port 9222...");
  await waitPort({ host: "127.0.0.1", port: 9222, timeout: 15000 });

  // start proxy to bypass Host check
  console.log("[Remote] Starting Proxy...");
  const proxyServer = await startProxy(9222);

  // start ngrok pointing to PROXY (9223)
  console.log("[Remote] Starting Ngrok...");
  const { proc, url } = await startNgrok(9223);

  const sessionId = Math.random().toString(36).slice(2, 10);
  activeSessions.set(sessionId, { browser, page, ngrokProc: proc, ngrokUrl: url, proxyServer, ownerId, createdAt: Date.now() });

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
  try { s.proxyServer.close(); } catch (e) {}
  activeSessions.delete(sessionId);
}
