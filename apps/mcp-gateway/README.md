# Local MCP HTTP gateway (prototype)

This is the first stage of Option A: a **local-only, read-only** Streamable HTTP gateway for the existing Roblox MCP stdio server.

**Not yet compatible with the ChatGPT custom connector.** The gateway currently uses a private bearer token; the ChatGPT connector shown in the screenshots offers OAuth or no authentication, not a manually configured bearer token. **Do not expose this service publicly or choose "No authentication" to bypass that limitation.**

## Local development

1. Build the existing MCP package: `pnpm --filter roblox-mcp-server build`.
2. Install workspace dependencies: `pnpm install`.
3. Generate a strong token and set `GATEWAY_TOKEN` in your terminal environment. Never commit it.
4. Run `pnpm --filter @business-duplicator/mcp-gateway dev`.
5. Test `http://127.0.0.1:18765/health` and the MCP endpoint with a local client that supports bearer-token authentication.

The Roblox client can continue using its local bridge at `localhost:16384`.

## Before ChatGPT connection

- Implement a compliant OAuth 2.1 authorization server or integrate a trusted identity provider compatible with MCP.
- Verify OAuth metadata, audience validation, protected-resource metadata, and authorization-code + PKCE behavior.
- Serve the gateway through HTTPS without publicly exposing port 16384.
- Add rate limiting, request size/time limits, logging hygiene, and integration tests.
- Review tool schemas; this initial gateway exposes only read-only tools with string-only arguments, and skips other tools.
- Verify the MCP SDK transport behavior against a real ChatGPT connector before deployment.

This prototype does **not** implement start/stop controls or production authentication.
