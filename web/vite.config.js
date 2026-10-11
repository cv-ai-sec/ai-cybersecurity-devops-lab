import { defineConfig } from "vite";

// Intentionally generic. The dev and preview servers listen on loopback only, so
// the dashboard is not reachable from other machines by default. If your setup
// needs a different bind address, pass it on the command line (`--host <address>`)
// from your own private runbook rather than editing this file. Setup-specific
// detail is kept out of this repository on purpose, to keep its attack surface
// low and to show that a public repo can stay generic. See docs/SECURITY.md.
export default defineConfig(({ command }) => ({
  // GitHub Pages serves a project site at https://<user>.github.io/<repo>/,
  // not the domain root, so asset URLs need that prefix. Applied only for
  // `vite build` (what the Pages workflow runs), not `vite dev` or `vite preview`.
  base: command === "build" ? "/ai-cybersecurity-devops-lab/" : "/",
  server: {
    host: "127.0.0.1",
    port: 4321,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4321,
    strictPort: true,
  },
}));
