// src/pages/Donnees/components/VueGenerale.tsx
// Vue Générale — rapport EDA complet sur une seule page (13 sections + synthèse exécutive)

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  Shield,
  Sparkles,
  Table2,
  Target,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import { API, DatasetFull, EDAFrame, useDatasets } from '../../../contexts/DatasetContext';
import IncompatibleDatasetMessage from './IncompatibleDatasetMessage';

const TYPE_LABELS: Record<string, string> = {
  vibration: 'Vibratoire',
  kpi: 'KPI',
  maintenance: 'Maintenance',
  machine: 'Machine',
  generic: 'Générique',
};

const TYPE_COLORS: Record<string, string> = {
  vibration: '#7c3aed',
  kpi: '#0891b2',
  maintenance: '#b45309',
  machine: '#16a34a',
  generic: 'var(--theme-text-muted)',
};

const EDA_STEPS = [
  'Parsing du fichier',
  'Détection du type',
  'Analyse statistique',
  'Contrôle qualité',
  'Prétraitement',
  'Génération graphiques',
  'Narration IA',
  'Génération rapport PDF',
];

const SECTIONS = [
  { id: 'sec-exec',        label: 'Synthèse exécutive', icon: Sparkles },
  { id: 'sec-resume',      label: '1. Résumé',          icon: Database },
  { id: 'sec-audit',       label: '2. Audit qualité',   icon: Shield },
  { id: 'sec-kpis',        label: '3. KPIs',            icon: TrendingUp },
  { id: 'sec-rul',         label: '4. Pronostic RUL',   icon: Clock },
  { id: 'sec-univarie',    label: '5. Analyse univariée', icon: Activity },
  { id: 'sec-bivarie',     label: '6. Corrélations',    icon: GitBranch },
  { id: 'sec-temporel',    label: '7. Temporel',        icon: Clock },
  { id: 'sec-diagnostic',  label: '8. Diagnostic',      icon: Target },
  { id: 'sec-alertes',     label: '9. Alertes',         icon: AlertTriangle },
  { id: 'sec-cleaning',    label: '10. Cleaning',       icon: Workflow },
  { id: 'sec-ml',          label: '11. Recommandations ML', icon: BrainCircuit },
  { id: 'sec-limites',     label: '12. Limites',        icon: Info },
  { id: 'sec-annexes',     label: '13. Annexes',        icon: BookOpen },
];

/* ─── Sous-composants utilitaires ───────────────────────────── */
const SectionTitle: React.FC<{ id: string; icon: React.ElementType; children: React.ReactNode }> = ({ id, icon: Icon, children }) => (
  <h2 id={id} className="vg-section-title">
    <Icon size={18} />
    <span>{children}</span>
  </h2>
);

const Subtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="vg-subtitle">{children}</h3>
);

const Narration: React.FC<{ text?: string }> = ({ text }) => {
  if (!text) return null;
  return (
    <div className="vg-narration">
      <BrainCircuit size={13} className="vg-narration-icon" />
      <div className="vg-narration-body">
        {text.split(/\n\n+/).map((par, i) => <p key={i}>{par.trim()}</p>)}
      </div>
    </div>
  );
};

const PlotInline: React.FC<{ plot?: { title: string; b64: string }; onZoom?: (b64: string) => void }> = ({ plot, onZoom }) => {
  if (!plot) return null;
  return (
    <figure className="vg-plot-figure" onClick={() => onZoom?.(plot.b64)}>
      <img src={`data:image/png;base64,${plot.b64}`} alt={plot.title} className="vg-plot-img" />
      <figcaption className="vg-plot-caption">
        <ImageIcon size={11} /> {plot.title}
      </figcaption>
    </figure>
  );
};

const AlertCard: React.FC<{ alert: { level: string; title: string; impact?: string; action?: string } }> = ({ alert }) => (
  <div className={`vg-alert vg-alert-${alert.level}`}>
    <div className="vg-alert-header">
      <span className="vg-alert-badge">{alert.level === 'critical' ? 'CRITIQUE' : alert.level === 'warning' ? 'ATTENTION' : 'INFO'}</span>
      <span className="vg-alert-title">{alert.title}</span>
    </div>
    {alert.impact && <div className="vg-alert-line"><strong>Impact :</strong> {alert.impact}</div>}
    {alert.action && <div className="vg-alert-line"><strong>Action :</strong> {alert.action}</div>}
  </div>
);

const KV: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="vg-kv">
    <span className="vg-kv-label">{label}</span>
    <span className="vg-kv-value">{value}</span>
  </div>
);

