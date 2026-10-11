import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const endpoint = process.env.AGENT_SERVER_URL;
const token = process.env.AGENT_TOKEN;
if (!endpoint || !token || !endpoint.startsWith("wss://")) {
  console.error("Set AGENT_SERVER_URL (wss://) and AGENT_TOKEN.");
  process.exit(1);
}

const defaultEntry = fileURLToPath(new URL("../../../roblox-executor-mcp-main/roblox-executor-mcp-main/dist/index.js", import.meta.url));
const entry = path.resolve(process.env.MCP_ENTRY ?? defaultEntry);
let client: Client | undefined;
let transport: StdioClientTransport | undefined;
let state: "stopped" | "starting" | "running" | "stopping" = "stopped";
let socket: WebSocket | undefined;
let generation = 0;
let stopping = false;
let lastError: string | undefined;
const pending = new Set<string>();

type Request = { id: string; type: "status" | "start" | "stop" | "list_tools" | "call_tool"; name?: string; arguments?: Record<string, unknown> };
function reply(id: string, payload: Record<string, unknown>) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id, ...payload }));
}
function status() { return { state, lastError, toolCallsInFlight: pending.size }; }

async function start() {
  if (state !== "stopped") throw new Error(`Cannot start while ${state}`);
  if (!existsSync(entry)) throw new Error(`MCP build missing at ${entry}; build the existing MCP package first.`);
  state = "starting";
  lastError = undefined;
  const current = ++generation;
  const nextClient = new Client({ name: "business-duplicator-agent", version: "0.1.0" });
  const nextTransport = new StdioClientTransport({ command: process.execPath, args: [entry], stderr: "pipe" });
  nextTransport.stderr?.on("data", (chunk: Buffer) => {
    const line = chunk.toString().trim();
    if (line) console.error("[mcp]", line.slice(0, 2000));
  });
  nextTransport.onclose = () => {
    if (current !== generation) return;
    client = undefined; transport = undefined; state = "stopped";
    console.error("MCP transport closed.");
  };
  try {
    await nextClient.connect(nextTransport);
    if (current !== generation) { await nextClient.close(); return; }
    client = nextClient; transport = nextTransport; state = "running";
  } catch (error) {
    state = "stopped";
    lastError = String(error);
    await nextTransport.close().catch(() => {});
    throw error;
  }
}
async function stop() {
  if (state === "stopped") return;
  if (state === "starting") throw new Error("Wait for MCP startup to finish.");
  state = "stopping";
  ++generation;
  const previous = client;
  const previousTransport = transport;
  client = undefined; transport = undefined;
  try { await previous?.close(); await previousTransport?.close(); }
  finally { state = "stopped"; }
}
async function handle(req: Request) {
  if (!req || typeof req.id !== "string" || typeof req.type !== "string" || req.id.length > 128) return;
  if (pending.has(req.id)) return;
  pending.add(req.id);
  try {
    let result: unknown;
    switch (req.type) {
      case "status": result = status(); break;
      case "start": await start(); result = status(); break;
      case "stop": await stop(); result = status(); break;
      case "list_tools":
        if (!client) throw new Error("MCP is not running.");
        result = await client.listTools(); break;
      case "call_tool":
        if (!client) throw new Error("MCP is not running.");
        if (typeof req.name !== "string" || !req.name) throw new Error("Missing tool name.");
        // The hosted backend must enforce user authentication and approvals.
        // This agent accepts requests only from the paired, authenticated backend.
        result = await client.callTool({ name: req.name, arguments: req.arguments ?? {} });
        break;
      default: throw new Error("Unknown request type.");
    }
    reply(req.id, { ok: true, result });
  } catch (error) {
    reply(req.id, { ok: false, error: error instanceof Error ? error.message : String(error) });
  } finally { pending.delete(req.id); }
}
function connect() {
  if (stopping) return;
  const ws = new WebSocket(endpoint!, { headers: { Authorization: `Bearer ${token}`, "X-Agent-Id": "personal-pc" }, handshakeTimeout: 10000 });
  socket = ws;
  ws.on("open", () => { console.log("Connected to hosted backend."); reply(randomUUID(), { event: "agent_status", result: status() }); });
  ws.on("message", raw => {
    if (raw.toString().length > 1024 * 1024) { ws.close(1009); return; }
    try { void handle(JSON.parse(raw.toString()) as Request); } catch { console.error("Invalid message."); }
  });
  ws.on("error", err => console.error("Hosted connection:", err.message));
  ws.on("close", () => {
    if (socket === ws) socket = undefined;
    if (!stopping) setTimeout(connect, 5000);
  });
}
process.on("SIGINT", () => { stopping = true; socket?.close(); void stop().finally(() => process.exit(0)); });
process.on("SIGTERM", () => { stopping = true; socket?.close(); void stop().finally(() => process.exit(0)); });
connect();
