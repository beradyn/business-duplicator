import express from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const port = Number(process.env.GATEWAY_PORT ?? 18765);
const host = "127.0.0.1"; // Never expose directly to the internet.
const token = process.env.GATEWAY_TOKEN;
if (!token || token.length < 32) throw new Error("Set a random GATEWAY_TOKEN (32+ characters).");
const entry = resolve(process.env.MCP_ENTRY ?? fileURLToPath(new URL("../../../roblox-executor-mcp-main/roblox-executor-mcp-main/dist/index.js", import.meta.url)));
if (!existsSync(entry)) throw new Error("Build the existing Roblox MCP server first: " + entry);

const upstream = new Client({ name: "business-duplicator-gateway", version: "0.1.0" });
const upstreamTransport = new StdioClientTransport({ command: process.execPath, args: [entry], stderr: "pipe" });
upstreamTransport.stderr?.on("data", chunk => console.error("[roblox-mcp]", chunk.toString().slice(0, 2000)));
await upstream.connect(upstreamTransport);
const available = await upstream.listTools();
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

const SAFE_TOOLS = new Set(["list-clients", "get-game-info", "get-console-output", "search-instances", "get-descendants-tree", "get-script-content", "script-grep", "semantic-search-scripts", "list-roblox-windows", "get-remote-spy-logs", "execute"]);
const captureAirplay = {
  name: "capture-airplay-screen",
  description: "Capture a screenshot of the visible AirPlay Video Stream window on the Windows gateway PC. Only use when the user asks to see their mirrored iPhone screen. The mirror window must be visible and unobstructed.",
  inputSchema: { type: "object" as const, properties: {}, additionalProperties: false }
};
const allowed = [...available.tools.filter(t => SAFE_TOOLS.has(t.name)), captureAirplay];
const execFileAsync = promisify(execFile);
function authenticated(header: string | undefined) {
  const expected = Buffer.from("Bearer " + token);
  const received = Buffer.from(header ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
function createMcpServer() {
  const server = new Server({ name: "business-duplicator-remote", version: "0.1.0" }, {
    capabilities: { tools: {} }
  });
  // Reuse the actual MCP JSON schemas, including nested/number/boolean inputs.
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allowed }));
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const name = request.params.name;
    if (name === "capture-airplay-screen") {
      if (process.platform !== "win32") return { isError: true, content: [{ type: "text" as const, text: "AirPlay capture requires Windows." }] };
      try {
        const script = fileURLToPath(new URL("../src/capture-airplay.ps1", import.meta.url));
        const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", script], { timeout: 15000, maxBuffer: 12 * 1024 * 1024, windowsHide: true });
        const data = stdout.trim();
        if (!data || !/^[A-Za-z0-9+/=]+$/.test(data)) throw new Error("Invalid screenshot data");
        return { content: [{ type: "image" as const, data, mimeType: "image/png" }] };
      } catch (error) {
        console.error("AirPlay screenshot failed:", error instanceof Error ? error.message : "unknown error");
        return { isError: true, content: [{ type: "text" as const, text: "Could not capture AirPlay window. Ensure the AirPlay Video Stream window is visible and not minimized." }] };
      }
    }
    if (!SAFE_TOOLS.has(name) || !allowed.some(t => t.name === name)) {
      return { isError: true, content: [{ type: "text" as const, text: "Tool not permitted." }] };
    }
    try {
      const result = await upstream.callTool({ name, arguments: request.params.arguments ?? {} });
      return result;
    } catch (error) {
      console.error("Upstream tool failed:", name);
      return { isError: true, content: [{ type: "text" as const, text: "Upstream tool call failed." }] };
    }
  });
  return server;
}
app.all("/mcp", async (req, res) => {
  if (!authenticated(req.headers.authorization)) { res.status(401).json({ error: "Unauthorized" }); return; }
  // Stateless transport: one MCP session per request. No public exposure or OAuth yet.
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("finish", () => { void transport.close(); void server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed:", error);
    if (!res.headersSent) res.status(500).json({ error: "MCP gateway failure" });
  }
});
app.get("/health", (_req, res) => res.json({ ok: true, toolCount: allowed.length }));
const listener = app.listen(port, host, () => console.log(`Local MCP gateway listening at http://${host}:${port}/mcp; exposed tools: ${allowed.length}`));
async function shutdown() {
  listener.close();
  await upstream.close().catch(() => {});
  await upstreamTransport.close().catch(() => {});
  process.exit(0);
}
process.on("SIGINT", () => { void shutdown(); });
process.on("SIGTERM", () => { void shutdown(); });
