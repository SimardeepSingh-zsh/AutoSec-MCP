# MCP setup

This repo includes a minimal Node-based MCP server (examples/mcp-server) exposing two actions:
- createGithubIssue
- triggerN8nWebhook

It communicates over HTTP for demo simplicity. In your org, host behind auth and TLS. You can extend this server to wrap internal systems with strict input validation and audit logs.

Setup:
1. Configure env in `.env` for GitHub tokens.
2. Start via docker compose (see examples/docker-compose.yml).
3. Test health: `curl http://localhost:8090/health`

Extending:
- Add new actions in `index.js` with clear schemas.
- Keep side effects idempotent; return correlation IDs.