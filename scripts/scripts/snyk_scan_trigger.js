#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require("child_process");
const { argv } = require("process");
const http = require("http");
const https = require("https");
const url = require("url");

function getArg(name, def) {
  const idx = argv.findIndex(a => a === `--${name}`);
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
  return def;
}

const scanPath = getArg("path", ".");
const minSeverity = (getArg("minSeverity", "high") || "high").toLowerCase();
const webhook = process.env.N8N_SNYK_WEBHOOK_URL || getArg("webhook", "");
const snykToken = process.env.SNYK_TOKEN;

if (!webhook) {
  console.error("N8N webhook not set. Use env N8N_SNYK_WEBHOOK_URL or --webhook.");
  process.exit(1);
}
if (!snykToken) {
  console.error("SNYK_TOKEN not set.");
  process.exit(1);
}

function postJSON(webhookUrl, payload) {
  const u = url.parse(webhookUrl);
  const lib = u.protocol === "https:" ? https : http;
  const data = JSON.stringify(payload);
  const opts = {
    hostname: u.hostname,
    port: u.port || (u.protocol === "https:" ? 443 : 80),
    path: u.path,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };
  return new Promise((resolve, reject) => {
    const req = lib.request(opts, res => {
      let body = "";
      res.on("data", d => (body += d.toString()));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function severityRank(s) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s] || 0;
}

function normalizeIssue(i) {
  return {
    id: i.id || i.issueId || i.ruleId,
    title: i.title || i.message,
    package: i.package || i.pkgName,
    version: i.version || i.pkgVersion,
    severity: (i.severity || "unknown").toLowerCase(),
    path: i.from || i.path || [],
    cvssScore: i.cvssScore || i.cvss || null,
    identifiers: i.identifiers || { cve: i.cve ? [i.cve] : [] },
    remediation: i.fixedIn ? { fixedIn: i.fixedIn } : i.remediation || null,
    ecosystem: i.ecosystem || "npm",
    file: i.file || i.location || null,
  };
}

function parseSnykJson(raw) {
  // Snyk CLI JSON may include `vulnerabilities` or `issues`.
  const obj = JSON.parse(raw);
  const issues = obj.vulnerabilities || obj.issues || [];
  return issues.map(normalizeIssue);
}

(async () => {
  try {
    console.log("[+] Running Snyk scan...");
    const out = execSync(`npx snyk test ${scanPath} --json`, {
      env: { ...process.env, SNYK_TOKEN: snykToken },
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
    }).toString();

    const allIssues = parseSnykJson(out);
    const filtered = allIssues.filter(i => severityRank(i.severity) >= severityRank(minSeverity));

    const payload = {
      source: "snyk",
      timestamp: new Date().toISOString(),
      repo: process.env.REPO_NAME || null,
      commit: process.env.GIT_COMMIT || null,
      minSeverity,
      counts: {
        total: allIssues.length,
        filtered: filtered.length,
      },
      issues: filtered,
    };

    console.log(`[+] Posting ${filtered.length} issues to n8n webhook...`);
    const res = await postJSON(webhook, payload);
    console.log(`[+] n8n responded with ${res.status}: ${res.body.slice(0, 200)}...`);
  } catch (e) {
    console.error("Scan or post failed:", e.message);
    process.exit(2);
  }
})();