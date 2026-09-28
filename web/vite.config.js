import { defineConfig } from "vite";

// Bound to all interfaces (not 127.0.0.1) for the same reason as the Docker
// services in docker/docker-compose.yml: when this runs inside the
// VirtualBox VM (see docs/INSTALL.md), VirtualBox's NAT port-forwarding
// delivers Windows->VM traffic to the VM's real NIC, not its loopback, so a
// 127.0.0.1-only bind is unreachable from Windows even with a correct
// port-forward rule. Actual exposure is still scoped by the VirtualBox
// boundary itself (only what's explicitly forwarded, or reachable via the
// private host-only network, can reach this at all) — see
// docs/INSTALL.md step 4.
export default defineConfig(({ command }) => ({
  // GitHub Pages serves a project site at https://<user>.github.io/<repo>/,
  // not the domain root — asset URLs need that prefix or they 404 once
  // deployed. Only applied for `vite build` (what the Pages deploy workflow
  // runs), not `vite dev`/`vite preview`, so local URLs from docs/INSTALL.md
  // (http://<host-only-ip>:4321) keep working unchanged.
  base: command === "build" ? "/ai-cybersecurity-devops-lab/" : "/",
  server: {
    host: "0.0.0.0",
    port: 4321,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4321,
    strictPort: true,
  },
}));
