// src/pages/Donnees/components/ChargementPage.tsx
// Sous-page Chargement : upload dataset, liste, résultats EDA complets

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
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
const ACCEPTED = '.csv,.xlsx,.xls,.txt,.tsv,.arff,.zip,.data,.dat';

const FORMATS = ['CSV', 'XLSX', 'XLS', 'TXT', 'ARFF', 'ZIP', 'DAT'];

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
  generic:     '#6b7280',
};

const STATUS_CONFIG = {
  uploaded:   { label: 'En attente',   color: '#6b7280', bg: '#f3f4f6',              icon: Clock },
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
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
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
    try {
      const res = await fetch(`${API}/api/donnees/upload`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Erreur lors de l\'upload.');
      } else {
        const data = await res.json();
        setSuccess(`Dataset "${name}" uploadé — analyse EDA en cours…`);
        setFile(null); setName(''); setDescription('');
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
            <Upload size={32} color="#d1d5db" />
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
          {uploading ? 'Envoi en cours…' : 'Lancer l\'analyse EDA'}
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
}

const DatasetCard: React.FC<DatasetCardProps> = ({ ds, isSelected, onSelect, onDelete }) => {
  const sc = STATUS_CONFIG[ds.status] || STATUS_CONFIG.uploaded;
  const StatusIcon = sc.icon;
  const typeColor  = TYPE_COLORS[ds.detected_type || 'generic'] || '#6b7280';

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
              className="ds-action-btn" title="Télécharger CSV traité"
            >
              <Download size={13} /> CSV
            </a>
            <a
              href={`${API}/api/donnees/datasets/${ds.id}/download/raw`}
              target="_blank" rel="noreferrer"
              className="ds-action-btn" title="Télécharger fichier brut"
            >
              <Download size={13} /> Brut
            </a>
            <a
              href={`${API}/api/donnees/datasets/${ds.id}/download/report`}
              target="_blank" rel="noreferrer"
              className="ds-action-btn ds-action-pdf" title="Télécharger rapport PDF"
            >
              <FileText size={13} /> PDF
            </a>
            <a
              href={`${API}/api/donnees/datasets/${ds.id}/download/preprocessing-trace`}
              target="_blank" rel="noreferrer"
              className="ds-action-btn" title="Télécharger trace du prétraitement"
            >
              <Download size={13} /> Trace
            </a>
          </>
        )}
        <button className="ds-action-delete" onClick={onDelete} title="Supprimer le dataset">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

/* ─── EDA Results ─────────────────────────────────────────── */
type EDATab = 'synthese' | 'plots' | 'pretraitement' | 'features' | 'apercu';

interface EDAResultsProps { dataset: DatasetFull }

const EDAResults: React.FC<EDAResultsProps> = ({ dataset }) => {
  const [edaTab, setEdaTab]     = useState<EDATab>('synthese');
  const [preview, setPreview]   = useState<{ columns: string[]; rows: (string | number | null)[][] } | null>(null);
  const [loadingPreview, setLP] = useState(false);
  const [expandedCol, setExpandedCol] = useState<string | null>(null);

  const frame: EDAFrame | undefined = dataset.eda_results?.[0];

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

  const { summary, llm_result, plots, encoding_maps } = frame;

  return (
    <div className="eda-results">
      {/* Header stats */}
      <div className="eda-header">
        <div className="eda-header-title">
          <Zap size={16} color="#f97316" />
          Résultats EDA — <em>{dataset.name}</em>
          <span className="eda-type-badge" style={{ background: `${TYPE_COLORS[frame.data_type] || '#6b7280'}18`, color: TYPE_COLORS[frame.data_type] || '#6b7280' }}>
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
        </div>
      </div>

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
                              ? `min ${col.min} · moy ${col.mean} · max ${col.max}`
                              : Object.keys(col.top_values || {}).slice(0,3).join(', ')}
                          </td>
                        </tr>
                        {expandedCol === col.name && col.type === 'categorical' && col.top_values && (
                          <tr className="col-expanded">
                            <td colSpan={6}>
                              <div className="col-top-values">
                                {Object.entries(col.top_values).map(([k, v]) => (
                                  <span key={k} className="col-val-chip">{k} <em>{v}</em></span>
                                ))}
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
            <div className="eda-block">
              <h4>Plan de prétraitement appliqué</h4>
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
                >
                  <Download size={14} /> CSV traité (propre)
                </a>
                <a
                  href={`${API}/api/donnees/datasets/${dataset.id}/download/raw`}
                  target="_blank" rel="noreferrer"
                  className="eda-dl-btn blue"
                >
                  <Download size={14} /> Fichier brut original
                </a>
                <a
                  href={`${API}/api/donnees/datasets/${dataset.id}/download/report`}
                  target="_blank" rel="noreferrer"
                  className="eda-dl-btn orange"
                >
                  <FileText size={14} /> Rapport PDF EDA
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
  const { datasets, loading, refresh, selectedId, setSelectedId, selectedDataset, loadingSelected } = useDatasets();
  const [showUpload, setShowUpload] = useState(true);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce dataset ? Cette action est irréversible.')) return;
    await fetch(`${API}/api/donnees/datasets/${id}`, { method: 'DELETE' });
    if (selectedId === id) setSelectedId(null);
    await refresh();
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
            <Plus size={28} color="#d1d5db" />
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
