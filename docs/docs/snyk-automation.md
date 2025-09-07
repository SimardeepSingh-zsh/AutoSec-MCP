# Snyk automation

Two ways to trigger:
- Local/CI: `scripts/snyk_scan_trigger.js` runs Snyk and posts a normalized JSON to n8n.
- Native webhook: Configure your CI to post Snyk SARIF/JSON to the n8n webhook URL.

Recommended:
- Prefer CI scans per PR + nightly full scans.
- Use `minSeverity` thresholds to avoid alert fatigue.
- Route only High/Critical to MCP for actionable steps.

Normalization:
- The script extracts: package, version, severity, identifiers, path, remediation advice, and commit SHA if available.