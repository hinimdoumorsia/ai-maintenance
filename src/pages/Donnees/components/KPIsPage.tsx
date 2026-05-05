// src/pages/Donnees/components/KPIsPage.tsx
// Sous-page KPIs & Performance

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Gauge,
  Loader2,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { API, useDatasets } from '../../../contexts/DatasetContext';
import { useDatasetForPage } from '../../../hooks/useDatasetForPage';
import IncompatibleDatasetMessage from './IncompatibleDatasetMessage';

const PERIODES = ['7 jours', '30 jours', '90 jours', '1 an'];

const ATELIER_COLORS = ['#3b82f6', '#f97316', '#16a34a', '#7c3aed', '#dc2626'];

const KPIsPage: React.FC = () => {
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('kpis', selectedId);
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [period, setPeriod] = useState('30 jours');
  const [indicator, setIndicator] = useState('disponibilite');
  const [loading, setLoading] = useState(false);
  const [showPareto, setShowPareto] = useState(false);

  const kpiCards = [
    { label: 'Disponibilité moyenne', value: 94.2, delta: 2.1, unit: '%', icon: Gauge, good: 90, formula: 'MTBF / (MTBF + MTTR) × 100', norm: 'ISO 13306' },
    { label: 'OEE', value: 78.5, delta: 1.8, unit: '%', icon: TrendingUp, good: 85, formula: 'Taux marche × Perf × Qualité', norm: 'NF E 60-182' },
    { label: 'MTBF moyen', value: 480, delta: 24, unit: 'h', icon: Clock, good: 500, formula: 'Temps total / Nb pannes', norm: 'NF X 60-020' },
    { label: 'MTTR moyen', value: 4.2, delta: -0.5, unit: 'h', icon: Wrench, good: 3, formula: 'Temps réparation / Nb pannes', norm: 'NF X 60-020' },
    { label: 'TRS', value: 76.8, delta: 1.2, unit: '%', icon: BarChart3, good: 80, formula: 'Équivalent OEE', norm: 'NF E 60-182' },
    { label: 'Coût maintenance', value: 12450, delta: -830, unit: '€', icon: DollarSign, good: 12000, formula: 'Coûts main d\'œuvre + pièces', norm: '' },
  ];

  const evolutionData = Array.from({ length: 12 }, (_, i) => ({
    mois: `2026-${String(i + 1).padStart(2, '0')}`,
    disponibilite: 92 + Math.random() * 6,
    oee: 75 + Math.random() * 8,
    mtbf: 450 + Math.random() * 80,
    mttr: 3.5 + Math.random() * 2,
  }));

  const paretoData = [
    { defaut: 'Défaut roulement', cout: 42000, pct: 35 },
    { defaut: 'Désalignement', cout: 28000, pct: 23 },
    { defaut: 'Balourd', cout: 18000, pct: 15 },
    { defaut: 'Usure engrenage', cout: 12000, pct: 10 },
    { defaut: 'Cavitation', cout: 8000, pct: 7 },
    { defaut: 'Lubrification', cout: 5500, pct: 5 },
    { defaut: 'Desserrage', cout: 3000, pct: 3 },
    { defaut: 'Autres', cout: 2500, pct: 2 },
  ];
  const paretoCumul = paretoData.reduce((acc, d, i) => { acc.push((acc[i - 1] || 0) + d.pct); return acc; }, [] as number[]);

  const radarData = [
    { axe: 'Disponibilité', A: 94, B: 88, C: 91, D: 85, E: 92 },
    { axe: 'OEE', A: 82, B: 75, C: 78, D: 72, E: 80 },
    { axe: 'MTBF', A: 90, B: 82, C: 85, D: 78, E: 88 },
    { axe: 'MTTR⁻¹', A: 85, B: 70, C: 80, D: 65, E: 75 },
    { axe: 'Alertes⁻¹', A: 88, B: 60, C: 75, D: 55, E: 80 },
  ];

  const ratios = [
    { code: 'r1', label: 'Coûts maint / Valeur bien', valeur: '2.8%', benchmark: '< 3% : excellent', ok: true },
    { code: 'r6', label: 'Coûts défaillance / total', valeur: '18%', benchmark: '< 20% : bon', ok: true },
    { code: 'r9', label: 'Coûts préventif / total', valeur: '65%', benchmark: 'Optimum ≈ 60–70%', ok: true },
    { code: 'r22', label: 'Disponibilité opérationnelle', valeur: '94.2%', benchmark: 'Cible > 85%', ok: true },
    { code: 'r28', label: 'MTBF', valeur: '480 h', benchmark: 'Variable par secteur', ok: true },
  ];

  if (ctxLoading) return <div className="kpis-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;
  if (source === 'dataset' && !isCompatible) {
    return <div className="kpis-page"><IncompatibleDatasetMessage page="KPIs & Performance" datasetName={selectedDs?.name || 'inconnu'} analysisType="kpi" /></div>;
  }

  return (
    <div className="kpis-page">
      {/* Period Selector + Source Toggle */}
      <div className="kpis-header">
        <div className="source-toggle-btns">
          <button className={`source-toggle-btn${source === 'db' ? ' active' : ''}`} onClick={() => setSource('db')}>Base de données</button>
          <button className={`source-toggle-btn${source === 'dataset' ? ' active' : ''}`} onClick={() => setSource('dataset')}>Dataset uploadé</button>
        </div>
        {source === 'dataset' && (
          <select className="source-dataset-select" value={selectedId || ''} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">-- Dataset KPI --</option>
            {datasets.filter(d => d.status === 'processed' && d.detected_type === 'kpi').map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        <div className="period-selector">
          {PERIODES.map(p => (
            <button key={p} className={`period-btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      {/* SECTION 1: 6 cartes KPI */}
      <div className="kpis-cards-grid">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon;
          const deltaPos = kpi.delta >= 0;
          return (
            <div key={kpi.label} className="kpi-card-item" title={`Formule : ${kpi.formula}\nNorme : ${kpi.norm}`}>
              <div className="kpi-card-header">
                <Icon size={16} color="#f97316" />
                <span className="kpi-card-label">{kpi.label}</span>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{kpi.value}{kpi.unit}</span>
                <span className={`kpi-card-delta ${deltaPos ? 'pos' : 'neg'}`}>
                  {deltaPos ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />}
                  {deltaPos ? '↑' : '↓'} {Math.abs(kpi.delta)}{kpi.unit}
                </span>
              </div>
              <div className="kpi-card-progress">
                <div className="kpi-card-progress-bar" style={{ width: `${Math.min(100, (kpi.value / kpi.good) * 100)}%`, background: kpi.value >= kpi.good ? '#16a34a' : kpi.value >= kpi.good * 0.85 ? '#f97316' : '#dc2626' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: Évolution temporelle */}
      <div className="kpis-section">
        <div className="kpis-section-header">
          <h3><TrendingUp size={16} /> Évolution temporelle — {indicator === 'disponibilite' ? 'Disponibilité' : indicator.toUpperCase()}</h3>
          <select className="source-dataset-select" style={{ width: 'auto' }} value={indicator} onChange={e => setIndicator(e.target.value)}>
            <option value="disponibilite">Disponibilité</option>
            <option value="mtbf">MTBF</option>
            <option value="mttr">MTTR</option>
            <option value="oee">OEE</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey={indicator} stroke="#f97316" strokeWidth={2} fill="url(#areaGrad)" />
            {indicator === 'disponibilite' && <ReferenceLine y={85} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Seuil critique', fill: '#dc2626', fontSize: 10 }} />}
            {indicator === 'mttr' && <ReferenceLine y={5} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Max acceptable', fill: '#dc2626', fontSize: 10 }} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 3: Pareto */}
      <div className="kpis-section">
        <h3><BarChart3 size={16} /> Analyse Pareto des défaillances</h3>
        <button className="baignoire-toggle" onClick={() => setShowPareto(v => !v)} style={{ marginBottom: '12px' }}>
          <span>Loi de Pareto — Identifier les 20% qui causent 80% des arrêts</span>
          {showPareto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showPareto && (
          <p className="baignoire-text" style={{ marginBottom: '16px' }}>La loi de Pareto (ou loi 80/20) affirme que 80% des effets indésirables sont causés par 20% des causes. En maintenance : 20% des types de défauts causent 80% des arrêts machine. Zone A (0–80%) : causes prioritaires. Zone B (80–95%) : secondaires. Zone C (95–100%) : marginales.</p>
        )}
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={paretoData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="defaut" tick={{ fontSize: 11 }} width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="cout" fill="#f97316" name="Coût (€)" barSize={16}>
              {paretoData.map((_, i) => (
                <Cell key={i} fill={paretoCumul[i] <= 80 ? '#dc2626' : paretoCumul[i] <= 95 ? '#f97316' : '#d1d5db'} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={2} name="% cumulé" dot={{ r: 3 }} />
            <ReferenceLine x={80} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Seuil Pareto (80%)', fill: '#dc2626', fontSize: 10, position: 'top' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 4: Comparaison Ateliers */}
      <div className="kpis-section">
        <h3><Zap size={16} /> Comparaison ateliers</h3>
        <div className="radar-grid">
          <ResponsiveContainer width={400} height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="axe" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              {['A', 'B', 'C', 'D', 'E'].map((atelier, i) => (
                <Radar key={atelier} dataKey={atelier} stroke={ATELIER_COLORS[i]} fill={ATELIER_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
          <table className="kpis-table">
            <thead><tr><th>Atelier</th><th>Dispo</th><th>OEE</th><th>MTBF</th></tr></thead>
            <tbody>
              {[{ atelier: 'A', dispo: 94, oee: 82, mtbf: 490 }, { atelier: 'B', dispo: 88, oee: 75, mtbf: 450 }, { atelier: 'C', dispo: 91, oee: 78, mtbf: 470 }, { atelier: 'D', dispo: 85, oee: 72, mtbf: 420 }, { atelier: 'E', dispo: 92, oee: 80, mtbf: 480 }].map(a => (
                <tr key={a.atelier}><td><strong>{a.atelier}</strong></td><td>{a.dispo}%</td><td>{a.oee}%</td><td>{a.mtbf}h</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: Ratios normalisés */}
      <div className="kpis-section">
        <h3><Gauge size={16} /> Ratios normalisés — NF X 60-020</h3>
        <div className="ratios-table-wrap">
          <table className="ratios-table">
            <thead><tr><th>Ratio</th><th>Formule</th><th>Valeur calculée</th><th>Benchmark</th></tr></thead>
            <tbody>
              {ratios.map(r => (
                <tr key={r.code}>
                  <td className="ratio-code">{r.code}</td>
                  <td>{r.label}</td>
                  <td className={`ratio-value${r.ok ? ' ok' : ''}`}>{r.valeur}</td>
                  <td className="ratio-benchmark">{r.benchmark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KPIsPage;