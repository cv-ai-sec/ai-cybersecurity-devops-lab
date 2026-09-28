import mermaid from "mermaid";
import "./styles/main.css";
import {
  architectureDiagram,
  getAgentStatuses,
  getCveAlerts,
  getRemediationLog,
  getCounterSwarmLog,
} from "./lib/mockData.js";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

const severityColor = {
  CRITICAL: "text-red-400",
  HIGH: "text-orange-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-gray-400",
};

const statusColor = {
  idle: "bg-gray-600",
  running: "bg-accent",
  "awaiting-approval": "bg-yellow-500",
  error: "bg-red-500",
};

async function renderDiagram() {
  const el = document.getElementById("architecture-diagram");
  const { svg } = await mermaid.render("architecture-svg", architectureDiagram);
  el.innerHTML = svg;
}

// Static, hand-maintained content for the Overview tab — mirrors README.md's
// Agents table and stack list. Not fetched/derived from anything live, so it
// doesn't belong in mockData.js alongside the simulated dashboard fixtures.
const AGENTS_OVERVIEW = [
  { name: "Deployment", role: "Runs Ansible, summarizes results", guardrail: "Dry-run by default" },
  { name: "Telemetry", role: "Queries Loki, flags anomalies", guardrail: "Untrusted logs wrapped in containment tags; optional sandboxed inspection" },
  { name: "Vulnerability", role: "Runs Trivy, triages via LLM", guardrail: "Summary grounded strictly in scan JSON" },
  { name: "Remediation", role: "Proposes a fix for a finding", guardrail: "Deny-list check + mandatory human approval" },
  { name: "Sandbox", role: "Isolated exec boundary for untrusted commands", guardrail: "No network, read-only root, dropped capabilities" },
  { name: "Counter-Swarm", role: "Simulated attack vs. defense loop", guardrail: "Fully synthetic — local state file only" },
];

const TOOLS = [
  "Docker", "LM Studio (Qwen)", "Open-WebUI", "Loki", "Promtail", "Trivy",
  "Ansible", "Python", "Vite", "Tailwind CSS", "Mermaid.js", "Rocky Linux",
];

function renderAgentsOverview() {
  const el = document.getElementById("agents-overview");
  el.innerHTML = AGENTS_OVERVIEW.map(
    (agent) => `
    <div class="grid grid-cols-3 gap-4 p-3 text-sm">
      <span class="font-medium">${agent.name}</span>
      <span class="text-gray-400">${agent.role}</span>
      <span class="text-gray-500 text-xs">${agent.guardrail}</span>
    </div>`
  ).join("");
}

function renderToolsGrid() {
  const el = document.getElementById("tools-grid");
  el.innerHTML = TOOLS.map(
    (tool) => `<span class="bg-surface text-gray-300 text-xs px-3 py-1.5 rounded-full">${tool}</span>`
  ).join("");
}

function setupTabs() {
  const tabs = {
    overview: { btn: document.getElementById("tab-overview"), view: document.getElementById("view-overview") },
    dashboard: { btn: document.getElementById("tab-dashboard"), view: document.getElementById("view-dashboard") },
  };

  function activate(name) {
    for (const [key, { btn, view }] of Object.entries(tabs)) {
      const isActive = key === name;
      btn.classList.toggle("active", isActive);
      view.classList.toggle("hidden", !isActive);
    }
  }

  tabs.overview.btn.addEventListener("click", () => activate("overview"));
  tabs.dashboard.btn.addEventListener("click", () => activate("dashboard"));
  activate("overview");
}

function renderAgentStatus() {
  const el = document.getElementById("agent-status");
  el.innerHTML = getAgentStatuses()
    .map(
      (agent) => `
      <div class="bg-surface rounded-lg p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium">${agent.name}</span>
          <span class="flex items-center gap-2 text-xs text-gray-400">
            <span class="w-2 h-2 rounded-full ${statusColor[agent.status] ?? "bg-gray-600"}"></span>
            ${agent.status}
          </span>
        </div>
        <p class="text-sm text-gray-400">${agent.detail}</p>
        <p class="text-xs text-gray-500 mt-1">Last run: ${agent.lastRun}</p>
      </div>`
    )
    .join("");
}

function renderCveAlerts() {
  const el = document.getElementById("cve-alerts");
  el.innerHTML = getCveAlerts()
    .map(
      (cve) => `
      <div class="p-4 flex items-center justify-between">
        <div>
          <span class="font-mono text-sm">${cve.id}</span>
          <span class="text-sm text-gray-400 ml-2">${cve.package}</span>
          <p class="text-sm text-gray-500">${cve.summary}</p>
        </div>
        <span class="text-xs font-semibold ${severityColor[cve.severity] ?? "text-gray-400"}">${cve.severity}</span>
      </div>`
    )
    .join("");
}

function renderRemediationLog() {
  const el = document.getElementById("remediation-log");
  el.innerHTML = getRemediationLog()
    .map(
      (entry) => `
      <div class="p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm">${entry.action}</span>
          <span class="text-xs text-gray-500">${entry.time}</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">${entry.outcome}</p>
      </div>`
    )
    .join("");
}

function renderCounterSwarmLog() {
  const el = document.getElementById("counter-swarm-log");
  el.innerHTML = getCounterSwarmLog()
    .map(
      (entry) => `
      <div class="p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm">${entry.action}</span>
          <span class="text-xs text-gray-500">${entry.time}</span>
        </div>
      </div>`
    )
    .join("");
}

async function refreshAll() {
  await renderDiagram();
  renderAgentsOverview();
  renderToolsGrid();
  renderAgentStatus();
  renderCveAlerts();
  renderRemediationLog();
  renderCounterSwarmLog();
}

setupTabs();
refreshAll();
// Simulated on-demand refresh, matching the "refreshable views" requirement
// without an actual backend poll loop.
setInterval(() => {
  renderAgentStatus();
  renderCveAlerts();
  renderRemediationLog();
  renderCounterSwarmLog();
}, 15000);
