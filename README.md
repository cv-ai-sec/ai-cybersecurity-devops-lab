# AI Cybersecurity DevOps Lab

A local, air-gapped, open-source DevOps and AI cybersecurity training lab: a multi-agent Python backend coordinating
deployment automation, log telemetry, and vulnerability scanning, fronted by a local dashboard website. It runs on a
local open-weight model.

The lab's infrastructure (container, network, host, and monitoring configuration) is private, and so is its detailed
setup. Those follow the operator's security practices. See [docs/SECURITY.md](docs/SECURITY.md#buildout-and-configuration).
Setup outline: [docs/INSTALL.md](docs/INSTALL.md). Already running and just need a command? See
[docs/USER-GUIDE.md](docs/USER-GUIDE.md).

**[→ Live dashboard](https://cv-ai-sec.github.io/ai-cybersecurity-devops-lab/)** — a static build of the dashboard
below, viewable without running any of this yourself (see [Publishing the dashboard](#publishing-the-dashboard-github-pages)).

## Learning use

This repository is for learning. You can give its public material to a coding agent, such as Claude Code, to help
you build your own version. Claude Code and Codex are the agents this was written for. Give the agent the public docs and your own configuration only. The restricted
configuration isn't in this repository, so the agent works from the outline in [docs/INSTALL.md](docs/INSTALL.md) and
the controls in [docs/SECURITY.md](docs/SECURITY.md). Keep real credentials and addresses out of the agent's context.
If you build your own version, consider setting up a secure, private way to export any restricted files it needs.

## Why the files here are generic

This is intentional. The files in this repository describe what the lab does and how it is designed, and leave out
how any one machine is set up. That lowers the attack surface of the public repository, and it shows that a public
repo can be useful without exposing a buildout.

It also lets a coding agent, such as Claude Code or Codex, help you manage or rebuild the lab from the public material
alone. The agent gets the outline and the controls, and your private configuration stays on your side. Details:
[docs/SECURITY.md](docs/SECURITY.md#why-the-files-are-generic).

## Mission

Build hands-on fluency in AI-assisted DevOps security workflows — deployment automation, log telemetry, vulnerability
scanning, and gated auto-remediation — using only local, open-weight models and permissively-licensed tooling. No
cloud API, no telemetry, no data leaves the lab machine.

## Why this is safe to publish

- **Isolated by design:** the lab runs on an isolated network with no route to the internet, enforced at the host.
- **Not exposed:** no service is reachable from a LAN or the internet. Interfaces are restricted to the lab host.
- **No real secrets required:** the local model server needs no real API key. `.env.example` ships placeholder values
  only, and `.env` is git-ignored.
- **Public material is the application.** The network, host, and monitoring configuration that enforces the lab is kept
  private, because publishing it would show an attacker the attack surface.
- **Pre-commit security checklist:** see [docs/SECURITY.md](docs/SECURITY.md) — followed before every commit.

## Architecture

```
Container stack → Log shipper / Log store → Vulnerability scanning → Automation → Local agents → Dashboard
```

Components and trust boundaries: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository structure

```
/
├── agents/           # Python multi-agent backend (deployment, telemetry, vulnerability, remediation)
├── web/              # Vite + Tailwind dashboard: architecture diagram, agent status, CVE alerts
├── docs/             # INSTALL.md (outline), ARCHITECTURE.md, SECURITY.md, USER-GUIDE.md (generic)
├── .github/          # Pages deploy workflow for the static dashboard
├── .env.example      # Placeholder config values — copy to .env, never commit .env
└── .gitignore        # Excludes .env, logs, local DBs, caches, IDE dirs, and private buildout files
```

## Getting started

The setup outline is in [docs/INSTALL.md](docs/INSTALL.md). Step-by-step configuration for the container, host, and
monitoring stack is private and follows the buildout rules in [docs/SECURITY.md](docs/SECURITY.md).

Once your stack is running, the agents and dashboard run from the public code:

```bash
cp .env.example .env
cd agents && pip install -r requirements.txt
python telemetry_agent.py --sandbox-inspect   # sandboxed log inspection
python counter_swarm.py                       # simulated counter-swarm round
cd ../web && npm install && npm run dev       # local dashboard, on loopback
```

## Publishing the dashboard (GitHub Pages)

The dashboard (`web/`) is entirely static — both its Overview tab and its "Live Dashboard" tab run on fixture data baked
into the build (`web/src/lib/mockData.js`), not a live connection to any stack or agent. It can be published as an
always-on page without anyone needing the lab running.

Published automatically via **GitHub Actions** (`.github/workflows/deploy-pages.yml`) — every push to `main` that
touches `web/` triggers a build and publishes the result to GitHub Pages.

**One-time setup:** on GitHub, go to **Settings → Pages** and set **Source** to **GitHub Actions** (not "Deploy from a
branch"). After that, just push.

## Agents

| Agent | Role | Guardrail |
|---|---|---|
| Deployment | Runs automation against the local stack, summarizes results | Dry-run by default |
| Telemetry | Queries logs, flags anomalies in recent entries | Untrusted log content wrapped in containment tags; optional sandboxed inspection |
| Vulnerability | Runs an offline scanner against images and filesystems, triages via the local model | Summary grounded strictly in scan output |
| Remediation | Proposes a fix command based on findings | Deterministic deny-list check and mandatory human approval before execution |
| Sandbox (`agents/sandbox.py`) | Isolated, disposable boundary for commands derived from untrusted data | No network, read-only root, capabilities dropped, non-root user, bounded memory, process count, and time |
| Counter-Swarm (`agents/counter_swarm.py`) | Simulated attacker traffic against a defensive swarm | Fully synthetic — writes only to a local, git-ignored state file |

These guardrails are the lessons from the companion
[`Cybersecurity_AI_Learning`](https://github.com/cv-ai-sec/Cybersecurity_AI_Learning) repo: schema validation isn't
correctness validation, untrusted data needs structural containment, and a model with tool access needs least-privilege
scoping plus a human gate.

## Disclaimer

Educational lab running entirely on local infrastructure. No production systems, third-party services, or real
credentials are involved anywhere in this repository.
