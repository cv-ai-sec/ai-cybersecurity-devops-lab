"""Remediation Agent — proposes and (with human approval) executes patch
actions based on the Vulnerability Agent's findings.

Excessive-agency guardrail: this agent NEVER auto-executes a remediation
action. Every proposed action must pass a deterministic policy check and then
be explicitly approved by a human operator before running. This mirrors the
lesson from llm-security-labs/lab4 — an LLM connected to real tools needs
least-privilege scoping and a human-in-the-loop gate, not just a polite
system prompt asking it to be careful.

Grounding, not just guessing: earlier versions of this agent let the model guess both the
target host's package manager and whether the finding was even fixable with a host command
at all — confirmed live to go wrong: given a musl/Alpine finding from scanning `alpine:3.19`,
it proposed an `apt-get` command run against this Rocky/RHEL VM (wrong package manager, and
the wrong target entirely — the vulnerable package lives inside the scanned image's layers,
not the host, so no host command can fix it regardless of package manager). Now the actual
host package manager is detected (`_detect_host_package_manager`) and the vulnerability
summary's "Scan target: ... (container image|filesystem/host path)" header (printed by
`vulnerability_agent.py`) is parsed to tell the model which situation it's in, so it isn't
guessing. This reduces how often it's wrong, but doesn't guarantee correctness — local
open-weight models can still propose something confidently wrong. The deny-list + human
approval gate below remains the actual safety mechanism regardless: even a wrong proposal
should only ever fail safely (a `command not found`, harmless), not damage anything.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess

from common.llm_client import ask

# Deterministic — not asked of the model, since it can't reliably introspect its own
# execution environment, and a wrong guess here (as happened before this fix) directly
# causes a wrong, if harmless, proposal.
KNOWN_PACKAGE_MANAGERS = ["dnf", "apt-get", "apk", "yum", "zypper", "pacman"]


def _detect_host_package_manager() -> str:
    for pm in KNOWN_PACKAGE_MANAGERS:
        if shutil.which(pm):
            return pm
    return "unknown (no common package manager found on PATH)"


def _parse_target_type(vulnerability_summary: str) -> str | None:
    """Reads the "Scan target: <target> (<type>)" header vulnerability_agent.py prints,
    so this agent knows whether a host command can even apply — rather than guessing.
    """
    match = re.search(r"^Scan target:.*\((.+?)\)\s*$", vulnerability_summary, re.MULTILINE)
    return match.group(1).strip() if match else None


def _build_system_prompt(target_type: str | None) -> str:
    if target_type == "container image":
        target_guidance = (
            "The vulnerability was found in a container IMAGE, not on this host — a host "
            "package-manager command cannot fix it, because the vulnerable files only exist "
            "inside that image's already-built layers. Propose `docker pull <image>:<a "
            "newer-or-patched-tag-you-can-name>` instead. If you don't know a specific newer tag, "
            "output exactly NONE as the command, and explain in the rationale that this needs a "
            "Dockerfile rebuild against an updated base image."
        )
    else:
        package_manager = _detect_host_package_manager()
        target_guidance = (
            f"The vulnerability was found directly on THIS host. This host's package manager is "
            f"'{package_manager}' — propose a command using that package manager specifically, "
            f"never a different one (e.g. never apt-get on a dnf-based host)."
        )

    return f"""You are a Remediation Agent. Given a vulnerability summary, propose a
single concrete remediation command. Output ONLY the shell command on the first line, followed
by a one-sentence rationale. Do not use markdown formatting, code fences, or backticks anywhere
in your response. Never propose a command that deletes data, modifies firewall rules, or targets
anything outside the package/image mentioned in the input.

{target_guidance}"""

# Deterministic policy: commands containing any of these are rejected outright,
# regardless of what the model proposed or why.
DENYLIST_SUBSTRINGS = [
    "rm -rf",
    "mkfs",
    "dd if=",
    ":(){:|:&};:",
    "shutdown",
    "reboot",
    "iptables",
    "ufw",
    "> /dev/",
]


def _strip_code_fence(text: str) -> str:
    """Models routinely wrap output in ```bash ... ``` fences even when told
    not to (confirmed live: LM Studio's Qwen did this on the first real run —
    and not just at the very start/end of the response, but with the closing
    fence landing mid-response, right before the rationale text, which a
    naive first-line/last-line strip misses). Don't rely on the system prompt
    alone to prevent this — drop every line that's purely a fence marker,
    wherever it lands, the same "deterministic guard, not just a polite ask"
    principle as the deny-list below.
    """
    lines = [ln for ln in text.strip().splitlines() if not ln.strip().startswith("```")]
    return "\n".join(lines).strip()


def propose_remediation(vulnerability_summary: str) -> tuple[str, str]:
    target_type = _parse_target_type(vulnerability_summary)
    system_prompt = _build_system_prompt(target_type)
    response = _strip_code_fence(ask(system_prompt, vulnerability_summary))
    lines = response.strip().splitlines()
    command = lines[0].strip() if lines else ""
    rationale = " ".join(lines[1:]).strip() if len(lines) > 1 else ""
    return command, rationale


def policy_check(command: str) -> str | None:
    lowered = command.lower()
    for bad in DENYLIST_SUBSTRINGS:
        if bad in lowered:
            return f"Rejected by deterministic policy: command contains '{bad}'."
    if not command:
        return "Rejected: empty command."
    return None


def execute(command: str) -> dict:
    result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
    return {"returncode": result.returncode, "stdout": result.stdout, "stderr": result.stderr}


def main() -> None:
    parser = argparse.ArgumentParser(description="Remediation Agent")
    parser.add_argument("vulnerability_summary_file", help="Path to a text file with the finding")
    parser.add_argument("--yes", action="store_true", help="Skip interactive confirmation (still policy-checked)")
    args = parser.parse_args()

    with open(args.vulnerability_summary_file, "r", encoding="utf-8") as f:
        summary = f.read()

    command, rationale = propose_remediation(summary)
    print(f"Proposed command : {command}")
    print(f"Rationale        : {rationale}")

    if command.strip().upper() == "NONE":
        print(
            "\n[i] No direct command proposed — per the rationale above, this needs a "
            "Dockerfile rebuild against an updated base image, not something this agent can "
            "run directly. Nothing to approve here."
        )
        return

    rejection = policy_check(command)
    if rejection:
        print(f"\n[X] {rejection}")
        return

    if not args.yes:
        approval = input("\nApprove and execute this command? (y/N): ").strip().lower()
        if approval != "y":
            print("Execution aborted by operator.")
            return

    result = execute(command)
    print(json.dumps(result, indent=2))
    if result["returncode"] != 0:
        print(
            "\n[i] Non-zero exit code. If this is a package-manager-not-found or similar "
            "shell error (not a policy rejection above), that's the local model proposing "
            "something incorrect for this host/target — see the module docstring at the top "
            "of this file for why that's an expected, safely-contained outcome rather than a bug."
        )


if __name__ == "__main__":
    main()
