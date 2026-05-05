import React, { useState } from "react";
import { Terminal, RefreshCw } from "lucide-react";
import { LogEntry } from "../types";

const LOGS: LogEntry[] = [
  { id: "l01", timestamp: "10:47:23", level: "INFO",  source: "Pipeline",  message: "Prédiction lancée pour MCH-004 — modèle LSTM v2.1" },
  { id: "l02", timestamp: "10:47:21", level: "WARN",  source: "Capteur",   message: "Valeur aberrante détectée sur capteur T4 (MCH-002)" },
  { id: "l03", timestamp: "10:46:58", level: "ERROR", source: "API",       message: "Timeout connexion API collecte — retry #2" },
  { id: "l04", timestamp: "10:46:45", level: "INFO",  source: "Modèle",    message: "Chargement modèle LSTM — 128MB — OK" },
  { id: "l05", timestamp: "10:46:30", level: "DEBUG", source: "DataProc",  message: "Normalisation dataset — 300 observations traitées" },
  { id: "l06", timestamp: "10:46:12", level: "INFO",  source: "Agent",     message: "Agent_Data_Cleaner — nettoyage terminé" },
  { id: "l07", timestamp: "10:45:58", level: "WARN",  source: "Mémoire",   message: "RAM à 78% — pipeline dégradé possible" },
  { id: "l08", timestamp: "10:45:40", level: "INFO",  source: "Scheduler", message: "Tâche planifiée MCH-001 — prédiction automatique" },
  { id: "l09", timestamp: "10:45:22", level: "DEBUG", source: "DataProc",  message: "Transformation features — 15 features extraites" },
  { id: "l10", timestamp: "10:44:55", level: "INFO",  source: "Modèle",    message: "Score validation LSTM — F1: 0.91 / Recall: 0.88" },
  { id: "l11", timestamp: "10:44:30", level: "ERROR", source: "Capteur",   message: "Capteur P2 (MCH-004) hors ligne — données manquantes" },
  { id: "l12", timestamp: "10:44:08", level: "INFO",  source: "Pipeline",  message: "Pipeline ML initialisé avec succès" },
];

type Filter = "ALL" | "INFO" | "WARN" | "ERROR" | "DEBUG";

const SystemLogsCard: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = filter === "ALL" ? LOGS : LOGS.filter((l) => l.level === filter);

  const levelCls: Record<string, string> = {
    INFO: "level-info", WARN: "level-warn", ERROR: "level-error", DEBUG: "level-debug",
  };

  return (
    <div className="outil-card outils-content-full">
      <div className="outil-card-header">
        <div className="outil-card-title-wrap">
          <div className="outil-card-icon icon-purple"><Terminal size={16} /></div>
          <div>
            <div className="outil-card-title">Journaux Système</div>
            <div className="outil-card-sub">Logs en temps réel des composants</div>
          </div>
        </div>
        <div className="logs-toolbar">
          {(["ALL", "INFO", "WARN", "ERROR", "DEBUG"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`log-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
          <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
            <RefreshCw size={12} /> Actualiser
          </button>
        </div>
      </div>

      <div className="logs-list">
        {filtered.map((log) => (
          <div key={log.id} className="log-entry">
            <span className="log-time">{log.timestamp}</span>
            <span className={`log-level ${levelCls[log.level] ?? ""}`}>{log.level}</span>
            <span className="log-source">[{log.source}]</span>
            <span className="log-msg">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemLogsCard;
