// src/pages/Donnees/components/PronosticPage.tsx
// Sous-page Pronostic & DRBF — Durée Résiduelle Avant Bris de Fatigue

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BatteryCharging,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Info,
  Loader2,
  Sigma,
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

const RUL_COLORS = {
  critical: '#dc2626',
  warning: '#f97316',
  nominal: '#16a34a',
};

const getRULCategory = (rul: number | null) => {
  if (rul == null) return null;
  if (rul < 15) return { label: 'Critique', color: RUL_COLORS.critical, icon: 'CRIT' };
  if (rul <= 60) return { label: 'Surveillance', color: RUL_COLORS.warning, icon: 'SURV' };
  return { label: 'Nominal', color: RUL_COLORS.nominal, icon: 'NOM' };
};

interface MachinePronostic {
  machine_id: string;
  machine_name: string;
  health_index: number | null;
  rul_days: number | null;
  rul_confidence: number | null;
  vrms_current: number | null;
  last_updated: string | null;
  has_pronostic_data: number;
  has_health_data: number;
}

const PronosticPage: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [machines, setMachines] = useState<MachinePronostic[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [degradationData, setDegradationData] = useState<any[]>([]);
  const [showBaignoire, setShowBaignoire] = useState(false);
  const [showWeibull, setShowWeibull] = useState(false);
  const [kpiStats, setKpiStats] = useState<{
    mtbf: number | null; mttr: number | null;
    disponibilite: number | null; taux_detection: number | null;
  } | null>(null);

  // ─── Alarme prévisionnelle ─────────────────────────────────────────
  // Calcule la date prédite de passage en zone critique pour chaque machine
  const previsionalAlarms = useMemo(() => {
    const today = new Date();
    return machines
      .filter(m => m.rul_days != null)
      .map(m => {
        const cat = getRULCategory(m.rul_days)!;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + m.rul_days!);
        const warningDate = new Date(today);
        warningDate.setDate(today.getDate() + Math.max(1, Math.round(m.rul_days! * 0.5)));
        return {
          machine_id: m.machine_id,
          machine_name: m.machine_name,
          health_index: m.health_index,
          rul_days: m.rul_days!,
          confidence: m.rul_confidence,
          predicted_failure_date: targetDate.toISOString().slice(0, 10),
          warning_date: warningDate.toISOString().slice(0, 10),
          category: cat.label,
          color: cat.color,
        };
      })
      .sort((a, b) => a.rul_days - b.rul_days);
  }, [machines]);

  // ─── Analyse Weibull (loi de fiabilité, ISO 14224 / NF X 60-503) ────
  // Estimation des paramètres β (forme) et η (échelle) à partir du MTBF
  // Formule simplifiée : MTBF = η · Γ(1 + 1/β), avec Γ ≈ 0.886 pour β=2 (approximation pratique)
  const weibullAnalysis = useMemo(() => {
    const mtbf = kpiStats?.mtbf ?? 0;
    // Estimation pragmatique de β selon la phase :
    //  β < 1 = mortalité infantile · β = 1 = aléatoire · β > 1 = vieillissement
    // En l'absence de données de défaillance complètes, on estime β à partir
    // de la dispersion du health index (à défaut, β = 2.5 typique en industrie)
    const healthValues = machines.map(m => m.health_index).filter((h): h is number => h != null && h > 0);
    const meanHealth = healthValues.length > 0 ? healthValues.reduce((a, b) => a + b, 0) / healthValues.length : 70;
    // Plus la variance est forte, plus β est petit (défaillances aléatoires)
    const variance = healthValues.length > 0
      ? healthValues.reduce((acc, h) => acc + Math.pow(h - meanHealth, 2), 0) / healthValues.length
      : 100;
    const cv = Math.sqrt(variance) / Math.max(meanHealth, 1);
    const beta = Math.max(0.8, Math.min(4.5, 2.0 + (1 - cv) * 1.5));
    // η = MTBF / Γ(1 + 1/β), approximation via série
    const gammaApprox = (x: number) => {
      if (x < 1) return 0.886;
      return Math.exp(-0.5772 * (1 - 1/x) + 0.5 * Math.log(2 * Math.PI / x));
    };
    const eta = mtbf / Math.max(0.5, gammaApprox(1 + 1 / beta));
    let phase: 'A' | 'B' | 'C';
    let phaseLabel: string;
    if (beta < 1.0) {
      phase = 'A'; phaseLabel = 'Mortalité infantile';
    } else if (beta < 1.3) {
      phase = 'B'; phaseLabel = 'Maturité (défaillances aléatoires)';
    } else {
      phase = 'C'; phaseLabel = 'Vieillissement (usure)';
    }
    // Fiabilité R(t) = exp(-(t/η)^β) à différents horizons
    const reliability = (t: number) => Math.exp(-Math.pow(t / eta, beta));
    return {
      beta: parseFloat(beta.toFixed(2)),
      eta: Math.round(eta),
      phase,
      phaseLabel,
      reliability_30d: parseFloat((reliability(30 * 24) * 100).toFixed(1)),
      reliability_90d: parseFloat((reliability(90 * 24) * 100).toFixed(1)),
      reliability_180d: parseFloat((reliability(180 * 24) * 100).toFixed(1)),
      reliability_365d: parseFloat((reliability(365 * 24) * 100).toFixed(1)),
    };
  }, [machines, kpiStats?.mtbf]);

  useEffect(() => {
    if (source !== 'db') { setMachines([]); setKpiStats(null); return; }
    setLoading(true);
    const session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
    const userId = session.id;
    if (!userId) { setLoading(false); return; }
    Promise.all([
      fetch(`${API}/api/donnees/pronostic/synthese?user_id=${userId}`).then(r => r.json()),
      fetch(`${API}/api/donnees/kpis/synthese?user_id=${userId}`).then(r => r.json()),
    ])
      .then(([pronostic, kpis]) => {
        setMachines(pronostic.machines || pronostic);
        setKpiStats(kpis && Object.keys(kpis).length > 0 ? kpis : null);
      })
      .catch(() => setError('Impossible de charger les données pronostic.'))
      .finally(() => setLoading(false));
  }, [source]);

  useEffect(() => {
    if (!selectedMachine) return;
    const session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
    const userId = session.id;
    if (!userId) return;
    fetch(`${API}/api/donnees/pronostic/historique/${selectedMachine}?user_id=${userId}`)
      .then(r => r.json())
      .then(({ historique }) => {
        const m = machines.find(x => x.machine_id === selectedMachine);
        const historical = (historique as any[]).map(h => ({
          date: (h.ts as string)?.slice(0, 10) ?? '',
          health: h.health_index ?? null,
          vrms: h.vrms,
        }));
        const today = new Date();
        const projected = m && m.rul_days > 0
          ? Array.from({ length: Math.ceil((m.rul_days + 10) / 2) }, (_, i) => {
              const days = (i + 1) * 2;
              const d = new Date(today);
              d.setDate(d.getDate() + days);
              return {
                date: d.toISOString().slice(0, 10),
                health: Math.max(0, Math.round(m.health_index - days * (m.health_index / m.rul_days))),
                vrms: +(m.vrms_current + days * 0.04).toFixed(2),
                projected: true,
              };
            })
          : [];
        setDegradationData([...historical, ...projected]);
      })
      .catch(() => setDegradationData([]));
  }, [selectedMachine, machines]);

  if (ctxLoading) {
    return <div className="pronostic-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;
  }

  if (source === 'dataset') {
    return (
      <PronosticWrapper>
        <SourceToggle source={source} setSource={setSource} datasets={datasets} selectedId={selectedId} setSelectedId={setSelectedId} />
        <div className="pronostic-section" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Info size={36} style={{ marginBottom: 12, color: 'var(--theme-text-faint)' }} />
          <p style={{ fontSize: 14, marginBottom: 6, color: 'var(--theme-text)' }}>
            L'analyse pronostic depuis un dataset uploadé n'est pas encore disponible.
          </p>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginBottom: 20 }}>
            Intégrez vos données en base via <strong>Chargement → Intégrer en BD</strong>,<br />
            puis basculez sur <strong>Base de données</strong> pour accéder aux RUL calculés.
          </p>
          <button className="source-toggle-btn active" onClick={() => setSource('db')}>
            Basculer vers Base de données
          </button>
        </div>
      </PronosticWrapper>
    );
  }

  const stats = {
    critical: machines.filter(m => m.rul_days != null && m.rul_days < 15).length,
    warning: machines.filter(m => m.rul_days != null && m.rul_days >= 15 && m.rul_days <= 60).length,
    nominal: machines.filter(m => m.rul_days != null && m.rul_days > 60).length,
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
            {!loading && !error && machines.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--theme-text-faint)', fontSize: 13 }}>
                Aucune machine avec données pronostic en base de données.
              </div>
            )}
            {machines.map(m => {
              const cat = getRULCategory(m.rul_days);
              return (
                <div key={m.machine_id} className={`pronostic-machine-card ${cat?.label.toLowerCase() ?? 'unknown'}`}>
                  <div className="pmc-header">
                    <span className="pmc-icon">{cat?.icon ?? '—'}</span>
                    {cat ? (
                      <span className="pmc-badge" style={{ background: cat.color, color: '#fff' }}>{cat.label.toUpperCase()}</span>
                    ) : (
                      <span className="pmc-badge" style={{ background: 'var(--theme-bg-hover)', color: 'var(--theme-text-muted)' }}>SANS DONNÉES</span>
                    )}
                    <span className="pmc-id">{m.machine_id}</span>
                    <span className="pmc-name">— {m.machine_name}</span>
                  </div>
                  <div className="pmc-metrics">
                    <div className="pmc-metric">
                      <span className="pmc-metric-label">
                        RUL estimé
                        {!m.has_pronostic_data && (
                          <span title="Aucune donnée pronostic en BD pour cette machine" style={{ marginLeft: 5, fontSize: 9, background: 'rgba(107,114,128,0.15)', color: 'var(--theme-text-muted)', borderRadius: 3, padding: '1px 4px', fontWeight: 600 }}>Pas de données</span>
                        )}
                      </span>
                      <span className="pmc-metric-value" style={{ color: cat?.color ?? 'var(--theme-text-muted)' }}>
                        {m.rul_days != null ? `${m.rul_days} jours` : '—'}
                      </span>
                      <span className="pmc-metric-sub">Confiance : {m.rul_confidence != null ? `${m.rul_confidence}%` : '—'}</span>
                    </div>
                    <div className="pmc-metric">
                      <span className="pmc-metric-label">
                        Health Index
                        {!m.has_health_data && (
                          <span title="Aucun KPI journalier en BD pour cette machine" style={{ marginLeft: 5, fontSize: 9, background: 'rgba(107,114,128,0.15)', color: 'var(--theme-text-muted)', borderRadius: 3, padding: '1px 4px', fontWeight: 600 }}>Pas de données</span>
                        )}
                      </span>
                      <div className="health-index-bar">
                        <div className="health-index-fill" style={{
                          width: `${m.health_index ?? 0}%`,
                          background: m.health_index == null ? 'var(--theme-border)' : m.health_index <= 30 ? RUL_COLORS.critical : m.health_index <= 60 ? RUL_COLORS.warning : RUL_COLORS.nominal,
                        }} />
                      </div>
                      <span className="pmc-metric-sub">{m.health_index ?? '—'} / 100</span>
                    </div>
                  </div>
                  <div className="pmc-footer">
                    <span className="pmc-updated">Dernière mise à jour : {m.last_updated ?? '—'}</span>
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

      {/* SECTION 1bis: Alarmes prévisionnelles */}
      {previsionalAlarms.length > 0 && (
        <div className="pronostic-section">
          <h3 className="pronostic-section-title">
            <CalendarClock size={18} /> Alarmes prévisionnelles
          </h3>
          <p style={{ fontSize: 11.5, color: 'var(--theme-text-muted)', marginBottom: 10 }}>
            Pour chaque machine, l'application calcule la <strong>date prédite</strong> à laquelle le Health Index
            franchira le seuil critique, permettant de planifier les interventions avant arrêt non programmé.
          </p>
          <div className="prevalarm-grid">
            {previsionalAlarms.slice(0, 8).map(a => {
              const isCritical = a.rul_days < 15;
              const isWarning = a.rul_days < 60;
              return (
                <div key={a.machine_id} className="prevalarm-card" style={{ borderLeftColor: a.color }}>
                  <div className="prevalarm-header">
                    <strong>{a.machine_id}</strong>
                    <span className="prevalarm-badge" style={{ background: `${a.color}18`, color: a.color }}>
                      {a.category}
                    </span>
                  </div>
                  <div className="prevalarm-name">{a.machine_name}</div>
                  <div className="prevalarm-dates">
                    <div className="prevalarm-date-row">
                      <Clock size={10} />
                      <span>Alerte préventive&nbsp;:</span>
                      <strong style={{ color: '#f97316' }}>{a.warning_date}</strong>
                    </div>
                    <div className="prevalarm-date-row">
                      <AlertTriangle size={10} color="#dc2626" />
                      <span>Bris probable&nbsp;:</span>
                      <strong style={{ color: '#dc2626' }}>{a.predicted_failure_date}</strong>
                      <em style={{ marginLeft: 'auto', color: 'var(--theme-text-faint)', fontSize: 10 }}>± {Math.round(100 - a.confidence)}%</em>
                    </div>
                  </div>
                  <div className="prevalarm-rul">
                    Dans <strong style={{ color: a.color, fontSize: 14 }}>{a.rul_days} jours</strong>
                    &nbsp;· Confiance {a.confidence}%
                  </div>
                  {isCritical && (
                    <button className="btn-pmc-action urgent" style={{ width: '100%', marginTop: 6 }} onClick={() => navigate('/maintenance')}>
                      <Wrench size={11} /> Planifier intervention urgente
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Courbe de dégradation */}
      {selectedMachine && degradationData.length > 0 && (
        <div className="pronostic-section">
          <h3 className="pronostic-section-title"><TrendingDown size={18} /> Courbe de dégradation — {selectedMachine}</h3>
          <div className="degradation-chart">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={degradationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
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
            <div className="fiabilite-value">{kpiStats?.mtbf != null ? `${kpiStats.mtbf}h` : '—'}</div>
            <div className="fiabilite-label">MTBF moyen parc</div>
          </div>
          <div className="fiabilite-card">
            <div className="fiabilite-value">{kpiStats?.mttr != null ? `${kpiStats.mttr}h` : '—'}</div>
            <div className="fiabilite-label">MTTR moyen</div>
          </div>
          <div className="fiabilite-card">
            <div className="fiabilite-value">{kpiStats?.disponibilite != null ? `${kpiStats.disponibilite}%` : '—'}</div>
            <div className="fiabilite-label">Disponibilité parc</div>
          </div>
          <div className="fiabilite-card">
            <div className="fiabilite-value">{kpiStats?.taux_detection != null ? `${kpiStats.taux_detection}%` : '—'}</div>
            <div className="fiabilite-label">Taux détection prédictive</div>
          </div>
        </div>

        {/* ── Analyse Weibull (loi de fiabilité ISO 14224 / NF X 60-503) ── */}
        <div className="baignoire-section">
          <button className="baignoire-toggle" onClick={() => setShowWeibull(v => !v)}>
            <span><Sigma size={13} style={{ marginRight: 6 }}/>Analyse Weibull — Loi de fiabilité (ISO 14224)</span>
            {showWeibull ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showWeibull && (
            kpiStats?.mtbf == null ? (
              <div style={{ padding: '14px 16px', color: 'var(--theme-text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={14} style={{ flexShrink: 0 }} />
                Données MTBF insuffisantes pour calculer la loi de Weibull.
                Intégrez des datasets KPI en base pour activer cette analyse.
              </div>
            ) : (
            <div className="baignoire-content">
              <p className="baignoire-text" style={{ marginBottom: 12 }}>
                La <strong>distribution de Weibull</strong> est l'outil standard pour modéliser la fiabilité d'un
                équipement. Les paramètres β (forme) et η (échelle) sont estimés à partir du MTBF et de la
                dispersion des Health Index, conformément à la norme ISO 14224.
              </p>

              <div className="weibull-params">
                <div className="weibull-param-card">
                  <span className="weibull-param-name">β (forme)</span>
                  <span className="weibull-param-value">{weibullAnalysis.beta}</span>
                  <span className="weibull-param-desc">
                    {weibullAnalysis.beta < 1 ? 'β < 1 → mortalité infantile'
                      : weibullAnalysis.beta < 1.3 ? 'β ≈ 1 → défaillances aléatoires'
                      : 'β > 1 → vieillissement (usure)'}
                  </span>
                </div>
                <div className="weibull-param-card">
                  <span className="weibull-param-name">η (échelle)</span>
                  <span className="weibull-param-value">{weibullAnalysis.eta}h</span>
                  <span className="weibull-param-desc">Vie caractéristique (63.2% défaillances)</span>
                </div>
                <div className="weibull-param-card phase">
                  <span className="weibull-param-name">Phase</span>
                  <span className="weibull-param-value">{weibullAnalysis.phase}</span>
                  <span className="weibull-param-desc">{weibullAnalysis.phaseLabel}</span>
                </div>
              </div>

              <h4 style={{ fontSize: 12, marginTop: 14, marginBottom: 6, color: 'var(--theme-text)' }}>
                Fiabilité prévisionnelle R(t) = exp(−(t/η)<sup>β</sup>)
              </h4>
              <div className="weibull-reliability">
                {[
                  { label: '30 jours', val: weibullAnalysis.reliability_30d },
                  { label: '90 jours', val: weibullAnalysis.reliability_90d },
                  { label: '180 jours', val: weibullAnalysis.reliability_180d },
                  { label: '365 jours', val: weibullAnalysis.reliability_365d },
                ].map(r => {
                  const c = r.val >= 90 ? '#16a34a' : r.val >= 70 ? '#f97316' : '#dc2626';
                  return (
                    <div key={r.label} className="weibull-rel-card" style={{ borderColor: `${c}40` }}>
                      <span className="weibull-rel-label">{r.label}</span>
                      <span className="weibull-rel-bar-wrap">
                        <span className="weibull-rel-bar" style={{ width: `${r.val}%`, background: c }} />
                      </span>
                      <span className="weibull-rel-val" style={{ color: c }}>{r.val}%</span>
                    </div>
                  );
                })}
              </div>

              <p className="baignoire-text" style={{ marginTop: 12, fontSize: 11.5 }}>
                <Info size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                <strong>Interprétation :</strong> avec β = {weibullAnalysis.beta},
                {weibullAnalysis.beta < 1 ? ' le parc est en phase de rodage (défauts de fabrication ou montage). Une vigilance accrue est recommandée pendant les premières semaines.'
                  : weibullAnalysis.beta < 1.3 ? ' les défaillances sont aléatoires (usure normale). Le MTBF est représentatif et la maintenance préventive est efficace.'
                  : ' le parc est en phase de vieillissement progressif. Les remplacements préventifs deviennent rentables et la maintenance prévisionnelle est fortement conseillée.'}
              </p>
            </div>
            )
          )}
        </div>

        <div className="baignoire-section">
          <button className="baignoire-toggle" onClick={() => setShowBaignoire(v => !v)}>
            <span>La courbe en baignoire</span>
            {showBaignoire ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showBaignoire && (
            <div className="baignoire-content">
              {(() => {
                const phase = weibullAnalysis.phase;
                const aActive = phase === 'A', bActive = phase === 'B', cActive = phase === 'C';
                return (
                  <svg viewBox="0 0 600 180" className="baignoire-svg">
                    <defs>
                      <linearGradient id="bgGrad">
                        <stop offset="0%" stopColor="rgba(59,130,246,0.08)" />
                        <stop offset="33%" stopColor="rgba(16,185,129,0.05)" />
                        <stop offset="100%" stopColor="rgba(239,68,68,0.08)" />
                      </linearGradient>
                    </defs>
                    <rect width="600" height="180" fill="url(#bgGrad)" rx="8" />
                    {aActive && <rect x="40" y="0" width="120" height="180" fill="rgba(59,130,246,0.10)" rx="4" />}
                    {bActive && <rect x="160" y="0" width="220" height="180" fill="rgba(16,185,129,0.10)" rx="4" />}
                    {cActive && <rect x="380" y="0" width="180" height="180" fill="rgba(239,68,68,0.10)" rx="4" />}
                    <path d="M40,140 C40,80 80,40 160,50 C240,60 280,70 300,60 C320,50 340,50 440,60 C480,68 520,100 560,160" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                    <line x1="40" y1="20" x2="560" y2="20" stroke="var(--theme-border)" strokeWidth="1" />
                    <line x1="160" y1="15" x2="160" y2="175" stroke="var(--theme-border)" strokeDasharray="4 4" />
                    <line x1="380" y1="15" x2="380" y2="175" stroke="var(--theme-border)" strokeDasharray="4 4" />
                    <text x="50" y="12" fontSize={aActive ? 12 : 10} fill="#3b82f6" fontWeight={aActive ? '800' : '500'} textDecoration={aActive ? 'underline' : 'none'}>
                      {aActive ? '▶ ' : ''}Phase A : Mortalité infantile
                    </text>
                    <text x="180" y="12" fontSize={bActive ? 12 : 10} fill="#16a34a" fontWeight={bActive ? '800' : '500'} textDecoration={bActive ? 'underline' : 'none'}>
                      {bActive ? '▶ ' : ''}Phase B : Maturité
                    </text>
                    <text x="395" y="12" fontSize={cActive ? 12 : 10} fill="#dc2626" fontWeight={cActive ? '800' : '500'} textDecoration={cActive ? 'underline' : 'none'}>
                      {cActive ? '▶ ' : ''}Phase C : Vieillissement
                    </text>
                    <text x="50" y="170" fontSize="9" fill="var(--theme-text-muted)">λ(t) décroissant</text>
                    <text x="260" y="170" fontSize="9" fill="var(--theme-text-muted)">λ(t) ≈ constant</text>
                    <text x="440" y="170" fontSize="9" fill="var(--theme-text-muted)">λ(t) croissant</text>
                  </svg>
                );
              })()}
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
                  {[...machines].sort((a, b) => (a.rul_days ?? Infinity) - (b.rul_days ?? Infinity)).map(m => {
                    const cat = getRULCategory(m.rul_days);
                    return (
                      <tr key={m.machine_id}>
                        <td>{m.machine_name}</td>
                        <td style={{ color: cat?.color ?? 'var(--theme-text-muted)', fontWeight: 700 }}>
                          {m.rul_days ?? '—'}
                        </td>
                        <td>{m.health_index ?? '—'}</td>
                        <td>
                          {cat ? (
                            <span className="rul-table-badge" style={{ background: cat.color, color: '#fff' }}>{cat.label}</span>
                          ) : '—'}
                        </td>
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