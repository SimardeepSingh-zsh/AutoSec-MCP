#!/usr/bin/env bash
set -euo pipefail

# Simple helper to (re)build and run the example MCP server standalone

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DIR="$ROOT_DIR/examples/mcp-server"

echo "[+] Building MCP server image..."
docker build -t demo-mcp-server:latest "$MCP_DIR"

echo "[+] Running MCP server on :8090..."
docker rm -f demo-mcp-server >/dev/null 2>&1 || true
docker run --name demo-mcp-server --env-file "$ROOT_DIR/.env" -p 8090:8090 demo-mcp-server:latest
