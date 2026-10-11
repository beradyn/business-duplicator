import express from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

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

const SAFE_TOOLS = new Set(["list-clients", "get-game-info", "get-console-output", "search-instances", "get-descendants-tree", "get-script-content", "script-grep", "semantic-search-scripts", "list-roblox-windows", "get-remote-spy-logs"]);
const allowed = available.tools.filter(t => SAFE_TOOLS.has(t.name));
function authenticated(header: string | undefined) {
  const expected = Buffer.from("Bearer " + token);
  const received = Buffer.from(header ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
function createMcpServer() {
  const server = new McpServer({ name: "business-duplicator-remote", version: "0.1.0" });
  for (const tool of allowed) {
    // Preserve the original JSON schema using the SDK's low-level tool registration.
    server.server.setRequestHandler as unknown; // The dynamic tools below are registered through registerTool.
    const properties = (tool.inputSchema?.properties ?? {}) as Record<string, unknown>;
    const shape: Record<string, z.ZodTypeAny> = {};
    // This prototype intentionally only supports string-typed fields.
    // Unsupported schemas must not be advertised with incorrect validation.
    let supported = true;
    for (const [key, value] of Object.entries(properties)) {
      const schema = value as { type?: string };
      if (schema.type !== "string") { supported = false; break; }
      shape[key] = (tool.inputSchema.required ?? []).includes(key) ? z.string() : z.string().optional();
    }
    if (!supported) continue;
    server.registerTool(tool.name, {
      description: tool.description ?? "",
      inputSchema: shape
    }, async (args) => {
      try {
        const result = await upstream.callTool({ name: tool.name, arguments: args });
        return { content: result.content as Array<{ type: "text"; text: string }>, isError: result.isError === true };
      } catch (error) {
        return { content: [{ type: "text" as const, text: String(error) }], isError: true };
      }
    });
  }
  return server;
}
app.all("/mcp", async (req, res) => {
  if (!authenticated(req.headers.authorization)) { res.status(401).json({ error: "Unauthorized" }); return; }
  // Stateless transport: one MCP session per request. No public exposure or OAuth yet.
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => { void transport.close(); void server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed:", error);
    if (!res.headersSent) res.status(500).json({ error: "MCP gateway failure" });
  }
});
app.get("/health", (_req, res) => res.json({ ok: true, toolCount: allowed.length }));
const listener = app.listen(port, host, () => console.log(`Local MCP gateway listening at http://${host}:${port}/mcp; read-only tools: ${allowed.length}`));
async function shutdown() {
  listener.close();
  await upstream.close().catch(() => {});
  await upstreamTransport.close().catch(() => {});
  process.exit(0);
}
process.on("SIGINT", () => { void shutdown(); });
process.on("SIGTERM", () => { void shutdown(); });
