import React from "react";
import { Settings } from "lucide-react";
import { TrainingResults } from "../types";

interface ResultsCardProps {
  results: TrainingResults | null;
}

const LOSS = [0.9, 0.75, 0.6, 0.5, 0.42, 0.35, 0.3, 0.26, 0.22, 0.19, 0.17];
const ACC  = [0.5, 0.6, 0.68, 0.74, 0.79, 0.83, 0.86, 0.88, 0.9, 0.91, 0.917];

const W = 280, H = 110;
const PAD = { top: 10, right: 10, bottom: 24, left: 10 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

function toX(i: number, total: number) { return PAD.left + (i / (total - 1)) * PW; }
function toY(v: number, min = 0, max = 1) { return PAD.top + PH - ((v - min) / (max - min)) * PH; }
function poly(data: number[]) { return data.map((v, i) => `${toX(i, data.length)},${toY(v)}`).join(" "); }

const ResultsCard: React.FC<ResultsCardProps> = ({ results }) => {
  const epochs = LOSS.map((_, i) => i * 5);

  return (
    <div className="card results-training-card">
      <div className="card-section-label" style={{ marginBottom: 12 }}>
        <span className="results-bar-icon" />
        <h3 className="section-title">Résultats</h3>
      </div>

      <div className="model-used-row">
        <div className="model-used-icon">
          <Settings size={18} color="#2563EB" />
        </div>
        <div>
          <p className="model-used-label">Modele utillee</p>
          <p className="model-used-name">LSTM <span className="model-badge">Mode I:desionale</span></p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-chip blue">
          <span className="metric-label">Accuracy</span>
          <span className="metric-value">91.7%</span>
        </div>
        <div className="metric-chip orange">
          <span className="metric-label">Precision</span>
          <span className="metric-value">89.3%</span>
        </div>
        <div className="metric-chip green">
          <span className="metric-label">Recall</span>
          <span className="metric-value">98.1%</span>
        </div>
        <div className="metric-chip purple">
          <span className="metric-label">F1-Score</span>
          <span className="metric-value">91.2%</span>
        </div>
      </div>

      <div className="history-section">
        <div className="history-header">
          <p className="history-title">Training History</p>
          <div className="history-legend">
            <span className="hist-leg"><span className="hist-dot blue" />Loss</span>
            <span className="hist-leg"><span className="hist-dot orange" />Accurnr</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 110 }}>
          {/* Grid */}
          {[0, 0.5, 1].map(v => (
            <line key={v} x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)}
              stroke="#F3F4F6" strokeWidth={1} />
          ))}
          {/* Y axis labels */}
          {[0, 0.5, 1].map(v => (
            <text key={v} x={PAD.left - 2} y={toY(v) + 4} fontSize={8} fill="#9CA3AF" textAnchor="end">{v}</text>
          ))}
          {/* X axis labels */}
          {epochs.filter((_, i) => i % 2 === 0).map((e, i) => (
            <text key={e} x={toX(i * 2, LOSS.length)} y={H - 4} fontSize={8} fill="#9CA3AF" textAnchor="middle">{e}</text>
          ))}
          {/* Loss (blue, decreasing) */}
          <polyline points={poly(LOSS)} fill="none" stroke="#2563EB" strokeWidth={2} />
          {/* Accuracy (orange, increasing) */}
          <polyline points={poly(ACC)} fill="none" stroke="#F97316" strokeWidth={2} />
        </svg>
      </div>
    </div>
  );
};

export default ResultsCard;
