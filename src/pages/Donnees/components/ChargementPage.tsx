// src/pages/Donnees/components/ChargementPage.tsx
// Sous-page Chargement : upload dataset, liste, résultats EDA complets

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Table2,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { API, DatasetFull, DatasetMeta, EDAFrame, useDatasets } from '../../../contexts/DatasetContext';

/* ─── Helpers ────────────────────────────────────────────── */
const ACCEPTED = '.csv,.xlsx,.xls,.txt,.tsv,.arff,.zip,.data,.dat,.mat,.npz';

const FORMATS = ['CSV', 'XLSX', 'TXT', 'ARFF', 'ZIP', 'MAT', 'NPZ'];

const TYPE_LABELS: Record<string, string> = {
  vibration:   'Vibratoire',
  kpi:         'KPI',
  maintenance: 'Maintenance',
  machine:     'Machine',
  generic:     'Générique',
};

const TYPE_COLORS: Record<string, string> = {
  vibration:   '#7c3aed',
  kpi:         '#0891b2',
  maintenance: '#b45309',
  machine:     '#16a34a',
  generic:     'var(--theme-text-muted)',
};

const STATUS_CONFIG = {
  uploaded:   { label: 'En attente',   color: 'var(--theme-text-muted)', bg: 'var(--theme-bg-hover)', icon: Clock },
  processing: { label: 'Traitement…',  color: '#d97706', bg: 'rgba(251,191,36,.12)', icon: Loader2 },
  processed:  { label: 'Prêt',         color: '#16a34a', bg: 'rgba(22,163,74,.10)',  icon: CheckCircle2 },
  error:      { label: 'Erreur',       color: '#dc2626', bg: 'rgba(220,38,38,.09)',  icon: AlertTriangle },
};

const fmtBytes = (b: number | null) =>
  !b ? '—' : b < 1024 ? `${b} o` : b < 1048576 ? `${(b/1024).toFixed(1)} Ko` : `${(b/1048576).toFixed(1)} Mo`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

