// src/pages/Donnees/components/KPIsPage.tsx
// Sous-page KPIs & Performance

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  DollarSign,
  Gauge,
  ListTodo,
  Loader2,
  RefreshCw,
  Shield,
  Timer,
  TrendingUp,
  Users,
  Wifi,
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


/* ─── Formateur de valeur ────────────────────────────────────────────── */
const fmt = (v: any, unit = '', decimals = 0): string => {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (isNaN(n)) return '—';
  return `${n.toFixed(decimals)}${unit}`;
};

/* ─── 9 piliers Dashboard (config statique) ──────────────────────────── */
const PILLARS: {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  kpis: (c: any) => { label: string; value: string }[];
}[] = [
  {
    id: 'revenue_recovery', name: 'Revenue Recovery', icon: DollarSign, color: '#16a34a',
    kpis: (c) => [
      { label: 'Économies YTD', value: fmt(c?.economies_ytd_k, ' k€') },
      { label: 'ROI prédictif',  value: fmt(c?.roi_pct, '%') },
      { label: 'Pannes évitées', value: fmt(c?.pannes_evitees) },
      { label: 'Coût moy/panne', value: fmt(c?.cout_moy_panne, ' €') },
    ],
  },
  {
    id: 'asset_availability', name: 'Asset Availability', icon: Gauge, color: '#3b82f6',
    kpis: (c) => [
      { label: 'Disponibilité', value: fmt(c?.disponibilite_moy, '%', 1) },
      { label: 'OEE / TRS',     value: fmt(c?.oee_moy, '%', 1) },
      { label: 'MTBF moy',      value: fmt(c?.mtbf_moy, ' h') },
      { label: 'MTTR moy',      value: fmt(c?.mttr_moy, ' h', 1) },
    ],
  },
  {
    id: 'risk_reduction', name: 'Risk Reduction', icon: Shield, color: '#dc2626',
    kpis: (c) => [
      { label: 'Machines zone D', value: fmt(c?.machines_zone_d) },
      { label: 'Défauts actifs',  value: fmt(c?.defauts_actifs) },
      { label: 'DRBF min parc',   value: fmt(c?.drbf_min_parc, ' j', 1) },
      { label: 'Incidents YTD',   value: fmt(c?.incidents_ytd) },
    ],
  },
  {
    id: 'smart_replacement', name: 'Smart Replacement', icon: RefreshCw, color: '#7c3aed',
    kpis: (c) => [
      { label: 'Remplacements opt.', value: fmt(c?.remplacements_optimaux) },
      { label: 'Écon. remplacement', value: fmt(c?.economies_remplacement_k, ' k€') },
      { label: 'PM supprimées',      value: fmt(c?.pm_supprimees) },
      { label: 'Économies PM',       value: fmt(c?.economies_pm_k, ' k€') },
    ],
  },
  {
    id: 'iot_network', name: 'IoT Network', icon: Wifi, color: '#0ea5e9',
    kpis: (c) => [
      { label: 'Total capteurs',  value: fmt(c?.total_capteurs) },
      { label: 'Capteurs actifs', value: fmt(c?.capteurs_actifs) },
      { label: 'Batterie faible', value: fmt(c?.batterie_faible) },
      { label: 'Batterie moy',    value: fmt(c?.batterie_moy_pct, '%') },
    ],
  },
  {
    id: 'planned_maintenance', name: 'Maintenance planifiée', icon: Wrench, color: '#f97316',
    kpis: (c) => [
      { label: 'BT planifiés', value: fmt(c?.bt_planifies) },
      { label: 'BT en cours',  value: fmt(c?.bt_en_cours) },
      { label: 'BT urgents',   value: fmt(c?.bt_urgents) },
      { label: 'Durée moy',    value: fmt(c?.duree_moy_h, ' h', 1) },
    ],
  },
  {
    id: 'service_loss', name: 'Service Loss', icon: AlertTriangle, color: '#ef4444',
    kpis: (c) => [
      { label: 'Pannes histor.', value: fmt(c?.nb_pannes_historique) },
      { label: 'Arrêt moy',      value: fmt(c?.arret_moy_h, ' h', 1) },
      { label: 'Pertes arrêts',  value: fmt(c?.pertes_arret_k, ' k€') },
      { label: 'Total arrêt',    value: fmt(c?.total_arret_h, ' h') },
    ],
  },
  {
    id: 'workforce', name: 'Workforce', icon: Users, color: '#8b5cf6',
    kpis: (c) => [
      { label: 'Techniciens',   value: fmt(c?.nb_techniciens) },
      { label: 'Certifications', value: fmt(c?.nb_certifications) },
      { label: 'Équipe active',  value: fmt(c?.equipe_active) },
      { label: 'Interventions',  value: fmt(c?.nb_interventions) },
    ],
  },
  {
    id: 'predictive_power', name: 'Predictive Power', icon: TrendingUp, color: '#f59e0b',
    kpis: (c) => [
      { label: 'Taux détection',  value: fmt(c?.taux_detection_pct, '%', 1) },
      { label: 'Confiance moy',   value: fmt(c?.confiance_moy_pct, '%', 1) },
      { label: 'Défauts actifs',  value: fmt(c?.defauts_actifs) },
      { label: 'Lead time moy',   value: fmt(c?.lead_time_moy_j, ' j', 1) },
    ],
  },
];

