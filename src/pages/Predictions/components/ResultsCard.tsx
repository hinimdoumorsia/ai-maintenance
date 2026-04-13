import React from "react";
import { Server, Wrench, AlertTriangle, Clock, Gauge, Zap } from "lucide-react";

interface KPIBlock {
  icon: React.ReactNode;
  value: string;
  label: string;
  badge?: string;
  trend?: string;
}

const kpis: KPIBlock[] = [
  { icon: <Server size={18} />, value: "95%", label: "Taux de Disponibilité", badge: "1,122", trend: "objectif −30%" },
  { icon: <Clock size={18} />, value: "1,122", label: "Mibo %", trend: "objectif −30%" },
  { icon: <Gauge size={18} />, value: "1.9h", label: "Gtlbpcirf", trend: "objectif −25%" },
  { icon: <Wrench size={18} />, value: "1,142 h", label: "Objectif +100% hums" },
  { icon: <Clock size={18} />, value: "1.9h", label: "Objectif −25%" },
  { icon: <AlertTriangle size={18} />, value: "4  6%", label: "Objectif −29%" },
  { icon: <Zap size={18} />, value: "6%", label: "Taux des Pannes Imprévues" },
  { icon: <Clock size={18} />, value: "24 février", label: "objectif −2%" },
  { icon: <Gauge size={18} />, value: "<95ms", label: "Objectif −44.orc / Objectif :0.04" },
];

const ResultsCard: React.FC = () => {
  return (
    <div className="card results-card">
      <div className="results-header">
        <h3 className="section-title">Résultats</h3>
      </div>
      <div className="kpi-header-row">
        <span className="kpi-year-label">2025-2026 KPI de Fiabilité</span>
        <span className="kpi-badge-chip">
          <span className="kpi-badge-dot" />
          16 Laporefts des Dattarlfleih,
        </span>
      </div>
      <div className="kpi-grid">
        <div className="kpi-item kpi-primary">
          <Server size={20} className="kpi-icon" />
          <span className="kpi-value primary">95%</span>
          <span className="kpi-label">Taux de Disponibilité</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-value accent">1,122</span>
          <span className="kpi-sub">Mibo %</span>
          <span className="kpi-trend neg">objectif −30%</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-value accent">1.9h</span>
          <span className="kpi-sub">Gtlbpcirf</span>
          <span className="kpi-trend neg">objectif −25%</span>
        </div>
        <div className="kpi-item">
          <Wrench size={16} className="kpi-icon-sm" />
          <span className="kpi-value">1,142 h</span>
          <span className="kpi-label">Objectif +100% hums</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-value">1.9h</span>
          <span className="kpi-label">Objectif</span>
          <span className="kpi-trend neg">−25%</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-value">4  6%</span>
          <span className="kpi-label">Objectif −29%</span>
        </div>
        <div className="kpi-item">
          <Zap size={16} className="kpi-icon-sm" />
          <span className="kpi-value">6%</span>
          <span className="kpi-label">Taux des Pannes Imprévues</span>
        </div>
        <div className="kpi-item">
          <Clock size={16} className="kpi-icon-sm" />
          <span className="kpi-value">24 février</span>
          <span className="kpi-trend neg">objectif −2%</span>
        </div>
        <div className="kpi-item">
          <Gauge size={16} className="kpi-icon-sm" />
          <span className="kpi-value">&lt;95ms</span>
          <span className="kpi-label">Objectif −44.orc</span>
          <span className="kpi-label">Objectif :0.04</span>
        </div>
      </div>
    </div>
  );
};

export default ResultsCard;
