import React from "react";

interface HealthMetric {
  name: string;
  value: number;  // 0–100
  label: string;
  color: "green" | "orange" | "blue" | "red";
}

interface SystemHealthCardProps {
  metrics: HealthMetric[];
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ metrics }) => {
  return (
    <div className="db-card">
      <div className="db-card-header">
        <span className="db-card-title">Santé Système</span>
        <span className="db-card-badge badge-green">En ligne</span>
      </div>
      <div className="health-list">
        {metrics.map((m) => (
          <div key={m.name} className="health-item">
            <div className="health-item-top">
              <span className="health-name">{m.name}</span>
              <span className="health-value">{m.label}</span>
            </div>
            <div className="health-bar">
              <div className={`health-bar-fill fill-${m.color}`} style={{ width: `${m.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemHealthCard;