/* ─── Dérivation KPIs de gestion (depuis dashCats) ───────────────────── */
const gestionKpis = (cats: any) => {
  const pm  = cats?.planned_maintenance  ?? {};
  const svc = cats?.service_loss         ?? {};
  const wf  = cats?.workforce            ?? {};

  const btPlanned  = pm.bt_planifies  ?? 0;
  const btOngoing  = pm.bt_en_cours   ?? 0;
  const btDone     = pm.bt_termines   ?? 0;
  const btUrgent   = pm.bt_urgents    ?? 0;
  const btActive   = btPlanned + btOngoing;
  const btTotal    = btActive + btDone + btUrgent;

  const ratioPM = btTotal > 0
    ? parseFloat(((btActive / btTotal) * 100).toFixed(1))
    : null;

  const pmCompliance = (btDone + btPlanned) > 0
    ? parseFloat((btDone / (btDone + btPlanned) * 100).toFixed(1))
    : null;

  const nbTech   = Math.max(wf.nb_techniciens ?? 1, 1);
  const backlog  = parseFloat((btActive / nbTech).toFixed(1));

  const nbPannes   = Math.max(svc.nb_pannes_historique ?? 1, 1);
  const arretMoy   = svc.arret_moy_h     ?? 0;
  const pertesK    = svc.pertes_arret_k  ?? 0;
  const coutArrets = arretMoy > 0 || pertesK > 0
    ? Math.round(arretMoy * 2500 + (pertesK * 1000 / nbPannes))
    : null;

  return { ratioPM, pmCompliance, backlog, coutArrets };
};

