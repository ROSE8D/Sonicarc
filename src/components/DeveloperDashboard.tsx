import { useEffect, useState, type ReactNode } from "react";
import { Activity, Bot, Database, Gauge, Home, Mic2, Network, Wrench } from "lucide-react";
import type { ChordAnalysisResponse } from "../types";
import { ArchitecturePlaceholders } from "./ArchitecturePlaceholders";
import { ChatAssistant } from "./ChatAssistant";
import { DatabaseSchemaViewer } from "./DatabaseSchemaViewer";
import { DeveloperAnalysisPanel } from "./DeveloperAnalysisPanel";
import { InstrumentClassifier } from "./InstrumentClassifier";
import { LegacyStudio } from "./LegacyStudio";

type Tool = "overview" | "instrument" | "database" | "ai" | "legacy";
interface Props { result: ChordAnalysisResponse | null; isAnalyzing: boolean; error: string | null; analyze: (file: File) => Promise<void>; }
interface Health { status?: string; service?: string; mongodb_connected?: boolean; gemini_api_configured?: boolean; geminiConnected?: boolean; }

export function DeveloperDashboard(props: Props) {
  const [tool, setTool] = useState<Tool>("overview");
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState(false);
  useEffect(() => { fetch("/api/health").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setHealth).catch(() => setHealthError(true)); }, []);
  const status = (known: boolean | undefined, offlineLabel = "Not configured") => known === true ? ["Available", "ok"] : known === false ? [offlineLabel, "off"] : ["Unknown", "unknown"];
  const apiStatus = health?.status === "ok" ? ["Responding", "ok"] : healthError ? ["Unreachable", "off"] : ["Checking", "unknown"];
  const services = [
    ["React frontend", "This interface is running", "ok"],
    ["Node.js server", "Serves the production frontend; independent status endpoint unavailable", "unknown"],
    ["Python audio backend", apiStatus[0], apiStatus[1]],
    ["AI API integration", ...status(health?.gemini_api_configured ?? health?.geminiConnected)],
    ["Database integration", ...status(health?.mongodb_connected, "Disconnected")]
  ];
  const nav: [Tool, string, ReactNode][] = [["overview", "Overview", <Gauge size={16} />], ["instrument", "Instrument classifier", <Mic2 size={16} />], ["database", "Database tools", <Database size={16} />], ["ai", "AI tools", <Bot size={16} />], ["legacy", "Legacy studio", <Wrench size={16} />]];
  return <div className="dev-shell"><aside className="dev-sidebar"><a className="dev-brand" href="/dev"><Activity size={20} />SONICARC <span>DEV</span></a><nav>{nav.map(([id,label,icon]) => <button key={id} className={tool === id ? "active" : ""} onClick={() => setTool(id)}>{icon}{label}</button>)}</nav><a className="return-app" href="/"><Home size={15} /> Return to user app</a></aside>
    <main className="dev-main"><header className="dev-header"><div><span className="dev-kicker">Internal workspace</span><h1>Developer Dashboard</h1></div><span className="route-chip">/dev</span></header>
    {tool === "overview" && <div className="dev-stack"><section className="dev-panel"><div className="dev-section-title"><div><span className="dev-kicker">Observed connectivity</span><h2>System status</h2></div><button className="refresh-link" onClick={() => location.reload()}>Refresh checks</button></div><div className="service-grid">{services.map(([name,detail,state]) => <div className="service" key={name}><span className={`status-dot ${state}`} /><div><strong>{name}</strong><small>{detail}</small></div></div>)}</div><p className="status-note">Statuses are based only on browser runtime state and the real <code>/api/health</code> response. Undetectable services remain unknown.</p></section><DeveloperAnalysisPanel {...props} /><ArchitecturePlaceholders /></div>}
    {tool === "instrument" && <InstrumentClassifier />}{tool === "database" && <DatabaseSchemaViewer />}{tool === "ai" && <ChatAssistant />}{tool === "legacy" && <div className="legacy-wrap"><div className="legacy-warning"><Network size={18} /><div><strong>Preserved prototype workspace</strong><span>Technical controls and demo tooling are isolated here from the user application.</span></div></div><LegacyStudio /></div>}
    </main></div>;
}
