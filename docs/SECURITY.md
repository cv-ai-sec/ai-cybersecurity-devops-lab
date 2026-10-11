# Security

This repository holds application code and public documentation. Live values, addresses, machine details, and
the lab's infrastructure configuration are kept outside it, in local, restricted locations. Read this before you
change anything that touches the agents, the sandbox, or what they can run.

## Design rules

- **No real credentials in code.** Configuration holds placeholders only. Real values live in untracked local files.
- **Untrusted data is contained.** Logs, scan output, and web content are wrapped and never treated as instructions.
- **Commands from untrusted data run only in the sandbox,** with no network, a read-only root, a non-root user, and
  bounded memory, processes, and time.
- **Remediation needs a human.** A proposed fix passes a deny-list check and waits for explicit approval.
- **Services are not exposed.** Nothing in the lab is reachable from outside its own host.

## Accepted risks

Known tradeoffs for the lab are recorded in the operator's restricted register, not in this repository. Each one was
reviewed and accepted for a single-user lab. Code a tradeoff affects says so, and points to the register by name.

If you adapt this project, review these areas before you rely on it:

- What the sandbox can reach, and what it does with output it produces.
- What the agents can do once a model's output is acted on, and which actions skip the human gate.
- Who can reach the dashboard, and whether it is ever exposed beyond the host.
- What the logs contain, and who can read them.
- Whether the agents' state persists, and whether anything checks what goes into it.

## Buildout and configuration

Anything that describes how the lab is built is private. That includes container and compose definitions, networks,
ports, host firewall rules, virtual machine setup, log-shipping configuration, and detailed install and operations
steps. Showing these to the public shows attackers the attack surface.

They are kept in a local, restricted folder and follow the operator's shared security practices (the buildout rules
in `PRACTICES.md`). They are never committed to this repository, which ignores their paths as a second check.

## Why the files are generic

The generic wording in this repository's code comments, config examples, and docs is intentional. It is not an
omission to fix.

- **Lower attack surface.** The public files state what the lab does and which controls it uses. They don't state
  addresses, ports, host or machine layout, firewall detail, or how a specific setup is wired. Anyone reading them
  learns the design, not a way in.
- **Demonstration.** A repository can be useful and teach real controls while staying generic. These files are the
  worked example.
- **Agent-managed.** The lab is meant to be managed or rebuilt by a coding agent such as Claude Code or Codex. The
  agent works from the generic outline plus your private configuration, which never enters this repository.

If you add a comment or a doc here, keep it generic. Put setup-specific detail in your own restricted folder.

## Agentic AI controls

The agents follow the OWASP Top 10 for Agentic Applications (2026) where it applies to this lab:

- **ASI01 goal hijack:** untrusted content is contained and never treated as instructions.
- **ASI02 tool misuse:** each agent has a narrow job and a fixed set of actions.
- **ASI05 code execution:** derived commands run only in the sandbox.
- **ASI09 trust exploitation:** remediation waits for a human decision.

Controls that depend on a model following instructions are advisory. Controls in code are enforced.

## Exporting restricted files

If you build your own version, you will probably have restricted files that must reach a machine. Consider setting up
a secure, private way to export them. Keep that method out of any public material.

## Pre-commit checklist

1. Read every line of the staged diff before committing.
2. Scan staged content for secret-like values. Any match must be a placeholder.
3. Confirm no `.env` file with real values is staged.
4. Confirm no private addresses, machine names, usernames, or local paths are staged.
5. Confirm no logs, state files, or databases are staged.
6. Confirm no buildout or restricted content is staged.

## If a secret is exposed

Stop. Don't commit or push. A secret in an unpushed commit can be dropped. A secret that reached a remote must be
treated as compromised: rotate it first, then remove it from history.
