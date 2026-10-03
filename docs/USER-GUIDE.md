# User Guide

Day-to-day reference for a stack that's already set up. Different from
[INSTALL.md](INSTALL.md) (one-time setup) and [README.md](../README.md) (project overview) — this
is the page to open when you just want a URL or a command, without re-reading the full install guide.

## Finding the VM's host-only IP (needed for the dashboard)

Run **on the VM**, not Windows:

```bash
ip addr show | grep 192.168.56
```

## Quick reference

| What | Where | Notes |
|---|---|---|
| Open-WebUI (chat with the local Qwen model) | `http://127.0.0.1:3000` (Windows, via NAT) | Also reachable via the VM's host-only IP on the same port. |
| Loki (log storage, queried via Open-WebUI/your own tools) | `http://127.0.0.1:3100` (Windows, via NAT) | No real browsable UI of its own — this is the API port. |
| Web dashboard (architecture, agent status, CVE alerts) | `http://<VM_host-only-IP>:4321` | **No NAT port-forward exists for this one, deliberately** — VirtualBox's NAT engine has a confirmed bug with this dashboard's long-lived connections. Must use the host-only IP. |
| SSH into the VM | `ssh -p 2222 <user>@127.0.0.1` | |
| LM Studio (LLM backend) | Running on Windows — check its own Developer tab | Reachable from the VM at the host-only adapter's IP (`HOST_LM_STUDIO_IP` in `.env`, default `192.168.56.1`). |
| Live published dashboard (static, no setup needed) | https://cv-ai-sec.github.io/ai-cybersecurity-devops-lab/ | Fixture data, not connected to your local stack — safe to show anyone without running anything. |

## Graceful startup

1. Start the VM (from Windows):
   ```powershell
   & "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" startvm "ai_cybersecurity" --type headless
   ```
2. Confirm SSH is up: `ssh -p 2222 <user>@127.0.0.1`
3. Bring up the Docker stack:
   ```bash
   docker compose -f docker/docker-compose.yml --env-file .env up -d
   ```
4. Verify it's actually healthy, not crash-looping:
   ```bash
   docker compose -f docker/docker-compose.yml --env-file .env ps
   ```
5. If you need the dashboard too, start it (see "Restart the dashboard dev server" below).

## Graceful shutdown

**Stop the dashboard dev server first, if it's running**, so `npm run dev` isn't just killed
mid-build:
```bash
pkill -f "vite"   # or Ctrl+C in its terminal if it's running in the foreground
```

**Stop the Docker stack cleanly, not a hard kill:**
```bash
docker compose -f docker/docker-compose.yml --env-file .env down
```
This waits for each container to exit cleanly rather than force-killing — Loki in particular has
on-disk state (`docker/loki/data/`) that an abrupt stop can leave inconsistent. `down` does not
delete volumes; your data is still there afterward.

**Then shut down the VM's OS itself over SSH — not a VirtualBox hard power-off:**
```bash
sudo shutdown -h now
```

**Avoid this for routine shutdowns** (last resort for a genuinely hung VM only):
```powershell
& "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" controlvm "ai_cybersecurity" poweroff
```

**Confirm it's off:**
```powershell
& "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" list runningvms
```

## Running the agents

From `agents/` on the VM, with the venv activated (`source .venv/bin/activate`):

```bash
python deployment_agent.py                    # dry-run by default
python telemetry_agent.py --minutes 15
python telemetry_agent.py --sandbox-inspect    # sandboxed raw-log inspection
python vulnerability_agent.py alpine:3.19
python remediation_agent.py <path-to-a-summary-file>
python counter_swarm.py                        # simulated counter-swarm round
```

## Common day-2 operations

**Check everything's running:**
```bash
docker compose -f docker/docker-compose.yml --env-file .env ps
```
(Always include both flags — `docker-compose.yml` lives in `docker/`, and `.env` lives at the repo
root; a bare `docker compose ps` from the repo root will fail with "no configuration file provided.")

**Tail logs:**
```bash
docker compose -f docker/docker-compose.yml --env-file .env logs -f open-webui
```

**Restart the dashboard dev server** (if you closed the terminal it was running in):
```bash
cd web
nohup npm run dev > /tmp/vite.log 2>&1 &
disown
```

**Verify the lab's Docker network still can't reach the internet:**
```bash
docker exec lab_open_webui curl -m 3 -sS http://8.8.8.8   # should time out / fail to connect
```

For anything not covered here — first-time setup, firewall rules, network architecture — see
[INSTALL.md](INSTALL.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [SECURITY.md](SECURITY.md).
