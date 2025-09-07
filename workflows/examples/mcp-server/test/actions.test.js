import assert from "assert";
import fetch from "node-fetch";

const base = "http://localhost:8090";

describe("MCP Server Actions", () => {
  it("should create a GitHub issue", async () => {
    const res = await fetch(`${base}/action/createGithubIssue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: process.env.TARGET_REPO, title: "Test Issue", body: "Test body" })
    });
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.ok(json.issueNumber);
  });
});