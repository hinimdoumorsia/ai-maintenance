// src/pages/Donnees/components/DonneesParc.tsx
// Sous-page Parc Machines — vue analytique en lecture seule

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Eye,
  Layout,
  List,
  Loader2,
  Search,
  Wrench,
} from 'lucide-react';
import { API, useDatasets } from '../../../contexts/DatasetContext';
import { useDatasetForPage } from '../../../hooks/useDatasetForPage';
import IncompatibleDatasetMessage from './IncompatibleDatasetMessage';

interface Machine {
  code: string;
  nom: string;
  type: string;
  atelier: string;
  statut: string;
  classe_iso: string;
  age_jours: number;
  nb_capteurs: number;
  zone_iso: string;
  derniere_mesure: string;
  capteurs?: any[];
  defauts?: any[];
  dernieres_mesures?: any[];
}

const ZONE_COLORS: Record<string, string> = { A: '#16a34a', B: '#eab308', C: '#f97316', D: '#dc2626' };

const DonneesParc: React.FC = () => {
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('machines', selectedId);
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAtelier, setFilterAtelier] = useState('Tous');
  const [filterType, setFilterType] = useState('Tous');
  const [filterZone, setFilterZone] = useState('Tous');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'synoptic' | 'table'>('synoptic');

  const mockMachines: Machine[] = [
    { code: 'M001', nom: 'Compresseur Atlas C-1', type: 'Compresseur', atelier: 'A', statut: 'Actif', classe_iso: 'II', age_jours: 420, nb_capteurs: 6, zone_iso: 'B', derniere_mesure: '2026-05-05 10:30', capteurs: [{ type: 'Accéléromètre', position: 'Roulement 1', statut: 'Actif', batterie: 85 }, { type: 'Vélocimètre', position: 'Sortie arbre', statut: 'Actif', batterie: 72 }], defauts: [{ type: 'Balourd léger', severite: 'Faible' }], dernieres_mesures: [{ date: '2026-05-05', vrms: 2.8, zone: 'B' }, { date: '2026-05-04', vrms: 2.6, zone: 'B' }] },
    { code: 'M002', nom: 'Pompe hydraulique P-12', type: 'Pompe', atelier: 'B', statut: 'En maintenance', classe_iso: 'III', age_jours: 1800, nb_capteurs: 4, zone_iso: 'D', derniere_mesure: '2026-05-04 08:15', capteurs: [], defauts: [{ type: 'Défaut roulement avancé', severite: 'Élevée' }], dernieres_mesures: [] },
    { code: 'M003', nom: 'Moteur électrique ME-45', type: 'Moteur', atelier: 'A', statut: 'Actif', classe_iso: 'I', age_jours: 90, nb_capteurs: 3, zone_iso: 'A', derniere_mesure: '2026-05-05 11:00' },
    { code: 'M004', nom: 'Ventilateur V-08', type: 'Ventilateur', atelier: 'C', statut: 'Actif', classe_iso: 'II', age_jours: 1200, nb_capteurs: 2, zone_iso: 'C', derniere_mesure: '2026-05-03 16:45' },
    { code: 'M005', nom: 'Réducteur R-22', type: 'Réducteur', atelier: 'B', statut: 'En alarme', classe_iso: 'III', age_jours: 2500, nb_capteurs: 5, zone_iso: 'D', derniere_mesure: '2026-05-05 09:20' },
  ];

  useEffect(() => {
    setLoading(true);
    if (source === 'db') {
      fetch(`${API}/api/donnees/parc/synthese`)
        .then(r => r.ok ? r.json() : mockMachines)
        .then(d => setMachines(Array.isArray(d) ? d : d.machines || []))
        .catch(() => setMachines(mockMachines))
        .finally(() => setLoading(false));
    } else {
      setMachines(mockMachines);
      setLoading(false);
    }
  }, [source]);

  const ateliers = ['Tous', ...new Set(machines.map(m => m.atelier))];
  const types = ['Tous', ...new Set(machines.map(m => m.type))];
  const zones = ['Tous', 'A', 'B', 'C', 'D'];

  const filtered = machines
    .filter(m => !search || m.nom.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()))
    .filter(m => filterAtelier === 'Tous' || m.atelier === filterAtelier)
    .filter(m => filterType === 'Tous' || m.type === filterType)
    .filter(m => filterZone === 'Tous' || m.zone_iso === filterZone)
    .sort((a, b) => {
      if (!sortCol) return 0;
      const va = String((a as any)[sortCol] || '');
      const vb = String((b as any)[sortCol] || '');
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const stats = { total: machines.length, actives: machines.filter(m => m.statut === 'Actif').length, maintenance: machines.filter(m => m.statut === 'En maintenance').length, alarme: machines.filter(m => m.zone_iso === 'C' || m.zone_iso === 'D').length };

  if (ctxLoading) return <div className="parc-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;
  if (source === 'dataset' && !isCompatible) {
    return (
      <div className="parc-page">
        <IncompatibleDatasetMessage
          page="Parc Machines"
          datasetName={selectedDs?.name || 'inconnu'}
          analysisType="machine"
          datasetDetectedType={selectedDs?.detected_type}
        />
      </div>
    );
  }

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // Export CSV de la liste machines filtrée
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Code', 'Nom', 'Type', 'Atelier', 'Statut', 'Classe ISO', 'Age (j)', 'Capteurs', 'Zone ISO', 'Dernière mesure'];
    const rows = filtered.map(m => [
      m.code, m.nom, m.type, m.atelier, m.statut, m.classe_iso,
      String(m.age_jours), String(m.nb_capteurs), m.zone_iso, m.derniere_mesure
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parc_machines_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="parc-page">
      {/* Source Toggle */}
      <div className="kpis-header">
        <div className="source-toggle-btns">
          <button className={`source-toggle-btn${source === 'db' ? ' active' : ''}`} onClick={() => setSource('db')}>Base de données</button>
          <button className={`source-toggle-btn${source === 'dataset' ? ' active' : ''}`} onClick={() => setSource('dataset')}>Dataset uploadé</button>
        </div>
        {source === 'dataset' && (
          <select className="source-dataset-select" value={selectedId || ''} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">-- Dataset machines --</option>
            {datasets.filter(d => d.status === 'processed' && d.detected_type === 'machine').map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Compteurs */}
      <div className="parc-stats">
        <div className="parc-stat"><div className="parc-stat-value">{stats.total}</div><div className="parc-stat-label">Total machines</div></div>
        <div className="parc-stat"><div className="parc-stat-value" style={{ color: '#16a34a' }}>{stats.actives}</div><div className="parc-stat-label">Actives</div></div>
        <div className="parc-stat"><div className="parc-stat-value" style={{ color: '#f97316' }}>{stats.maintenance}</div><div className="parc-stat-label">En maintenance</div></div>
        <div className="parc-stat"><div className="parc-stat-value" style={{ color: '#dc2626' }}>{stats.alarme}</div><div className="parc-stat-label">Zone C/D</div></div>
      </div>

      {/* Filtres + Toggle vue + Export */}
      <div className="parc-toolbar">
        <div className="parc-search">
          <Search size={14} />
          <input placeholder="Rechercher machine..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterAtelier} onChange={e => setFilterAtelier(e.target.value)}>
          {ateliers.map(a => <option key={a} value={a}>{a === 'Tous' ? 'Tous ateliers' : `Atelier ${a}`}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'Tous' ? 'Tous types' : t}</option>)}
        </select>
        <select value={filterZone} onChange={e => setFilterZone(e.target.value)}>
          {zones.map(z => <option key={z} value={z}>{z === 'Tous' ? 'Toutes zones' : `Zone ${z}`}</option>)}
        </select>

        <div className="parc-view-toggle">
          <button
            className={`parc-view-btn${viewMode === 'synoptic' ? ' active' : ''}`}
            onClick={() => setViewMode('synoptic')}
            title="Vue synoptique (Mode Supervision XPR)"
          >
            <Layout size={13} /> Synoptique
          </button>
          <button
            className={`parc-view-btn${viewMode === 'table' ? ' active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Vue tableau"
          >
            <List size={13} /> Tableau
          </button>
        </div>

        <button
          className="parc-export-btn"
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          title="Exporter la liste filtrée en CSV"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* ── VUE SYNOPTIQUE (Mode Supervision XPR) ── */}
      {viewMode === 'synoptic' && (
        <div className="parc-synoptic">
          <p style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 10 }}>
            Vue synoptique inspirée du <strong>Mode Supervision</strong> d'OneProd XPR.
            Chaque carte représente une machine ; sa couleur de bordure reflète sa zone ISO la plus aggravante.
            Cliquez sur une carte pour voir le détail.
          </p>
          <div className="parc-synoptic-grid">
            {filtered.map(m => {
              const zoneColor = ZONE_COLORS[m.zone_iso] || '#6b7280';
              const isExpanded = expanded === m.code;
              const statusColor = m.statut === 'Actif' ? '#16a34a' : m.statut === 'En alarme' ? '#dc2626' : '#f97316';
              return (
                <div
                  key={m.code}
                  className={`parc-synoptic-card${isExpanded ? ' expanded' : ''}`}
                  style={{ borderTopColor: zoneColor, borderTopWidth: 4 }}
                  onClick={() => setExpanded(isExpanded ? null : m.code)}
                >
                  <div className="parc-synoptic-header">
                    <span className="parc-synoptic-code">{m.code}</span>
                    <span className="parc-synoptic-zone" style={{ background: zoneColor, color: '#fff' }}>
                      Z{m.zone_iso}
                    </span>
                  </div>
                  <div className="parc-synoptic-name" title={m.nom}>{m.nom}</div>
                  <div className="parc-synoptic-info">
                    <span className="parc-synoptic-type">{m.type}</span>
                    <span style={{ color: '#9ca3af' }}>·</span>
                    <span>Atelier {m.atelier}</span>
                  </div>
                  <div className="parc-synoptic-meta">
                    <span title="Statut" style={{ color: statusColor, fontWeight: 600 }}>
                      ● {m.statut}
                    </span>
                    <span title="Classe ISO">Cl. {m.classe_iso}</span>
                    <span title="Âge">{m.age_jours}j</span>
                    <span title="Capteurs">{m.nb_capteurs} cpt</span>
                  </div>
                  {(m.defauts && m.defauts.length > 0) ? (
                    <div className="parc-synoptic-alerts">
                      <AlertTriangle size={11} color="#dc2626" />
                      {m.defauts.length} défaut{m.defauts.length > 1 ? 's' : ''} actif{m.defauts.length > 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="parc-synoptic-alerts" style={{ color: '#16a34a' }}>
                      <CheckCircle2 size={11} /> RAS
                    </div>
                  )}
                  <div className="parc-synoptic-footer">
                    <Eye size={10} /> {m.derniere_mesure}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="parc-empty">
              <Search size={32} color="#d1d5db" />
              <p>Aucune machine ne correspond aux filtres</p>
            </div>
          )}
        </div>
      )}

      {/* ── VUE TABLEAU ── */}
      {viewMode === 'table' && (
      <div className="parc-table-wrap">
        <table className="parc-table">
          <thead>
            <tr>
              {['code', 'nom', 'type', 'atelier', 'statut', 'classe_iso', 'age_jours', 'nb_capteurs', 'zone_iso', 'derniere_mesure'].map(col => (
                <th key={col} onClick={() => handleSort(col)} className={sortCol === col ? 'sorted' : ''}>
                  {col === 'code' ? 'Code' : col === 'nom' ? 'Nom' : col === 'classe_iso' ? 'Classe ISO' : col === 'age_jours' ? 'Âge' : col === 'nb_capteurs' ? 'Capteurs' : col === 'zone_iso' ? 'Zone ISO' : col === 'derniere_mesure' ? 'Dernière mesure' : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <React.Fragment key={m.code}>
                <tr className="parc-row" onClick={() => setExpanded(expanded === m.code ? null : m.code)}>
                  <td className="parc-code">{m.code}</td>
                  <td>{m.nom}</td>
                  <td>{m.type}</td>
                  <td>{m.atelier}</td>
                  <td><span className={`status-badge ${m.statut === 'Actif' ? 'ok' : m.statut === 'En alarme' ? 'alerte' : 'panne'}`}>{m.statut}</span></td>
                  <td>{m.classe_iso}</td>
                  <td><span style={{ color: m.age_jours < 365 ? '#16a34a' : m.age_jours < 1825 ? '#f97316' : '#dc2626', fontWeight: 600 }}>{m.age_jours}j</span></td>
                  <td>{m.nb_capteurs}</td>
                  <td><span className="parc-zone-badge" style={{ background: ZONE_COLORS[m.zone_iso] || '#6b7280', color: '#fff' }}>{m.zone_iso}</span></td>
                  <td>{m.derniere_mesure}</td>
                </tr>
                {expanded === m.code && (
                  <tr className="parc-expanded">
                    <td colSpan={10}>
                      <div className="parc-expanded-content">
                        <h4>Capteurs ({m.capteurs?.length || 0})</h4>
                        {m.capteurs && m.capteurs.length > 0 ? (
                          <table><thead><tr><th>Type</th><th>Position</th><th>Statut</th><th>Batterie</th></tr></thead>
                            <tbody>{m.capteurs.map((c, i) => <tr key={i}><td>{c.type}</td><td>{c.position}</td><td>{c.statut}</td><td>{c.batterie}%</td></tr>)}</tbody>
                          </table>
                        ) : <p>Aucun capteur</p>}
                        <h4>Défauts actifs ({m.defauts?.length || 0})</h4>
                        {m.defauts && m.defauts.length > 0 ? (
                          <table><thead><tr><th>Type</th><th>Sévérité</th></tr></thead>
                            <tbody>{m.defauts.map((d, i) => <tr key={i}><td><AlertTriangle size={12} color="#dc2626" /> {d.type}</td><td>{d.severite}</td></tr>)}</tbody>
                          </table>
                        ) : <p>Aucun défaut</p>}
                        <h4>Dernières mesures</h4>
                        {m.dernieres_mesures && m.dernieres_mesures.length > 0 ? (
                          <table><thead><tr><th>Date</th><th>V-RMS</th><th>Zone</th></tr></thead>
                            <tbody>{m.dernieres_mesures.map((mes, i) => <tr key={i}><td>{mes.date}</td><td>{mes.vrms} mm/s</td><td><span className="parc-zone-badge" style={{ background: ZONE_COLORS[mes.zone] || '#6b7280', color: '#fff' }}>{mes.zone}</span></td></tr>)}</tbody>
                          </table>
                        ) : <p>Aucune mesure</p>}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default DonneesParc;