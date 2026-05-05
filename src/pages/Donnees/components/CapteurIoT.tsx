// src/pages/Donnees/components/CapteurIoT.tsx
// Sous-page Capteurs IoT — monitoring capteurs

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BatteryLow,
  CheckCircle2,
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

const CapteurIoT: React.FC = () => {
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('capteurs', selectedId);
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [capteurs, setCapteurs] = useState<Capteur[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('Tous');
  const [filterStatut, setFilterStatut] = useState('Tous');

  const mockCapteurs: Capteur[] = [
    { id: 'C001', machine_id: 'M001', machine_nom: 'Compresseur Atlas C-1', type: 'Accéléromètre', position: 'Roulement 1', statut: 'Actif', batterie: 85, derniere_mesure: '2026-05-05 10:30', freq_acq: '10 kHz', nb_mesures_24h: 1440 },
    { id: 'C002', machine_id: 'M001', machine_nom: 'Compresseur Atlas C-1', type: 'Vélocimètre', position: 'Sortie arbre', statut: 'Actif', batterie: 72, derniere_mesure: '2026-05-05 10:30', freq_acq: '5 kHz', nb_mesures_24h: 720 },
    { id: 'C003', machine_id: 'M002', machine_nom: 'Pompe P-12', type: 'Température', position: 'Carter', statut: 'Batterie faible', batterie: 15, derniere_mesure: '2026-05-04 08:15', freq_acq: '1 Hz', nb_mesures_24h: 86400 },
    { id: 'C004', machine_id: 'M003', machine_nom: 'Moteur ME-45', type: 'Courant', position: 'Phase A', statut: 'Actif', batterie: null, derniere_mesure: '2026-05-05 11:00', freq_acq: '50 Hz', nb_mesures_24h: 4320000 },
    { id: 'C005', machine_id: 'M001', machine_nom: 'Compresseur Atlas C-1', type: 'Pression', position: 'Sortie', statut: 'En panne', batterie: 5, derniere_mesure: '2026-05-01 14:20', freq_acq: '10 Hz', nb_mesures_24h: 0 },
    { id: 'C006', machine_id: 'M004', machine_nom: 'Ventilateur V-08', type: 'Accéléromètre', position: 'Roulement 2', statut: 'Inactif', batterie: 45, derniere_mesure: '2026-04-28 22:00', freq_acq: '10 kHz', nb_mesures_24h: 0 },
    { id: 'C007', machine_id: 'M005', machine_nom: 'Réducteur R-22', type: 'Température', position: 'Huile', statut: 'Actif', batterie: 90, derniere_mesure: '2026-05-05 09:20', freq_acq: '1 Hz', nb_mesures_24h: 86400 },
  ];

  useEffect(() => {
    setLoading(true);
    if (source === 'db') {
      fetch(`${API}/api/donnees/parc/capteurs`)
        .then(r => r.ok ? r.json() : mockCapteurs)
        .then(d => setCapteurs(Array.isArray(d) ? d : d.capteurs || []))
        .catch(() => setCapteurs(mockCapteurs))
        .finally(() => setLoading(false));
    } else {
      setCapteurs(mockCapteurs);
      setLoading(false);
    }
  }, [source]);

  const types = ['Tous', ...new Set(capteurs.map(c => c.type))];
  const statuts = ['Tous', 'Actif', 'Inactif', 'Batterie faible', 'En panne'];

  const filtered = capteurs
    .filter(c => filterType === 'Tous' || c.type === filterType)
    .filter(c => filterStatut === 'Tous' || c.statut === filterStatut);

  const stats = {
    total: capteurs.length,
    actifs: capteurs.filter(c => c.statut === 'Actif').length,
    batterieFaible: capteurs.filter(c => c.batterie !== null && c.batterie < 20).length,
    panne: capteurs.filter(c => c.statut === 'En panne').length,
  };

  if (ctxLoading) return <div className="capteurs-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;
  if (source === 'dataset' && !isCompatible) {
    return <div className="capteurs-page"><IncompatibleDatasetMessage page="Capteurs IoT" datasetName={selectedDs?.name || 'inconnu'} /></div>;
  }

  const getBatteryColor = (b: number | null) => b == null ? '#d1d5db' : b < 20 ? '#dc2626' : b <= 50 ? '#f97316' : '#16a34a';

  return (
    <div className="capteurs-page">
      {/* Source Toggle */}
      <div className="kpis-header">
        <div className="source-toggle-btns">
          <button className={`source-toggle-btn${source === 'db' ? ' active' : ''}`} onClick={() => setSource('db')}>Base de données</button>
          <button className={`source-toggle-btn${source === 'dataset' ? ' active' : ''}`} onClick={() => setSource('dataset')}>Dataset uploadé</button>
        </div>
      </div>

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
          {types.map(t => <option key={t} value={t}>{t === 'Tous' ? 'Tous types' : t}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          {statuts.map(s => <option key={s} value={s}>{s === 'Tous' ? 'Tous statuts' : s}</option>)}
        </select>
      </div>

      {/* Types de capteurs */}
      <div className="capteurs-types-grid">
        {Object.entries(TYPE_DESC).map(([type, desc]) => {
          const Icon = TYPE_ICONS[type] || Zap;
          return (
            <div key={type} className="capteur-type-card">
              <Icon size={20} color="#f97316" />
              <div>
                <strong>{type}</strong>
                <p>{desc}</p>
              </div>
            </div>
          );
        })}
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
            {filtered.map(c => {
              const bColor = getBatteryColor(c.batterie);
              const statusColor = c.statut === 'Actif' ? '#16a34a' : c.statut === 'Batterie faible' ? '#f97316' : c.statut === 'En panne' ? '#dc2626' : '#9ca3af';
              return (
                <tr key={c.id}>
                  <td className="parc-code">{c.id}</td>
                  <td>{c.machine_nom}</td>
                  <td>{c.type}</td>
                  <td>{c.position}</td>
                  <td><span className="parc-zone-badge" style={{ background: statusColor, color: '#fff' }}>{c.statut}</span></td>
                  <td>
                    {c.batterie == null ? 'N/A' : (
                      <div className="battery-cell">
                        {c.batterie < 20 && <BatteryLow size={12} color="#dc2626" />}
                        <div className="battery-bar"><div className="battery-fill" style={{ width: `${c.batterie}%`, background: bColor }} /></div>
                        <span style={{ color: bColor, fontWeight: 600, fontSize: '11px' }}>{c.batterie}%</span>
                      </div>
                    )}
                  </td>
                  <td>{c.derniere_mesure}</td>
                  <td>{c.freq_acq}</td>
                  <td>{c.nb_mesures_24h.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CapteurIoT;