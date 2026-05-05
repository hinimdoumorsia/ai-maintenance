// src/pages/Donnees/components/PronosticPage.tsx
// Sous-page Pronostic & DRBF — Durée Résiduelle Avant Bris de Fatigue

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BatteryCharging,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Loader2,
  TrendingDown,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  PieChart,
  Pie,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { API, useDatasets } from '../../../contexts/DatasetContext';
import { useDatasetForPage } from '../../../hooks/useDatasetForPage';
import IncompatibleDatasetMessage from './IncompatibleDatasetMessage';

const RUL_COLORS = {
  critical: '#dc2626',
  warning: '#f97316',
  nominal: '#16a34a',
};

const getRULCategory = (rul: number) => {
  if (rul < 15) return { label: 'Critique', color: RUL_COLORS.critical, icon: '🔴' };
  if (rul <= 60) return { label: 'Surveillance', color: RUL_COLORS.warning, icon: '🟠' };
  return { label: 'Nominal', color: RUL_COLORS.nominal, icon: '🟢' };
};

interface MachinePronostic {
  machine_id: string;
  machine_name: string;
  health_index: number;
  rul_days: number;
  rul_confidence: number;
  vrms_current: number;
  last_updated: string;
}

const PronosticPage: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('pronostic', selectedId);
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [machines, setMachines] = useState<MachinePronostic[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [degradationData, setDegradationData] = useState<any[]>([]);
  const [showBaignoire, setShowBaignoire] = useState(false);

  const kpiData = {
    mtbf: 480,
    mttr: 4.2,
    dispo: 96.3,
    detection: 87,
  };

  useEffect(() => {
    if (source === 'db') {
      setLoading(true);
      fetch(`${API}/api/donnees/pronostic/synthese`)
        .then(r => r.json())
        .then(d => setMachines(d.machines || d))
        .catch(() => setError('Impossible de charger les données pronostic.'))
        .finally(() => setLoading(false));
    } else if (selectedId && isCompatible) {
      setLoading(true);
      fetch(`${API}/api/donnees/datasets/${selectedId}/pronostic-analysis`)
        .then(r => r.json())
        .then(d => setMachines(d.machines || d))
        .catch(() => setError('Erreur chargement analyse pronostic.'))
        .finally(() => setLoading(false));
    }
  }, [source, selectedId, isCompatible]);

  useEffect(() => {
    if (!selectedMachine || machines.length === 0) return;
    const m = machines.find(x => x.machine_id === selectedMachine);
    if (!m) return;
    const today = new Date();
    const data = [];
    for (let i = 60; i >= 0; i -= 2) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const hi = Math.min(100, m.health_index + i * (2 - m.health_index / 30));
      data.push({
        date: d.toISOString().slice(0, 10),
        health: Math.round(hi),
        vrms: m.vrms_current + (i * 0.02),
        degradation: ((100 - hi) / 100) * (i > 0 ? 0.3 : 1),
      });
    }
    for (let i = 2; i <= m.rul_days + 10; i += 2) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const hi = Math.max(0, m.health_index - i * (m.health_index / m.rul_days));
      data.push({
        date: d.toISOString().slice(0, 10),
        health: Math.round(hi),
        vrms: m.vrms_current + (i * 0.04),
        degradation: Math.min(1, ((100 - hi) / 100) * 1.5),
        projected: true,
      });
    }
    setDegradationData(data);
  }, [selectedMachine]);

  if (ctxLoading) {
    return <div className="pronostic-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;
  }

  if (source === 'dataset' && !isCompatible) {
    return <PronosticWrapper><IncompatibleDatasetMessage page="Pronostic & DRBF" datasetName={selectedDs?.name || 'inconnu'} analysisType="maintenance" /></PronosticWrapper>;
  }

  const stats = {
    critical: machines.filter(m => m.rul_days < 15).length,
    warning: machines.filter(m => m.rul_days >= 15 && m.rul_days <= 60).length,
    nominal: machines.filter(m => m.rul_days > 60).length,
  };

  return (
    <PronosticWrapper>
      {/* Source Toggle */}
      <SourceToggle source={source} setSource={setSource} datasets={datasets} selectedId={selectedId} setSelectedId={setSelectedId} />

      {/* SECTION 1: Synthèse par urgence */}
      <div className="pronostic-section">
        <h3 className="pronostic-section-title"><AlertTriangle size={18} /> Synthèse des machines par urgence</h3>
        <div className="rul-legend">
          <span className="rul-legend-item"><span className="rul-dot" style={{ background: RUL_COLORS.critical }} /> Critique : RUL &lt; 15 jours</span>
          <span className="rul-legend-item"><span className="rul-dot" style={{ background: RUL_COLORS.warning }} /> Surveillance : 15–60 jours</span>
          <span className="rul-legend-item"><span className="rul-dot" style={{ background: RUL_COLORS.nominal }} /> Nominal : &gt; 60 jours</span>
        </div>

        {loading ? <div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div> : error ? <div className="upload-msg error"><AlertTriangle size={13} />{error}</div> : (
          <div className="pronostic-machine-list">
            {machines.map(m => {
              const cat = getRULCategory(m.rul_days);
              return (
                <div key={m.machine_id} className={`pronostic-machine-card ${cat.label.toLowerCase()}`}>
                  <div className="pmc-header">
                    <span className="pmc-icon">{cat.icon}</span>
                    <span className="pmc-badge" style={{ background: cat.color, color: '#fff' }}>{cat.label.toUpperCase()}</span>
                    <span className="pmc-id">{m.machine_id}</span>
                    <span className="pmc-name">— {m.machine_name}</span>
                  </div>
                  <div className="pmc-metrics">
                    <div className="pmc-metric">
                      <span className="pmc-metric-label">RUL estimé</span>
                      <span className="pmc-metric-value" style={{ color: cat.color }}>{m.rul_days} jours</span>
                      <span className="pmc-metric-sub">Confiance : {m.rul_confidence}%</span>
                    </div>
                    <div className="pmc-metric">
                      <span className="pmc-metric-label">Health Index</span>
                      <div className="health-index-bar">
                        <div className="health-index-fill" style={{ width: `${m.health_index}%`, background: m.health_index <= 30 ? RUL_COLORS.critical : m.health_index <= 60 ? RUL_COLORS.warning : RUL_COLORS.nominal }} />
                      </div>
                      <span className="pmc-metric-sub">{m.health_index} / 100</span>
                    </div>
                  </div>
                  <div className="pmc-footer">
                    <span className="pmc-updated">Dernière mise à jour : {m.last_updated}</span>
                    <div className="pmc-actions">
                      <button className="btn-pmc-action urgent" onClick={() => navigate('/maintenance')}>
                        <Wrench size={12} /> Créer BT urgent
                      </button>
                      <button className="btn-pmc-action" onClick={() => setSelectedMachine(m.machine_id)}>
                        <TrendingDown size={12} /> Voir courbe
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Courbe de dégradation */}
      {selectedMachine && degradationData.length > 0 && (
        <div className="pronostic-section">
          <h3 className="pronostic-section-title"><TrendingDown size={18} /> Courbe de dégradation — {selectedMachine}</h3>
          <div className="degradation-chart">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={degradationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Health Index (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 15]} tick={{ fontSize: 11 }} label={{ value: 'V-RMS (mm/s)', angle: 90, position: 'insideRight', style: { fontSize: 11 } }} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="degradation" fill="rgba(220,38,38,0.12)" stroke="none" name="Score dégradation" />
                <Line yAxisId="left" type="monotone" dataKey="health" stroke="#3b82f6" strokeWidth={2} dot={false} name="Health Index" />
                <Line yAxisId="right" type="monotone" dataKey="vrms" stroke="#f97316" strokeWidth={2} dot={false} name="V-RMS" />
                <ReferenceLine yAxisId="left" y={30} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Seuil critique (30%)', fill: '#dc2626', fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="degradation-explanation">
            <p>La courbe de dégradation modélise l'évolution de l'état de santé de la machine dans le temps. Le RUL (Remaining Useful Life / Durée Résiduelle Avant Bris de Fatigue) est estimé comme le temps avant que le Health Index descende sous le seuil critique (30%). Cette estimation intègre les mesures vibratoires, thermiques et les historiques d'intervention.</p>
          </div>
        </div>
      )}

      {/* SECTION 3: Statistiques fiabilité + Courbe en baignoire */}
      <div className="pronostic-section">
        <h3 className="pronostic-section-title"><Cpu size={18} /> Statistiques de fiabilité</h3>
        <div className="fiabilite-grid">
          <div className="fiabilite-card">
            <div className="fiabilite-value">{kpiData.mtbf}h</div>
            <div className="fiabilite-label">MTBF moyen parc</div>
          </div>
          <div className="fiabilite-card">
            <div className="fiabilite-value">{kpiData.mttr}h</div>
            <div className="fiabilite-label">MTTR moyen</div>
          </div>
          <div className="fiabilite-card">
            <div className="fiabilite-value">{kpiData.dispo}%</div>
            <div className="fiabilite-label">Disponibilité parc</div>
          </div>
          <div className="fiabilite-card">
            <div className="fiabilite-value">{kpiData.detection}%</div>
            <div className="fiabilite-label">Taux détection prédictive</div>
          </div>
        </div>

        <div className="baignoire-section">
          <button className="baignoire-toggle" onClick={() => setShowBaignoire(v => !v)}>
            <span>La courbe en baignoire</span>
            {showBaignoire ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showBaignoire && (
            <div className="baignoire-content">
              <svg viewBox="0 0 600 180" className="baignoire-svg">
                <defs>
                  <linearGradient id="bgGrad">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.08)" />
                    <stop offset="33%" stopColor="rgba(16,185,129,0.05)" />
                    <stop offset="100%" stopColor="rgba(239,68,68,0.08)" />
                  </linearGradient>
                </defs>
                <rect width="600" height="180" fill="url(#bgGrad)" rx="8" />
                <path d="M40,140 C40,80 80,40 160,50 C240,60 280,70 300,60 C320,50 340,50 440,60 C480,68 520,100 560,160" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                <line x1="40" y1="20" x2="560" y2="20" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="160" y1="15" x2="160" y2="175" stroke="#e5e7eb" strokeDasharray="4 4" />
                <line x1="380" y1="15" x2="380" y2="175" stroke="#e5e7eb" strokeDasharray="4 4" />
                <text x="50" y="12" fontSize="11" fill="#3b82f6" fontWeight="600">Phase A : Mortalité infantile</text>
                <text x="180" y="12" fontSize="11" fill="#16a34a" fontWeight="600">Phase B : Maturité</text>
                <text x="400" y="12" fontSize="11" fill="#dc2626" fontWeight="600">Phase C : Vieillissement</text>
                <text x="50" y="170" fontSize="9" fill="#6b7280">λ(t) décroissant</text>
                <text x="260" y="170" fontSize="9" fill="#6b7280">λ(t) ≈ constant</text>
                <text x="440" y="170" fontSize="9" fill="#6b7280">λ(t) croissant</text>
              </svg>
              <p className="baignoire-text">La courbe en baignoire décrit l'évolution du taux de défaillance λ(t) d'un équipement. Phase A (jeunesse) : défauts de fabrication → λ décroissant. Phase B (maturité) : défaillances aléatoires → λ constant, MTBF prévisible. Phase C (vieillissement) : usure progressive → λ croissant, maintenance prévisionnelle recommandée.</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Distribution RUL */}
      {machines.length > 0 && (
        <div className="pronostic-section">
          <h3 className="pronostic-section-title"><BatteryCharging size={18} /> Distribution des RUL</h3>
          <div className="rul-distribution">
            <div className="rul-donut">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={[
                    { name: 'Critique (<15j)', value: stats.critical, color: RUL_COLORS.critical },
                    { name: 'Surveillance (15–60j)', value: stats.warning, color: RUL_COLORS.warning },
                    { name: 'Nominal (>60j)', value: stats.nominal, color: RUL_COLORS.nominal },
                  ]} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {([{ value: stats.critical, color: RUL_COLORS.critical }, { value: stats.warning, color: RUL_COLORS.warning }, { value: stats.nominal, color: RUL_COLORS.nominal }]).map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rul-table-wrap">
              <table className="rul-table">
                <thead><tr><th>Machine</th><th>RUL (jours)</th><th>Health Index</th><th>Catégorie</th></tr></thead>
                <tbody>
                  {[...machines].sort((a, b) => a.rul_days - b.rul_days).map(m => {
                    const cat = getRULCategory(m.rul_days);
                    return (
                      <tr key={m.machine_id}>
                        <td>{m.machine_name}</td>
                        <td style={{ color: cat.color, fontWeight: 700 }}>{m.rul_days}</td>
                        <td>{m.health_index}</td>
                        <td><span className="rul-table-badge" style={{ background: cat.color, color: '#fff' }}>{cat.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PronosticWrapper>
  );
};

const PronosticWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="pronostic-page">{children}</div>
);

const SourceToggle: React.FC<{
  source: string; setSource: (s: 'db' | 'dataset') => void;
  datasets: any[]; selectedId: number | null; setSelectedId: (id: number | null) => void;
}> = ({ source, setSource, datasets, selectedId, setSelectedId }) => (
  <div className="pronostic-source-toggle">
    <div className="source-toggle-btns">
      <button className={`source-toggle-btn${source === 'db' ? ' active' : ''}`} onClick={() => setSource('db')}>Base de données</button>
      <button className={`source-toggle-btn${source === 'dataset' ? ' active' : ''}`} onClick={() => setSource('dataset')}>Dataset uploadé</button>
    </div>
    {source === 'dataset' && (
      <select className="source-dataset-select" value={selectedId || ''} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}>
        <option value="">-- Sélectionner un dataset --</option>
        {datasets.filter((d: any) => d.status === 'processed' && d.detected_type === 'maintenance').map((d: any) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    )}
  </div>
);

export default PronosticPage;