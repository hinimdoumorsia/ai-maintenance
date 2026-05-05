import React, { useState } from "react";
import { BarChart2, ChevronDown } from "lucide-react";

const dates = ["16", "17", "18", "19", "20", "21", "22", "23", "24", "Feb:24"];

const tempData = [72, 68, 74, 71, 69, 73, 70, 75, 78, 74];
const vibData = [63, 66, 61, 65, 67, 64, 68, 62, 70, 72];
const normalData = [68, 68, 68, 68, 68, 68, 68, 68, 68, 68];

const W = 420, H = 180, PAD = { top: 20, right: 20, bottom: 30, left: 30 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const MIN_Y = 50, MAX_Y = 85;

function toX(i: number) { return PAD.left + (i / (dates.length - 1)) * PLOT_W; }
function toY(v: number) { return PAD.top + PLOT_H - ((v - MIN_Y) / (MAX_Y - MIN_Y)) * PLOT_H; }

function polyline(data: number[]) {
  return data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
}

const PredictionChart: React.FC = () => {
  const [showDownload, setShowDownload] = useState(false);
  const predStartIdx = 7;

  return (
    <div className="card chart-card">
      <div className="card-section-label">
        <BarChart2 size={18} color="#2563EB" />
        <h3 className="section-title">Graphique de Prédiction</h3>
      </div>

      <div className="chart-legend">
        <span className="legend-item"><span className="legend-dot blue" />Température</span>
        <span className="legend-item"><span className="legend-dot green" />Virvature</span>
        <span className="legend-item"><span className="legend-dot orange-dashed" />1ormal de loual</span>
      </div>

      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
          {/* Grid lines */}
          {[50, 60, 71, 75, 80].map((v) => (
            <line key={v} x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)}
              stroke="#e5e7eb" strokeWidth={0.8} />
          ))}
          {[50, 60, 71, 75].map((v) => (
            <text key={v} x={PAD.left - 4} y={toY(v) + 4} fontSize={9} fill="#9ca3af" textAnchor="end">{v}</text>
          ))}

          {/* Prediction zone highlight */}
          <rect
            x={toX(predStartIdx)}
            y={PAD.top}
            width={W - PAD.right - toX(predStartIdx)}
            height={PLOT_H}
            fill="#FEF3C7"
            opacity={0.6}
          />
          <line
            x1={toX(predStartIdx)} x2={toX(predStartIdx)}
            y1={PAD.top} y2={PAD.top + PLOT_H}
            stroke="#F97316" strokeWidth={1.5} strokeDasharray="4,3"
          />

          {/* Normal baseline dashed */}
          <polyline points={polyline(normalData)} fill="none" stroke="#F97316" strokeWidth={1.5} strokeDasharray="5,4" />

          {/* Vibration line */}
          <polyline points={polyline(vibData)} fill="none" stroke="#22c55e" strokeWidth={2} />

          {/* Temperature line */}
          <polyline points={polyline(tempData)} fill="none" stroke="#2563EB" strokeWidth={2} />

          {/* Alert triangle at prediction start */}
          <polygon points={`${toX(predStartIdx) - 8},${toY(78) - 4} ${toX(predStartIdx)},${toY(78) - 16} ${toX(predStartIdx) + 8},${toY(78) - 4}`} fill="#F97316" opacity={0.85} />
          <text x={toX(predStartIdx)} y={toY(78) - 7} fontSize={7} fill="white" textAnchor="middle" fontWeight="700">!</text>
          <circle cx={toX(predStartIdx)} cy={toY(78)} r={5} fill="#F97316" />

          {/* Date labels */}
          {dates.map((d, i) => (
            <text key={d} x={toX(i)} y={H - 4} fontSize={9} fill="#6b7280" textAnchor="middle">{d}</text>
          ))}
        </svg>
      </div>

      <div className="chart-download-row">
        <button className="download-btn" onClick={() => setShowDownload(!showDownload)}>
          Telecharger les Prédictions... <ChevronDown size={14} />
        </button>
        {showDownload && (
          <div className="download-dropdown">
            <button className="download-option">CSV</button>
            <button className="download-option">Excel</button>
            <button className="download-option">PDF</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionChart;
