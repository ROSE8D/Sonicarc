import { Network, Workflow } from "lucide-react";
export function ArchitecturePlaceholders() {
  return <section className="dev-panel"><div className="dev-section-title"><div><span className="dev-kicker">Documentation</span><h2>Architecture</h2></div><p>Reserved for validated diagrams. No topology is assumed here.</p></div><div className="diagram-grid"><div className="diagram-placeholder"><Network /><h3>System Diagram</h3><p>Architecture diagram will be added after the service topology is verified.</p></div><div className="diagram-placeholder"><Workflow /><h3>Sequence Diagram</h3><p>Request sequence will be documented here after the integration flow is finalized.</p></div></div></section>;
}