/* ─── Component principal ──────────────────────────────────── */
const VueGenerale: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, selectedId, selectedDataset, loadingSelected } = useDatasets();
  const [preview, setPreview] = useState<{ columns: string[]; rows: (string | number | null)[][] } | null>(null);
  const [loadingPreview, setLP] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [expandedCol, setExpandedCol] = useState<string | null>(null);
  const [simulatedStep, setSimulatedStep] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<string>('sec-exec');

  // IMPORTANT : le dataset complet (avec eda_results) vient de `selectedDataset` (fetch /datasets/{id}).
  // La liste `datasets` ne contient que les métadonnées (sans eda_results) → l'utiliser ici rendrait
  // `frame` toujours undefined et la page afficherait « Résultats EDA non disponibles ».
  const dataset: DatasetFull | null =
    selectedDataset && selectedDataset.id === selectedId ? selectedDataset : null;

  const frame: EDAFrame | undefined = dataset?.eda_results?.[0];

  // Simulation des étapes pendant le traitement
  useEffect(() => {
    if (!dataset || dataset.status !== 'processing') {
      setSimulatedStep(0);
      return;
    }
    const interval = setInterval(() => {
      setSimulatedStep(s => (s >= EDA_STEPS.length - 1 ? s : s + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [dataset?.status]);

  // Charger l'aperçu après processed
  useEffect(() => {
    if (dataset && dataset.status === 'processed' && !preview) {
      setLP(true);
      fetch(`${API}/api/donnees/datasets/${dataset.id}/preview`)
        .then(r => r.json())
        .then(d => setPreview(d))
        .catch(() => setPreviewError(true))
        .finally(() => setLP(false));
    }
  }, [dataset?.id, dataset?.status]);

  // Suivi de l'anchor visible (scroll spy)
  useEffect(() => {
    if (!frame) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveAnchor(e.target.id);
        });
      },
      { rootMargin: '-30% 0px -65% 0px' }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [frame]);

  /* ── États préliminaires ── */
  if (!selectedId && datasets.length === 0) {
    return (
      <div className="vg-page">
        <div className="vg-empty-state">
          <Table2 size={48} color="#f97316" />
          <h2>Aucun dataset sélectionné</h2>
          <p>Uploadez un dataset depuis la page Chargement pour visualiser son analyse.</p>
          <button className="vg-cta" onClick={() => navigate('/donnees?tab=chargement')}>
            Aller au Chargement
          </button>
        </div>
      </div>
    );
  }

  if (!dataset || loadingSelected) {
    return (
      <div className="vg-page">
        <div className="vg-loading"><Loader2 size={24} className="spin" /> Chargement du dataset...</div>
      </div>
    );
  }

  if (dataset.detected_type && !['kpi', 'vibration', 'maintenance', 'machine', 'generic'].includes(dataset.detected_type)) {
    return (
      <div className="vg-page">
        <IncompatibleDatasetMessage page="Vue Générale" datasetName={dataset.name} />
      </div>
    );
  }

  if (dataset.status === 'uploaded' || dataset.status === 'processing') {
    return (
      <div className="vg-page">
        <div className="vg-processing">
          <div className="vg-processing-header">
            <Loader2 size={20} className="spin" color="#f97316" />
            <span>L'agent EDA analyse votre dataset...</span>
          </div>
          <div className="vg-steps-list">
            {EDA_STEPS.map((step, i) => {
              const done = i <= simulatedStep;
              const current = i === simulatedStep + 1;
              return (
                <div key={step} className={`vg-step${done ? ' done' : ''}${current ? ' current' : ''}`}>
                  {done ? <CheckCircle2 size={16} color="#16a34a" /> :
                    current ? <Loader2 size={14} className="spin" color="#f97316" /> :
                    <div className="vg-step-empty" />}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (dataset.status === 'error') {
    return (
      <div className="vg-page">
        <div className="vg-error">
          <AlertTriangle size={20} color="#dc2626" />
          <strong>Erreur lors de l'analyse EDA</strong>
          {dataset.error_message && <pre>{dataset.error_message}</pre>}
        </div>
      </div>
    );
  }

  if (!frame) {
    return <div className="vg-page"><div className="vg-empty">Résultats EDA non disponibles.</div></div>;
  }

  /* ── Données ── */
  const {
    summary, llm_result, plots, encoding_maps, quality_score, pipeline_trace,
    kpis, rul_info, alerts, iso_25012, vif_info, anomalies_iso,
    stationarity, temporal_trend, exec_summary,
  } = frame;

  const plotsBySection: Record<string, { title: string; b64: string }> = {};
  plots.forEach(p => { if (p.section) plotsBySection[p.section] = p; });

  const qualityColor = (s?: number) => s == null ? 'var(--theme-text-muted)' : s >= 85 ? '#16a34a' : s >= 70 ? '#65a30d' : s >= 50 ? '#f97316' : '#dc2626';
  const qualityLabel = (s?: number) => s == null ? '—' : s >= 85 ? 'Excellent' : s >= 70 ? 'Bon' : s >= 50 ? 'Acceptable' : 'Insuffisant';

  const readiness = exec_summary?.readiness || '';
  const readinessColor =
    readiness.startsWith('OUI') && !readiness.toLowerCase().includes('reserves') ? '#16a34a' :
    readiness.startsWith('OUI') ? '#f97316' :
    readiness.startsWith('NON') ? '#dc2626' : 'var(--theme-text-muted)';

  const criticalAlerts = (alerts || []).filter(a => a.level === 'critical');
  const warningAlerts = (alerts || []).filter(a => a.level === 'warning');
  const infoAlerts = (alerts || []).filter(a => a.level === 'info');

  const hasTemporal = !!(plotsBySection['time_series'] || plotsBySection['acf'] ||
                         (stationarity && Object.keys(stationarity).length > 0) ||
                         (temporal_trend && Object.keys(temporal_trend).length > 0));

  const diagPlots = (() => {
    if (frame.data_type === 'vibration') {
      return ['vrms_trend', 'crest_kurtosis', 'iso_zones', 'vrms_par_machine']
        .filter(k => plotsBySection[k])
        .map(k => plotsBySection[k]);
    }
    if (frame.data_type === 'maintenance' || frame.data_type === 'machine') {
      return ['pareto'].filter(k => plotsBySection[k]).map(k => plotsBySection[k]);
    }
    return [];
  })();

  /* ── RENDU ── */
  return (
    <div className="vg-page">
      {/* Lightbox */}
      {lightboxImg && (
        <div className="vg-lightbox" onClick={() => setLightboxImg(null)}>
          <img src={`data:image/png;base64,${lightboxImg}`} alt="Graphique" onClick={e => e.stopPropagation()} />
          <button className="vg-lightbox-close" onClick={() => setLightboxImg(null)}>×</button>
        </div>
      )}

      <div className="vg-layout">
        {/* TOC sticky */}
        <nav className="vg-toc" aria-label="Sommaire">
          <div className="vg-toc-title">Sommaire</div>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`vg-toc-link${activeAnchor === s.id ? ' active' : ''}`}
                onClick={e => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <Icon size={13} />
                <span>{s.label}</span>
              </a>
            );
          })}
          <div className="vg-toc-downloads">
            <a href={`${API}/api/donnees/datasets/${dataset.id}/download/report`} target="_blank" rel="noreferrer" className="vg-toc-dl">
              <FileText size={12} /> Rapport PDF
            </a>
            <a href={`${API}/api/donnees/datasets/${dataset.id}/download/processed`} target="_blank" rel="noreferrer" className="vg-toc-dl">
              <Download size={12} /> CSV propre
            </a>
          </div>
        </nav>

        <main className="vg-content">
          {/* En-tête */}
          <header className="vg-header">
            <div className="vg-header-top">
              <div>
                <h1 className="vg-h1">
                  <BrainCircuit size={20} color="#f97316" />
                  Rapport EDA — <em>{dataset.name}</em>
                </h1>
                <div className="vg-header-meta">
                  <span className="vg-badge" style={{ background: `${TYPE_COLORS[frame.data_type]}18`, color: TYPE_COLORS[frame.data_type] }}>
                    {TYPE_LABELS[frame.data_type] || frame.data_type}
                  </span>
                  <span>{summary.n_rows.toLocaleString()} lignes</span>
                  <span>×</span>
                  <span>{summary.n_cols} colonnes</span>
                </div>
              </div>
              {quality_score != null && (
                <div className="vg-quality-card">
                  <div className="vg-quality-num" style={{ color: qualityColor(quality_score) }}>{quality_score}<small>/100</small></div>
                  <div className="vg-quality-label" style={{ color: qualityColor(quality_score) }}>{qualityLabel(quality_score)}</div>
                  <div className="vg-quality-sub">Score qualité global</div>
                </div>
              )}
            </div>
            {readiness && (
              <div className="vg-readiness" style={{ background: readinessColor }}>
                <CheckCircle2 size={16} />
                Prêt pour entraînement : <strong>{readiness}</strong>
                {exec_summary?.readiness_reason && <em> — {exec_summary.readiness_reason}</em>}
              </div>
            )}
          </header>

          {/* ══ SECTION 0 — SYNTHÈSE EXÉCUTIVE ══ */}
          <section className="vg-section">
            <SectionTitle id="sec-exec" icon={Sparkles}>Synthèse exécutive</SectionTitle>
            <Narration text={llm_result.executive_summary} />

            {exec_summary && (exec_summary.urgent_actions || exec_summary.short_term_actions || exec_summary.medium_term_actions) && (
              <>
                <Subtitle>Décisions prioritaires</Subtitle>
                <div className="vg-decisions">
                  {exec_summary.urgent_actions && exec_summary.urgent_actions.length > 0 && (
                    <div className="vg-decision-block vg-decision-urgent">
                      <div className="vg-decision-tag">URGENT (24-48h)</div>
                      <ul>{exec_summary.urgent_actions.slice(0, 3).map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  )}
                  {exec_summary.short_term_actions && exec_summary.short_term_actions.length > 0 && (
                    <div className="vg-decision-block vg-decision-short">
                      <div className="vg-decision-tag">COURT TERME (1 sem.)</div>
                      <ul>{exec_summary.short_term_actions.slice(0, 3).map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  )}
                  {exec_summary.medium_term_actions && exec_summary.medium_term_actions.length > 0 && (
                    <div className="vg-decision-block vg-decision-medium">
                      <div className="vg-decision-tag">MOYEN TERME (1 mois)</div>
                      <ul>{exec_summary.medium_term_actions.slice(0, 3).map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ══ SECTION 1 — RÉSUMÉ DU DATASET ══ */}
          <section className="vg-section">
            <SectionTitle id="sec-resume" icon={Database}>1. Résumé du dataset</SectionTitle>
            <div className="vg-kv-grid">
              <KV label="Source" value={dataset.name} />
              <KV label="Type détecté" value={TYPE_LABELS[frame.data_type] || frame.data_type} />
              <KV label="Lignes" value={summary.n_rows.toLocaleString()} />
              <KV label="Colonnes" value={summary.n_cols} />
              <KV label="Variables numériques" value={summary.n_numeric} />
              <KV label="Variables catégorielles" value={summary.n_categorical} />
              <KV label="Valeurs manquantes" value={`${summary.missing_total} (${summary.missing_pct}%)`} />
              <KV label="Doublons" value={summary.duplicates} />
              <KV label="Score qualité" value={`${quality_score}/100 ${qualityLabel(quality_score)}`} />
            </div>
          </section>

          {/* ══ SECTION 2 — AUDIT QUALITÉ ══ */}
          <section className="vg-section">
            <SectionTitle id="sec-audit" icon={Shield}>2. Audit qualité des données</SectionTitle>

            {iso_25012 && Object.keys(iso_25012).length > 0 && (
              <>
                <Subtitle>Décomposition ISO/IEC 25012:2008</Subtitle>
                <div className="vg-iso-grid">
                  {Object.entries(iso_25012).map(([dim, info]) => (
                    <div key={dim} className="vg-iso-card">
                      <div className="vg-iso-dim">{dim.charAt(0).toUpperCase() + dim.slice(1)}</div>
                      <div className="vg-iso-score" style={{ color: info.score >= 17 ? '#16a34a' : info.score >= 12 ? '#f97316' : '#dc2626' }}>
                        {info.score}<small>/{info.max}</small>
                      </div>
                      <div className="vg-iso-ref">{info.ref}</div>
                      <div className="vg-iso-detail">{info.detail}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {plotsBySection['missing_values'] && (
              <>
                <Subtitle>Valeurs manquantes par colonne</Subtitle>
                <PlotInline plot={plotsBySection['missing_values']} onZoom={setLightboxImg} />
              </>
            )}
            <Narration text={llm_result.quality_audit} />
          </section>

          {/* ══ SECTION 3 — KPIs ══ */}
          {kpis && Object.keys(kpis).length > 0 && (
            <section className="vg-section">
              <SectionTitle id="sec-kpis" icon={TrendingUp}>3. Indicateurs de performance</SectionTitle>
              <div className="vg-table-wrap">
                <table className="vg-table">
                  <thead><tr><th>Indicateur</th><th>Valeur</th><th>Unité</th><th>Source</th></tr></thead>
                  <tbody>
                    {Object.entries(kpis).map(([k, v]) => (
                      <tr key={k}>
                        <td><strong>{k.toUpperCase().replace('_', ' ')}</strong></td>
                        <td className="vg-num">{v.value}</td>
                        <td>{v.unit}</td>
                        <td className="vg-faint">{v.source_col}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="vg-refs">Références : ISO 13306:2017, EN 15341:2019</div>
            </section>
          )}

          {/* ══ SECTION 4 — PRONOSTIC RUL ══ */}
          {rul_info && Object.keys(rul_info).length > 0 && (
            <section className="vg-section">
              <SectionTitle id="sec-rul" icon={Clock}>4. Pronostic — RUL / Durée de vie restante</SectionTitle>
              <div className="vg-kv-grid">
                {rul_info.rul_mean != null && <KV label="RUL moyen (h)" value={rul_info.rul_mean} />}
                {rul_info.rul_min != null && <KV label="RUL minimum (h)" value={rul_info.rul_min} />}
                {rul_info.rul_max != null && <KV label="RUL maximum (h)" value={rul_info.rul_max} />}
                {rul_info.health_index_mean != null && <KV label="Health Index moyen" value={rul_info.health_index_mean} />}
                {rul_info.health_index_min != null && <KV label="Health Index min" value={rul_info.health_index_min} />}
                {rul_info.degradation_rate != null && <KV label="Taux dégradation" value={rul_info.degradation_rate} />}
                {rul_info.pct_critical != null && <KV label="% parc critique" value={`${rul_info.pct_critical}%`} />}
                {rul_info.reliability_rt != null && <KV label="Fiabilité R(t)" value={rul_info.reliability_rt} />}
              </div>
              {plotsBySection['rul_distribution'] && <PlotInline plot={plotsBySection['rul_distribution']} onZoom={setLightboxImg} />}
              {plotsBySection['health_vs_rul'] && <PlotInline plot={plotsBySection['health_vs_rul']} onZoom={setLightboxImg} />}
            </section>
          )}

          {/* ══ SECTION 5 — ANALYSE UNIVARIÉE ══ */}
          <section className="vg-section">
            <SectionTitle id="sec-univarie" icon={Activity}>5. Analyse univariée détaillée</SectionTitle>

            {plotsBySection['categoricals'] && (<><Subtitle>5.1 Variables catégorielles</Subtitle><PlotInline plot={plotsBySection['categoricals']} onZoom={setLightboxImg} /></>)}
            {plotsBySection['distributions'] && (<><Subtitle>5.2 Distributions numériques</Subtitle><PlotInline plot={plotsBySection['distributions']} onZoom={setLightboxImg} /></>)}
            {plotsBySection['boxplots'] && (<><Subtitle>5.3 Outliers (méthode IQR)</Subtitle><PlotInline plot={plotsBySection['boxplots']} onZoom={setLightboxImg} /></>)}

            {anomalies_iso && (anomalies_iso.n_anomalies ?? 0) > 0 && (
              <>
                <Subtitle>5.4 Anomalies multidimensionnelles (Isolation Forest)</Subtitle>
                <div className="vg-kv-grid vg-kv-compact">
                  <KV label="Anomalies détectées" value={`${anomalies_iso.n_anomalies} (${anomalies_iso.pct_anomalies}%)`} />
                  <KV label="Features utilisées" value={anomalies_iso.n_features} />
                  <KV label="Contamination cible" value={anomalies_iso.contamination} />
                </div>
                {plotsBySection['iso_forest_2d'] && <PlotInline plot={plotsBySection['iso_forest_2d']} onZoom={setLightboxImg} />}
              </>
            )}
            <Narration text={llm_result.univariate_insights} />

            <Subtitle>Détail par colonne ({summary.columns.length})</Subtitle>
            <div className="vg-table-wrap">
              <table className="vg-table vg-table-cols">
                <thead>
                  <tr>
                    <th>Colonne</th><th>Type</th><th>Manquants</th><th>Uniques</th>
                    <th>Statistiques</th><th>Outliers IQR</th><th>Skewness</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.columns.map(col => (
                    <React.Fragment key={col.name}>
                      <tr className={`vg-col-row${expandedCol === col.name ? ' expanded' : ''}`}
                          onClick={() => setExpandedCol(expandedCol === col.name ? null : col.name)}>
                        <td><strong>{col.name}</strong></td>
                        <td><span className={`vg-col-type ${col.type}`}>{col.type}</span></td>
                        <td className={col.missing_pct > 20 ? 'vg-warn' : col.missing_pct > 0 ? 'vg-caution' : 'vg-ok'}>
                          {col.missing} ({col.missing_pct}%)
                        </td>
                        <td>{col.unique}</td>
                        <td className="vg-faint">
                          {col.type === 'numeric'
                            ? <>min {col.min} · moy {col.mean} · max {col.max}</>
                            : Object.keys(col.top_values || {}).slice(0, 3).join(', ')}
                        </td>
                        <td>
                          {col.type === 'numeric' && col.n_outliers != null ? (
                            <span className={(col.outlier_pct ?? 0) > 10 ? 'vg-warn' : (col.outlier_pct ?? 0) > 5 ? 'vg-caution' : 'vg-ok'}>
                              {col.n_outliers} ({col.outlier_pct}%)
                            </span>
                          ) : <span className="vg-faint">—</span>}
                        </td>
                        <td>
                          {col.type === 'numeric' && col.skewness != null ? (
                            <span className={Math.abs(col.skewness) > 2 ? 'vg-warn' : Math.abs(col.skewness) > 1 ? 'vg-caution' : 'vg-ok'}>
                              {col.skewness > 0 ? '+' : ''}{col.skewness}
                            </span>
                          ) : <span className="vg-faint">—</span>}
                        </td>
                      </tr>
                      {expandedCol === col.name && (
                        <tr className="vg-col-expanded">
                          <td colSpan={7}>
                            {col.type === 'numeric' && (
                              <div className="vg-chips">
                                {col.skewness != null && <span className="vg-chip">Skew {col.skewness > 0 ? '+' : ''}{col.skewness} ({Math.abs(col.skewness) > 2 ? 'Très asym.' : Math.abs(col.skewness) > 1 ? 'Asym.' : 'Sym.'})</span>}
                                {col.kurtosis != null && <span className="vg-chip">Kurtosis {col.kurtosis > 0 ? '+' : ''}{col.kurtosis}</span>}
                                {col.q25 != null && <span className="vg-chip">Q1 {col.q25}</span>}
                                {col.q75 != null && <span className="vg-chip">Q3 {col.q75}</span>}
                                {col.std != null && <span className="vg-chip">σ {col.std}</span>}
                                {col.n_outliers != null && col.n_outliers > 0 && (
                                  <span className="vg-chip vg-chip-warn">
                                    {col.n_outliers} outliers ({col.outlier_pct}%) → {(col.outlier_pct ?? 0) > 10 ? 'RobustScaler' : 'StandardScaler'}
                                  </span>
                                )}
                              </div>
                            )}
                            {col.type === 'categorical' && col.top_values && (
                              <div className="vg-chips">
                                {Object.entries(col.top_values).map(([k, v]) => (
                                  <span key={k} className="vg-chip">{k} <em>{v}</em></span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ══ SECTION 6 — BIVARIÉE & CORRÉLATIONS ══ */}
          {(plotsBySection['correlation_pearson'] || plotsBySection['correlation_spearman'] || vif_info) && (
            <section className="vg-section">
              <SectionTitle id="sec-bivarie" icon={GitBranch}>6. Analyse bivariée et corrélations</SectionTitle>
              {plotsBySection['correlation_pearson'] && (<><Subtitle>6.1 Corrélation de Pearson (linéaire)</Subtitle><PlotInline plot={plotsBySection['correlation_pearson']} onZoom={setLightboxImg} /></>)}
              {plotsBySection['correlation_spearman'] && (<><Subtitle>6.2 Corrélation de Spearman (monotone)</Subtitle><PlotInline plot={plotsBySection['correlation_spearman']} onZoom={setLightboxImg} /></>)}

              {vif_info && vif_info.length > 0 && (
                <>
                  <Subtitle>6.3 Multicolinéarité (VIF)</Subtitle>
                  {plotsBySection['vif'] && <PlotInline plot={plotsBySection['vif']} onZoom={setLightboxImg} />}
                  <div className="vg-table-wrap">
                    <table className="vg-table">
                      <thead><tr><th>Colonne</th><th>VIF</th><th>R²</th><th>Verdict</th></tr></thead>
                      <tbody>
                        {vif_info.slice(0, 15).map((v, i) => (
                          <tr key={i}>
                            <td><strong>{v.name}</strong></td>
                            <td className={v.vif > 10 ? 'vg-warn' : v.vif > 5 ? 'vg-caution' : 'vg-ok'}>{v.vif}</td>
                            <td className="vg-faint">{v.r2 ?? '—'}</td>
                            <td className={v.vif > 10 ? 'vg-warn' : v.vif > 5 ? 'vg-caution' : 'vg-ok'}>{v.verdict}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <Narration text={llm_result.bivariate_insights} />
            </section>
          )}

          {/* ══ SECTION 7 — TEMPOREL ══ */}
          {hasTemporal && (
            <section className="vg-section">
              <SectionTitle id="sec-temporel" icon={Clock}>7. Analyse temporelle</SectionTitle>
              {plotsBySection['time_series'] && (<><Subtitle>7.1 Séries temporelles</Subtitle><PlotInline plot={plotsBySection['time_series']} onZoom={setLightboxImg} /></>)}

              {temporal_trend && Object.keys(temporal_trend).length > 0 && (
                <>
                  <Subtitle>7.2 Tendance détectée</Subtitle>
                  <div className="vg-kv-grid vg-kv-compact">
                    <KV label="Direction" value={temporal_trend.trend || '—'} />
                    <KV label="Pente / jour" value={temporal_trend.slope_per_day ?? '—'} />
                    <KV label="Valeur actuelle" value={temporal_trend.current_value ?? '—'} />
                    <KV label="Date actuelle" value={temporal_trend.current_date || '—'} />
                    {temporal_trend.days_to_zone_c && <KV label="→ Zone C" value={`${temporal_trend.days_to_zone_c} jours (${temporal_trend.date_zone_c})`} />}
                    {temporal_trend.days_to_zone_d && <KV label="→ Zone D" value={`${temporal_trend.days_to_zone_d} jours (${temporal_trend.date_zone_d})`} />}
                  </div>
                </>
              )}

              {stationarity && Object.keys(stationarity).length > 0 && (
                <>
                  <Subtitle>7.3 Stationnarité</Subtitle>
                  <div className={`vg-stationarity ${stationarity.is_stationary ? 'ok' : 'warn'}`}>
                    <strong>{stationarity.verdict}</strong>
                    <div className="vg-stationarity-detail">
                      Variation moyenne : {stationarity.mean_variation_pct}% · Variation écart-type : {stationarity.std_variation_pct}%
                    </div>
                  </div>
                </>
              )}

              {plotsBySection['acf'] && (<><Subtitle>7.4 Autocorrélation (ACF)</Subtitle><PlotInline plot={plotsBySection['acf']} onZoom={setLightboxImg} /></>)}
              <Narration text={llm_result.temporal_insights} />
            </section>
          )}

          {/* ══ SECTION 8 — DIAGNOSTIC SPÉCIFIQUE ══ */}
          {diagPlots.length > 0 && (
            <section className="vg-section">
              <SectionTitle id="sec-diagnostic" icon={Target}>8. Diagnostic spécifique — {TYPE_LABELS[frame.data_type]}</SectionTitle>
              {diagPlots.map((p, i) => <PlotInline key={i} plot={p} onZoom={setLightboxImg} />)}
              <Narration text={llm_result.diagnostic_insights} />
            </section>
          )}

          {/* ══ SECTION 9 — ALERTES ══ */}
          {(alerts && alerts.length > 0) && (
            <section className="vg-section">
              <SectionTitle id="sec-alertes" icon={AlertTriangle}>9. Anomalies et alertes critiques</SectionTitle>
              {criticalAlerts.length > 0 && (
                <>
                  <Subtitle>Critiques ({criticalAlerts.length})</Subtitle>
                  {criticalAlerts.map((a, i) => <AlertCard key={i} alert={a} />)}
                </>
              )}
              {warningAlerts.length > 0 && (
                <>
                  <Subtitle>Avertissements ({warningAlerts.length})</Subtitle>
                  {warningAlerts.map((a, i) => <AlertCard key={i} alert={a} />)}
                </>
              )}
              {infoAlerts.length > 0 && (
                <>
                  <Subtitle>Informations ({infoAlerts.length})</Subtitle>
                  {infoAlerts.map((a, i) => <AlertCard key={i} alert={a} />)}
                </>
              )}
            </section>
          )}

          {/* ══ SECTION 10 — CLEANING ══ */}
          <section className="vg-section">
            <SectionTitle id="sec-cleaning" icon={Workflow}>10. Cleaning et préparation</SectionTitle>
            <Narration text={llm_result.preprocessing_plan} />

            {pipeline_trace && pipeline_trace.steps.length > 0 && (
              <>
                <Subtitle>10.1 Journal des transformations ({pipeline_trace.steps.length} étapes)</Subtitle>
                <div className="vg-pipeline">
                  {pipeline_trace.steps.map((step, i) => {
                    const META: Record<string, { label: string; color: string }> = {
                      drop_duplicates:       { label: 'Suppression des doublons',        color: 'var(--theme-text-muted)' },
                      drop_constant_columns: { label: 'Élimination colonnes constantes', color: 'var(--theme-text-muted)' },
                      datetime_parsing:      { label: 'Parsing colonnes datetime',       color: '#0891b2' },
                      missing_imputation:    { label: 'Imputation valeurs manquantes',   color: '#16a34a' },
                      encoding:              { label: 'Encodage catégorielles',          color: '#7c3aed' },
                      standardization:       { label: 'Scaling adaptatif',               color: '#2563eb' },
                    };
                    const meta = META[step.type] || { label: step.type, color: 'var(--theme-text-muted)' };
                    const summary_text = (() => {
                      switch (step.type) {
                        case 'drop_duplicates':       return `${step.rows_removed ?? 0} lignes supprimées`;
                        case 'drop_constant_columns': return `${(step.columns_removed ?? []).length} colonnes éliminées`;
                        case 'datetime_parsing':      return `${(step.columns ?? []).length} colonne(s)`;
                        case 'missing_imputation':    return `${Object.keys(step.columns ?? {}).length} colonne(s) imputées`;
                        case 'encoding':              return `${Object.keys(step.columns ?? {}).length} colonne(s) encodées`;
                        case 'standardization':       return `${step.n_standard ?? 0}× Standard + ${step.n_robust ?? 0}× Robust`;
                        default: return '';
                      }
                    })();
                    return (
                      <div key={i} className="vg-pipeline-step" style={{ borderLeftColor: meta.color }}>
                        <div className="vg-pipeline-step-head">
                          <span className="vg-pipeline-step-num">{step.step}</span>
                          <strong>{meta.label}</strong>
                          <span className="vg-pipeline-step-summary">{summary_text}</span>
                        </div>
                        {step.type === 'standardization' && step.columns && (
                          <table className="vg-pipeline-table">
                            <thead><tr><th>Colonne</th><th>Scaler</th><th>Centre</th><th>Échelle</th><th>Outliers</th></tr></thead>
                            <tbody>
                              {Object.entries(step.columns as Record<string, any>).slice(0, 10).map(([col, info]: [string, any]) => (
                                <tr key={col}>
                                  <td>{col}</td>
                                  <td><span className={`vg-scaler ${info.scaler === 'RobustScaler' ? 'robust' : 'standard'}`}>{info.scaler === 'RobustScaler' ? 'Robust' : 'Standard'}</span></td>
                                  <td>{info.center}</td>
                                  <td>{info.scale}</td>
                                  <td className={info.outlier_pct > 10 ? 'vg-warn' : 'vg-ok'}>{info.outlier_pct}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {Object.keys(encoding_maps).length > 0 && (
              <>
                <Subtitle>10.2 Mappings d'encodage</Subtitle>
                {Object.entries(encoding_maps).map(([col, info]) => (
                  <div key={col} className="vg-encoding">
                    <div className="vg-encoding-head">
                      <strong>{col}</strong>
                      <span className="vg-encoding-type">{info.type}</span>
                    </div>
                    <div className="vg-chips">
                      {Object.entries(info.mapping).slice(0, 20).map(([k, v]) => (
                        <span key={k} className="vg-chip"><em>{k}</em> → {v}</span>
                      ))}
                      {Object.keys(info.mapping).length > 20 && <span className="vg-chip vg-faint">+{Object.keys(info.mapping).length - 20} autres</span>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>

          {/* ══ SECTION 11 — RECOMMANDATIONS ML ══ */}
          <section className="vg-section">
            <SectionTitle id="sec-ml" icon={BrainCircuit}>11. Recommandations pour la modélisation</SectionTitle>
            {llm_result.ml_tasks && (<><Subtitle>11.1 Tâches ML recommandées</Subtitle><Narration text={llm_result.ml_tasks} /></>)}
            <Subtitle>11.2 Features (à conserver / créer / exclure)</Subtitle>
            <Narration text={llm_result.feature_recommendations} />
          </section>

          {/* ══ SECTION 12 — LIMITES ══ */}
          {llm_result.limitations && (
            <section className="vg-section">
              <SectionTitle id="sec-limites" icon={Info}>12. Limites et points d'attention</SectionTitle>
              <Narration text={llm_result.limitations} />
            </section>
          )}

          {/* ══ SECTION 13 — ANNEXES ══ */}
          <section className="vg-section">
            <SectionTitle id="sec-annexes" icon={BookOpen}>13. Annexes</SectionTitle>

            {pipeline_trace && pipeline_trace.column_order.length > 0 && (
              <>
                <Subtitle>13.1 Colonnes finales du dataset nettoyé ({pipeline_trace.column_order.length})</Subtitle>
                <div className="vg-cols-list">
                  {pipeline_trace.column_order.map((c, i) => (
                    <span key={i} className="vg-col-pill"><em>{i + 1}.</em> {c}</span>
                  ))}
                </div>
              </>
            )}

            {pipeline_trace && Object.keys(pipeline_trace.units).length > 0 && (
              <>
                <Subtitle>13.2 Unités détectées dans les colonnes d'origine</Subtitle>
                <div className="vg-chips">
                  {Object.entries(pipeline_trace.units).map(([clean, info]) => (
                    <span key={clean} className="vg-chip"><em>{info.original}</em> → {clean} <strong>({info.unit})</strong></span>
                  ))}
                </div>
              </>
            )}

            <Subtitle>13.3 Aperçu des 15 premières lignes</Subtitle>
            {loadingPreview && <div className="vg-loading"><Loader2 size={16} className="spin" /> Chargement…</div>}
            {!loadingPreview && previewError && (
              <div style={{ padding: '12px', color: '#dc2626', fontSize: 13 }}>Impossible de charger l'aperçu des données.</div>
            )}
            {!loadingPreview && !previewError && preview && (
              <div className="vg-table-wrap">
                <table className="vg-table vg-table-preview">
                  <thead><tr>{preview.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci}>{cell == null ? <em className="vg-faint">null</em> : String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Subtitle>13.4 Téléchargements</Subtitle>
            <div className="vg-downloads">
              <a href={`${API}/api/donnees/datasets/${dataset.id}/download/processed`} target="_blank" rel="noreferrer" className="vg-dl green">
                <Download size={14} /> CSV propre
              </a>
              <a href={`${API}/api/donnees/datasets/${dataset.id}/download/raw`} target="_blank" rel="noreferrer" className="vg-dl blue">
                <Download size={14} /> Fichier original
              </a>
              <a href={`${API}/api/donnees/datasets/${dataset.id}/download/report`} target="_blank" rel="noreferrer" className="vg-dl orange">
                <FileText size={14} /> Rapport PDF complet
              </a>
              <a href={`${API}/api/donnees/datasets/${dataset.id}/download/preprocessing-trace`} target="_blank" rel="noreferrer" className="vg-dl purple">
                <ClipboardList size={14} /> Trace prétraitement
              </a>
              <a href={`${API}/api/donnees/datasets/${dataset.id}/download/eda-json`} target="_blank" rel="noreferrer" className="vg-dl gray">
                <Layers size={14} /> Export JSON
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default VueGenerale;
