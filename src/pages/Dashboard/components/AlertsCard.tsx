import React from "react";
import { Alert } from "../types";

interface AlertsCardProps {
  alerts: Alert[];
}

const severityStyle: Record<Alert["severity"], { cls: string; dotCls: string }> = {
  Critique: { cls: "badge-red",    dotCls: "dot-critique" },
  Élevé:    { cls: "badge-orange", dotCls: "dot-eleve" },
  Moyen:    { cls: "badge-orange", dotCls: "dot-moyen" },
  Faible:   { cls: "badge-blue",   dotCls: "dot-faible" },
};

const AlertsCard: React.FC<AlertsCardProps> = ({ alerts }) => {
  const active = alerts.filter((a) => !a.resolved);
  return (
    <div className="db-card">
      <div className="db-card-header">
        <span className="db-card-title">Alertes Actives</span>
        <span className={`db-card-badge ${active.length > 0 ? "badge-red" : "badge-green"}`}>
          {active.length} alerte{active.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="alerts-list">
        {active.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--theme-text-muted)", textAlign: "center", padding: "20px 0" }}>
            Aucune alerte active
          </p>
        ) : (
          active.slice(0, 5).map((alert) => {
            const { cls, dotCls } = severityStyle[alert.severity] ?? { cls: "badge-blue", dotCls: "dot-faible" };
            return (
              <div key={alert.id} className="alert-item">
                <div className={`alert-dot ${dotCls}`} />
                <div className="alert-meta">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="alert-machine">{alert.machineName}</span>
                    <span className={`alert-severity db-card-badge ${cls}`}>{alert.severity}</span>
                  </div>
                  <div className="alert-msg">{alert.message}</div>
                  <div className="alert-time">{alert.timestamp} · {alert.type}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsCard;
