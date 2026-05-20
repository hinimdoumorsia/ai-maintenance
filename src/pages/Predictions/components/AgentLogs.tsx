import React from "react";
import { Bot, AlertCircle, TrendingUp, Cpu, Zap, CheckCircle2, XCircle } from "lucide-react";

interface SSELogEvent {
  type?: string;
  message?: string;
  detail?: string;
  time?: string;
  model_id?: string;
  [key: string]: unknown;
}

interface AgentLogDisplay {
  time: string;
  message: string;
  variant: "observation" | "model" | "analysis" | "prediction" | "done" | "error";
}

const VARIANT_ICON: Record<AgentLogDisplay["variant"], React.ReactNode> = {
  observation: <AlertCircle size={14} color="#F97316" />,
  model: <Cpu size={14} color="#F97316" />,
  analysis: <TrendingUp size={14} color="#F97316" />,
  prediction: <Zap size={14} color="#F97316" />,
  done: <CheckCircle2 size={14} color="#22c55e" />,
  error: <XCircle size={14} color="#ef4444" />,
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const nowTime = () => {
  const d = new Date();
  return `${pad2(d.getHours())}.${pad2(d.getMinutes())}.${pad2(d.getSeconds())}`;
};

const KNOWN_VARIANTS: AgentLogDisplay["variant"][] = [
  "observation", "model", "analysis", "prediction", "done", "error",
];

function mapEvent(event: SSELogEvent): AgentLogDisplay | null {
  if (!event || event.type === "ping") return null;

  const message = event.message || event.detail || "";
  if (!message && !event.model_id) return null;

  const time = event.time || nowTime();
  const type = (event.type || "").toLowerCase();

  // L'agent envoie un type sémantique typé : on lui fait confiance.
  if ((KNOWN_VARIANTS as string[]).includes(type)) {
    return { time, message: message || (type === "done" ? "Prédiction terminée" : ""), variant: type as AgentLogDisplay["variant"] };
  }

  // Sinon (event non typé ou type inconnu), on tombe en mode "observation"
  return { time, message, variant: "observation" };
}

interface AgentLogsProps {
  logs?: SSELogEvent[];
}

const AgentLogs: React.FC<AgentLogsProps> = ({ logs = [] }) => {
  const displayLogs: AgentLogDisplay[] = logs
    .map(mapEvent)
    .filter((x): x is AgentLogDisplay => x !== null);

  return (
    <div className="card agent-logs-card">
      <div className="card-section-label">
        <Bot size={18} color="#2563EB" />
        <h3 className="section-title">Journaux de l'Agent</h3>
      </div>
      <div className="logs-list">
        {displayLogs.length === 0 ? (
          <div className="log-entry" style={{ color: "#94a3b8", fontStyle: "italic" }}>
            En attente d'une prédiction…
          </div>
        ) : (
          displayLogs.map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-icon">{VARIANT_ICON[log.variant]}</span>
              <span className="log-time">{log.time}</span>
              <span className="log-msg">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentLogs;
