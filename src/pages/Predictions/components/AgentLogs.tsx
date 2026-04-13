import React from "react";
import { Bot, AlertCircle, TrendingUp, Cpu, Zap } from "lucide-react";
import { AgentLog } from "../types";

const logs: AgentLog[] = [
  { time: "10.11.28", message: "Observation analysées: Vlieces vitration ≥ 1 6g,   Tendarens à la hausse", icon: "observation" },
  { time: "10.11.31", message: "Modèle, utilisé ▲ LSTM sélectionné on prédile Tusure", icon: "model" },
  { time: "10.11.32", message: "Analyse des tendances: Augmentation des viérations déspassant le seuil de maintenance (−4.6g)", icon: "analysis" },
  { time: "10.11.34", message: "Prédiction: Maintenance présue le 24 février 2024 avec une confiance de 92%", icon: "prediction" },
];

const IconMap: Record<AgentLog["icon"], React.ReactNode> = {
  observation: <AlertCircle size={14} color="#F97316" />,
  model: <Cpu size={14} color="#F97316" />,
  analysis: <TrendingUp size={14} color="#F97316" />,
  prediction: <Zap size={14} color="#F97316" />,
};

const AgentLogs: React.FC = () => {
  return (
    <div className="card agent-logs-card">
      <div className="card-section-label">
        <Bot size={18} color="#2563EB" />
        <h3 className="section-title">Journaux de l'Agent</h3>
      </div>
      <div className="logs-list">
        {logs.map((log, i) => (
          <div key={i} className="log-entry">
            <span className="log-icon">{IconMap[log.icon]}</span>
            <span className="log-time">{log.time}</span>
            <span className="log-msg">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentLogs;
