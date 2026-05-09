import React, { useRef, useEffect } from "react";
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

const AgentTrainingLogs: React.FC<AgentTrainingLogsProps> = ({
  logs = [],
  onClear,
  isRunning = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="agent-logs-training-card">
      {/* HEADER - UN SEUL TITRE */}
      <div className="agent-logs-header">
        <span className="logs-grid-icon">⊞</span>
        <h3 className="agent-logs-title">Journaux de l'Agent</h3>
        <button className="eflacar-btn" onClick={onClear} disabled={isRunning || logs.length === 0}>
          <Trash2 size={12} /> Effacer
        </button>
      </div>

      {/* LISTE DES LOGS */}
      <div className="logs-list">
        {logs.length === 0 && !isRunning && (
          <div className="log-empty">
            <Cpu size={20} />
            <span>En attente du démarrage de l'entraînement...</span>
          </div>
        )}

        {logs.length === 0 && isRunning && (
          <div className="log-empty" style={{ color: "#F97316" }}>
            <Cpu size={16} className="spin" />
            <span>Démarrage de l'entraînement...</span>
          </div>
        )}

        {logs.map((log, i) => (
          <div key={i} className="log-entry">
            <span className="log-icon">{IconMap[log.type] ?? <Cpu size={13} color="#F97316" />}</span>
            <span className="log-time">{log.time}</span>
            <div className="log-body">
              <span className="log-title">{log.title}</span>
              {log.detail && <span className="log-detail">{log.detail}</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <style>{`
        .agent-logs-training-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e5e7eb;
        }
        
        .agent-logs-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .logs-grid-icon {
          font-size: 18px;
          color: #f97316;
        }
        
        .agent-logs-title {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .eflacar-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .logs-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .log-entry {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          margin-bottom: 4px;
          background: #fafafa;
          border: 1px solid #f3f4f6;
        }
        
        .log-icon {
          flex-shrink: 0;
        }
        
        .log-time {
          flex-shrink: 0;
          font-size: 11px;
          color: #9ca3af;
          font-family: monospace;
        }
        
        .log-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .log-title {
          font-size: 12px;
          font-weight: 600;
          color: #f97316;
        }
        
        .log-detail {
          font-size: 11px;
          color: #6b7280;
          word-break: break-word;
        }
        
        .log-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 20px;
          color: #9ca3af;
          font-size: 13px;
          text-align: center;
          gap: 8px;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AgentTrainingLogs;