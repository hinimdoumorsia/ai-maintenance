import React, { useEffect, useState } from "react";
import { Terminal, RefreshCw } from "lucide-react";
import { LogEntry } from "../types";
import { getToolsLogs } from "../../../services/api";

type Filter = "ALL" | "INFO" | "WARN" | "ERROR" | "DEBUG";

// Normalise les niveaux backend variés vers les 4 niveaux UI.
// Le schéma SQLite `alerte.niveau` utilise les valeurs FR : 'info', 'alerte', 'critique'.
// On accepte aussi les niveaux EN au cas où d'autres sources de logs viendraient s'ajouter.
function normalizeLevel(raw: any): LogEntry["level"] {
  const s = String(raw || "").toUpperCase();
  // FR
  if (s === "ALERTE") return "WARN";
  if (s === "CRITIQUE") return "ERROR";
  // EN
  if (s.startsWith("WARN")) return "WARN";
  if (s === "ERROR" || s === "CRITICAL" || s === "FATAL") return "ERROR";
  if (s === "DEBUG" || s === "TRACE") return "DEBUG";
  return "INFO";
}

function formatTime(raw: any): string {
  if (!raw) return "";
  const s = String(raw);
  // Si déjà au format HH:MM:SS, on garde
  if (/^\d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 8);
  // SQLite renvoie souvent "2024-05-20 10:47:23" (espace au lieu de T).
  // Safari/iOS refusent ce format → on normalise en ISO.
  const isoLike = s.replace(" ", "T");
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) {
    // Dernier recours : extraire HH:MM:SS si présent dans le string
    const m = s.match(/(\d{2}:\d{2}:\d{2})/);
    return m ? m[1] : s;
  }
  return d.toLocaleTimeString();
}

const SystemLogsCard: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setError(null);
    try {
      const data = await getToolsLogs();
      const list: LogEntry[] = (data.logs ?? []).map((l: any) => ({
        id: String(l.id ?? l.timestamp ?? Math.random()),
        timestamp: formatTime(l.timestamp),
        level: normalizeLevel(l.level),
        source: String(l.source ?? "system"),
        message: String(l.message ?? ""),
      }));
      setLogs(list);
    } catch (e: any) {
      setError(e?.message || "Impossible de charger les logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = filter === "ALL" ? logs : logs.filter((l) => l.level === filter);

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
            <div className="outil-card-sub">
              {logs.length > 0 ? `${logs.length} alertes récentes` : "Alertes système (table alerte)"}
            </div>
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
          <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={loadLogs}>
            <RefreshCw size={12} /> Actualiser
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Chargement des logs…
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: "12px", color: "#b91c1c", fontSize: 13 }}>
          ❌ {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Aucune alerte récente dans le système.
        </div>
      )}

      {!loading && !error && logs.length > 0 && filtered.length === 0 && (
        <div style={{ padding: "16px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Aucun log au niveau « {filter} ».
        </div>
      )}

      {filtered.length > 0 && (
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
      )}
    </div>
  );
};

export default SystemLogsCard;
