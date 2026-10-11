# Architecture

The lab is a multi-agent Python backend, a set of supporting services, and a local dashboard. Everything runs locally,
on an open-weight model. The network, host, and monitoring layout is private (see
[SECURITY.md](SECURITY.md#buildout-and-configuration)).

## Components

| Component | Role |
|---|---|
| Agents (`agents/`) | Deployment, telemetry, vulnerability, and remediation agents, plus a counter-swarm simulator |
| Sandbox (`agents/sandbox.py`) | Isolated boundary for commands derived from untrusted data |
| Local model | Open-weight model served on the host. The agents call it for triage and summaries. |
| Log stack | Stores and queries the lab's logs |
| Dashboard (`web/`) | Static site: architecture overview, agent status, alerts, and logs |

## Trust boundaries

- **Untrusted data.** Log lines, scan output, and web content are data. Agents wrap them in containment tags and never
  treat their contents as instructions.
- **Commands from untrusted data.** They run only in the sandbox: no network, read-only root, non-root user, and bounded
  resources.
- **Remediation.** A proposed fix passes a deny-list check and needs human approval before it runs.
- **Counter-swarm.** It is fully synthetic. It writes to a local state file and never touches a real firewall or credential.
- **Secrets.** Placeholders only in the repository. Real values stay in untracked local files.
