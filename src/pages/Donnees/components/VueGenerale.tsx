// src/pages/Donnees/components/VueGenerale.tsx
// Sous-page Vue Générale — affiche les résultats complets de l'agent EDA

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  Shield,
  Table2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { API, DatasetFull, EDAFrame, useDatasets } from '../../../contexts/DatasetContext';
import IncompatibleDatasetMessage from './IncompatibleDatasetMessage';

type EDATab = 'synthese' | 'plots' | 'pretraitement' | 'features' | 'apercu';

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
  generic: '#6b7280',
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

const VueGenerale: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, selectedId, setSelectedId, selectedDataset, loadingSelected, refresh } = useDatasets();
  const [edaTab, setEdaTab] = useState<EDATab>('synthese');
  const [preview, setPreview] = useState<{ columns: string[]; rows: (string | number | null)[][] } | null>(null);
  const [loadingPreview, setLP] = useState(false);
  const [expandedCol, setExpandedCol] = useState<string | null>(null);
  const [simulatedStep, setSimulatedStep] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Trouver le dataset si sélectionné, sinon utiliser le dernier dataset processed
  const dataset: DatasetFull | null = selectedId
    ? datasets.find(d => d.id === selectedId) as DatasetFull || null
    : null;

  const frame: EDAFrame | undefined = dataset?.eda_results?.[0];

  // Simulation des étapes pendant le traitement
  useEffect(() => {
    if (!dataset || dataset.status !== 'processing') {
      setSimulatedStep(0);
      return;
    }
    const interval = setInterval(() => {
      setSimulatedStep(s => {
        if (s >= EDA_STEPS.length - 1) return s;
        return s + 1;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [dataset?.status]);

  // Charger l'aperçu
  useEffect(() => {
    if (edaTab === 'apercu' && dataset && !preview) {
      setLP(true);
      fetch(`${API}/api/donnees/datasets/${dataset.id}/preview`)
        .then(r => r.json())
        .then(d => setPreview(d))
        .catch(() => {})
        .finally(() => setLP(false));
    }
  }, [edaTab, preview, dataset?.id]);

  /* ─── État : aucun dataset sélectionné ─── */
  if (!selectedId && datasets.length === 0) {
    return (
      <div className="vue-generale-page">
        <div className="incompatible-dataset" style={{ padding: '60px 20px' }}>
          <div className="incompatible-dataset-icon">
            <Table2 size={48} color="#f97316" />
          </div>
          <h2 className="incompatible-dataset-title">Aucun dataset sélectionné</h2>
          <p className="incompatible-dataset-message">
            Uploadez un dataset depuis la page Chargement pour visualiser son analyse.
          </p>
          <button
            className="btn-incompatible-navigate"
            onClick={() => navigate('/donnees?tab=chargement')}
          >
            Aller au Chargement
          </button>
        </div>
      </div>
    );
  }

  /* ─── État : chargement ─── */
  if (!dataset || loadingSelected) {
    return (
      <div className="vue-generale-page">
        <div className="eda-loading" style={{ padding: '60px 20px', justifyContent: 'center' }}>
          <Loader2 size={24} className="spin" />
          <span>Chargement du dataset...</span>
        </div>
      </div>
    );
  }

  /* ─── État : non compatible ─── */
  if (dataset.detected_type && !['kpi', 'vibration', 'maintenance', 'machine', 'generic'].includes(dataset.detected_type)) {
    return (
      <div className="vue-generale-page">
        <IncompatibleDatasetMessage
          page="Vue Générale"
          datasetName={dataset.name}
        />
      </div>
    );
  }

  /* ─── État : en cours de traitement ─── */
  if (dataset.status === 'uploaded' || dataset.status === 'processing') {
    return (
      <div className="vue-generale-page">
        <div className="eda-processing-banner" style={{ margin: '20px', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Loader2 size={20} className="spin" color="#d97706" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#b45309' }}>
              L'agent EDA analyse votre dataset...
            </span>
          </div>

          <div className="eda-steps-list">
            {EDA_STEPS.map((step, i) => {
              const done = i <= simulatedStep;
              const current = i === simulatedStep + 1;
              return (
                <div
                  key={step}
                  className={`eda-step-item${done ? ' done' : ''}${current ? ' current' : ''}`}
                >
                  <div className="eda-step-check">
                    {done ? (
                      <CheckCircle2 size={16} color="#16a34a" />
                    ) : current ? (
                      <Loader2 size={14} className="spin" color="#f97316" />
                    ) : (
                      <div className="eda-step-empty" />
                    )}
                  </div>
                  <span className="eda-step-label">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ─── État : erreur ─── */
  if (dataset.status === 'error') {
    return (
      <div className="vue-generale-page">
        <div className="eda-error-banner" style={{ margin: '20px' }}>
          <AlertTriangle size={20} color="#dc2626" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>
            Erreur lors de l'analyse EDA
          </span>
          {dataset.error_message && (
            <pre className="eda-error-msg" style={{ marginTop: '10px' }}>{dataset.error_message}</pre>
          )}
        </div>
      </div>
    );
  }

  /* ─── Pas de résultats EDA ─── */
  if (!frame) {
    return (
      <div className="vue-generale-page">
        <div className="eda-empty">Résultats EDA non disponibles pour ce dataset.</div>
      </div>
    );
  }

  const { summary, llm_result, plots, encoding_maps, quality_score, pipeline_trace } = frame;

  // Helpers score qualité
  const qualityColor = (s?: number) => s == null ? '#6b7280' : s >= 85 ? '#16a34a' : s >= 70 ? '#65a30d' : s >= 50 ? '#f97316' : '#dc2626';
  const qualityLabel = (s?: number) => s == null ? '—' : s >= 85 ? 'Excellent' : s >= 70 ? 'Bon' : s >= 50 ? 'Acceptable' : 'Insuffisant';

  // Extraction des recommandations urgentes : 3 premières lignes/puces
  const urgentRecos = (llm_result.feature_recommendations || llm_result.preprocessing_plan || '')
    .split(/\n+/)
    .filter(line => line.trim().length > 20)
    .slice(0, 3);

  /* ─── RENDU PRINCIPAL ─── */
  return (
    <div className="vue-generale-page">
      <div className="eda-results">
        {/* Header */}
        <div className="eda-header">
          <div className="eda-header-title">
            <BrainCircuit size={18} color="#f97316" />
            Résultats EDA — <em>{dataset.name}</em>
            <span
              className="eda-type-badge"
              style={{
                background: `${TYPE_COLORS[frame.data_type] || '#6b7280'}18`,
                color: TYPE_COLORS[frame.data_type] || '#6b7280',
              }}
            >
              {TYPE_LABELS[frame.data_type] || frame.data_type}
            </span>
          </div>
          <div className="eda-stats-row">
            {[
              { label: 'Lignes', val: summary.n_rows.toLocaleString() },
              { label: 'Colonnes', val: summary.n_cols },
              { label: 'Num.', val: summary.n_numeric },
              { label: 'Cat.', val: summary.n_categorical },
              { label: 'Manquants', val: `${summary.missing_pct}%` },
              { label: 'Doublons', val: summary.duplicates },
            ].map(s => (
              <div key={s.label} className="eda-stat">
                <div className="eda-stat-val">{s.val}</div>
                <div className="eda-stat-lbl">{s.label}</div>
              </div>
            ))}
            {quality_score != null && (
              <div className="eda-stat eda-quality-stat">
                <div className="eda-quality-ring" style={{ '--qcolor': qualityColor(quality_score) } as React.CSSProperties}>
                  <span className="eda-quality-num" style={{ color: qualityColor(quality_score) }}>{quality_score}</span>
                  <span className="eda-quality-slash">/100</span>
                </div>
                <div className="eda-stat-lbl">
                  <Shield size={9} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                  Qualité&nbsp;
                  <em style={{ color: qualityColor(quality_score), fontStyle: 'normal', fontWeight: 600 }}>
                    {qualityLabel(quality_score)}
                  </em>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bannière recommandations IA prioritaires */}
        {urgentRecos.length > 0 && (
          <div className="vg-reco-banner">
            <div className="vg-reco-banner-header">
              <Lightbulb size={16} color="#f97316" />
              <strong>Recommandations IA prioritaires</strong>
              <button
                className="vg-reco-link"
                onClick={() => setEdaTab('features')}
              >
                Voir toutes les recommandations <ChevronRight size={12} />
              </button>
            </div>
            <ul className="vg-reco-list">
              {urgentRecos.map((line, i) => (
                <li key={i}>
                  <span className="vg-reco-bullet" />
                  <span>{line.trim().replace(/^[-•*]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabs */}
        <div className="eda-tabs">
          {([
            { id: 'synthese' as EDATab, label: 'Synthèse' },
            { id: 'plots' as EDATab, label: `Graphiques (${plots.length})` },
            { id: 'pretraitement' as EDATab, label: 'Prétraitement' },
            { id: 'features' as EDATab, label: 'Recommandations' },
            { id: 'apercu' as EDATab, label: 'Aperçu données' },
          ]).map(t => (
            <button
              key={t.id}
              className={`eda-tab${edaTab === t.id ? ' active' : ''}`}
              onClick={() => setEdaTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="eda-tab-content">
          {/* ═════ SYNTHÈSE ═════ */}
          {edaTab === 'synthese' && (
            <div className="eda-synthese">
              <div className="eda-narrative">
                <h4>
                  <BrainCircuit size={14} color="#7c3aed" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Narration IA (Claude)
                </h4>
                <p>{llm_result.narrative}</p>
              </div>

              <div className="eda-columns-table-wrap">
                <h4>Détail des colonnes ({summary.columns.length})</h4>
                <div className="eda-columns-table-scroll">
                  <table className="eda-columns-table">
                    <thead>
                      <tr>
                        <th>Colonne</th>
                        <th>Type</th>
                        <th>Dtype</th>
                        <th>Manquants</th>
                        <th>Uniques</th>
                        <th>Statistiques</th>
                        <th title="Outliers détectés par la méthode IQR (1.5×IQR)">Outliers IQR</th>
                        <th title="Asymétrie de la distribution">Skewness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.columns.map(col => (
                        <React.Fragment key={col.name}>
                          <tr
                            className={`col-row${expandedCol === col.name ? ' expanded' : ''}`}
                            onClick={() => setExpandedCol(expandedCol === col.name ? null : col.name)}
                          >
                            <td className="col-name">{col.name}</td>
                            <td>
                              <span className={`col-type-badge ${col.type}`}>{col.type}</span>
                            </td>
                            <td className="col-dtype">{col.dtype}</td>
                            <td>
                              <span className={col.missing_pct > 20 ? 'text-warn' : col.missing_pct > 0 ? 'text-caution' : 'text-ok'}>
                                {col.missing} ({col.missing_pct}%)
                              </span>
                            </td>
                            <td>{col.unique}</td>
                            <td className="col-stats">
                              {col.type === 'numeric'
                                ? <>min {col.min} · moy {col.mean} · max {col.max}</>
                                : Object.keys(col.top_values || {}).slice(0, 3).join(', ')
                              }
                            </td>
                            <td>
                              {col.type === 'numeric' && col.n_outliers != null
                                ? <span className={col.outlier_pct! > 10 ? 'text-warn' : col.outlier_pct! > 5 ? 'text-caution' : 'text-ok'}>
                                    {col.n_outliers} ({col.outlier_pct}%)
                                  </span>
                                : <span style={{ color: '#9ca3af' }}>—</span>
                              }
                            </td>
                            <td>
                              {col.type === 'numeric' && col.skewness != null
                                ? <span
                                    className={Math.abs(col.skewness) > 2 ? 'text-warn' : Math.abs(col.skewness) > 1 ? 'text-caution' : 'text-ok'}
                                    title={`Kurtosis : ${col.kurtosis}`}
                                  >
                                    {col.skewness > 0 ? '+' : ''}{col.skewness}
                                  </span>
                                : <span style={{ color: '#9ca3af' }}>—</span>
                              }
                            </td>
                          </tr>
                          {expandedCol === col.name && col.type === 'categorical' && col.top_values && (
                            <tr className="col-expanded">
                              <td colSpan={8}>
                                <div className="col-top-values">
                                  {Object.entries(col.top_values).map(([k, v]) => (
                                    <span key={k} className="col-val-chip">
                                      {k} <em>{v}</em>
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                          {expandedCol === col.name && col.type === 'numeric' && (
                            <tr className="col-expanded">
                              <td colSpan={8}>
                                <div className="col-numeric-detail">
                                  {col.skewness != null && (
                                    <span className="col-detail-chip">
                                      Skewness&nbsp;<strong>{col.skewness > 0 ? '+' : ''}{col.skewness}</strong>
                                      &nbsp;({Math.abs(col.skewness) > 2 ? 'Très asymétrique' : Math.abs(col.skewness) > 1 ? 'Asymétrique' : 'Symétrique'})
                                    </span>
                                  )}
                                  {col.kurtosis != null && (
                                    <span className="col-detail-chip">
                                      Kurtosis&nbsp;<strong>{col.kurtosis > 0 ? '+' : ''}{col.kurtosis}</strong>
                                    </span>
                                  )}
                                  {col.n_outliers != null && col.n_outliers > 0 && (
                                    <span className="col-detail-chip warn">
                                      {col.n_outliers} outlier{col.n_outliers > 1 ? 's' : ''} IQR ({col.outlier_pct}%)
                                      &nbsp;→ {col.outlier_pct! > 10 ? 'RobustScaler' : 'StandardScaler'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════ GRAPHIQUES ═════ */}
          {edaTab === 'plots' && (
            <div className="eda-plots" style={{ position: 'relative' }}>
              {/* Lightbox */}
              {lightboxImg && (
                <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
                  <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                    <img src={`data:image/png;base64,${lightboxImg}`} alt="Graphique" />
                    <button className="lightbox-close" onClick={() => setLightboxImg(null)}>X</button>
                  </div>
                </div>
              )}

              {plots.length === 0 ? (
                <p className="eda-empty">Aucun graphique généré.</p>
              ) : (
                plots.map((p, i) => (
                  <div key={i} className="eda-plot-card" onClick={() => setLightboxImg(p.b64)} style={{ cursor: 'pointer' }}>
                    <div className="eda-plot-title">{p.title}</div>
                    <img
                      src={`data:image/png;base64,${p.b64}`}
                      alt={p.title}
                      className="eda-plot-img"
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═════ PRÉTRAITEMENT ═════ */}
          {edaTab === 'pretraitement' && (
            <div className="eda-pretraitement">
              {/* Steps structurés */}
              {pipeline_trace && pipeline_trace.steps.length > 0 && (
                <div className="eda-block">
                  <h4>Étapes de transformation ({pipeline_trace.steps.length})</h4>
                  <div className="pipeline-steps">
                    {pipeline_trace.steps.map((step, i) => {
                      const STEP_META: Record<string, { label: string; color: string }> = {
                        drop_duplicates:       { label: 'Suppression des doublons',        color: '#6b7280' },
                        drop_constant_columns: { label: 'Élimination colonnes constantes', color: '#6b7280' },
                        datetime_parsing:      { label: 'Parsing colonnes datetime',       color: '#0891b2' },
                        missing_imputation:    { label: 'Imputation valeurs manquantes',   color: '#16a34a' },
                        encoding:              { label: 'Encodage catégorielles',          color: '#7c3aed' },
                        standardization:       { label: 'Normalisation / Scaling adaptatif', color: '#2563eb' },
                      };
                      const meta = STEP_META[step.type] || { label: step.type, color: '#6b7280' };
                      const summary_text = (() => {
                        switch (step.type) {
                          case 'drop_duplicates':       return `${step.rows_removed ?? 0} lignes supprimées`;
                          case 'drop_constant_columns': return `${(step.columns_removed ?? []).length} colonnes éliminées`;
                          case 'datetime_parsing':      return `${(step.columns ?? []).length} colonne(s)`;
                          case 'missing_imputation':    return `${Object.keys(step.columns ?? {}).length} colonne(s) imputées`;
                          case 'encoding':              return `${Object.keys(step.columns ?? {}).length} colonne(s) encodées`;
                          case 'standardization':       return `${step.n_standard ?? 0}×Standard + ${step.n_robust ?? 0}×Robust`;
                          default: return '';
                        }
                      })();
                      return (
                        <div key={i} className="pipeline-step-card">
                          <div className="pipeline-step-header" style={{ borderLeftColor: meta.color }}>
                            <span className="pipeline-step-num">Étape {step.step}</span>
                            <span className="pipeline-step-label">{meta.label}</span>
                            <span className="pipeline-step-summary">{summary_text}</span>
                          </div>
                          {step.type === 'standardization' && step.columns && (
                            <div className="pipeline-step-detail">
                              <table className="pipeline-scaler-table">
                                <thead><tr><th>Colonne</th><th>Scaler</th><th>Centre</th><th>Échelle</th><th>Outliers</th></tr></thead>
                                <tbody>
                                  {Object.entries(step.columns as Record<string, any>).slice(0, 12).map(([col, info]: [string, any]) => (
                                    <tr key={col}>
                                      <td>{col}</td>
                                      <td><span className={`scaler-badge ${info.scaler === 'RobustScaler' ? 'robust' : 'standard'}`}>{info.scaler === 'RobustScaler' ? 'Robust' : 'Standard'}</span></td>
                                      <td>{info.center}</td>
                                      <td>{info.scale}</td>
                                      <td className={info.outlier_pct > 10 ? 'text-warn' : 'text-ok'}>{info.outlier_pct}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Log textuel */}
              {pipeline_trace && pipeline_trace.transformation_log.length > 0 && (
                <div className="eda-block">
                  <h4>Journal de transformation</h4>
                  <div className="pipeline-log">
                    {pipeline_trace.transformation_log.map((line, i) => (
                      <div key={i} className={`pipeline-log-line${line.startsWith('  *') ? ' indent' : ''}`}>{line}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="eda-block">
                <h4>Analyse IA du prétraitement</h4>
                <pre className="eda-pre">{llm_result.preprocessing_plan}</pre>
              </div>

              {Object.keys(encoding_maps).length > 0 && (
                <div className="eda-block">
                  <h4>Correspondances d'encodage</h4>
                  {Object.entries(encoding_maps).map(([col, info]) => (
                    <div key={col} className="encoding-block">
                      <div className="encoding-col-name">
                        <span>{col}</span>
                        <span className="encoding-type-badge">{info.type}</span>
                      </div>
                      <div className="encoding-map-chips">
                        {Object.entries(info.mapping).slice(0, 20).map(([k, v]) => (
                          <span key={k} className="encoding-chip">
                            <em>{k}</em> → {v}
                          </span>
                        ))}
                        {Object.keys(info.mapping).length > 20 && (
                          <span className="encoding-chip more">
                            +{Object.keys(info.mapping).length - 20} autres
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════ RECOMMANDATIONS ═════ */}
          {edaTab === 'features' && (
            <div className="eda-features">
              <div className="eda-block">
                <h4>Recommandations IA pour la sélection de features</h4>
                <pre className="eda-pre">{llm_result.feature_recommendations}</pre>
              </div>

              <div className="eda-downloads">
                <h4>Télécharger</h4>
                <div className="eda-download-btns">
                  <a
                    href={`${API}/api/donnees/datasets/${dataset.id}/download/processed`}
                    target="_blank"
                    rel="noreferrer"
                    className="eda-dl-btn green"
                    title="Dataset après nettoyage, imputation et normalisation"
                  >
                    <Download size={14} /> CSV propre
                  </a>
                  <a
                    href={`${API}/api/donnees/datasets/${dataset.id}/download/raw`}
                    target="_blank"
                    rel="noreferrer"
                    className="eda-dl-btn blue"
                    title="Fichier uploadé tel quel, sans modification"
                  >
                    <Download size={14} /> Fichier original
                  </a>
                  <a
                    href={`${API}/api/donnees/datasets/${dataset.id}/download/report`}
                    target="_blank"
                    rel="noreferrer"
                    className="eda-dl-btn orange"
                    title="Rapport PDF complet : qualité, colonnes enrichies, pipeline, graphiques"
                  >
                    <FileText size={14} /> Rapport PDF
                  </a>
                  <a
                    href={`${API}/api/donnees/datasets/${dataset.id}/download/preprocessing-trace`}
                    target="_blank"
                    rel="noreferrer"
                    className="eda-dl-btn purple"
                    title="Journal textuel détaillé des étapes de prétraitement"
                  >
                    <Download size={14} /> Trace prétraitement (.txt)
                  </a>
                  <a
                    href={`${API}/api/donnees/datasets/${dataset.id}/download/eda-json`}
                    target="_blank"
                    rel="noreferrer"
                    className="eda-dl-btn gray"
                    title="Export JSON des résultats EDA complets (sans images)"
                  >
                    <Download size={14} /> Export JSON (data science)
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ═════ APERÇU DONNÉES ═════ */}
          {edaTab === 'apercu' && (
            <div className="eda-apercu">
              {loadingPreview && (
                <div className="eda-loading">
                  <Loader2 size={20} className="spin" /> Chargement de l'aperçu...
                </div>
              )}
              {!loadingPreview && !preview && (
                <p className="eda-empty">Aperçu non disponible.</p>
              )}
              {!loadingPreview && preview && (
                <>
                  <div className="apercu-info">
                    <Table2 size={14} /> Aperçu des 15 premières lignes · {preview.columns.length} colonnes
                  </div>
                  <div className="apercu-table-scroll">
                    <table className="apercu-table">
                      <thead>
                        <tr>
                          {preview.columns.map(c => <th key={c}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci}>
                                {cell == null ? <em className="null-cell">null</em> : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VueGenerale;
