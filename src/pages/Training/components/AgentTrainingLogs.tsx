import React from "react";
import { Database, Lightbulb, Cpu, Play, Save, Trash2 } from "lucide-react";
import { AgentLogEntry } from "../types";

interface AgentTrainingLogsProps {
  logs?: AgentLogEntry[];
  onClear?: () => void;
  isRunning?: boolean;
}

const IconMap: Record<AgentLogEntry["type"], React.ReactNode> = {
  dataset:    <Database size={13} color="#F97316" />,
  explain:    <Lightbulb size={13} color="#F97316" />,
  preprocess: <Cpu size={13} color="#F97316" />,
  training:   <Play size={13} color="#F97316" />,
  model:      <Save size={13} color="#F97316" />,
};

const AgentTrainingLogs: React.FC<AgentTrainingLogsProps> = ({ logs = [], onClear, isRunning = false }) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  // Utiliser les logs passés en props s'il y en a, sinon les logs mockés par défaut
  const displayLogs = logs.length > 0 ? logs : [];

  return (
    <div className="card agent-logs-training-card">
      <div className="agent-logs-header">
        <div className="card-section-label" style={{ marginBottom: 0 }}>
          <span className="logs-grid-icon">⊞</span>
          <h3 className="section-title">Journaux de l'Agent</h3>
        </div>
        <button className="eflacar-btn" onClick={handleClear} disabled={isRunning}>
          <Trash2 size={12} /> Effacer
        </button>
      </div>

      <div className="logs-list" style={{ marginTop: 12, maxHeight: 400, overflowY: "auto" }}>
        {displayLogs.length === 0 && !isRunning && (
          <div className="log-entry" style={{ justifyContent: "center", color: "#9CA3AF", padding: "20px", textAlign: "center" }}>
            En attente du démarrage de l'entraînement...
          </div>
        )}
        
        {displayLogs.length === 0 && isRunning && (
          <div className="log-entry" style={{ justifyContent: "center", color: "#F97316", padding: "20px", textAlign: "center" }}>
            <Cpu size={16} className="spin" style={{ marginRight: 8 }} />
            Démarrage de l'entraînement...
          </div>
        )}
        
        {displayLogs.map((log, i) => (
          <div key={i} className="log-entry training-log">
            <span className="log-icon">{IconMap[log.type] || <Cpu size={13} color="#F97316" />}</span>
            <span className="log-time">{log.time}</span>
            <div className="log-body">
              <span className="log-title-blue">{log.title}</span>
              <span className="log-detail"> {log.detail}</span>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .logs-list::-webkit-scrollbar {
          width: 6px;
        }
        .logs-list::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 10px;
        }
        .logs-list::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default AgentTrainingLogs;