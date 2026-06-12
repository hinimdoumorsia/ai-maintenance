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

  const [expandedDetail, setExpandedDetail] = useState<Record<string, any>>({});

  useEffect(() => {
    if (source !== 'db') return;
    setLoading(true);
    const session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
    const userId = session.id;
    if (!userId) { setLoading(false); return; }
    fetch(`${API}/api/donnees/parc/synthese?user_id=${userId}`)
      .then(r => r.json())
      .then(d => setMachines(Array.isArray(d) ? d : d.machines || []))
      .catch(() => setMachines([]))
      .finally(() => setLoading(false));
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

  const stats = {
    total:       machines.length,
    actives:     machines.filter(m => m.statut === 'en_service').length,
    maintenance: machines.filter(m => m.statut === 'en_maintenance').length,
    alarme:      machines.filter(m => m.zone_iso === 'C' || m.zone_iso === 'D').length,
  };

  if (ctxLoading) return <div className="parc-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;
  if (source === 'dataset') {
    return (
      <div className="parc-page">
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
          <Layout size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14, marginBottom: 8 }}>
            L'analyse du parc depuis un dataset uploadé n'est pas disponible dans cette vue.
          </p>
          <p style={{ fontSize: 12, color: 'var(--theme-text-faint)' }}>
            Utilisez le mode <strong>Base de données</strong> pour consulter votre parc réel.
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

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleExpand = (code: string) => {
    const isExpanding = expanded !== code;
    setExpanded(isExpanding ? code : null);
    if (isExpanding && !expandedDetail[code]) {
      const session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
      const userId = session.id;
      if (!userId) return;
      fetch(`${API}/api/donnees/parc/machine/${code}?user_id=${userId}`)
        .then(r => r.json())
        .then(d => setExpandedDetail(prev => ({ ...prev, [code]: d })))
        .catch(() => {});
    }
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
          {ateliers.map(a => <option key={a} value={a}>{a === 'Tous' ? 'Tous ateliers' : a}</option>)}
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
            title="Vue synoptique du parc"
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

      {/* ── VUE SYNOPTIQUE ── */}
      {viewMode === 'synoptic' && (
        <div className="parc-synoptic">
          <p style={{ fontSize: 11.5, color: 'var(--theme-text-faint)', marginBottom: 10 }}>
            Vue synoptique du parc. Chaque carte représente une machine ; sa couleur de bordure reflète sa zone ISO
            la plus aggravante. Cliquez sur une carte pour voir le détail.
          </p>
          <div className="parc-synoptic-grid">
            {filtered.map(m => {
              const zoneColor = ZONE_COLORS[m.zone_iso] || 'var(--theme-text-faint)';
              const isExpanded = expanded === m.code;
              const statusColor = m.statut === 'en_service' ? '#16a34a'
                : m.statut === 'en_alarme' ? '#dc2626' : '#f97316';
              const detail = expandedDetail[m.code];
              return (
                <div
                  key={m.code}
                  className={`parc-synoptic-card${isExpanded ? ' expanded' : ''}`}
                  style={{ borderTopColor: zoneColor, borderTopWidth: 4 }}
                  onClick={() => handleExpand(m.code)}
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
                    <span style={{ color: 'var(--theme-text-muted)' }}>·</span>
                    <span>{m.atelier}</span>
                  </div>
                  <div className="parc-synoptic-meta">
                    <span title="Statut" style={{ color: statusColor, fontWeight: 600 }}>
                      ● {m.statut}
                    </span>
                    <span title="Classe ISO">Cl. {m.classe_iso}</span>
                    <span title="Âge">{m.age_jours}j</span>
                    <span title="Capteurs">{m.nb_capteurs} cpt</span>
                  </div>
                  {(detail?.defauts && detail.defauts.length > 0) ? (
                    <div className="parc-synoptic-alerts">
                      <AlertTriangle size={11} color="#dc2626" />
                      {detail.defauts.length} défaut{detail.defauts.length > 1 ? 's' : ''} actif{detail.defauts.length > 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="parc-synoptic-alerts" style={{ color: '#16a34a' }}>
                      <CheckCircle2 size={11} /> RAS
                    </div>
                  )}
                  <div className="parc-synoptic-footer">
                    <Eye size={10} /> {m.derniere_mesure || '—'}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="parc-empty">
              <Search size={32} style={{ color: 'var(--theme-border-bright)' }} />
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
                <tr className="parc-row" onClick={() => handleExpand(m.code)}>
                  <td className="parc-code">{m.code}</td>
                  <td>{m.nom}</td>
                  <td>{m.type}</td>
                  <td>{m.atelier}</td>
                  <td><span className={`status-badge ${m.statut === 'en_service' ? 'ok' : m.statut === 'en_alarme' ? 'alerte' : 'panne'}`}>{m.statut}</span></td>
                  <td>{m.classe_iso}</td>
                  <td><span style={{ color: m.age_jours < 365 ? '#16a34a' : m.age_jours < 1825 ? '#f97316' : '#dc2626', fontWeight: 600 }}>{m.age_jours}j</span></td>
                  <td>{m.nb_capteurs}</td>
                  <td><span className="parc-zone-badge" style={{ background: ZONE_COLORS[m.zone_iso] || 'var(--theme-bg-hover)', color: ZONE_COLORS[m.zone_iso] ? '#fff' : 'var(--theme-text)' }}>{m.zone_iso || '—'}</span></td>
                  <td>{m.derniere_mesure || '—'}</td>
                </tr>
                {expanded === m.code && (() => {
                  const d = expandedDetail[m.code];
                  return (
                    <tr className="parc-expanded">
                      <td colSpan={10}>
                        <div className="parc-expanded-content">
                          {!d ? (
                            <div style={{ padding: '12px', color: 'var(--theme-text-faint)', fontSize: 12 }}>
                              <Loader2 size={14} className="spin" style={{ display: 'inline-block', marginRight: 6 }} /> Chargement du détail…
                            </div>
                          ) : (
                            <>
                              <h4>Capteurs ({d.capteurs?.length || 0})</h4>
                              {d.capteurs && d.capteurs.length > 0 ? (
                                <table><thead><tr><th>Type</th><th>Position</th><th>Statut</th><th>Batterie</th></tr></thead>
                                  <tbody>{d.capteurs.map((c: any, i: number) => <tr key={i}><td>{c.type}</td><td>{c.position}</td><td>{c.statut}</td><td>{c.batterie != null ? `${c.batterie}%` : '—'}</td></tr>)}</tbody>
                                </table>
                              ) : <p>Aucun capteur</p>}
                              <h4>Défauts actifs ({d.defauts?.length || 0})</h4>
                              {d.defauts && d.defauts.length > 0 ? (
                                <table><thead><tr><th>Type</th><th>Sévérité</th></tr></thead>
                                  <tbody>{d.defauts.map((df: any, i: number) => <tr key={i}><td><AlertTriangle size={12} color="#dc2626" /> {df.type}</td><td>{df.severite}</td></tr>)}</tbody>
                                </table>
                              ) : <p>Aucun défaut actif</p>}
                              <h4>Dernières mesures</h4>
                              {d.dernieres_mesures && d.dernieres_mesures.length > 0 ? (
                                <table><thead><tr><th>Date</th><th>V-RMS</th><th>Zone</th></tr></thead>
                                  <tbody>{d.dernieres_mesures.map((mes: any, i: number) => <tr key={i}><td>{mes.date}</td><td>{mes.vrms} mm/s</td><td><span className="parc-zone-badge" style={{ background: ZONE_COLORS[mes.zone] || 'var(--theme-border)', color: '#fff' }}>{mes.zone}</span></td></tr>)}</tbody>
                                </table>
                              ) : <p>Aucune mesure enregistrée</p>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })()}
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