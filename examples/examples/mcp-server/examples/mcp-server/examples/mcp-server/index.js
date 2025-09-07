import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_, res) => res.json({ ok: true }));

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const TARGET_REPO = process.env.TARGET_REPO;

async function githubRequest(method, path, body) {
  const resp = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      "User-Agent": "demo-mcp-server",
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!resp.ok) {
    throw new Error(`GitHub ${resp.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

app.post("/action/createGithubIssue", async (req, res) => {
  try {
    requireEnv("GITHUB_TOKEN");
    const repo = req.body.repo || TARGET_REPO;
    if (!repo) throw new Error("repo required");
    const title = req.body.title || "Automated issue";
    const body = req.body.body || "Created by MCP server.";
    const result = await githubRequest("POST", `/repos/${repo}/issues`, { title, body });
    res.json({ ok: true, issueNumber: result.number, url: result.html_url });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/action/triggerN8nWebhook", async (req, res) => {
  try {
    const { url, payload } = req.body || {};
    if (!url) throw new Error("url required");
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
    const text = await r.text();
    res.json({ ok: true, status: r.status, body: text.slice(0, 500) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const port = process.env.PORT || 8090;
app.listen(port, () => console.log(`MCP server listening on :${port}`));