// src/pages/Donnees/components/VisualisationCard.tsx
// Panneau haut droite : Visualisation Complète des Données

import React from 'react';
import { BarChart2 } from 'lucide-react';
import { StatistiqueApercu, Observation } from '../types';

interface Props {
  apercu: StatistiqueApercu;
  observations: Observation[];
}

/* ─── Mini histogramme SVG ────────────────────────────────── */
const MiniHisto: React.FC<{ values: number[]; color: string; label: string; xMin: number; xMax: number }> = ({
  values, color, label, xMin, xMax,
}) => {
  const maxVal = Math.max(...values);
  return (
    <div className="mini-chart-wrap" style={{ flex: 1 }}>
      <div className="mini-chart">
        {values.map((v, i) => (
          <div
            key={i}
            className="mini-bar"
            style={{ height: `${(v / maxVal) * 100}%`, background: color }}
          />
        ))}
      </div>
      <div className="mini-chart-label">
        <span>{xMin}</span>
        <span>{xMax}</span>
      </div>
      <div className="dist-title">{label}</div>
    </div>
  );
};

/* ─── Scatter SVG simplifié ──────────────────────────────── */
const ScatterPlot: React.FC = () => {
  const points = [
    [10,15],[12,18],[15,22],[18,28],[20,35],[22,38],[25,42],[28,45],[30,48],
    [14,20],[17,25],[21,32],[24,40],[27,44],[29,47],[11,16],[13,19],[16,24],
  ];
  return (
    <svg viewBox="0 0 120 90" style={{ width: '100%', height: '100%' }}>
      <line x1="10" y1="80" x2="110" y2="80" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="10" y1="10" x2="10" y2="80" stroke="#e2e8f0" strokeWidth="1" />
      <text x="5" y="88" fontSize="7" fill="#94a3b8">10</text>
      <text x="100" y="88" fontSize="7" fill="#94a3b8">30</text>
      <text x="0" y="13" fontSize="7" fill="#94a3b8">50</text>
      <text x="0" y="85" fontSize="7" fill="#94a3b8">10</text>
      <text x="38" y="96" fontSize="7" fill="#94a3b8">Runtime</text>
      <text x="-35" y="50" fontSize="7" fill="#94a3b8" transform="rotate(-90,0,50)">Temp</text>
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={10 + ((x - 10) / 20) * 100}
          cy={80 - ((y - 10) / 40) * 70}
          r="2.5"
          fill="#3b82f6"
          opacity="0.7"
        />
      ))}
    </svg>
  );
};

/* ─── Tendances SVG simplifié ────────────────────────────── */
const TendancesChart: React.FC = () => {
  const points = Array.from({ length: 40 }, (_, i) => i);

  const tempY = (i: number) => 40 - Math.sin(i * 0.4) * 12 - Math.random() * 4;
  const vibY = (i: number) => 55 - Math.sin(i * 0.3 + 1) * 8 - Math.random() * 3;
  const pressY = (i: number) => 70 - Math.cos(i * 0.25) * 5 - Math.random() * 2;

  const polyline = (fn: (i: number) => number, color: string) => {
    const pts = points.map(i => `${10 + i * 2.5},${fn(i)}`).join(' ');
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />;
  };

  return (
    <svg viewBox="0 0 115 80" style={{ width: '100%', height: 80 }}>
      {[10, 25, 40, 55, 70].map(y => (
        <line key={y} x1="8" y1={y} x2="112" y2={y} stroke="#f1f5f9" strokeWidth="0.5" />
      ))}
      {polyline(tempY, '#1d4ed8')}
      {polyline(vibY, '#f97316')}
      {polyline(pressY, '#22c55e')}
      {[5,10,15,20,25,30,35,40].map((l, i) => (
        <text key={l} x={10 + i * 12.5} y={78} fontSize="6" fill="#94a3b8">{l}</text>
      ))}
    </svg>
  );
};

/* ─── Main Component ─────────────────────────────────────── */
export const VisualisationCard: React.FC<Props> = ({ apercu, observations }) => {
  return (
    <div className="card visualisation-card">
      <h2 className="card-title">
        <BarChart2 size={16} style={{ flexShrink: 0, color: '#f97316' }} />
        Visualisation Complète des Données
      </h2>

      <div className="viz-grid">
        {/* a) Aperçu Statistique */}
        <div>
          <div className="kpi-section-title">a) Aperçu Statistique</div>
          <table className="apercu-table">
            <tbody>
              <tr><td>Total observations</td><td>{apercu.total_observations}</td><td>Features</td><td>{apercu.features}</td></tr>
              <tr><td>Total features</td><td>{apercu.total_features}</td><td>Valuers desentations</td><td>{apercu.valuers_desentations}</td></tr>
              <tr><td>Values missings</td><td>{apercu.values_missings}</td><td></td><td></td></tr>
            </tbody>
          </table>

          <table className="obs-table">
            <thead>
              <tr>
                <th>timestamp</th>
                <th>machine_id</th>
                <th>temperature</th>
                <th>vibration</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((o, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap' }}>{o.timestamp}</td>
                  <td>{o.machine_id}</td>
                  <td>{o.temperature}</td>
                  <td>{o.vibration}</td>
                  <td>
                    <span className={`status-badge ${o.status.toLowerCase()}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* b) Distributions des Features */}
        <div>
          <div className="kpi-section-title">b) Distributions des Features</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <MiniHisto
              values={[60, 80, 100, 90, 70, 50, 40, 60]}
              color="#3b82f6"
              label="Temperature"
              xMin={10} xMax={40}
            />
            <MiniHisto
              values={[20, 40, 70, 90, 80, 60, 30, 10]}
              color="#3b82f6"
              label="Vibration"
              xMin={0} xMax={25}
            />
            <MiniHisto
              values={[10, 30, 60, 100, 90, 70, 50, 20]}
              color="#3b82f6"
              label="Pressure"
              xMin={0} xMax={20}
            />
          </div>
        </div>

        {/* c) Corrélations */}
        <div>
          <div className="kpi-section-title">c) Corrélations</div>
          <div className="correlation-wrap">
            <div className="heatmap-placeholder">
              Corrélations<br/>ou a text<br/>manuiel
            </div>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', height: 90 }}>
              <ScatterPlot />
            </div>
          </div>
        </div>

        {/* d) Tendances Temporelles */}
        <div>
          <div className="kpi-section-title">d) Tendances Temporelles</div>
          <div className="trend-chart-wrap">
            <div className="trend-legend">
              <span><span className="legend-dot" style={{ background: '#1d4ed8' }} />Temp</span>
              <span><span className="legend-dot" style={{ background: '#f97316' }} />Vibration</span>
              <span><span className="legend-dot" style={{ background: '#22c55e' }} />Pressure</span>
            </div>
            <TendancesChart />
          </div>
        </div>
      </div>
    </div>
  );
};