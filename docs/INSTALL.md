# Install

This is an outline. The full setup for a specific machine is private, because it describes the network, host, and
virtual machine layout. It follows the buildout rules in [SECURITY.md](SECURITY.md#buildout-and-configuration).

## Outline

1. **Host.** Use a Linux virtual machine or a container host, with a container runtime, an automation tool, and a
   vulnerability scanner installed. Keep it on a private network with no inbound route from outside.
2. **Local model.** Run a local, open-weight model server on the host. Use a model that fits your memory, and confirm
   its API responds before you start the agents.
3. **Configuration.** Copy `.env.example` to `.env` and fill in values for your machine. Never commit `.env`.
4. **Network.** Give the lab its own network. Allow only the traffic the stack needs, and enforce any outbound block
   in the host firewall, not only in container configuration.
5. **Stack.** Start the containers for log storage, log shipping, and the chat interface. Confirm each is running.
6. **Agents and dashboard.** Install the Python dependencies, run the agents, and start the dashboard on loopback.
7. **Verify.** Test that outbound traffic from the lab is blocked, that the local model answers, and that logs reach
   the log store.

Build your own configuration for steps 1, 4, and 5 from this outline and from the controls in
[SECURITY.md](SECURITY.md). Use the OWASP Agentic AI controls as your checklist.
