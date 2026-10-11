# User Guide

Day-to-day reference for a lab that's already set up. For setup, see [INSTALL.md](INSTALL.md). Stack-specific
addresses, ports, and commands are private, so placeholders such as `<lab host>` stand in for them.

## Use the dashboard

The dashboard is a static site. Run it on loopback from the `web/` folder:

```bash
cd web && npm install && npm run dev
```

Open the address the dev server prints. The public copy is also published on GitHub Pages, with fixture data only.

## Run the agents

```bash
cd agents
python telemetry_agent.py --sandbox-inspect   # sandboxed log inspection
python counter_swarm.py                       # simulated counter-swarm round
```

Run agents from the `agents/` folder with the lab's configuration loaded from your local `.env`.

## Check the stack

Use your container tool to confirm that each service is running and healthy. The lab's stack commands and expected
states are in the operator's private runbook.

## Stop the lab

- Stop the agents and the dashboard dev server with `Ctrl+C`.
- Stop the stack with your container tool's stop command, then shut the host down with its normal shutdown command.
  Don't force-power the host, since that can interrupt writes to the log store.

## Troubleshooting

- **Dashboard shows old data:** it is fixture data by design. The public build doesn't read a live stack.
- **Agent refuses to run:** check that the local model server is up and reachable from the agent's network.
- **Remediation waits:** that is the human gate working. Review the proposed command, then approve or refuse it.
