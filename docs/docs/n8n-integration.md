# n8n integration

Workflows provided:
- snyk-to-n8n.json: Receives Snyk payloads, filters by severity, posts to Slack, opens GitHub issues, and forwards criticals to MCP.
- mcp-driven-remediation.json: On demand or via webhook, calls MCP to create PR stubs and posts review tasks.

Secrets to set in n8n:
- GITHUB_TOKEN (repo:status, repo:write for target repos)
- SLACK_WEBHOOK_URL (or Slack credentials node)
- MCP_SERVER_URL (e.g., http://mcp-server:8090)

Best practices:
- Use credentials in n8n, not plain env vars in nodes.
- Add “Manual Trigger” nodes for safe testing.
- Use “IF” and “Switch” nodes to route by severity or package type.