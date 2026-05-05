// src/pages/Models/components/PerformanceChart.tsx
import React, { useState } from 'react';

// ── Données simulées par modèle (60 époques) ──────────────────────────────
const EPOCHS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

const modelsData = [
  {
    id: 'LSTM_001',
    color: '#f97316',
    loss:  [1.42, 1.18, 0.95, 0.76, 0.61, 0.50, 0.41, 0.34, 0.28, 0.24, 0.21, 0.19, 0.17],
    f1:    [0.31, 0.42, 0.55, 0.65, 0.73, 0.79, 0.84, 0.87, 0.89, 0.91, 0.92, 0.93, 0.93],
  },
  {
    id: 'Random Forest_002',
    color: '#3b82f6',
    loss:  [1.30, 1.05, 0.84, 0.68, 0.57, 0.49, 0.43, 0.39, 0.36, 0.34, 0.32, 0.31, 0.30],
    f1:    [0.28, 0.38, 0.50, 0.60, 0.67, 0.72, 0.75, 0.77, 0.78, 0.79, 0.79, 0.80, 0.80],
  },
  {
    id: 'XGBoost_003',
    color: '#8b5cf6',
    loss:  [1.55, 1.28, 1.02, 0.82, 0.67, 0.56, 0.48, 0.42, 0.37, 0.34, 0.31, 0.29, 0.28],
    f1:    [0.22, 0.34, 0.46, 0.56, 0.63, 0.68, 0.72, 0.74, 0.76, 0.77, 0.77, 0.78, 0.78],
  },
];

// ── SVG helpers ───────────────────────────────────────────────────────────
const W = 420;
const H = 130;
const PL = 30; const PR = 10; const PT = 10; const PB = 22;
const IW = W - PL - PR;
const IH = H - PT - PB;

function toPoints(values: number[], minV: number, maxV: number) {
  return values
    .map((v, i) => {
      const x = PL + (i / (EPOCHS.length - 1)) * IW;
      const y = PT + IH - ((v - minV) / (maxV - minV)) * IH;
      return `${x},${y}`;
    })
    .join(' ');
}

function yTicks(minV: number, maxV: number, count = 4) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const v = minV + (i / count) * (maxV - minV);
    const y = PT + IH - ((v - minV) / (maxV - minV)) * IH;
    return { v, y };
  });
}

// ── Component ─────────────────────────────────────────────────────────────
type Tab = 'loss' | 'f1';

const PerformanceChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('loss');
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const isLoss = activeTab === 'loss';
  const allValues = modelsData.flatMap(m => isLoss ? m.loss : m.f1);
  const minV = isLoss ? 0 : 0;
  const maxV = isLoss ? Math.ceil(Math.max(...allValues) * 10) / 10 + 0.1
                      : 1.0;
  const ticks = yTicks(minV, maxV);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Header ── */}
      <div className="card-hd" style={{ marginBottom: 10 }}>
        <div className="card-title-g">
          <div className="card-icon ci-blue">
            <svg width="16" height="16" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
          </div>
          <div>
            <div className="ct">Performance Globale</div>
            <div className="cs">Courbes de tous les modèles — par époque</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--border-light)', borderRadius: 8, padding: 3,
        }}>
          {(['loss', 'f1'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                transition: 'all .15s',
              }}
            >
              {tab === 'loss' ? 'Courbe Loss' : 'F1-Score'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: 10 }}>
        {modelsData.map(m => (
          <div
            key={m.id}
            onMouseEnter={() => setHoveredModel(m.id)}
            onMouseLeave={() => setHoveredModel(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', opacity: hoveredModel && hoveredModel !== m.id ? 0.35 : 1,
              transition: 'opacity .2s',
            }}
          >
            <svg width="24" height="10">
              <line x1="0" y1="5" x2="18" y2="5" stroke={m.color} strokeWidth="2.5"
                strokeLinecap="round" strokeDasharray={m.id === 'XGBoost_003' ? '4 2' : undefined}/>
              <circle cx="9" cy="5" r="3" fill={m.color}/>
            </svg>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)' }}>
              {m.id}
            </span>
          </div>
        ))}
      </div>

      {/* ── SVG Chart ── */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', flex: 1 }}>
        {/* Grid + Y labels */}
        {ticks.map(({ v, y }) => (
          <g key={v}>
            <line x1={PL} y1={y} x2={W - PR} y2={y}
              stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3 3"/>
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {EPOCHS.map((e, i) => (
          <text key={e}
            x={PL + (i / (EPOCHS.length - 1)) * IW}
            y={H - 4}
            textAnchor="middle" fontSize={9} fill="#9ca3af"
          >
            {e}
          </text>
        ))}

        {/* X axis title */}
        <text x={PL + IW / 2} y={H + 6} textAnchor="middle" fontSize={9} fill="#c4c9d4">
          Époques
        </text>

        {/* Lines */}
        {modelsData.map(m => {
          const vals = isLoss ? m.loss : m.f1;
          const pts = toPoints(vals, minV, maxV);
          const dimmed = hoveredModel !== null && hoveredModel !== m.id;
          return (
            <g key={m.id}
              style={{ opacity: dimmed ? 0.15 : 1, transition: 'opacity .2s' }}>
              <polyline
                points={pts}
                fill="none"
                stroke={m.color}
                strokeWidth={hoveredModel === m.id ? 2.5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={m.id === 'XGBoost_003' ? '6 3' : undefined}
              />
              {/* Dots at each data point */}
              {vals.map((v, i) => {
                const cx = PL + (i / (EPOCHS.length - 1)) * IW;
                const cy = PT + IH - ((v - minV) / (maxV - minV)) * IH;
                return (
                  <circle key={i} cx={cx} cy={cy} r={hoveredModel === m.id ? 3 : 2}
                    fill={m.color} style={{ transition: 'r .15s' }}/>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* ── Footer stats ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, marginTop: 14,
        borderTop: '1px solid var(--border-light)', paddingTop: 12,
      }}>
        {modelsData.map(m => {
          const vals = isLoss ? m.loss : m.f1;
          const final = vals[vals.length - 1];
          const best  = isLoss ? Math.min(...vals) : Math.max(...vals);
          return (
            <div key={m.id} style={{
              background: 'var(--border-light)', borderRadius: 8, padding: '8px 10px',
              borderLeft: `3px solid ${m.color}`,
            }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>
                {m.id}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Final</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>
                    {final.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {isLoss ? 'Min' : 'Max'}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {best.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PerformanceChart;