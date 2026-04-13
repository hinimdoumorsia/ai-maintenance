import React from "react";
import type { ToolPerformance, PerformanceBarPoint } from "../types";

interface Props {
  tools: ToolPerformance[];
  chartData: PerformanceBarPoint[];
}

const PerformanceCard: React.FC<Props> = ({ tools, chartData }) => {
  const maxVal = Math.max(...chartData.flatMap((d) => [d.f1Score, d.recall]));

  return (
    <div className="card perf-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon" style={{ background: "rgba(16,185,129,.10)", fontSize: 16 }}>📶</div>
          <div>
            <div className="card-title">Performance des Outils</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="perf-table">
        <div className="perf-table-header">
          <span>Outils</span>
          <span style={{ textAlign: "center" }}>Exécution</span>
          <span style={{ textAlign: "center" }}>Timps</span>
          <span style={{ textAlign: "center" }}>Success</span>
        </div>
        {tools.map((tool) => (
          <div key={tool.name} className="perf-row">
            <span className="perf-name">{tool.name}</span>
            <span className="perf-val">{tool.execution}</span>
            <span className="perf-val">{tool.temps}</span>
            <span className="perf-success">{tool.success}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="chart-wrap">
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot f1" />
            <span>F1-Score</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot recall" />
            <span>Recall</span>
          </div>
        </div>

        {/* Y-axis labels + bars */}
        <div style={{ display: "flex", gap: 6 }}>
          {/* Y labels */}
          <div style={{
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            height: 110, paddingBottom: 24, fontSize: 10, color: "#9ca3af",
            paddingRight: 4
          }}>
            <span>1.0</span>
            <span>0.8</span>
            <span>0.6</span>
            <span>0.3</span>
            <span>0.0</span>
          </div>

          <div style={{ flex: 1 }}>
            <div className="chart-bars">
              {chartData.map((point) => (
                <div key={point.label} className="bar-group">
                  <div
                    className="bar f1"
                    style={{
                      height: `${(point.f1Score / maxVal) * 80}px`,
                      animationDelay: `${point.label * 0.05}s`
                    }}
                    title={`F1: ${point.f1Score}`}
                  />
                  <div
                    className="bar recall"
                    style={{
                      height: `${(point.recall / maxVal) * 80}px`,
                      animationDelay: `${point.label * 0.05 + 0.1}s`
                    }}
                    title={`Recall: ${point.recall}`}
                  />
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {chartData.map((point) => (
                <div key={point.label} className="chart-label">{point.label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard;