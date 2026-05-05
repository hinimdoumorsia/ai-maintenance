import React from "react";
import { ActivityPoint } from "../types";

interface ActivityChartProps {
  data: ActivityPoint[];
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  const maxPred  = Math.max(...data.map((d) => d.predictions), 1);
  const maxAlert = Math.max(...data.map((d) => d.alerts), 1);
  const maxVal   = Math.max(maxPred, maxAlert);

  return (
    <div className="db-card">
      <div className="db-card-header">
        <span className="db-card-title">Activité — 24 h</span>
        <span className="db-card-badge badge-blue">Aujourd'hui</span>
      </div>
      <div className="activity-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#2563eb" }} />
          <span>Prédictions</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#f97316" }} />
          <span>Alertes</span>
        </div>
      </div>
      <div className="activity-chart-wrap">
        {data.map((d) => (
          <div key={d.hour} className="activity-bar-group">
            <div className="activity-bars">
              <div
                className="bar-pred"
                style={{ height: `${(d.predictions / maxVal) * 80}px` }}
                title={`Prédictions: ${d.predictions}`}
              />
              <div
                className="bar-alert"
                style={{ height: `${(d.alerts / maxVal) * 80}px` }}
                title={`Alertes: ${d.alerts}`}
              />
            </div>
            <span className="activity-label">{d.hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityChart;
