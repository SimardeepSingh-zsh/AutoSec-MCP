# AutoSec-MCP

**AutoSec-MCP** is a production-ready automation framework that connects [Snyk](https://snyk.io) vulnerability detection with [n8n](https://n8n.io) workflows and custom MCP (Machine-Controlled Process) servers. It empowers security and DevOps teams to detect, triage, and remediate vulnerabilities automatically — with safety, auditability, and flexibility built in.

Created and maintained by [@SimardeepSingh-zsh](https://github.com/SimardeepSingh-zsh), this toolkit is designed to be practical, extensible, and easy to adopt across teams of any size.

---

## 🔧 What This Project Enables

- **Automated Vulnerability Detection**  
  Snyk scans your codebase and sends structured results to n8n.

- **Workflow Orchestration**  
  n8n parses results, filters by severity, and routes alerts to Slack, GitHub, Jira, or other tools.

- **Controlled Remediation**  
  MCP servers expose safe, scriptable actions (e.g., open issues, create PRs) that n8n can trigger automatically.

- **Policy Enforcement**  
  A built-in policy engine ensures only approved packages are auto-remediated.

---

## 🚀 Getting Started

### 1. Clone and Configure

```bash
git clone https://github.com/SimardeepSingh-zsh/AutoSec-MCP.git
cd AutoSec-MCP
cp examples/.env.example .env
# Fill in secrets in .env (GitHub token, Snyk token, Slack webhook, etc.)

2. Launch the Stack
```bash
docker compose -f examples/docker-compose.yml --env-file .env up -d --build

This starts:
• 	n8n workflow engine
• 	PostgreSQL database for n8n
• 	A sample MCP server with GitHub integration

3. Import Workflows into n8n
• 	Open n8n at http://localhost:5678
• 	Import the following JSON files from :
• 	 – handles incoming Snyk data, routes alerts, and triggers MCP
• 	 – filters issues, applies policy, and initiates remediation

4. Run a Snyk Scan and Trigger the Flow
```bash
node scripts/snyk_scan_trigger.js --path . --minSeverity=high

🧪 End-to-End Test
1. Start the Stack
```bash
docker compose up

2. Import and Publish Workflows in n8n
• 	Use the n8n editor to import both workflows
• 	Publish them to make them active

3. Run a Scan Manually or via CI
• 	Use the CLI script or GitHub Action to trigger a Snyk scan
• 	Post results to the n8n webhook

4. Observe Results
• 	Slack notification for findings
• 	GitHub issue creation for critical vulnerabilities
• 	Jira ticket creation
• 	Remediation webhook triggered for high-severity issues

🛡 Production Deployment Tips
• 	Run n8n behind HTTPS and authentication
• 	Host MCP server behind an API gateway with mTLS or token-based auth
• 	Use fine-grained GitHub tokens scoped to specific repos
• 	Integrate Snyk scans into your CI pipeline and post results to n8n
• 	Keep auto-remediation behind manual approval until trust is established



