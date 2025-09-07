#!/usr/bin/env node
/* eslint-disable no-console */
const https = require("https");

const githubToken = process.env.GITHUB_TOKEN;
const repo = process.env.TARGET_REPO; // e.g., "org/repo"
const baseBranch = process.env.BASE_BRANCH || "main";
const dependency = process.env.DEP_NAME; // e.g., "lodash"
const targetVersion = process.env.TARGET_VERSION; // e.g., "4.17.21"

if (!githubToken || !repo || !dependency || !targetVersion) {
  console.error("Missing env: GITHUB_TOKEN, TARGET_REPO, DEP_NAME, TARGET_VERSION");
  process.exit(1);
}

function ghRequest(method, path, body) {
  const data = body ? JSON.stringify(body) : null;
  const opts = {
    hostname: "api.github.com",
    path,
    method,
    headers: {
      "User-Agent": "n8n-mcp-automation-hub",
      "Authorization": `Bearer ${githubToken}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let out = "";
      res.on("data", d => (out += d.toString()));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: out ? JSON.parse(out) : {} });
        } catch {
          resolve({ status: res.statusCode, body: out });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const branchName = `security/bump-${dependency}-to-${targetVersion}`.replace(/[^a-zA-Z0-9/_-]/g, "-");

  // 1. Get base branch SHA
  const ref = await ghRequest("GET", `/repos/${repo}/git/ref/heads/${baseBranch}`);
  if (ref.status >= 300) {
    console.error("Failed to get base ref:", ref.body);
    process.exit(2);
  }
  const baseSha = ref.body.object.sha;

  // 2. Create new branch
  await ghRequest("POST", `/repos/${repo}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // 3. Create or update package.json patch (naive demo)
  const pkg = await ghRequest("GET", `/repos/${repo}/contents/package.json?ref=${baseBranch}`);
  const content = Buffer.from(pkg.body.content, "base64").toString("utf8");
  const json = JSON.parse(content);
  if (json.dependencies && json.dependencies[dependency]) {
    json.dependencies[dependency] = targetVersion;
  } else if (json.devDependencies && json.devDependencies[dependency]) {
    json.devDependencies[dependency] = targetVersion;
  } else {
    console.error("Dependency not found in package.json");
    process.exit(3);
  }
  const newContent = Buffer.from(JSON.stringify(json, null, 2)).toString("base64");

  await ghRequest("PUT", `/repos/${repo}/contents/package.json`, {
    message: `chore(security): bump ${dependency} to ${targetVersion}`,
    content: newContent,
    branch: branchName,
    sha: pkg.body.sha,
  });

  // 4. Open PR
  const pr = await ghRequest("POST", `/repos/${repo}/pulls`, {
    title: `Security: bump ${dependency} to ${targetVersion}`,
    head: branchName,
    base: baseBranch,
    body: "Automated bump created by n8n-mcp-automation-hub. Please review CI results before merge.",
    maintainer_can_modify: true,
  });

  console.log(JSON.stringify({ branch: branchName, prNumber: pr.body.number, prUrl: pr.body.html_url }));
})().catch(e => {
  console.error("Remediation failed:", e.message);
  process.exit(4);
});