/* ─── Upload Zone ─────────────────────────────────────────── */
interface UploadZoneProps {
  onUploaded: (id: number) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUploaded }) => {
  const { refresh, pollUntilDone } = useDatasets();
  const [dragging,    setDragging]    = useState(false);
  const [file,        setFile]        = useState<File | null>(null);
  const [name,              setName]              = useState('');
  const [description,       setDescription]       = useState('');
  const [mode,              setMode]              = useState<'exploratory' | 'company'>('exploratory');
  const [vitesseRpm,        setVitesseRpm]        = useState('');
  const [nbPairesPoles,     setNbPairesPoles]     = useState('');
  const [nbDentsEngrenage,  setNbDentsEngrenage]  = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(''); if (!name) setName(f.name.replace(/\.[^.]+$/, '')); }
  }, [name]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(''); if (!name) setName(f.name.replace(/\.[^.]+$/, '')); }
  };

  const handleUpload = async () => {
    if (!file) return setError('Veuillez sélectionner un fichier.');
    if (!name.trim()) return setError('Le nom du dataset est obligatoire.');
    setUploading(true); setError(''); setSuccess('');
    const form = new FormData();
    form.append('file', file);
    form.append('name', name.trim());
    form.append('description', description);
    form.append('mode', mode);
    if (vitesseRpm)       form.append('vitesse_rpm',        vitesseRpm);
    if (nbPairesPoles)    form.append('nb_paires_poles',    nbPairesPoles);
    if (nbDentsEngrenage) form.append('nb_dents_engrenage', nbDentsEngrenage);
    const _session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
    form.append('user_id', String(_session.id || 0));
    try {
      const res = await fetch(`${API}/api/donnees/upload`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Erreur lors de l\'upload.');
      } else {
        const data = await res.json();
        setSuccess(`Dataset "${name}" uploadé — analyse EDA en cours…`);
        setFile(null); setName(''); setDescription('');
        setVitesseRpm(''); setNbPairesPoles(''); setNbDentsEngrenage('');
        await refresh();
        pollUntilDone(data.dataset_id);
        onUploaded(data.dataset_id);
      }
    } catch {
      setError('Impossible de contacter le serveur (http://localhost:8000).');
    }
    setUploading(false);
  };

  return (
    <div className="upload-section">
      <div className="upload-section-title">
        <Upload size={16} />
        Charger un nouveau dataset
      </div>

      {/* Dropzone */}
      <div
        className={`dropzone${dragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} onChange={onPickFile} style={{ display: 'none' }} />
        {file ? (
          <div className="dropzone-file-info">
            <FileText size={28} color="#f97316" />
            <div>
              <div className="dropzone-filename">{file.name}</div>
              <div className="dropzone-filesize">{fmtBytes(file.size)}</div>
            </div>
            <button className="dropzone-clear" onClick={e => { e.stopPropagation(); setFile(null); }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={32} style={{ color: 'var(--theme-border-bright)' }} />
            <p className="dropzone-hint">Glissez-déposez votre fichier ici ou <span>parcourir</span></p>
            <div className="format-chips">
              {FORMATS.map(f => <span key={f} className="format-chip">{f}</span>)}
            </div>
          </>
        )}
      </div>

      {/* Form */}
      <div className="upload-form">
        <div className="upload-field">
          <label className="upload-label">Nom du dataset <span className="required">*</span></label>
          <input
            className="upload-input"
            placeholder="ex : CMAPSSFan001, VibrationPompeP201…"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="upload-field">
          <label className="upload-label">Description <span className="optional">(optionnel)</span></label>
          <textarea
            className="upload-textarea"
            rows={2}
            placeholder="Décrivez le contexte, la source, la période de collecte…"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div className="upload-field">
          <label className="upload-label">
            Paramètres spectraux <span className="optional">(optionnel — datasets vibratoires)</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="number" min="1" step="1"
              className="upload-input"
              placeholder="Vitesse nominale (RPM)"
              value={vitesseRpm}
              onChange={e => setVitesseRpm(e.target.value)}
              style={{ flex: 1, minWidth: '140px' }}
            />
            <input
              type="number" min="1" step="1"
              className="upload-input"
              placeholder="Nb paires de pôles"
              value={nbPairesPoles}
              onChange={e => setNbPairesPoles(e.target.value)}
              style={{ flex: 1, minWidth: '140px' }}
            />
            <input
              type="number" min="0" step="1"
              className="upload-input"
              placeholder="Nb dents engrenage"
              value={nbDentsEngrenage}
              onChange={e => setNbDentsEngrenage(e.target.value)}
              style={{ flex: 1, minWidth: '140px' }}
            />
          </div>
        </div>
      </div>

      {/* Mode d'utilisation */}
      <div className="upload-mode-selector">
        <div className="upload-label" style={{ marginBottom: '8px' }}>Mode d'utilisation</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {([
            { val: 'exploratory', title: 'Analyse exploratoire', desc: 'EDA uniquement — aucune trace dans le dashboard', icon: 'EDA' },
            { val: 'company',     title: 'Données entreprise',   desc: 'EDA + intégration automatique dashboard (KPIs, alertes, suivi)', icon: 'ENT' },
          ] as const).map(opt => (
            <label
              key={opt.val}
              style={{
                flex: 1, minWidth: '180px', cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', border: `2px solid ${mode === opt.val ? '#f97316' : 'var(--theme-border)'}`,
                background: mode === opt.val ? 'rgba(249,115,22,0.08)' : 'var(--theme-bg-card)', transition: 'all 0.15s',
              }}
            >
              <input
                type="radio" name="mode" value={opt.val}
                checked={mode === opt.val}
                onChange={() => setMode(opt.val)}
                style={{ marginTop: '3px', accentColor: '#f97316' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--theme-text)' }}>{opt.icon} {opt.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error   && <div className="upload-msg error"><AlertTriangle size={13} />{error}</div>}
      {success && <div className="upload-msg success"><CheckCircle2 size={13} />{success}</div>}

      <div className="upload-actions">
        <button
          className="btn-upload-primary"
          onClick={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
          {uploading ? 'Envoi en cours…' : 'Lancer l\'analyse'}
        </button>
      </div>
    </div>
  );
};

/* ─── Dataset Card ────────────────────────────────────────── */
interface DatasetCardProps {
  ds: DatasetMeta;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onReprocess: () => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ ds, isSelected, onSelect, onDelete, onReprocess }) => {
  const sc = STATUS_CONFIG[ds.status] || STATUS_CONFIG.uploaded;
  const StatusIcon = sc.icon;
  const typeColor  = TYPE_COLORS[ds.detected_type || 'generic'] || 'var(--theme-text-muted)';

  return (
    <div
      className={`ds-card${isSelected ? ' selected' : ''}`}
      onClick={onSelect}
    >
      {/* Left: status icon */}
      <div className="ds-card-status-icon" style={{ color: sc.color }}>
        <StatusIcon size={18} className={ds.status === 'processing' ? 'spin' : ''} />
      </div>

      {/* Center: info */}
      <div className="ds-card-body">
        <div className="ds-card-top">
          <span className="ds-card-name">{ds.name}</span>
          {ds.detected_type && (
            <span className="ds-card-type" style={{ color: typeColor, background: `${typeColor}18` }}>
              {TYPE_LABELS[ds.detected_type] || ds.detected_type}
            </span>
          )}
          <span className="ds-card-status-badge" style={{ color: sc.color, background: sc.bg }}>
            {sc.label}
          </span>
        </div>
        {ds.description && <div className="ds-card-desc">{ds.description}</div>}
        <div className="ds-card-meta">
          <span>{ds.original_filename}</span>
          <span>·</span>
          <span>{fmtBytes(ds.file_size_bytes)}</span>
          {ds.n_rows != null && <><span>·</span><span>{ds.n_rows.toLocaleString()} lignes × {ds.n_cols} cols</span></>}
          <span>·</span>
          <span>{fmtDate(ds.created_at)}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="ds-card-actions" onClick={e => e.stopPropagation()}>
        {ds.status === 'processed' && (
          <>
            <a
              href={`${API}/api/donnees/datasets/${ds.id}/download/processed`}
              target="_blank" rel="noreferrer"
              className="ds-action-btn" title="CSV nettoyé + normalisé"
            >
              <Download size={13} /> CSV
            </a>
            <a
              href={`${API}/api/donnees/datasets/${ds.id}/download/raw`}
              target="_blank" rel="noreferrer"
              className="ds-action-btn" title="Fichier uploadé original"
            >
              <Download size={13} /> Brut
            </a>
            <a
              href={`${API}/api/donnees/datasets/${ds.id}/download/report`}
              target="_blank" rel="noreferrer"
              className="ds-action-btn ds-action-pdf" title="Rapport EDA complet (PDF)"
            >
              <FileText size={13} /> PDF
            </a>
            <a
              href={`${API}/api/donnees/datasets/${ds.id}/download/preprocessing-trace`}
              target="_blank" rel="noreferrer"
              className="ds-action-btn ds-action-trace" title="Journal prétraitement (.txt)"
            >
              <FileText size={13} /> Trace
            </a>
            <a
              href={`${API}/api/donnees/datasets/${ds.id}/download/eda-json`}
              target="_blank" rel="noreferrer"
              className="ds-action-btn ds-action-json" title="Export JSON résultats EDA"
            >
              <Download size={13} /> JSON
            </a>
          </>
        )}
        {(ds.status === 'error' || ds.status === 'processed') && (
          <button
            className="ds-action-btn ds-action-reprocess"
            onClick={onReprocess}
            title="Re-lancer l'analyse EDA (utile si la clé API manquait)"
          >
            <RefreshCw size={13} /> Re-analyser
          </button>
        )}
        <button className="ds-action-delete" onClick={onDelete} title="Supprimer le dataset">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

/* ─── Helpers EDA ─────────────────────────────────────────── */
const qualityColor = (s: number) => s >= 85 ? '#16a34a' : s >= 70 ? '#65a30d' : s >= 50 ? '#f97316' : '#dc2626';
const qualityLabel = (s: number) => s >= 85 ? 'Excellent' : s >= 70 ? 'Bon' : s >= 50 ? 'Acceptable' : 'Insuffisant';

const STEP_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  drop_duplicates:        { label: 'Suppression des doublons',         Icon: Trash2,       color: 'var(--theme-text-muted)' },
  drop_constant_columns:  { label: 'Élimination colonnes constantes',  Icon: X,            color: 'var(--theme-text-muted)' },
  datetime_parsing:       { label: 'Parsing colonnes datetime',        Icon: Clock,        color: '#0891b2' },
  missing_imputation:     { label: 'Imputation valeurs manquantes',    Icon: CheckCircle2, color: '#16a34a' },
  encoding:               { label: 'Encodage catégorielles',           Icon: Zap,          color: '#7c3aed' },
  standardization:        { label: 'Normalisation / Scaling adaptatif',Icon: BarChart2,    color: '#2563eb' },
};

function stepSummary(step: any): string {
  switch (step.type) {
    case 'drop_duplicates':        return `${step.rows_removed ?? 0} lignes supprimées`;
    case 'drop_constant_columns':  return `${(step.columns_removed ?? []).length} colonnes éliminées`;
    case 'datetime_parsing':       return `${(step.columns ?? []).length} colonne(s) parsées`;
    case 'missing_imputation': {
      const cols = step.columns ?? {};
      return `${Object.keys(cols).length} colonne(s) imputées (médiane/mode)`;
    }
    case 'encoding': {
      const cols = step.columns ?? {};
      return `${Object.keys(cols).length} colonne(s) encodées`;
    }
    case 'standardization': {
      const nr = step.n_robust ?? 0;
      const ns = step.n_standard ?? 0;
      return `${ns} StandardScaler + ${nr} RobustScaler`;
    }
    default: return '';
  }
}

/* ─── EDA Results ─────────────────────────────────────────── */
type EDATab = 'synthese' | 'plots' | 'pretraitement' | 'features' | 'apercu';

interface EDAResultsProps { dataset: DatasetFull }

const EDAResults: React.FC<EDAResultsProps> = ({ dataset }) => {
  const [edaTab, setEdaTab]     = useState<EDATab>('synthese');
  const [preview, setPreview]   = useState<{ columns: string[]; rows: (string | number | null)[][] } | null>(null);
  const [loadingPreview, setLP] = useState(false);
  const [expandedCol, setExpandedCol] = useState<string | null>(null);
  const [integrated,    setIntegrated]    = useState(dataset.ingestion_mode === 'company');
  const [integrating,   setIntegrating]   = useState(false);
  const [integrateMsg,  setIntegrateMsg]  = useState('');

  const frame: EDAFrame | undefined = dataset.eda_results?.[0];

  // Sync état intégration si le dataset change
  useEffect(() => {
    setIntegrated(dataset.ingestion_mode === 'company');
    setIntegrateMsg('');
  }, [dataset.id, dataset.ingestion_mode]);

  const handleIntegrate = async () => {
    setIntegrating(true);
    setIntegrateMsg('');
    try {
      const _sess = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
      const res = await fetch(`${API}/api/donnees/datasets/${dataset.id}/integrate?user_id=${_sess.id || 0}`, { method: 'POST' });
      if (res.ok) {
        setIntegrated(true);
        setIntegrateMsg('Dataset intégré au dashboard entreprise.');
      } else {
        const err = await res.json();
        setIntegrateMsg(`Erreur : ${err.detail || 'Intégration impossible.'}`);
      }
    } catch {
      setIntegrateMsg('Erreur : impossible de contacter le serveur.');
    }
    setIntegrating(false);
  };

  useEffect(() => {
    if (edaTab === 'apercu' && !preview) {
      setLP(true);
      fetch(`${API}/api/donnees/datasets/${dataset.id}/preview`)
        .then(r => r.json())
        .then(d => setPreview(d))
        .catch(() => {})
        .finally(() => setLP(false));
    }
  }, [edaTab, preview, dataset.id]);

  if (!frame) return (
    <div className="eda-empty">Résultats EDA non disponibles pour ce dataset.</div>
  );

  const { summary, llm_result, plots, encoding_maps, quality_score, pipeline_trace, kpis, rul_info } = frame;

  return (
    <div className="eda-results">
      {/* Header stats */}
      <div className="eda-header">
        <div className="eda-header-title">
          <Zap size={16} color="#f97316" />
          Résultats EDA — <em>{dataset.name}</em>
          <span className="eda-type-badge" style={{ background: `${TYPE_COLORS[frame.data_type] || 'var(--theme-text-muted)'}18`, color: TYPE_COLORS[frame.data_type] || 'var(--theme-text-muted)' }}>
            {TYPE_LABELS[frame.data_type] || frame.data_type}
          </span>
        </div>
        <div className="eda-stats-row">
          {[
            { label: 'Lignes',       val: summary.n_rows.toLocaleString() },
            { label: 'Colonnes',     val: summary.n_cols },
            { label: 'Num.',         val: summary.n_numeric },
            { label: 'Cat.',         val: summary.n_categorical },
            { label: 'Manquants',    val: `${summary.missing_pct}%` },
            { label: 'Doublons',     val: summary.duplicates },
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
                Qualité&nbsp;
                <em style={{ color: qualityColor(quality_score), fontStyle: 'normal', fontWeight: 600 }}>
                  {qualityLabel(quality_score)}
                </em>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bannière intégration dashboard */}
      {dataset.status === 'processed' && frame && frame.data_type !== 'generic' && !integrated && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
          padding: '10px 16px', margin: '0 0 4px 0',
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px',
          fontSize: '13px',
        }}>
          <Database size={15} color="#b45309" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#92400e' }}>Dataset {TYPE_LABELS[frame.data_type] || frame.data_type} détecté</strong>
            <span style={{ color: '#78350f', marginLeft: '6px' }}>
              — Ces données semblent être des données d'entreprise. Voulez-vous les intégrer au dashboard ?
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleIntegrate}
              disabled={integrating}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: '#f97316', color: '#fff', fontWeight: 600, fontSize: '12px',
              }}
            >
              {integrating ? <Loader2 size={12} className="spin" /> : <Database size={12} />}
              Intégrer au dashboard
            </button>
            <button
              onClick={() => setIntegrated(true)}
              style={{
                padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--theme-border)',
                background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)', fontSize: '12px', cursor: 'pointer',
              }}
            >
              Ignorer
            </button>
          </div>
        </div>
      )}

      {/* Badge : déjà intégré */}
      {dataset.status === 'processed' && frame && frame.data_type !== 'generic' && integrated && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '7px 14px', marginBottom: '4px',
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
          fontSize: '12px', color: '#15803d',
        }}>
          <CheckCircle2 size={13} color="#16a34a" />
          <span><strong>Intégré au dashboard entreprise</strong> — mesures, KPIs et défauts visibles dans le dashboard.</span>
        </div>
      )}

      {integrateMsg && (
        <div style={{
          padding: '7px 14px', marginBottom: '4px', borderRadius: '8px', fontSize: '12px',
          background: integrateMsg.startsWith('Dataset intégré') ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${integrateMsg.startsWith('Dataset intégré') ? '#86efac' : '#fca5a5'}`,
          color: integrateMsg.startsWith('Dataset intégré') ? '#15803d' : '#dc2626',
        }}>
          {integrateMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="eda-tabs">
        {([
          { id: 'synthese',     label: 'Synthèse' },
          { id: 'plots',        label: `Graphiques (${plots.length})` },
          { id: 'pretraitement',label: 'Prétraitement' },
          { id: 'features',     label: 'Recommandations' },
          { id: 'apercu',       label: 'Aperçu données' },
        ] as { id: EDATab; label: string }[]).map(t => (
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

        {/* SYNTHÈSE */}
        {edaTab === 'synthese' && (
          <div className="eda-synthese">
            <div className="eda-narrative">
              <h4>Analyse narrative</h4>
              <p>{llm_result.narrative}</p>
            </div>

            {kpis && Object.keys(kpis).length > 0 && (
              <div className="eda-block">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart2 size={16} color="#2563eb" />
                  Indicateurs de Performance
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {Object.entries(kpis).map(([key, item]) => {
                    const labelMap: Record<string, string> = {
                      mtbf: 'MTBF',
                      mttr: 'MTTR',
                      mttf: 'MTTF',
                      availability: 'Disponibilité',
                      failure_rate_lambda: 'Taux λ',
                      oee: 'OEE / TRS',
                      anomaly_rate: "Taux d'anomalies",
                    };
                    const label = labelMap[key] || key;
                    const color =
                      key === 'mttr' ? '#f97316' :
                      key === 'anomaly_rate' && item.value > 10 ? '#dc2626' :
                      key === 'availability' ? '#16a34a' :
                      (key === 'mtbf' || key === 'mttf') ? '#2563eb' : 'var(--theme-text-muted)';
                    return (
                      <div
                        key={key}
                        style={{
                          border: `1px solid ${color}33`,
                          background: `${color}10`,
                          borderRadius: '10px',
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color }}>
                          {Number(item.value).toLocaleString('fr-FR', { maximumFractionDigits: 3 })}
                          <span style={{ fontSize: '12px', marginLeft: 4, color: 'var(--theme-text-muted)' }}>{item.unit}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--theme-text-faint)' }}>source: {item.source_col}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {rul_info && Object.keys(rul_info).length > 0 && (
              <div className="eda-block">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={16} color="#7c3aed" />
                  Pronostic — Durée de Vie Restante
                </h4>
                {rul_info.rul_mean != null && (
                  <div style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid #ddd6fe', borderRadius: '10px', background: '#faf5ff' }}>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>RUL moyen</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#6d28d9' }}>
                      {rul_info.rul_mean.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                    </div>
                    {rul_info.rul_max != null && rul_info.rul_max > 0 && (
                      <>
                        {(() => {
                          const pct = Math.max(0, Math.min(100, (rul_info.rul_mean! / rul_info.rul_max!) * 100));
                          const c = pct > 70 ? '#16a34a' : pct >= 30 ? '#f97316' : '#dc2626';
                          return (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ height: 8, borderRadius: 999, background: 'var(--theme-border)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: c }} />
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--theme-text-muted)', marginTop: 3 }}>{pct.toFixed(1)}% de RUL max observée</div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {rul_info.health_index_mean != null && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: 4 }}>Health Index moyen</div>
                    {(() => {
                      const pct = Math.max(0, Math.min(100, rul_info.health_index_mean! * 100));
                      const c = pct > 70 ? '#16a34a' : pct >= 30 ? '#f97316' : '#dc2626';
                      return (
                        <>
                          <div style={{ height: 10, borderRadius: 999, background: 'var(--theme-border)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: c }} />
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--theme-text-muted)', marginTop: 3 }}>{pct.toFixed(1)}%</div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {rul_info.pct_critical != null && (
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: rul_info.pct_critical > 0 ? '#dc2626' : '#16a34a',
                        background: rul_info.pct_critical > 0 ? '#fee2e2' : '#dcfce7',
                        border: `1px solid ${rul_info.pct_critical > 0 ? '#fca5a5' : '#86efac'}`,
                      }}
                    >
                      Machines critiques (&lt; 0.3): {rul_info.pct_critical.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            )}

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
                      <th title="Asymétrie de la distribution (|skew|>1 = asymétrique, >2 = très asymétrique)">Skewness</th>
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
                              ? <>
                                  min {col.min} · moy {col.mean} · max {col.max}
                                  {col.q25 != null && <><br/><span style={{color: 'var(--theme-text-muted)',fontSize:'0.78em'}}>Q1 {col.q25} · Q3 {col.q75}</span></>}
                                </>
                              : Object.keys(col.top_values || {}).slice(0,3).join(', ')}
                          </td>
                          <td>
                            {col.type === 'numeric' && col.n_outliers != null
                              ? <span className={col.outlier_pct! > 10 ? 'text-warn' : col.outlier_pct! > 5 ? 'text-caution' : 'text-ok'}>
                                  {col.n_outliers} ({col.outlier_pct}%)
                                </span>
                              : <span style={{color: 'var(--theme-text-faint)'}}>—</span>
                            }
                          </td>
                          <td>
                            {col.type === 'numeric' && col.skewness != null
                              ? <span className={Math.abs(col.skewness) > 2 ? 'text-warn' : Math.abs(col.skewness) > 1 ? 'text-caution' : 'text-ok'}
                                      title={`Kurtosis : ${col.kurtosis}`}>
                                  {col.skewness > 0 ? '+' : ''}{col.skewness}
                                </span>
                              : <span style={{color: 'var(--theme-text-faint)'}}>—</span>
                            }
                          </td>
                        </tr>
                        {expandedCol === col.name && col.type === 'categorical' && col.top_values && (
                          <tr className="col-expanded">
                            <td colSpan={8}>
                              <div className="col-top-values">
                                {Object.entries(col.top_values).map(([k, v]) => (
                                  <span key={k} className="col-val-chip">{k} <em>{v}</em></span>
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
                                    &nbsp;({col.kurtosis > 1 ? 'Leptokurtique (queues lourdes)' : col.kurtosis < -1 ? 'Platykurtique (queues légères)' : 'Normal'})
                                  </span>
                                )}
                                {col.n_outliers != null && col.n_outliers > 0 && (
                                  <span className="col-detail-chip warn">
                                    {col.n_outliers} outlier{col.n_outliers > 1 ? 's' : ''} IQR ({col.outlier_pct}%)
                                    &nbsp;→ {col.outlier_pct! > 10 ? 'RobustScaler appliqué' : 'StandardScaler appliqué'}
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

        {/* PLOTS */}
        {edaTab === 'plots' && (
          <div className="eda-plots">
            {plots.length === 0
              ? <p className="eda-empty">Aucun graphique généré.</p>
              : plots.map((p, i) => (
                <div key={i} className="eda-plot-card">
                  <div className="eda-plot-title">{p.title}</div>
                  <img
                    src={`data:image/png;base64,${p.b64}`}
                    alt={p.title}
                    className="eda-plot-img"
                  />
                </div>
              ))
            }
          </div>
        )}

        {/* PRÉTRAITEMENT */}
        {edaTab === 'pretraitement' && (
          <div className="eda-pretraitement">

            {/* Pipeline steps structurés */}
            {pipeline_trace && pipeline_trace.steps.length > 0 && (
              <div className="eda-block">
                <h4>Étapes de transformation ({pipeline_trace.steps.length})</h4>
                <div className="pipeline-steps">
                  {pipeline_trace.steps.map((step, i) => {
                    const meta = STEP_META[step.type] || { label: step.type, Icon: Activity, color: 'var(--theme-text-muted)' };
                    const { Icon } = meta;
                    return (
                      <div key={i} className="pipeline-step-card">
                        <div className="pipeline-step-header" style={{ borderLeftColor: meta.color }}>
                          <Icon size={14} style={{ color: meta.color }} />
                          <span className="pipeline-step-num">Étape {step.step}</span>
                          <span className="pipeline-step-label">{meta.label}</span>
                          <span className="pipeline-step-summary">{stepSummary(step)}</span>
                        </div>
                        {/* Détail scaling adaptatif */}
                        {step.type === 'standardization' && step.columns && (
                          <div className="pipeline-step-detail">
                            <table className="pipeline-scaler-table">
                              <thead>
                                <tr><th>Colonne</th><th>Scaler</th><th>Centre</th><th>Échelle</th><th>Outliers</th></tr>
                              </thead>
                              <tbody>
                                {Object.entries(step.columns as Record<string, any>).slice(0, 15).map(([col, info]: [string, any]) => (
                                  <tr key={col}>
                                    <td>{col}</td>
                                    <td>
                                      <span className={`scaler-badge ${info.scaler === 'RobustScaler' ? 'robust' : 'standard'}`}>
                                        {info.scaler === 'RobustScaler' ? 'Robust' : 'Standard'}
                                      </span>
                                    </td>
                                    <td>{info.center}</td>
                                    <td>{info.scale}</td>
                                    <td className={info.outlier_pct > 10 ? 'text-warn' : 'text-ok'}>{info.outlier_pct}%</td>
                                  </tr>
                                ))}
                                {Object.keys(step.columns).length > 15 && (
                                  <tr><td colSpan={5} style={{color: 'var(--theme-text-faint)', textAlign:'center'}}>
                                    +{Object.keys(step.columns).length - 15} autres colonnes
                                  </td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {/* Colonnes supprimées */}
                        {step.type === 'drop_constant_columns' && step.columns_removed && step.columns_removed.length > 0 && (
                          <div className="pipeline-step-detail">
                            {step.columns_removed.map((c: string) => (
                              <span key={c} className="col-val-chip" style={{background:'#fef2f2',color:'#dc2626'}}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Log de transformation textuel (IA) */}
            {pipeline_trace && pipeline_trace.transformation_log.length > 0 && (
              <div className="eda-block">
                <h4>Journal de transformation</h4>
                <div className="pipeline-log">
                  {pipeline_trace.transformation_log.map((line, i) => (
                    <div key={i} className={`pipeline-log-line${line.startsWith('  *') ? ' indent' : ''}`}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ordre des colonnes après transformation */}
            {pipeline_trace && pipeline_trace.column_order.length > 0 && (
              <div className="eda-block">
                <h4>Colonnes du dataset traité ({pipeline_trace.column_order.length})</h4>
                <div className="col-order-chips">
                  {pipeline_trace.column_order.map((c, i) => (
                    <span key={i} className="col-val-chip">{i + 1}. {c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Plan de prétraitement IA (texte narratif) */}
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
                        <span className="encoding-chip more">+{Object.keys(info.mapping).length - 20} autres</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECOMMANDATIONS FEATURES */}
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
                  target="_blank" rel="noreferrer"
                  className="eda-dl-btn green"
                  title="Dataset après nettoyage, imputation et normalisation"
                >
                  <Download size={14} /> CSV propre
                </a>
                <a
                  href={`${API}/api/donnees/datasets/${dataset.id}/download/raw`}
                  target="_blank" rel="noreferrer"
                  className="eda-dl-btn blue"
                  title="Fichier uploadé tel quel, sans modification"
                >
                  <Download size={14} /> Fichier original
                </a>
                <a
                  href={`${API}/api/donnees/datasets/${dataset.id}/download/report`}
                  target="_blank" rel="noreferrer"
                  className="eda-dl-btn orange"
                  title="Rapport PDF complet : score qualité, colonnes enrichies, pipeline, graphiques"
                >
                  <FileText size={14} /> Rapport PDF
                </a>
                <a
                  href={`${API}/api/donnees/datasets/${dataset.id}/download/preprocessing-trace`}
                  target="_blank" rel="noreferrer"
                  className="eda-dl-btn purple"
                  title="Journal textuel détaillé des étapes de prétraitement"
                >
                  <Download size={14} /> Trace prétraitement (.txt)
                </a>
                <a
                  href={`${API}/api/donnees/datasets/${dataset.id}/download/eda-json`}
                  target="_blank" rel="noreferrer"
                  className="eda-dl-btn gray"
                  title="Export JSON des résultats EDA complets (sans images base64)"
                >
                  <Download size={14} /> Export JSON (data science)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* APERÇU DONNÉES */}
        {edaTab === 'apercu' && (
          <div className="eda-apercu">
            {loadingPreview && (
              <div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement de l'aperçu…</div>
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
                            <td key={ci}>{cell == null ? <em className="null-cell">null</em> : String(cell)}</td>
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
  );
};

/* ─── ChargementPage ─────────────────────────────────────── */
const ChargementPage: React.FC = () => {
  const { datasets, loading, refresh, selectedId, setSelectedId, selectedDataset, loadingSelected, pollUntilDone } = useDatasets();
  const [showUpload, setShowUpload] = useState(true);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce dataset ? Cette action est irréversible.')) return;
    await fetch(`${API}/api/donnees/datasets/${id}`, { method: 'DELETE' });
    if (selectedId === id) setSelectedId(null);
    await refresh();
  };

  const handleReprocess = async (id: number) => {
    await fetch(`${API}/api/donnees/datasets/${id}/reprocess`, { method: 'POST' });
    await refresh();
    pollUntilDone(id);
  };

  const handleUploaded = (id: number) => {
    setSelectedId(id);
    setShowUpload(false);
  };

  return (
    <div className="chargement-page">

      {/* ── Upload collapsible ── */}
      <div className="chargement-section">
        <div className="section-header" onClick={() => setShowUpload(v => !v)}>
          <div className="section-header-left">
            <Upload size={15} />
            <span>Charger un dataset</span>
          </div>
          {showUpload ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
        {showUpload && <UploadZone onUploaded={handleUploaded} />}
      </div>

      {/* ── Datasets list ── */}
      <div className="chargement-section">
        <div className="section-header" style={{ cursor: 'default' }}>
          <div className="section-header-left">
            <FileText size={15} />
            <span>Mes datasets ({datasets.length})</span>
          </div>
          <button className="refresh-btn" onClick={refresh} title="Rafraîchir">
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {datasets.length === 0 ? (
          <div className="ds-empty">
            <Plus size={28} style={{ color: 'var(--theme-border-bright)' }} />
            <p>Aucun dataset chargé</p>
            <small>Uploadez votre premier fichier ci-dessus</small>
          </div>
        ) : (
          <div className="ds-list">
            {datasets.map(ds => (
              <DatasetCard
                key={ds.id}
                ds={ds}
                isSelected={selectedId === ds.id}
                onSelect={() => setSelectedId(selectedId === ds.id ? null : ds.id)}
                onDelete={() => handleDelete(ds.id)}
                onReprocess={() => handleReprocess(ds.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── EDA Results ── */}
      {selectedId != null && (
        <div className="chargement-section">
          {loadingSelected && (
            <div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement des résultats…</div>
          )}
          {!loadingSelected && selectedDataset && (
            <>
              {selectedDataset.status === 'processing' || selectedDataset.status === 'uploaded' ? (
                <div className="eda-processing-banner">
                  <Loader2 size={16} className="spin" />
                  L'agent EDA analyse votre dataset… Mise à jour automatique dans quelques secondes.
                </div>
              ) : selectedDataset.status === 'error' ? (
                <div className="eda-error-banner">
                  <AlertTriangle size={16} />
                  Erreur lors de l'analyse EDA.
                  <pre className="eda-error-msg">{selectedDataset.error_message}</pre>
                </div>
              ) : (
                <EDAResults dataset={selectedDataset} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChargementPage;
