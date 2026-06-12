// src/pages/Donnees/components/CapteurIoT.tsx
// Sous-page Capteurs IoT — monitoring capteurs

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BatteryLow,
  Loader2,
  Thermometer,
  Waves,
  Zap,
  Gauge,
  Droplets,
} from 'lucide-react';
import { API, useDatasets } from '../../../contexts/DatasetContext';
import { useDatasetForPage } from '../../../hooks/useDatasetForPage';
import IncompatibleDatasetMessage from './IncompatibleDatasetMessage';

interface Capteur {
  id: string;
  machine_id: string;
  machine_nom: string;
  type: string;
  position: string;
  statut: string;
  batterie: number | null;
  derniere_mesure: string;
  freq_acq: string;
  nb_mesures_24h: number;
}

const STATUT_LABELS: Record<string, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  batterie_faible: 'Batterie faible',
  en_panne: 'En panne',
};

const TYPE_NORM: Record<string, string> = {
  accelerometre: 'Accéléromètre',
  velocimetre: 'Vélocimètre',
  thermique: 'Température',
  courant: 'Courant',
  pression: 'Pression',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  Accéléromètre: Waves,
  Vélocimètre: Gauge,
  Température: Thermometer,
  Courant: Zap,
  Pression: Droplets,
};

const TYPE_DESC: Record<string, string> = {
  Accéléromètre: 'Mesure l\'accélération vibratoire (g ou m/s²) — défauts hautes fréquences',
  Vélocimètre: 'Mesure la vitesse vibratoire (mm/s) — norme ISO 10816',
  Température: 'Surveille les échauffements anormaux — thermographie indirecte',
  Courant: 'Mesure le courant absorbé (A) — détection surcharges et désalignements',
  Pression: 'Systèmes hydrauliques et pneumatiques — détection cavitation',
};

function _normCol(c: string): string {
  return c.trim().toLowerCase().replace(/\s+/g, '_');
}

function _pickColIndex(columns: string[], names: string[]): number {
  const L = columns.map(_normCol);
  for (const name of names) {
    const n = _normCol(name);
    const j = L.indexOf(n);
    if (j >= 0) return j;
  }
  for (const name of names) {
    const n = _normCol(name);
    for (let j = 0; j < L.length; j++) {
      if (L[j] === n || L[j].includes(n) || n.includes(L[j])) return j;
    }
  }
  return -1;
}

