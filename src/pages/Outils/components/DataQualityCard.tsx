import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { DataQualityMetric } from "../types";
import { getToolsDataQuality } from "../../../services/api";

const METRICS: DataQualityMetric[] = [
  { name: "Complétude des données",  value: 92, status: "good",    detail: "8% de valeurs manquantes — acceptable" },
  { name: "Cohérence temporelle",    value: 78, status: "warning", detail: "22% d'irrégularités dans les timestamps" },
  { name: "Valeurs aberrantes",      value: 96, status: "good",    detail: "4% de valeurs hors plage normale" },
  { name: "Fraîcheur des données",   value: 55, status: "warning", detail: "Certaines sources retardées de >10 min" },
  { name: "Doublons détectés",       value: 98, status: "good",    detail: "Taux de dédoublonnage : 98%" },
];

const colorMap: Record<DataQualityMetric["status"], string> = {
  good:    "q-good",
  warning: "q-warning",
  critical: "q-critical",
};

const badgeMap: Record<DataQualityMetric["status"], string> = {
  good:    "outil-badge-green",
  warning: "outil-badge-orange",
  critical: "outil-badge-red",
};

const labelMap: Record<DataQualityMetric["status"], string> = {
  good: "Bon", warning: "Attention", critical: "Critique",
};

const DataQualityCard: React.FC = () => {
  const [metrics, setMetrics] = useState<DataQualityMetric[]>(METRICS);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getToolsDataQuality();
        if (!active || !Array.isArray(data.metrics)) return;
        setMetrics(data.metrics as DataQualityMetric[]);
      } catch {
        // keep defaults
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const overall = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);

  return (
    <div className="outil-card">
      <div className="outil-card-header">
        <div className="outil-card-title-wrap">
          <div className="outil-card-icon icon-green"><ShieldCheck size={16} /></div>
          <div>
            <div className="outil-card-title">Qualité des Données</div>
            <div className="outil-card-sub">Score global de qualité</div>
          </div>
        </div>
        <span
          className={`outil-badge ${overall >= 85 ? "outil-badge-green" : overall >= 70 ? "outil-badge-orange" : "outil-badge-red"}`}
        >
          {overall}%
        </span>
      </div>

      <div className="quality-list">
        {metrics.map((m) => (
          <div key={m.name} className="quality-item">
            <div className="quality-item-top">
              <span className="quality-name">{m.name}</span>
              <span className={`outil-badge ${badgeMap[m.status]}`}>{labelMap[m.status]}</span>
            </div>
            <div className="quality-bar">
              <div className={`quality-bar-fill ${colorMap[m.status]}`} style={{ width: `${m.value}%` }} />
            </div>
            <span className="quality-detail">{m.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataQualityCard;
