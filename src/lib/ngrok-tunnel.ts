import ngrok from '@ngrok/ngrok';

interface TunnelSession {
  url: string;
  sessionId: string;
  listener: any;
  timestamp: number;
}

declare global {
  var ngrokTunnel: TunnelSession | null;
}

if (!globalThis.ngrokTunnel) {
  globalThis.ngrokTunnel = null;
}

/**
 * Start an ngrok tunnel to the Puppeteer remote debugging port
 */
export async function startTunnel(sessionId: string): Promise<string> {
  // Close any existing tunnel
  if (globalThis.ngrokTunnel?.listener) {
    try {
      await globalThis.ngrokTunnel.listener.close();
    } catch (e) {
      console.error("Failed to close old tunnel:", e);
    }
    globalThis.ngrokTunnel = null;
  }

  // Get authtoken from environment
  const authToken = process.env.NGROK_AUTH_TOKEN;
  if (!authToken) {
    throw new Error("NGROK_AUTH_TOKEN not found in environment variables");
  }

  // Start tunnel to remote debugging port using new API
  const listener = await ngrok.forward({
    addr: 9222,
    authtoken: authToken,
  });

  const url = listener.url() || '';
  console.log(`>> [Ngrok] Tunnel started: ${url}`);

  globalThis.ngrokTunnel = {
    url,
    sessionId,
    listener,
    timestamp: Date.now()
  };

  return url;
}

/**
 * Stop the active tunnel
 */
export async function stopTunnel() {
  if (!globalThis.ngrokTunnel?.listener) return;

  try {
    await globalThis.ngrokTunnel.listener.close();
    console.log(">> [Ngrok] Tunnel closed");
  } catch (e) {
    console.error("Failed to stop tunnel:", e);
  }

  globalThis.ngrokTunnel = null;
}

/**
 * Get the current tunnel URL
 */
export function getTunnelUrl(): string | null {
  return globalThis.ngrokTunnel?.url || null;
}
