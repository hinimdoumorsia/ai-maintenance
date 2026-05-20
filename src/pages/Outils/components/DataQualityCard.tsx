import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { DataQualityMetric } from "../types";
import { getToolsDataQuality } from "../../../services/api";

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

// Normalise les status backend ("bad", "critical") vers le set frontend
function normalizeStatus(raw: any): DataQualityMetric["status"] {
  const s = String(raw || "").toLowerCase();
  if (s === "good") return "good";
  if (s === "warning") return "warning";
  return "critical";
}

const DataQualityCard: React.FC = () => {
  const [metrics, setMetrics] = useState<DataQualityMetric[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getToolsDataQuality();
        if (!active) return;
        const list: DataQualityMetric[] = (data.metrics ?? []).map((m: any) => ({
          name: String(m.name ?? "Métrique"),
          value: Number(m.value ?? 0),
          status: normalizeStatus(m.status),
          detail: String(m.detail ?? ""),
        }));
        setMetrics(list);
      } catch (e: any) {
        if (active) setError(e?.message || "Impossible de récupérer la qualité des données");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const overall = metrics && metrics.length > 0
    ? Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length)
    : null;

  return (
    <div className="outil-card">
      <div className="outil-card-header">
        <div className="outil-card-title-wrap">
          <div className="outil-card-icon icon-green"><ShieldCheck size={16} /></div>
          <div>
            <div className="outil-card-title">Qualité des Données</div>
            <div className="outil-card-sub">Mesurée par l'agent EDA sur le dernier dataset</div>
          </div>
        </div>
        {overall !== null && (
          <span
            className={`outil-badge ${overall >= 85 ? "outil-badge-green" : overall >= 70 ? "outil-badge-orange" : "outil-badge-red"}`}
          >
            {overall}%
          </span>
        )}
      </div>

      {loading && (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Chargement des métriques…
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: "12px", color: "#b91c1c", fontSize: 13 }}>
          ❌ {error}
        </div>
      )}

      {!loading && !error && metrics && metrics.length === 0 && (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          Aucune donnée à analyser. Uploade un dataset depuis l'onglet « Données » pour voir les métriques de qualité.
        </div>
      )}

      {metrics && metrics.length > 0 && (
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
      )}
    </div>
  );
};

export default DataQualityCard;