const KPIsPage: React.FC = () => {
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('kpis', selectedId);
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [period, setPeriod] = useState('30 jours');
  const [indicator, setIndicator] = useState('disponibilite');
  const [showPareto, setShowPareto] = useState(false);
  const [showOeeDecomp, setShowOeeDecomp] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [paretoDrillDown, setParetoDrillDown] = useState<string | null>(null);
  const [dbKpis, setDbKpis] = useState<{
    disponibilite?: number; oee?: number; mtbf?: number; mttr?: number;
    performance?: number; qualite?: number; cout_maintenance_k?: number;
    delta_disponibilite?: number; delta_oee?: number; delta_mtbf?: number; delta_mttr?: number;
  } | null>(null);
  const [dbEvolution, setDbEvolution] = useState<any[]>([]);
  const [paretoDB, setParetoDB] = useState<any[]>([]);
  const [atelierDB, setAtelierDB] = useState<any[]>([]);
  const [dashCats, setDashCats] = useState<any>(null);
  const [showDashKpis, setShowDashKpis] = useState(true);
  const [showGestion, setShowGestion] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
    const userId = session.id;
    if (!userId) return;
    fetch(`${API}/api/dashboard/categories?user_id=${userId}`)
      .then(r => r.json())
      .then(setDashCats)
      .catch(() => setDashCats({}));
  }, []);

  useEffect(() => {
    if (source !== 'db') return;
    const session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
    const userId = session.id;
    if (!userId) return;
    fetch(`${API}/api/donnees/kpis?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { if (d && Object.keys(d).length > 0) setDbKpis(d); })
      .catch(() => setFetchError(true));
    fetch(`${API}/api/donnees/visualisation?user_id=${userId}`)
      .then(r => r.json())
      .then((rows: any[]) => { if (rows && rows.length > 0) setDbEvolution(rows); })
      .catch(() => setFetchError(true));
    fetch(`${API}/api/donnees/pareto?user_id=${userId}`)
      .then(r => r.json())
      .then((rows: any[]) => { if (Array.isArray(rows)) setParetoDB(rows); })
      .catch(() => setFetchError(true));
    fetch(`${API}/api/donnees/ateliers?user_id=${userId}`)
      .then(r => r.json())
      .then((rows: any[]) => { if (Array.isArray(rows)) setAtelierDB(rows); })
      .catch(() => setFetchError(true));
  }, [source]);

  const kpis: NonNullable<typeof dbKpis> = dbKpis ?? {};
  const evolutionData = dbEvolution.map(r => ({
    mois: r.date_kpi || '',
    disponibilite: r.disponibilite_pct ?? null,
    oee: r.oee_pct ?? null,
    mtbf: r.mtbf_heures ?? null,
    mttr: r.mttr_heures ?? null,
    qualite: r.qualite_pct ?? null,
  }));

  const kpiCards: { label: string; value: number | null; delta: number | null; unit: string; icon: React.ElementType; good: number; formula: string; norm: string }[] = [
    { label: 'Disponibilité moyenne', value: kpis.disponibilite ?? null, delta: kpis.delta_disponibilite ?? null, unit: '%', icon: Gauge, good: 90, formula: 'MTBF / (MTBF + MTTR) × 100', norm: 'ISO 13306' },
    { label: 'TRS / OEE', value: kpis.oee ?? null, delta: kpis.delta_oee ?? null, unit: '%', icon: TrendingUp, good: 85, formula: 'Disponibilité × Performance × Qualité', norm: 'NF E 60-182' },
    { label: 'MTBF moyen', value: kpis.mtbf ?? null, delta: kpis.delta_mtbf ?? null, unit: 'h', icon: Clock, good: 500, formula: 'Temps total / Nb pannes', norm: 'NF X 60-020' },
    { label: 'MTTR moyen', value: kpis.mttr ?? null, delta: kpis.delta_mttr ?? null, unit: 'h', icon: Wrench, good: 3, formula: 'Temps réparation / Nb pannes', norm: 'NF X 60-020' },
    { label: 'TRG', value: null, delta: null, unit: '%', icon: BarChart3, good: 80, formula: 'TRS × (Tps planifié / Tps calendaire)', norm: 'NF E 60-182' },
    { label: 'Coût maintenance', value: kpis.cout_maintenance_k != null ? +(kpis.cout_maintenance_k * 1000).toFixed(0) : null, delta: null, unit: '€', icon: DollarSign, good: 12000, formula: "Coûts main d'œuvre + pièces", norm: '' },
  ];

  const paretoData = paretoDB.map(r => ({
    defaut: r.type_defaut,
    cout: r.cout_total ?? 0,
    pct: r.pct ?? 0,
    machines: Array.isArray(r.machines) ? r.machines : [],
  }));
  const paretoCumul = paretoData.reduce((acc, d, i) => { acc.push((acc[i - 1] || 0) + d.pct); return acc; }, [] as number[]);

  // ─── Décomposition OEE = Disponibilité × Performance × Qualité ──────
  const oeeDecomp = useMemo(() => {
    if (kpis.disponibilite == null || kpis.oee == null) return null;
    const dispoFrac = kpis.disponibilite / 100;
    const oeeFrac = kpis.oee / 100;
    const qualiteFrac = kpis.qualite != null ? kpis.qualite / 100 : 0.98;
    const perfFrac = kpis.performance != null
      ? kpis.performance / 100
      : (oeeFrac / Math.max(dispoFrac, 0.01)) / qualiteFrac;
    return {
      disponibilite: parseFloat((dispoFrac * 100).toFixed(1)),
      performance:   parseFloat((perfFrac * 100).toFixed(1)),
      qualite:       parseFloat((qualiteFrac * 100).toFixed(1)),
      oee:           parseFloat((oeeFrac * 100).toFixed(1)),
    };
  }, [kpis.disponibilite, kpis.oee, kpis.qualite, kpis.performance]);

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

  const atelierKeys = atelierDB.map((_, i) => String.fromCharCode(65 + i));
  const radarData = atelierDB.length > 0 ? [
    { axe: 'Disponibilité', ...Object.fromEntries(atelierDB.map((a, i) => [atelierKeys[i], a.disponibilite ?? 0])) },
    { axe: 'OEE',           ...Object.fromEntries(atelierDB.map((a, i) => [atelierKeys[i], a.oee ?? 0])) },
    { axe: 'MTBF',          ...Object.fromEntries(atelierDB.map((a, i) => [atelierKeys[i], Math.min(100, (a.mtbf ?? 0) / 5)])) },
    { axe: 'MTTR⁻¹',        ...Object.fromEntries(atelierDB.map((a, i) => [atelierKeys[i], Math.max(0, 100 - (a.mttr ?? 0) * 10)])) },
    { axe: 'Alertes⁻¹',     ...Object.fromEntries(atelierDB.map((a, i) => [atelierKeys[i], Math.max(0, 100 - (a.nb_alertes ?? 0) * 5)])) },
  ] : [];

  const ratios = [
    { code: 'r1',  label: 'Coûts maint / Valeur bien',    valeur: '—',  benchmark: '< 3% : excellent',     ok: null as boolean | null },
    { code: 'r6',  label: 'Coûts défaillance / total',     valeur: '—',  benchmark: '< 20% : bon',          ok: null as boolean | null },
    { code: 'r9',  label: 'Coûts préventif / total',       valeur: '—',  benchmark: 'Optimum ≈ 60–70%',     ok: null as boolean | null },
    { code: 'r22', label: 'Disponibilité opérationnelle',  valeur: kpis.disponibilite != null ? `${kpis.disponibilite.toFixed(1)}%` : '—', benchmark: 'Cible > 85%',           ok: kpis.disponibilite != null ? kpis.disponibilite >= 85 : null },
    { code: 'r28', label: 'MTBF',                          valeur: kpis.mtbf != null ? `${Math.round(kpis.mtbf)} h` : '—',                 benchmark: 'Variable par secteur', ok: null as boolean | null },
  ];

  if (ctxLoading) return <div className="kpis-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;
  if (source === 'dataset' && !isCompatible) {
    return <div className="kpis-page"><IncompatibleDatasetMessage page="KPIs & Performance" datasetName={selectedDs?.name || 'inconnu'} analysisType="kpi" /></div>;
  }
  if (source === 'dataset' && isCompatible) {
    return (
      <div className="kpis-page">
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
          <BarChart3 size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14, marginBottom: 8 }}>
            L'analyse KPI depuis un dataset uploadé n'est pas encore disponible dans cette vue.
          </p>
          <p style={{ fontSize: 12, color: 'var(--theme-text-faint)' }}>
            Intégrez votre dataset en base via l'onglet <strong>Chargement</strong>, puis consultez les KPIs calculés en mode <strong>Base de données</strong>.
          </p>
          <button
            style={{ marginTop: 16, padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            onClick={() => setSource('db')}
          >
            Passer en mode Base de données
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kpis-page">
      {fetchError && (
        <div style={{ padding: '10px 16px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', borderRadius: 6, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /> Certaines données n'ont pas pu être chargées. Vérifiez la connexion au backend.
        </div>
      )}
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
          return (
            <div key={kpi.label} className="kpi-card-item" title={`Formule : ${kpi.formula}\nNorme : ${kpi.norm}`}>
              <div className="kpi-card-header">
                <Icon size={16} color="#f97316" />
                <span className="kpi-card-label">{kpi.label}</span>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{kpi.value != null ? `${kpi.value}${kpi.unit}` : '—'}</span>
                {kpi.delta != null && (
                  <span className={`kpi-card-delta ${kpi.delta >= 0 ? 'pos' : 'neg'}`}>
                    {kpi.delta >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} />}
                    {kpi.delta >= 0 ? '↑' : '↓'} {Math.abs(kpi.delta)}{kpi.unit}
                  </span>
                )}
              </div>
              <div className="kpi-card-progress">
                <div className="kpi-card-progress-bar" style={{ width: kpi.value != null ? `${Math.min(100, (kpi.value / kpi.good) * 100)}%` : '0%', background: kpi.value != null ? (kpi.value >= kpi.good ? '#16a34a' : kpi.value >= kpi.good * 0.85 ? '#f97316' : '#dc2626') : 'var(--theme-border)' }} />
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
          oeeDecomp == null ? (
            <div style={{ padding: '16px', color: 'var(--theme-text-muted)', fontSize: 13 }}>
              Données insuffisantes pour calculer la décomposition OEE.
              Intégrez des datasets KPI en base pour activer cette section.
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 14 }}>
                Le <strong>TRS (Taux de Rendement Synthétique)</strong>, appelé <strong>OEE</strong> en anglais, est le produit de 3 ratios fondamentaux
                (norme NF E 60-182). TRS et OEE désignent exactement le même indicateur — seule la langue diffère.
                Cette décomposition identifie les <em>vraies</em> sources de pertes, là où une valeur globale seule reste opaque.
              </p>
              <div className="oee-waterfall">
                <div className="oee-step" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                  <div className="oee-step-icon"><Clock size={18} /></div>
                  <div className="oee-step-label">Disponibilité</div>
                  <div className="oee-step-value">{oeeDecomp.disponibilite}%</div>
                  <div className="oee-step-formula">Temps marche / Temps requis</div>
                </div>
                <div className="oee-mult">×</div>
                <div className="oee-step" style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
                  <div className="oee-step-icon"><Zap size={18} /></div>
                  <div className="oee-step-label">Performance</div>
                  <div className="oee-step-value">{oeeDecomp.performance}%</div>
                  <div className="oee-step-formula">Cadence réelle / Cadence théorique</div>
                </div>
                <div className="oee-mult">×</div>
                <div className="oee-step" style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>
                  <div className="oee-step-icon"><BarChart3 size={18} /></div>
                  <div className="oee-step-label">Qualité</div>
                  <div className="oee-step-value">{oeeDecomp.qualite}%</div>
                  <div className="oee-step-formula">Pièces conformes / Total produites</div>
                </div>
                <div className="oee-eq">=</div>
                <div className="oee-step oee-step-result" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', borderColor: '#f97316' }}>
                  <div className="oee-step-icon"><TrendingUp size={20} /></div>
                  <div className="oee-step-label">OEE</div>
                  <div className="oee-step-value">{oeeDecomp.oee}%</div>
                  <div className="oee-step-formula">
                    {oeeDecomp.oee >= 85 ? 'Classe mondiale' : oeeDecomp.oee >= 75 ? 'Très bon' : oeeDecomp.oee >= 60 ? 'Acceptable' : 'Insuffisant'}
                  </div>
                </div>
              </div>
              <div className="oee-benchmark-bar">
                <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Repères industriels :</span>
                <span style={{ fontSize: 11 }}><span className="oee-marker" style={{ background: '#dc2626' }} /> &lt; 60% Insuffisant</span>
                <span style={{ fontSize: 11 }}><span className="oee-marker" style={{ background: '#f97316' }} /> 60–75% Acceptable</span>
                <span style={{ fontSize: 11 }}><span className="oee-marker" style={{ background: '#16a34a' }} /> 75–85% Très bon</span>
                <span style={{ fontSize: 11 }}><span className="oee-marker" style={{ background: '#7c3aed' }} /> ≥ 85% Classe mondiale</span>
              </div>
            </>
          )
        )}
      </div>

      {/* SECTION 2: 9 piliers Dashboard — tous les KPIs de l'application */}
      <div className="kpis-section">
        <div className="kpis-section-header">
          <h3><Activity size={16} /> KPIs Application — 9 piliers de la maintenance prédictive</h3>
          <button
            className="baignoire-toggle"
            style={{ width: 'auto', padding: '4px 12px' }}
            onClick={() => setShowDashKpis(v => !v)}
          >
            {showDashKpis ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        {showDashKpis && (
          <>
            <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 14 }}>
              Ces indicateurs sont calculés depuis la <strong>base de données de l'application</strong> (machines, capteurs, historique de maintenance).
              Si aucune donnée n'a encore été intégrée, les valeurs affichent <strong>—</strong>.
              Intégrez un dataset via l'onglet <em>Chargement</em> pour les alimenter.
            </p>
            {!dashCats ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--theme-text-faint)', fontSize: 13 }}>
                <Loader2 size={18} className="spin" style={{ display: 'inline-block', marginRight: 8 }} />
                Chargement des KPIs application…
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {PILLARS.map(pillar => {
                  const Icon = pillar.icon;
                  const catData = dashCats[pillar.id];
                  const kpis = pillar.kpis(catData);
                  return (
                    <div
                      key={pillar.id}
                      style={{
                        background: 'var(--theme-bg-card)',
                        border: '1px solid var(--theme-border)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        borderTop: `3px solid ${pillar.color}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Icon size={14} color={pillar.color} />
                        <strong style={{ fontSize: '12px', color: 'var(--theme-text)' }}>{pillar.name}</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 4px' }}>
                        {kpis.map((kpi) => (
                          <div key={kpi.label}>
                            <div style={{
                              fontSize: '17px',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              color: kpi.value === '—' ? 'var(--theme-text-faint)' : 'var(--theme-text)',
                            }}>
                              {kpi.value}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--theme-text-faint)', marginTop: '2px' }}>
                              {kpi.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION 2bis: Indicateurs de gestion opérationnelle */}
      {dashCats && (() => {
        const g = gestionKpis(dashCats);
        const svc = dashCats.service_loss ?? {};
        const gCards = [
          {
            label: 'MTTF moyen',
            value: '—',
            unit: 'h',
            icon: Timer,
            color: '#3b82f6',
            formula: 'Σ durée vie / nb équipements',
            norm: 'ISO 14224',
            note: 'Non-réparables (roulements…) — non tracés en BD',
            ok: false,
            progressPct: 0,
          },
          {
            label: 'Ratio PM / Correctif',
            value: g.ratioPM !== null ? String(g.ratioPM) : '—',
            unit: '%',
            icon: BarChart3,
            color: '#16a34a',
            formula: 'H préventif / H totales × 100',
            norm: 'EN 15341 — E1',
            note: 'Objectif : 70–80 % de préventif',
            ok: g.ratioPM !== null ? g.ratioPM >= 60 : false,
            progressPct: g.ratioPM !== null ? Math.min(100, (g.ratioPM / 80) * 100) : 0,
          },
          {
            label: 'PM Compliance',
            value: g.pmCompliance !== null ? String(g.pmCompliance) : '—',
            unit: '%',
            icon: CheckCircle2,
            color: '#16a34a',
            formula: 'OT terminés / (terminés + planifiés) × 100',
            norm: 'EN 15341 — E3',
            note: 'World-class ≥ 95 %',
            ok: g.pmCompliance !== null ? g.pmCompliance >= 85 : false,
            progressPct: g.pmCompliance !== null ? Math.min(100, (g.pmCompliance / 95) * 100) : 0,
          },
          {
            label: 'Backlog',
            value: g.backlog !== null ? String(g.backlog) : '—',
            unit: 'sem.',
            icon: ListTodo,
            color: '#f97316',
            formula: 'OT en attente / Capacité équipe',
            norm: 'EN 15341',
            note: 'Sain : 2–4 semaines',
            ok: g.backlog !== null ? (g.backlog >= 2 && g.backlog <= 4) : false,
            progressPct: g.backlog !== null ? Math.min(100, Math.max(0, (1 - Math.abs(g.backlog - 3) / 4) * 100)) : 0,
          },
          {
            label: 'Coût des arrêts',
            value: g.coutArrets !== null ? g.coutArrets.toLocaleString() : '—',
            unit: '€',
            icon: DollarSign,
            color: '#dc2626',
            formula: 't × (marge + fixes) + réparation',
            norm: 'NF X 60-020',
            note: 'Formule : t × 2 500 €/h + réparation',
            ok: false,
            progressPct: 0,
          },
        ];
        return (
          <div className="kpis-section">
            <div className="kpis-section-header">
              <h3><Shield size={16} /> Indicateurs de gestion opérationnelle</h3>
              <button
                className="baignoire-toggle"
                style={{ width: 'auto', padding: '4px 12px' }}
                onClick={() => setShowGestion(v => !v)}
              >
                {showGestion ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
            {showGestion && (
              <>
                <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 14 }}>
                  Indicateurs de maturité de l'organisation maintenance. Formules selon <strong>EN 15341</strong> et <strong>NF X 60-020</strong>.
                  Le MTTF est en valeur de démo (équipements non-réparables non tracés en BD).
                </p>
                <div className="kpis-cards-grid">
                  {gCards.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                      <div
                        key={kpi.label}
                        className="kpi-card-item"
                        title={`Formule : ${kpi.formula}\nNorme : ${kpi.norm}\n${kpi.note}`}
                      >
                        <div className="kpi-card-header">
                          <Icon size={16} color={kpi.color} />
                          <span className="kpi-card-label">{kpi.label}</span>
                        </div>
                        <div className="kpi-card-body">
                          <span className="kpi-card-value">
                            {kpi.value}{kpi.value !== '—' ? kpi.unit : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--theme-text-faint)', marginTop: 4 }}>
                          {kpi.note}
                        </div>
                        <div className="kpi-card-progress" style={{ marginTop: 6 }}>
                          <div
                            className="kpi-card-progress-bar"
                            style={{
                              width: `${kpi.progressPct}%`,
                              background: kpi.ok ? '#16a34a' : kpi.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Formule détaillée Coût des arrêts */}
                <div style={{
                  marginTop: 16,
                  padding: '14px 18px',
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--theme-border)',
                  borderLeft: '3px solid #dc2626',
                  borderRadius: '6px',
                  fontSize: 12,
                }}>
                  <strong style={{ display: 'block', marginBottom: 6, color: 'var(--theme-text)' }}>
                    Formule détaillée — Coût d'un arrêt
                  </strong>
                  <code style={{ color: 'var(--theme-text-muted)', fontSize: 11 }}>
                    Coût = t_arrêt × (Marge horaire perdue + Coûts fixes) + Coût réparation
                  </code>
                  <div style={{ marginTop: 8, color: 'var(--theme-text-faint)', lineHeight: 1.6 }}>
                    Durée moy. : <strong style={{ color: 'var(--theme-text-muted)' }}>{fmt(svc.arret_moy_h, ' h', 1)}</strong>
                    {' · '}Pertes totales : <strong style={{ color: 'var(--theme-text-muted)' }}>{fmt(svc.pertes_arret_k, ' k€')}</strong>
                    {' · '}Pannes : <strong style={{ color: 'var(--theme-text-muted)' }}>{fmt(svc.nb_pannes_historique)}</strong>
                    {' · '}
                    Taux implicite : <strong style={{ color: '#dc2626' }}>2 500 €/h</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* SECTION 3: Évolution temporelle + Prédiction */}
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
            <label style={{ fontSize: 11, color: 'var(--theme-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
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

      {/* SECTION 4: Pareto avec drill-down (cliquable) */}
      <div className="kpis-section">
        <h3><BarChart3 size={16} /> Analyse Pareto des défaillances</h3>
        <button className="baignoire-toggle" onClick={() => setShowPareto(v => !v)} style={{ marginBottom: '12px' }}>
          <span>Loi de Pareto — Identifier les 20% qui causent 80% des arrêts</span>
          {showPareto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showPareto && (
          <p className="baignoire-text" style={{ marginBottom: '16px' }}>La loi de Pareto (ou loi 80/20) affirme que 80% des effets indésirables sont causés par 20% des causes. En maintenance : 20% des types de défauts causent 80% des arrêts machine. Zone A (0–80%) : causes prioritaires. Zone B (80–95%) : secondaires. Zone C (95–100%) : marginales.</p>
        )}
        {paretoData.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--theme-text-faint)', fontSize: 13, textAlign: 'center' }}>
            Aucune défaillance enregistrée. Intégrez des données de maintenance ou attendez que le système détecte des défauts.
          </div>
        ) : (
        <>
        <p style={{ fontSize: 11, color: 'var(--theme-text-faint)', margin: '4px 0 8px' }}>
          Cliquez sur un défaut pour voir les <strong>machines concernées</strong>.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={paretoData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
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
                <Cell key={i} fill={paretoCumul[i] <= 80 ? '#dc2626' : paretoCumul[i] <= 95 ? '#f97316' : 'var(--theme-border)'} />
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
                  <p style={{ fontSize: 11.5, color: 'var(--theme-text-muted)', margin: '6px 0 8px' }}>
                    Machines impactées par ce type de défaut ({item.machines.length}) — priorité d'intervention :
                  </p>
                  <div className="pareto-drilldown-machines">
                    {item.machines.map((m: string, i: number) => (
                      <div key={i} className="pareto-drilldown-machine">
                        <span className="pareto-drilldown-rank">#{i + 1}</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 11.5, color: 'var(--theme-text-faint)', fontStyle: 'italic' }}>Aucune machine identifiée pour cette catégorie.</p>
              )}
            </div>
          );
        })()}
        </>
        )}
      </div>

      {/* SECTION 5: Comparaison Ateliers */}
      <div className="kpis-section">
        <h3><Zap size={16} /> Comparaison ateliers</h3>
        {atelierDB.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--theme-text-faint)', fontSize: 13, textAlign: 'center' }}>
            Aucune donnée d'atelier disponible. Intégrez des datasets KPI pour alimenter cette comparaison.
          </div>
        ) : (
          <div className="radar-grid">
            <ResponsiveContainer width={400} height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--theme-border)" />
                <PolarAngleAxis dataKey="axe" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                {atelierKeys.map((key, i) => (
                  <Radar key={key} dataKey={key} stroke={ATELIER_COLORS[i % ATELIER_COLORS.length]} fill={ATELIER_COLORS[i % ATELIER_COLORS.length]} fillOpacity={0.1} strokeWidth={2} />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            <table className="kpis-table">
              <thead><tr><th>Atelier</th><th>Dispo</th><th>OEE</th><th>MTBF</th></tr></thead>
              <tbody>
                {atelierDB.map((a, i) => (
                  <tr key={i}>
                    <td><strong>{atelierKeys[i]} — {a.nom}</strong></td>
                    <td>{a.disponibilite != null ? `${a.disponibilite.toFixed(1)}%` : '—'}</td>
                    <td>{a.oee != null ? `${a.oee.toFixed(1)}%` : '—'}</td>
                    <td>{a.mtbf != null ? `${Math.round(a.mtbf)}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 6: Ratios normalisés */}
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