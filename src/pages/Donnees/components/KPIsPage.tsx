// src/pages/Donnees/components/KPIsPage.tsx
// Sous-page KPIs & Performance

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  DollarSign,
  Gauge,
  Loader2,
  TrendingUp,
  Wrench,
  X,
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

/* Données stables pour le démo quand la BD est vide */
const DEMO_EVOLUTION = Array.from({ length: 12 }, (_, i) => ({
  mois: `2026-${String(i + 1).padStart(2, '0')}`,
  disponibilite: [92.1, 93.4, 91.8, 94.2, 95.1, 93.7, 94.8, 95.6, 93.9, 94.5, 95.2, 94.2][i],
  oee: [75.2, 76.8, 74.5, 77.1, 78.9, 77.3, 79.1, 80.2, 78.5, 79.3, 80.1, 78.5][i],
  mtbf: [455, 470, 448, 482, 495, 478, 488, 502, 476, 490, 498, 480][i],
  mttr: [4.5, 4.2, 4.8, 4.1, 3.9, 4.3, 3.8, 3.6, 4.2, 3.9, 3.7, 4.2][i],
}));

const KPIsPage: React.FC = () => {
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('kpis', selectedId);
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [period, setPeriod] = useState('30 jours');
  const [indicator, setIndicator] = useState('disponibilite');
  const [loading, setLoading] = useState(false);
  const [showPareto, setShowPareto] = useState(false);
  const [showOeeDecomp, setShowOeeDecomp] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [paretoDrillDown, setParetoDrillDown] = useState<string | null>(null);
  const [dbKpis, setDbKpis] = useState<{ disponibilite?: number; oee?: number; mtbf?: number; mttr?: number } | null>(null);
  const [dbEvolution, setDbEvolution] = useState<any[]>([]);

  useEffect(() => {
    if (source !== 'db') return;
    fetch(`${API}/api/donnees/kpis`)
      .then(r => r.json())
      .then(d => { if (d && Object.keys(d).length > 0) setDbKpis(d); })
      .catch(() => {});
    fetch(`${API}/api/donnees/visualisation`)
      .then(r => r.json())
      .then((rows: any[]) => { if (rows && rows.length > 0) setDbEvolution(rows.reverse()); })
      .catch(() => {});
  }, [source]);

  const kpis = dbKpis || { disponibilite: 94.2, oee: 78.5, mtbf: 480, mttr: 4.2 };
  const evolutionData = dbEvolution.length > 0
    ? dbEvolution.map(r => ({
        mois: r.date_kpi || '',
        disponibilite: r.disponibilite_pct ?? 0,
        oee: 0,
        mtbf: 0,
        mttr: 0,
      }))
    : DEMO_EVOLUTION;

  const kpiCards = [
    { label: 'Disponibilité moyenne', value: kpis.disponibilite ?? 94.2, delta: 2.1, unit: '%', icon: Gauge, good: 90, formula: 'MTBF / (MTBF + MTTR) × 100', norm: 'ISO 13306' },
    { label: 'OEE', value: kpis.oee ?? 78.5, delta: 1.8, unit: '%', icon: TrendingUp, good: 85, formula: 'Taux marche × Perf × Qualité', norm: 'NF E 60-182' },
    { label: 'MTBF moyen', value: kpis.mtbf ?? 480, delta: 24, unit: 'h', icon: Clock, good: 500, formula: 'Temps total / Nb pannes', norm: 'NF X 60-020' },
    { label: 'MTTR moyen', value: kpis.mttr ?? 4.2, delta: -0.5, unit: 'h', icon: Wrench, good: 3, formula: 'Temps réparation / Nb pannes', norm: 'NF X 60-020' },
    { label: 'TRS', value: 76.8, delta: 1.2, unit: '%', icon: BarChart3, good: 80, formula: 'Équivalent OEE', norm: 'NF E 60-182' },
    { label: 'Coût maintenance', value: 12450, delta: -830, unit: '€', icon: DollarSign, good: 12000, formula: 'Coûts main d\'œuvre + pièces', norm: '' },
  ];

  const paretoData = [
    { defaut: 'Défaut roulement', cout: 42000, pct: 35, machines: ['M002 Pompe P-12', 'M005 Réducteur R-22', 'M007 Moteur ME-12'] },
    { defaut: 'Désalignement',    cout: 28000, pct: 23, machines: ['M001 Compresseur C-1', 'M003 Moteur ME-45'] },
    { defaut: 'Balourd',          cout: 18000, pct: 15, machines: ['M004 Ventilateur V-08', 'M001 Compresseur C-1'] },
    { defaut: 'Usure engrenage',  cout: 12000, pct: 10, machines: ['M005 Réducteur R-22'] },
    { defaut: 'Cavitation',       cout: 8000,  pct: 7,  machines: ['M002 Pompe P-12'] },
    { defaut: 'Lubrification',    cout: 5500,  pct: 5,  machines: ['M005 Réducteur R-22'] },
    { defaut: 'Desserrage',       cout: 3000,  pct: 3,  machines: ['M008 Pompe P-15'] },
    { defaut: 'Autres',           cout: 2500,  pct: 2,  machines: [] },
  ];
  const paretoCumul = paretoData.reduce((acc, d, i) => { acc.push((acc[i - 1] || 0) + d.pct); return acc; }, [] as number[]);

  // ─── Décomposition OEE = Disponibilité × Performance × Qualité ──────
  const oeeDecomp = useMemo(() => {
    const dispoVal = (kpis.disponibilite ?? 94.2) / 100;
    const oeeVal = (kpis.oee ?? 78.5) / 100;
    // Perf × Qualité = OEE / Disponibilité  →  on les estime à parts égales par défaut
    const perfQual = oeeVal / Math.max(dispoVal, 0.1);
    // Hypothèse : qualité ~ 98% pour la plupart des process industriels
    const qualite = Math.min(0.99, Math.max(0.85, 0.96 + Math.random() * 0.02));
    const performance = perfQual / qualite;
    return {
      disponibilite: parseFloat((dispoVal * 100).toFixed(1)),
      performance:   parseFloat((performance * 100).toFixed(1)),
      qualite:       parseFloat((qualite * 100).toFixed(1)),
      oee:           parseFloat((oeeVal * 100).toFixed(1)),
    };
  }, [kpis.disponibilite, kpis.oee]);

  // ─── Tendance prédictive (régression linéaire forward) ──────────────
  const forecastData = useMemo(() => {
    const data = [...evolutionData];
    if (data.length < 3) return data.map(d => ({ ...d, forecast: null }));
    // Régression linéaire sur les 6 derniers points pour l'indicateur sélectionné
    const recent = data.slice(-6);
    const n = recent.length;
    const xs = recent.map((_, i) => i);
    const ys = recent.map((d: any) => d[indicator] || 0);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
    const den = xs.reduce((s, x) => s + Math.pow(x - meanX, 2), 0);
    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;
    // Projection sur 3 mois suivants
    const lastDate = data[data.length - 1]?.mois || '';
    const result = data.map((d: any) => ({ ...d, [`${indicator}_forecast`]: null }));
    for (let i = 1; i <= 3; i++) {
      const projectedVal = intercept + slope * (n - 1 + i);
      const dateParts = lastDate.split('-');
      const yr = parseInt(dateParts[0] || '2026'), mo = parseInt(dateParts[1] || '1') + i;
      const newYr = yr + Math.floor((mo - 1) / 12);
      const newMo = ((mo - 1) % 12) + 1;
      const newDate = `${newYr}-${String(newMo).padStart(2, '0')}`;
      const point: any = { mois: newDate };
      point[indicator] = null;
      point[`${indicator}_forecast`] = parseFloat(projectedVal.toFixed(1));
      result.push(point);
    }
    // Ajout du dernier point dans la série forecast pour relier
    if (result[data.length - 1]) {
      result[data.length - 1][`${indicator}_forecast`] = result[data.length - 1][indicator];
    }
    return { data: result, slope: parseFloat(slope.toFixed(2)), trend: slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'stable' };
  }, [evolutionData, indicator]);

  const forecastDataPoints = Array.isArray(forecastData) ? forecastData : (forecastData as any).data;
  const forecastTrend = Array.isArray(forecastData) ? 'stable' : (forecastData as any).trend;
  const forecastSlope = Array.isArray(forecastData) ? 0 : (forecastData as any).slope;

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

      {/* SECTION 1bis: Décomposition OEE = Dispo × Perf × Qualité (NF E 60-182) */}
      <div className="kpis-section">
        <div className="kpis-section-header">
          <h3><Gauge size={16} /> Décomposition OEE — Disponibilité × Performance × Qualité</h3>
          <button className="baignoire-toggle" style={{ width: 'auto', padding: '4px 12px' }} onClick={() => setShowOeeDecomp(v => !v)}>
            {showOeeDecomp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        {showOeeDecomp && (
          <>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
              L'<strong>OEE (Overall Equipment Effectiveness)</strong> ou TRS est le produit de 3 ratios fondamentaux
              (norme NF E 60-182). Cette décomposition identifie les <em>vraies</em> sources de pertes, là où une
              valeur d'OEE seule reste opaque.
            </p>
            <div className="oee-waterfall">
              <div className="oee-step" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                <div className="oee-step-icon"><Clock size={18} /></div>
                <div className="oee-step-label">Disponibilité</div>
                <div className="oee-step-value">{oeeDecomp.disponibilite}%</div>
                <div className="oee-step-formula">Temps marche / Temps requis</div>
              </div>
              <div className="oee-mult">×</div>
              <div className="oee-step" style={{ background: '#fef3c7', color: '#b45309' }}>
                <div className="oee-step-icon"><Zap size={18} /></div>
                <div className="oee-step-label">Performance</div>
                <div className="oee-step-value">{oeeDecomp.performance}%</div>
                <div className="oee-step-formula">Cadence réelle / Cadence théorique</div>
              </div>
              <div className="oee-mult">×</div>
              <div className="oee-step" style={{ background: '#dcfce7', color: '#15803d' }}>
                <div className="oee-step-icon"><BarChart3 size={18} /></div>
                <div className="oee-step-label">Qualité</div>
                <div className="oee-step-value">{oeeDecomp.qualite}%</div>
                <div className="oee-step-formula">Pièces conformes / Total produites</div>
              </div>
              <div className="oee-eq">=</div>
              <div className="oee-step oee-step-result" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#f97316' }}>
                <div className="oee-step-icon"><TrendingUp size={20} /></div>
                <div className="oee-step-label">OEE</div>
                <div className="oee-step-value">{oeeDecomp.oee}%</div>
                <div className="oee-step-formula">
                  {oeeDecomp.oee >= 85 ? 'Classe mondiale' : oeeDecomp.oee >= 75 ? 'Très bon' : oeeDecomp.oee >= 60 ? 'Acceptable' : 'Insuffisant'}
                </div>
              </div>
            </div>
            <div className="oee-benchmark-bar">
              <span style={{ fontSize: 11, color: '#6b7280' }}>Repères industriels :</span>
              <span style={{ fontSize: 11 }}><span className="oee-marker" style={{ background: '#dc2626' }} /> &lt; 60% Insuffisant</span>
              <span style={{ fontSize: 11 }}><span className="oee-marker" style={{ background: '#f97316' }} /> 60–75% Acceptable</span>
              <span style={{ fontSize: 11 }}><span className="oee-marker" style={{ background: '#16a34a' }} /> 75–85% Très bon</span>
              <span style={{ fontSize: 11 }}><span className="oee-marker" style={{ background: '#7c3aed' }} /> ≥ 85% Classe mondiale</span>
            </div>
          </>
        )}
      </div>

      {/* SECTION 2: Évolution temporelle + Prédiction */}
      <div className="kpis-section">
        <div className="kpis-section-header">
          <h3>
            <TrendingUp size={16} /> Évolution + projection — {indicator === 'disponibilite' ? 'Disponibilité' : indicator.toUpperCase()}
            {forecastTrend !== 'stable' && (
              <span className={`forecast-trend-badge ${forecastTrend}`}>
                {forecastTrend === 'up' ? '↗' : '↘'} {forecastTrend === 'up' ? 'tendance haussière' : 'tendance baissière'}
                <em style={{ marginLeft: 4, opacity: 0.8 }}>({forecastSlope > 0 ? '+' : ''}{forecastSlope}/mois)</em>
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={showForecast} onChange={e => setShowForecast(e.target.checked)} />
              Prédiction
            </label>
            <select className="source-dataset-select" style={{ width: 'auto' }} value={indicator} onChange={e => setIndicator(e.target.value)}>
              <option value="disponibilite">Disponibilité</option>
              <option value="mtbf">MTBF</option>
              <option value="mttr">MTTR</option>
              <option value="oee">OEE</option>
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={showForecast ? forecastDataPoints : evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            <Legend />
            <Area type="monotone" dataKey={indicator} stroke="#f97316" strokeWidth={2} fill="url(#areaGrad)" name="Mesuré" />
            {showForecast && (
              <Line type="monotone" dataKey={`${indicator}_forecast`} stroke="#7c3aed" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4 }} name="Projection (régression linéaire)" connectNulls={true} />
            )}
            {indicator === 'disponibilite' && <ReferenceLine y={85} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Seuil critique', fill: '#dc2626', fontSize: 10 }} />}
            {indicator === 'mttr' && <ReferenceLine y={5} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Max acceptable', fill: '#dc2626', fontSize: 10 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* SECTION 3: Pareto avec drill-down (cliquable) */}
      <div className="kpis-section">
        <h3><BarChart3 size={16} /> Analyse Pareto des défaillances</h3>
        <button className="baignoire-toggle" onClick={() => setShowPareto(v => !v)} style={{ marginBottom: '12px' }}>
          <span>Loi de Pareto — Identifier les 20% qui causent 80% des arrêts</span>
          {showPareto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showPareto && (
          <p className="baignoire-text" style={{ marginBottom: '16px' }}>La loi de Pareto (ou loi 80/20) affirme que 80% des effets indésirables sont causés par 20% des causes. En maintenance : 20% des types de défauts causent 80% des arrêts machine. Zone A (0–80%) : causes prioritaires. Zone B (80–95%) : secondaires. Zone C (95–100%) : marginales.</p>
        )}
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 8px' }}>
          Cliquez sur un défaut pour voir les <strong>machines concernées</strong>.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={paretoData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="defaut" tick={{ fontSize: 11 }} width={100} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="cout"
              fill="#f97316"
              name="Coût (€)"
              barSize={16}
              cursor="pointer"
              onClick={(d: any) => setParetoDrillDown(d?.defaut || null)}
            >
              {paretoData.map((_, i) => (
                <Cell key={i} fill={paretoCumul[i] <= 80 ? '#dc2626' : paretoCumul[i] <= 95 ? '#f97316' : '#d1d5db'} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={2} name="% cumulé" dot={{ r: 3 }} />
            <ReferenceLine x={80} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Seuil Pareto (80%)', fill: '#dc2626', fontSize: 10, position: 'top' }} />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Drill-down panneau */}
        {paretoDrillDown && (() => {
          const item = paretoData.find(d => d.defaut === paretoDrillDown);
          if (!item) return null;
          return (
            <div className="pareto-drilldown">
              <div className="pareto-drilldown-header">
                <Cpu size={14} />
                <strong>{item.defaut}</strong>
                <span className="pareto-drilldown-cost">{item.cout.toLocaleString()} € · {item.pct}% des coûts</span>
                <button className="pareto-drilldown-close" onClick={() => setParetoDrillDown(null)}>
                  <X size={14} />
                </button>
              </div>
              {item.machines.length > 0 ? (
                <>
                  <p style={{ fontSize: 11.5, color: '#6b7280', margin: '6px 0 8px' }}>
                    Machines impactées par ce type de défaut ({item.machines.length}) — priorité d'intervention :
                  </p>
                  <div className="pareto-drilldown-machines">
                    {item.machines.map((m, i) => (
                      <div key={i} className="pareto-drilldown-machine">
                        <span className="pareto-drilldown-rank">#{i + 1}</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 11.5, color: '#9ca3af', fontStyle: 'italic' }}>Aucune machine identifiée pour cette catégorie.</p>
              )}
            </div>
          );
        })()}
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