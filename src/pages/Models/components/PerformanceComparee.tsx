// src/pages/Models/components/PerformanceComparee.tsx
import React from 'react';
import { PerformanceData } from '../types';

const data: PerformanceData[] = [
  { modelName: 'LSTM_001', f1Score: 0.93, precision: 0.87, recall: 0.86 },
  { modelName: 'Random Forest_002', f1Score: 0.78, precision: 0.65, recall: 0.88 },
  { modelName: 'XGBoost_003', f1Score: 0.75, precision: 0.65, recall: 0.82 },
];

const CHART_H = 220;
const CHART_W = 520;
const PAD_L = 40;
const PAD_B = 40;
const PAD_T = 10;
const INNER_H = CHART_H - PAD_B - PAD_T;
const INNER_W = CHART_W - PAD_L - 20;
const GROUP_W = INNER_W / data.length;
const BAR_W = 20;
const GROUP_BARS = 3;
const GROUP_GAP = 6;

const colors = ['#f97316', '#60a5fa', '#1e3a8a'];
const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

const barX = (groupIdx: number, barIdx: number) =>
  PAD_L + groupIdx * GROUP_W + (GROUP_W - GROUP_BARS * BAR_W - (GROUP_BARS - 1) * GROUP_GAP) / 2 + barIdx * (BAR_W + GROUP_GAP);

const barY = (val: number) => PAD_T + INNER_H - val * INNER_H;
const barH = (val: number) => val * INNER_H;

const PerformanceComparee: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="card-title-group">
        <div className="card-icon">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent-blue)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <div className="card-title">Performance Comparée</div>
          <div className="card-subtitle">Comparatives performance compraensées d'amix 3 leading modèles</div>
        </div>
      </div>
    </div>

    <div className="chart-legend">
      {['F1-Score', 'Precision', 'Recall'].map((label, i) => (
        <div className="legend-item" key={label}>
          <div className="legend-dot" style={{ background: colors[i] }} />
          {label}
        </div>
      ))}
    </div>

    <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ overflow: 'visible' }}>
      {/* Y grid lines + labels */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={PAD_L} y1={barY(t)}
            x2={CHART_W - 20} y2={barY(t)}
            stroke="#e5e7eb" strokeWidth={1}
          />
          <text
            x={PAD_L - 6} y={barY(t) + 4}
            textAnchor="end" fontSize={10} fill="#9ca3af"
          >
            {t.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, gi) => {
        const vals = [d.f1Score, d.precision, d.recall];
        return (
          <g key={d.modelName}>
            {vals.map((v, bi) => (
              <rect
                key={bi}
                x={barX(gi, bi)} y={barY(v)}
                width={BAR_W} height={barH(v)}
                fill={colors[bi]}
                rx={3}
              />
            ))}
            <text
              x={PAD_L + gi * GROUP_W + GROUP_W / 2}
              y={CHART_H - 8}
              textAnchor="middle" fontSize={10} fill="#6b7280"
            >
              {d.modelName}
            </text>
          </g>
        );
      })}

      {/* X axis label */}
      <text
        x={CHART_W / 2} y={CHART_H}
        textAnchor="middle" fontSize={10} fill="#9ca3af"
      >
        Modèle du modèle:
      </text>
    </svg>
  </div>
);

export default PerformanceComparee;