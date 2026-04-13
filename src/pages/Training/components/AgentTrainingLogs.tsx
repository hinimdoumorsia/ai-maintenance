import React from "react";
import { Database, Lightbulb, Cpu, Play, Save, Trash2 } from "lucide-react";
import { AgentLogEntry } from "../types";

const LOGS: AgentLogEntry[] = [
  {
    time: "10.24:15",
    title: "Dataset analysed:",
    detail: "Detected time series data Shape: [15221, 23], Miasling valbes: 2.3%",
    type: "dataset",
  },
  {
    time: "10.24:10",
    title: "Expliquer les decisions",
    detail: "Phe etiido temporoement in les journato model dlo estares",
    type: "explain",
  },
  {
    time: "10.24:17",
    title: "Data prepicessing …",
    detail: "Sealed: 23 Matures, crîatiés applec: 0.001",
    type: "preprocess",
  },
  {
    time: "10.24:29",
    title: "Training stareed",
    detail: "Epochs: 50, Batth:cr: 39, Learning rate: 0.001",
    type: "training",
  },
  {
    time: "10.25:48",
    title: "Model saved",
    detail: "casec: :Eally  Path:models/ietm_model_ut:0:h5",
    type: "model",
  },
];

const IconMap: Record<AgentLogEntry["type"], React.ReactNode> = {
  dataset:    <Database size={13} color="#F97316" />,
  explain:    <Lightbulb size={13} color="#F97316" />,
  preprocess: <Cpu size={13} color="#F97316" />,
  training:   <Play size={13} color="#F97316" />,
  model:      <Save size={13} color="#F97316" />,
};

const AgentTrainingLogs: React.FC = () => {
  return (
    <div className="card agent-logs-training-card">
      <div className="agent-logs-header">
        <div className="card-section-label" style={{ marginBottom: 0 }}>
          <span className="logs-grid-icon">⊞</span>
          <h3 className="section-title">Journaux de l'Agent</h3>
        </div>
        <button className="eflacar-btn">
          <Trash2 size={12} /> Eflacar
        </button>
      </div>

      <div className="logs-list" style={{ marginTop: 12 }}>
        {LOGS.map((log, i) => (
          <div key={i} className="log-entry training-log">
            <span className="log-icon">{IconMap[log.type]}</span>
            <span className="log-time">{log.time}</span>
            <div className="log-body">
              <span className="log-title-blue">{log.title}</span>
              <span className="log-detail"> {log.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentTrainingLogs;
