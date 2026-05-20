import React from "react";
import { PredictionResult } from "../../../services/api";
import { Server, Wrench, AlertTriangle, Clock, Gauge, Zap } from "lucide-react";

interface KPIBlock {
  icon: React.ReactNode;
  value: string;
  label: string;
  badge?: string;
  trend?: string;
}

const formatNumber = (value: number | null, digits: number = 3) => {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(digits);
};

interface ResultsCardProps {
  results?: PredictionResult | null;
}

const ResultsCard: React.FC<ResultsCardProps> = ({ results }) => {
  const values = Array.isArray(results?.predictions)
    ? results?.predictions.filter((v) => typeof v === "number" && Number.isFinite(v))
    : [];

  const count = values.length;
  const avg = count ? values.reduce((a, b) => a + b, 0) / count : null;
  const min = count ? Math.min(...values) : null;
  const max = count ? Math.max(...values) : null;
  const sorted = count ? [...values].sort((a, b) => a - b) : [];
  const p05 = count ? sorted[Math.floor(0.05 * (count - 1))] : null;
  const p95 = count ? sorted[Math.floor(0.95 * (count - 1))] : null;
  const modelId = (results?.summary as any)?.model_id || "-";

  const kpis: KPIBlock[] = [
    { icon: <Server size={18} />, value: count ? String(count) : "-", label: "Nb prédictions" },
    { icon: <Gauge size={18} />, value: formatNumber(avg), label: "Moyenne" },
    { icon: <AlertTriangle size={18} />, value: formatNumber(max), label: "Max" },
    { icon: <Clock size={18} />, value: formatNumber(min), label: "Min" },
    { icon: <Zap size={18} />, value: formatNumber(p95), label: "P95" },
    { icon: <Wrench size={18} />, value: formatNumber(p05), label: "P05" },
    { icon: <Server size={18} />, value: String(modelId), label: "Modèle" },
  ];
  return (
    <div className="card results-card">
      <div className="results-header">
        <h3 className="section-title">Résultats</h3>
        {count > 0 && (
          <span style={{ fontSize: 12, color: "#64748b" }}>{count} prédictions reçues</span>
        )}
      </div>
      <div className="kpi-header-row">
        <span className="kpi-year-label">KPI des prédictions</span>
        <span className="kpi-badge-chip">
          <span className="kpi-badge-dot" />
          {results?.job_id ? `Job ${results.job_id.slice(0, 8)}` : "Aucun job"}
        </span>
      </div>
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className={`kpi-item ${i === 0 ? "kpi-primary" : ""}`}>
            {i === 0 && <span className="kpi-icon">{kpi.icon}</span>}
            {i !== 0 && <span className="kpi-icon-sm">{kpi.icon}</span>}
            <span className={`kpi-value ${i === 0 ? "primary" : ""}`}>{kpi.value}</span>
            <span className="kpi-label">{kpi.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsCard;
