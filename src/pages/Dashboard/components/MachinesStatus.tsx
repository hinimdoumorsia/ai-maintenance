import React from "react";
import { Machine } from "../types";

interface MachinesStatusProps {
  machines: Machine[];
}

const statusLabel = (s: Machine["status"]) => {
  const map: Record<Machine["status"], { label: string; cls: string }> = {
    OK:         { label: "OK",         cls: "status-ok" },
    Alerte:     { label: "Alerte",     cls: "status-alerte" },
    Critique:   { label: "Critique",   cls: "status-critique" },
    "Hors Ligne": { label: "Hors Ligne", cls: "status-offline" },
  };
  return map[s] ?? { label: s, cls: "" };
};

const MachinesStatus: React.FC<MachinesStatusProps> = ({ machines }) => {
  return (
    <div className="db-card" style={{ gridColumn: "1 / -1" }}>
      <div className="db-card-header">
        <span className="db-card-title">État des Machines</span>
        <span className="db-card-badge badge-blue">{machines.length} machines</span>
      </div>
      <table className="machines-table">
        <thead>
          <tr>
            <th>Machine</th>
            <th>Statut</th>
            <th>Température (°C)</th>
            <th>Vibration</th>
            <th>Disponibilité</th>
            <th>Dernière vérif.</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((m) => {
            const { label, cls } = statusLabel(m.status);
            const tempPct = Math.min((m.temperature / 120) * 100, 100);
            return (
              <tr key={m.id}>
                <td>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{m.id}</span>
                  <span style={{ color: "#9ca3af", marginLeft: 6, fontSize: 11 }}>{m.name}</span>
                </td>
                <td>
                  <span className={`machine-status-dot ${cls}`}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                    {label}
                  </span>
                </td>
                <td>
                  <div className="temp-bar-wrap">
                    <span style={{ fontWeight: 600, minWidth: 36 }}>{m.temperature}°</span>
                    <div className="temp-bar">
                      <div
                        className="temp-bar-fill"
                        style={{
                          width: `${tempPct}%`,
                          background: m.temperature > 90 ? "#ef4444" : m.temperature > 75 ? "#f97316" : "#22c55e",
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{m.vibration.toFixed(3)}</td>
                <td>
                  <div className="temp-bar-wrap">
                    <span style={{ fontWeight: 600, minWidth: 36 }}>{m.uptime}%</span>
                    <div className="temp-bar">
                      <div
                        className="temp-bar-fill"
                        style={{ width: `${m.uptime}%`, background: m.uptime >= 95 ? "#22c55e" : m.uptime >= 80 ? "#f97316" : "#ef4444" }}
                      />
                    </div>
                  </div>
                </td>
                <td style={{ color: "#9ca3af", fontSize: 12 }}>{m.lastCheck}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MachinesStatus;