function _formatAcquisitionFreq(v: unknown): string {
  if (v == null || v === '') return '—';
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return String(v);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MHz`;
  if (n >= 1000) return `${n / 1000} kHz`;
  return `${n} Hz`;
}

function _formatTs(v: unknown): string {
  if (v == null || v === '') return '—';
  const s = String(v).replace('T', ' ').slice(0, 19);
  return s;
}

function _toBattery(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function _toNbMesures(v: unknown): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return Math.round(v);
  const s = String(v).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

/** Mappe un aperçu CSV brut (upload) vers la structure tableau Capteurs. */
function previewRowsToCapteurs(columns: string[], rows: (string | number | null)[][]): Capteur[] {
  const ix = {
    id: _pickColIndex(columns, ['sensor_id', 'code_capteur', 'id_capteur', 'capteur_id', 'id']),
    machine_id: _pickColIndex(columns, ['linked_machine', 'machine_id', 'code_machine', 'id_machine']),
    machine_nom: _pickColIndex(columns, ['machine_name', 'nom_machine', 'machine_nom', 'equipement']),
    type: _pickColIndex(columns, ['sensor_type', 'type_capteur', 'type', 'type_mesure']),
    position: _pickColIndex(columns, ['installation_position', 'position_montage', 'position', 'emplacement']),
    statut: _pickColIndex(columns, ['sensor_status', 'statut', 'status', 'etat']),
    batterie: _pickColIndex(columns, ['battery_pct', 'batterie', 'battery', 'niveau_batterie_pct']),
    derniere: _pickColIndex(columns, ['last_measurement_ts', 'derniere_mesure', 'timestamp_mesure', 'date_mesure']),
    freq: _pickColIndex(columns, ['acquisition_freq_hz', 'freq_acq', 'frequence_hz', 'frequence_acquisition']),
    nb: _pickColIndex(columns, ['nb_measurements_24h', 'nb_mesures_24h', 'mesures_24h', 'count_24h']),
  };
  if (ix.id < 0 && ix.machine_nom < 0 && ix.type < 0) return [];

  return rows.map((row, line) => {
    const id =
      ix.id >= 0 && row[ix.id] != null && row[ix.id] !== ''
        ? String(row[ix.id])
        : `L${line + 1}`;
    const machine_id = ix.machine_id >= 0 ? String(row[ix.machine_id] ?? '') : '';
    const machine_nom = ix.machine_nom >= 0 ? String(row[ix.machine_nom] ?? '') : machine_id || '—';
    const type = ix.type >= 0 ? String(row[ix.type] ?? '—') : '—';
    const position = ix.position >= 0 ? String(row[ix.position] ?? '').replace(/_/g, ' ') : '—';
    const statut = ix.statut >= 0 ? String(row[ix.statut] ?? '—') : '—';
    const batterie = _toBattery(ix.batterie >= 0 ? row[ix.batterie] : null);
    const derniere_mesure = _formatTs(ix.derniere >= 0 ? row[ix.derniere] : null);
    const freq_acq = ix.freq >= 0 ? _formatAcquisitionFreq(row[ix.freq]) : '—';
    const nb_mesures_24h = _toNbMesures(ix.nb >= 0 ? row[ix.nb] : 0);
    return {
      id,
      machine_id,
      machine_nom,
      type,
      position,
      statut,
      batterie,
      derniere_mesure,
      freq_acq,
      nb_mesures_24h,
    };
  });
}

const CAPTEUR_DATASET_TYPES = new Set(['generic', 'machine', 'vibration']);

const CapteurIoT: React.FC = () => {
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('capteurs', selectedId);

  const datasetOptions = useMemo(() => {
    const base = datasets.filter(
      d => d.status === 'processed' && CAPTEUR_DATASET_TYPES.has(d.detected_type || ''),
    );
    const sel = selectedId != null ? datasets.find(d => d.id === selectedId) : null;
    if (sel && sel.status === 'processed' && !base.some(d => d.id === sel.id)) {
      return [...base, sel].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }
    return base;
  }, [datasets, selectedId]);
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [capteurs, setCapteurs] = useState<Capteur[]>([]);
  const [loading, setLoading] = useState(false);
  const [datasetLoadError, setDatasetLoadError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('Tous');
  const [filterStatut, setFilterStatut] = useState('Tous');

  useEffect(() => {
    setLoading(true);
    setDatasetLoadError(null);
    if (source === 'db') {
      const session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
      const userId = session.id;
      if (!userId) { setLoading(false); return; }
      fetch(`${API}/api/donnees/parc/capteurs?user_id=${userId}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(d => {
          const raw: any[] = Array.isArray(d) ? d : d.capteurs || [];
          setCapteurs(raw.map(c => ({ ...c, freq_acq: _formatAcquisitionFreq(c.freq_acq) })));
        })
        .catch(() => setCapteurs([]))
        .finally(() => setLoading(false));
      return;
    }
    if (!isCompatible || !selectedId) {
      setCapteurs([]);
      setLoading(false);
      return;
    }
    fetch(`${API}/api/donnees/datasets/${selectedId}/preview?n=100000&from_upload=true`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { columns?: string[]; rows?: (string | number | null)[][] }) => {
        const mapped = previewRowsToCapteurs(data.columns || [], data.rows || []);
        setCapteurs(mapped);
        if (!mapped.length) {
          setDatasetLoadError(
            'Aucune ligne exploitable : vérifiez que le CSV uploadé contient des colonnes type sensor_id, machine_name, sensor_type…',
          );
        }
      })
      .catch(() => {
        setCapteurs([]);
        setDatasetLoadError('Impossible de lire le fichier uploadé (aperçu brut).');
      })
      .finally(() => setLoading(false));
  }, [source, selectedId, isCompatible]);

  const types = ['Tous', ...new Set(capteurs.map(c => c.type))];
  const statuts = ['Tous', ...new Set(capteurs.map(c => c.statut))];

  const filtered = capteurs
    .filter(c => filterType === 'Tous' || c.type === filterType)
    .filter(c => filterStatut === 'Tous' || c.statut === filterStatut);

  const stats = {
    total: capteurs.length,
    actifs: capteurs.filter(c => c.statut === 'actif').length,
    batterieFaible: capteurs.filter(c => c.batterie !== null && c.batterie < 20).length,
    panne: capteurs.filter(c => c.statut === 'en_panne').length,
  };

  if (ctxLoading) return <div className="capteurs-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;

  const sourceHeader = (
    <div className="kpis-header">
      <div className="source-toggle-btns">
        <button type="button" className={`source-toggle-btn${source === 'db' ? ' active' : ''}`} onClick={() => setSource('db')}>Base de données</button>
        <button type="button" className={`source-toggle-btn${source === 'dataset' ? ' active' : ''}`} onClick={() => setSource('dataset')}>Dataset uploadé</button>
      </div>
      {source === 'dataset' && (
        <select
          className="source-dataset-select"
          value={selectedId != null && datasetOptions.some(d => d.id === selectedId) ? selectedId : ''}
          onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- Dataset capteurs / IoT --</option>
          {datasetOptions.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      )}
    </div>
  );

  if (source === 'dataset' && !isCompatible) {
    return (
      <div className="capteurs-page">
        {sourceHeader}
        <IncompatibleDatasetMessage page="Capteurs IoT" datasetName={selectedDs?.name || 'inconnu'} />
      </div>
    );
  }

  const getBatteryColor = (b: number | null) => b == null ? 'var(--theme-border)' : b < 20 ? '#dc2626' : b <= 50 ? '#f97316' : '#16a34a';

  return (
    <div className="capteurs-page">
      {sourceHeader}

      {source === 'dataset' && datasetLoadError && (
        <div className="eda-warning" style={{ marginBottom: 12 }}>
          <AlertTriangle size={16} />
          <span>{datasetLoadError}</span>
        </div>
      )}

      {loading && (
        <div className="eda-loading" style={{ padding: '20px 0' }}>
          <Loader2 size={18} className="spin" /> Chargement des capteurs…
        </div>
      )}

      {!loading && <>
      {/* Compteurs */}
      <div className="capteurs-stats">
        <div className="capteur-stat"><div className="capteur-stat-value">{stats.total}</div><div className="capteur-stat-label">Total capteurs</div></div>
        <div className="capteur-stat"><div className="capteur-stat-value" style={{ color: '#16a34a' }}>{stats.actifs} <span style={{ fontSize: '11px' }}>({capteurs.length > 0 ? Math.round(stats.actifs / capteurs.length * 100) : 0}%)</span></div><div className="capteur-stat-label">Actifs</div></div>
        <div className="capteur-stat"><div className="capteur-stat-value" style={{ color: '#f97316' }}>{stats.batterieFaible}</div><div className="capteur-stat-label">Batterie &lt; 20%</div></div>
        <div className="capteur-stat"><div className="capteur-stat-value" style={{ color: '#dc2626' }}>{stats.panne}</div><div className="capteur-stat-label">En panne</div></div>
      </div>

      {/* Filtres */}
      <div className="parc-toolbar">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'Tous' ? 'Tous types' : TYPE_NORM[t] || t}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          {statuts.map(s => <option key={s} value={s}>{s === 'Tous' ? 'Tous statuts' : STATUT_LABELS[s] || s}</option>)}
        </select>
      </div>

      {/* Types de capteurs — filtrés aux types présents dans les données réelles */}
      <div className="capteurs-types-grid">
        {(() => {
          const presentLabels = capteurs.length > 0
            ? new Set(capteurs.map(c => TYPE_NORM[c.type] || c.type))
            : new Set(Object.keys(TYPE_DESC));
          return Object.entries(TYPE_DESC)
            .filter(([type]) => presentLabels.has(type))
            .map(([type, desc]) => {
              const Icon = TYPE_ICONS[type] || Zap;
              return (
                <div key={type} className="capteur-type-card">
                  <Icon size={20} color="#f97316" />
                  <div><strong>{type}</strong><p>{desc}</p></div>
                </div>
              );
            });
        })()}
      </div>

      {/* Tableau */}
      <div className="parc-table-wrap">
        <table className="parc-table">
          <thead>
            <tr>
              <th>ID</th><th>Machine</th><th>Type</th><th>Position</th><th>Statut</th><th>Batterie</th><th>Dernière mesure</th><th>Fréq. acq.</th><th>Mesures 24h</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--theme-text-faint)', fontSize: 13 }}>
                  {capteurs.length === 0
                    ? 'Aucun capteur enregistré pour cette entreprise.'
                    : 'Aucun capteur ne correspond aux filtres sélectionnés.'}
                </td>
              </tr>
            )}
            {filtered.map(c => {
              const bColor = getBatteryColor(c.batterie);
              const statusColor = c.statut === 'actif' ? '#16a34a' : c.statut === 'batterie_faible' ? '#f97316' : c.statut === 'en_panne' ? '#dc2626' : 'var(--theme-text-faint)';
              return (
                <tr key={c.id}>
                  <td className="parc-code">{c.id}</td>
                  <td>{c.machine_nom}</td>
                  <td>{TYPE_NORM[c.type] || c.type}</td>
                  <td>{c.position}</td>
                  <td><span className="parc-zone-badge" style={{ background: statusColor, color: statusColor === 'var(--theme-text-faint)' ? 'var(--theme-text)' : '#fff' }}>{STATUT_LABELS[c.statut] || c.statut}</span></td>
                  <td>
                    {c.batterie == null ? 'N/A' : (
                      <div className="battery-cell">
                        {c.batterie < 20 && <BatteryLow size={12} color="#dc2626" />}
                        <div className="battery-bar"><div className="battery-fill" style={{ width: `${c.batterie}%`, background: bColor }} /></div>
                        <span style={{ color: bColor, fontWeight: 600, fontSize: '11px' }}>{c.batterie}%</span>
                      </div>
                    )}
                  </td>
                  <td>{c.derniere_mesure || '—'}</td>
                  <td>{c.freq_acq}</td>
                  <td>{c.nb_mesures_24h.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>}
    </div>
  );
};

export default CapteurIoT;