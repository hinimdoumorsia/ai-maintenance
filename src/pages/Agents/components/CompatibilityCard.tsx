import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Globe } from "lucide-react";
import type { CompatibilityEntry } from "../types";

interface Props {
  entries: CompatibilityEntry[];
}

const CompatibilityCard: React.FC<Props> = ({ entries }) => {
  const badgeClass = (status: CompatibilityEntry["status"]) => {
    if (status === "Compatible") return "compat-badge compatible";
    if (status === "Alert") return "compat-badge alert";
    return "compat-badge incompatible";
  };

  const badgeIcon = (status: CompatibilityEntry["status"]) => {
    if (status === "Compatible") return <CheckCircle2 size={13} />;
    if (status === "Alert") return <AlertTriangle size={13} />;
    return <XCircle size={13} />;
  };

  return (
    <div className="card compat-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon" style={{ background: "rgba(99,102,241,.10)", color: "#6366f1" }}>
            <Globe size={16} />
          </div>
          <div>
            <div className="card-title">Statut de Compatibilité</div>
            <div className="card-subtitle">Compatibilités status en sous des données</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="compat-table">
        <div className="compat-table-header">
          <span>Incoment ID</span>
          <span>Statut</span>
        </div>
        {entries.map((entry) => (
          <div key={entry.id} className="compat-row">
            <span className="compat-id">{entry.incomentId}</span>
            <div className="compat-status-wrap">
              <span className={badgeClass(entry.status)}>
                {badgeIcon(entry.status)} {entry.status}
              </span>
              <span className="compat-action">{entry.actionLabel}</span>
              <span className="compat-msg">{entry.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompatibilityCard;