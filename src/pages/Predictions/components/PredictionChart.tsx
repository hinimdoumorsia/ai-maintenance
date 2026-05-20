import React, { useMemo } from "react";
import { BarChart2 } from "lucide-react";
import { PredictionResult } from "../../../services/api";

interface PredictionChartProps {
  results?: PredictionResult | null;
  threshold?: number;
}

const W = 460;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const MAX_POINTS = 200; // évite les SVG trop lourds

function downsample(arr: number[], n: number): number[] {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[Math.floor(i * step)]);
  }
  return out;
}

const PredictionChart: React.FC<PredictionChartProps> = ({ results, threshold = 0.5 }) => {
  const raw = Array.isArray(results?.predictions)
    ? (results!.predictions as number[]).filter((v) => typeof v === "number" && Number.isFinite(v))
    : [];

  const { series, minY, maxY, isProba } = useMemo(() => {
    if (raw.length === 0) {
      return { series: [] as number[], minY: 0, maxY: 1, isProba: false };
    }
    const sampled = downsample(raw, MAX_POINTS);
    const mn = Math.min(...sampled);
    const mx = Math.max(...sampled);
    const proba = mn >= 0 && mx <= 1;
    return {
      series: sampled,
      minY: proba ? 0 : mn - 0.05 * Math.abs(mn || 1),
      maxY: proba ? 1 : mx + 0.05 * Math.abs(mx || 1),
      isProba: proba,
    };
  }, [raw]);

  const showThreshold = isProba && threshold > minY && threshold < maxY;
  const aboveThreshold = isProba ? series.filter((v) => v >= threshold).length : 0;

  const toX = (i: number) => PAD.left + (series.length <= 1 ? PLOT_W / 2 : (i / (series.length - 1)) * PLOT_W);
  const toY = (v: number) => PAD.top + PLOT_H - ((v - minY) / (maxY - minY || 1)) * PLOT_H;

  const polyline = series.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  const yTicks = isProba ? [0, 0.25, 0.5, 0.75, 1] : [minY, (minY + maxY) / 2, maxY];

  return (
    <div className="card chart-card">
      <div className="card-section-label">
        <BarChart2 size={18} color="#2563EB" />
        <h3 className="section-title">Graphique de Prédiction</h3>
      </div>

      {series.length === 0 ? (
        <div style={{ padding: "32px 12px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>
          Aucune prédiction à visualiser pour l'instant.
        </div>
      ) : (
        <>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot blue" />
              {isProba ? "Probabilité par observation" : "Valeur prédite"}
            </span>
            {showThreshold && (
              <span className="legend-item">
                <span className="legend-dot orange-dashed" />
                Seuil ({threshold.toFixed(2)}) — {aboveThreshold} au-dessus
              </span>
            )}
          </div>

          <div className="chart-svg-wrap">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
              {/* Grid + Y labels */}
              {yTicks.map((t) => (
                <g key={t}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={toY(t)} y2={toY(t)} stroke="#e5e7eb" strokeWidth={0.8} />
                  <text x={PAD.left - 4} y={toY(t) + 4} fontSize={9} fill="#9ca3af" textAnchor="end">
                    {isProba ? t.toFixed(2) : t.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Threshold line */}
              {showThreshold && (
                <line
                  x1={PAD.left} x2={W - PAD.right}
                  y1={toY(threshold)} y2={toY(threshold)}
                  stroke="#F97316" strokeWidth={1.5} strokeDasharray="5,4"
                />
              )}

              {/* Prediction polyline */}
              <polyline points={polyline} fill="none" stroke="#2563EB" strokeWidth={2} />

              {/* Highlight points above threshold */}
              {isProba && series.map((v, i) =>
                v >= threshold ? (
                  <circle key={i} cx={toX(i)} cy={toY(v)} r={2.5} fill="#F97316" />
                ) : null
              )}

              {/* X axis label */}
              <text x={W / 2} y={H - 6} fontSize={9} fill="#6b7280" textAnchor="middle">
                Index de l'observation (0 — {raw.length - 1}{series.length < raw.length ? `, échantillonné à ${series.length} points` : ""})
              </text>
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default PredictionChart;
