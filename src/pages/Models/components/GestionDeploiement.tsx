// src/pages/Models/components/GestionDeploiement.tsx
import React from 'react';

// Simulated accuracy data matching the image (loss descends, recall rises slightly)
const epochs = [10, 20, 30, 40, 50, 60];
const lossData = [1.4, 1.1, 0.75, 0.5, 0.35, 0.25];
const recallData = [0.2, 0.45, 0.7, 0.85, 0.92, 0.95];

const W = 400;
const H = 90;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 4;
const PAD_B = 20;
const IW = W - PAD_L - PAD_R;
const IH = H - PAD_T - PAD_B;
const MAX_VAL = 1.5;

const px = (i: number) => PAD_L + (i / (epochs.length - 1)) * IW;
const py = (v: number) => PAD_T + IH - (v / MAX_VAL) * IH;

const toPath = (vals: number[]) =>
  vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');

const GestionDeploiement: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="card-title-group">
        <div style={{ width: 4, height: 20, background: 'var(--accent-orange)', borderRadius: 2 }} />
        <div>
          <div className="card-title">Gestion de Déploiement</div>
        </div>
      </div>
    </div>

    {/* Deployed model info */}
    <div className="deployed-model-info">
      <div className="deployed-model-icon">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent-blue)">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
          Modèle Actuellement Déployé
        </div>
        <div className="deployed-model-name">LSTM_001</div>
        <div className="deployed-model-meta">Date du 15 mit 2024</div>
      </div>
    </div>

    {/* Accuracy chart */}
    <div className="accuracy-label">Predictive Accuracy</div>
    <div className="accuracy-chart-wrap">
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
        {[{ label: 'Lost', color: '#3b82f6' }, { label: 'Recall', color: '#f97316' }].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ width: 20, height: 2, background: color, borderRadius: 1 }} />
            {label}
          </div>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Y grid */}
        {[0, 0.5, 1.0, 1.5].map((v) => (
          <g key={v}>
            <line x1={PAD_L} y1={py(v)} x2={W - PAD_R} y2={py(v)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={PAD_L - 2} y={py(v) + 3} textAnchor="end" fontSize={8} fill="#d1d5db">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Loss line (blue) */}
        <path d={toPath(lossData)} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Recall line (orange) */}
        <path d={toPath(recallData)} fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* X axis labels */}
        {epochs.map((e, i) => (
          <text key={e} x={px(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">{e}</text>
        ))}
      </svg>
    </div>

    {/* Action buttons */}
    <div className="deploy-actions">
      <button className="btn-undeploy">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        Undeploy
      </button>
      <button className="btn-replace">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Remplace
      </button>
    </div>
  </div>
);

export default GestionDeploiement;