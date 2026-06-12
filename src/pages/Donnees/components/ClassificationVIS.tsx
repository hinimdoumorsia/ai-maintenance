// src/pages/Donnees/components/ClassificationVIS.tsx
// Sous-page Classification VIS — Vibration Intelligent Surveillance

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { API, useDatasets } from '../../../contexts/DatasetContext';
import { useDatasetForPage } from '../../../hooks/useDatasetForPage';
import IncompatibleDatasetMessage from './IncompatibleDatasetMessage';

interface VisMachine {
  machine_id: string;
  machine_nom: string;
  vrms: number;
  zone_iso: string;
  tendance_7j: string;
  classe_vis: string;
  recommandation: string;
  action: string;
}

const VIS_COLORS: Record<string, string> = {
  NORMAL: '#16a34a',
  ATTENTION: '#eab308',
  CRITIQUE: '#f97316',
  URGENCE: '#dc2626',
};

const VIS_REFERENCE = [
  { classe: 'NORMAL', zone: 'A ou B', tendance: 'Stable ou baisse', action: 'Surveillance périodique (6 semaines)' },
  { classe: 'ATTENTION', zone: 'B ou C', tendance: 'Hausse modérée', action: 'Surveillance renforcée (2 semaines)' },
  { classe: 'CRITIQUE', zone: 'C', tendance: 'Hausse forte', action: 'Planifier intervention sous 30 jours' },
  { classe: 'URGENCE', zone: 'D', tendance: 'Toute tendance', action: 'Arrêt machine — intervention immédiate' },
];

const ClassificationVIS: React.FC = () => {
  const navigate = useNavigate();
  const { datasets, selectedId, setSelectedId, loading: ctxLoading } = useDatasets();
  const { isCompatible, dataset: selectedDs } = useDatasetForPage('vis', selectedId);
  const [source, setSource] = useState<'db' | 'dataset'>('db');
  const [machines, setMachines] = useState<VisMachine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPedagogique, setShowPedagogique] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (source === 'db') {
      const session = JSON.parse(localStorage.getItem('ai-maint-session') || '{}');
      const userId = session.id;
      if (!userId) { setLoading(false); return; }
      fetch(`${API}/api/donnees/parc/classification-vis?user_id=${userId}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(d => setMachines(Array.isArray(d) ? d : d.machines || []))
        .catch(() => setMachines([]))
        .finally(() => setLoading(false));
    } else {
      setMachines([]);
      setLoading(false);
    }
  }, [source]);

  const sorted = [...machines].sort((a, b) => {
    const order = ['URGENCE', 'CRITIQUE', 'ATTENTION', 'NORMAL'];
    return order.indexOf(a.classe_vis) - order.indexOf(b.classe_vis);
  });

  const stats = {
    normal: machines.filter(m => m.classe_vis === 'NORMAL').length,
    attention: machines.filter(m => m.classe_vis === 'ATTENTION').length,
    critique: machines.filter(m => m.classe_vis === 'CRITIQUE').length,
    urgence: machines.filter(m => m.classe_vis === 'URGENCE').length,
  };

  const barData = [
    { name: 'Normal', value: stats.normal, color: VIS_COLORS.NORMAL },
    { name: 'Attention', value: stats.attention, color: VIS_COLORS.ATTENTION },
    { name: 'Critique', value: stats.critique, color: VIS_COLORS.CRITIQUE },
    { name: 'Urgence', value: stats.urgence, color: VIS_COLORS.URGENCE },
  ];

  const needsAction = stats.critique + stats.urgence;
  const pctNeedsAction = machines.length > 0 ? Math.round(needsAction / machines.length * 100) : 0;

  if (ctxLoading) return <div className="vis-page"><div className="eda-loading"><Loader2 size={20} className="spin" /> Chargement...</div></div>;

  const sourceHeader = (
    <div className="kpis-header">
      <div className="source-toggle-btns">
        <button className={`source-toggle-btn${source === 'db' ? ' active' : ''}`} onClick={() => setSource('db')}>Base de données</button>
        <button className={`source-toggle-btn${source === 'dataset' ? ' active' : ''}`} onClick={() => setSource('dataset')}>Dataset uploadé</button>
      </div>
    </div>
  );

  if (source === 'dataset') {
    return (
      <div className="vis-page">
        {sourceHeader}
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
          <p style={{ fontSize: 14, marginBottom: 8 }}>La classification VIS depuis un dataset uploadé n'est pas disponible.</p>
          <p style={{ fontSize: 12, color: 'var(--theme-text-faint)' }}>
            Utilisez le mode <strong>Base de données</strong> pour voir la classification de votre parc réel.
          </p>
          <button style={{ marginTop: 16, padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
            onClick={() => setSource('db')}>Passer en mode Base de données</button>
        </div>
      </div>
    );
  }

  return (
    <div className="vis-page">
      {sourceHeader}

      {loading && (
        <div className="eda-loading" style={{ padding: '20px 0' }}>
          <Loader2 size={18} className="spin" /> Chargement de la classification...
        </div>
      )}
      {!loading && <>
      {/* SECTION 1: Explication VIS */}
      <div className="vis-section">
        <h3>Classification VIS — Vibration Intelligent Surveillance</h3>
        <p className="vis-desc">La classification VIS combine la zone ISO (niveau absolu de vibration) avec la tendance de dégradation pour recommander l'action maintenance la plus adaptée.</p>

        <div className="vis-reference-table-wrap">
          <table className="vis-reference-table">
            <thead><tr><th>Classe VIS</th><th>Zone ISO</th><th>Tendance</th><th>Action recommandée</th></tr></thead>
            <tbody>
              {VIS_REFERENCE.map(r => (
                <tr key={r.classe}>
                  <td><strong>{r.classe}</strong></td>
                  <td>{r.zone}</td>
                  <td>{r.tendance}</td>
                  <td>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="baignoire-toggle" onClick={() => setShowPedagogique(v => !v)} style={{ marginTop: '12px' }}>
          <span>En savoir plus sur la classification VIS</span>
          {showPedagogique ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showPedagogique && (
          <p className="baignoire-text" style={{ marginTop: '12px' }}>Cette classification est inspirée des recommandations de la norme ISO 18436 (formation et certification des praticiens en surveillance vibratoire de machines). Elle combine la mesure absolue (zone ISO 10816) — "où en est la machine maintenant" — et la tendance de dégradation — "dans quelle direction évolue-t-elle". Le résultat est une recommandation d'action concrète pour le technicien de maintenance.</p>
        )}
      </div>

      {/* SECTION 2: Tableau classification du parc */}
      <div className="vis-section">
        <h3>Classification du parc — {machines.length} machines</h3>
        <div className="parc-table-wrap">
          <table className="parc-table">
            <thead><tr><th>Machine</th><th>V-RMS</th><th>Zone ISO</th><th>Tendance 7j</th><th>Classe VIS</th><th>Recommandation</th><th>Action</th></tr></thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--theme-text-faint)', fontSize: 13 }}>
                    Aucune machine dans la base de données.
                  </td>
                </tr>
              )}
              {sorted.map(m => (
                <tr key={m.machine_id}>
                  <td>{m.machine_nom}</td>
                  <td style={{ fontWeight: 700 }}>
                    {m.vrms != null ? `${Number(m.vrms).toFixed(2)} mm/s` : '—'}
                  </td>
                  <td>
                    {m.zone_iso ? (
                      <span className="parc-zone-badge" style={{ background: m.zone_iso === 'A' ? '#16a34a' : m.zone_iso === 'B' ? '#eab308' : m.zone_iso === 'C' ? '#f97316' : '#dc2626', color: '#fff' }}>Zone {m.zone_iso}</span>
                    ) : '—'}
                  </td>
                  <td>{m.tendance_7j || '—'}</td>
                  <td>
                    <span className="parc-zone-badge" style={{
                      background: m.classe_vis ? (VIS_COLORS[m.classe_vis] || 'var(--theme-bg-hover)') : 'var(--theme-bg-hover)',
                      color: m.classe_vis && VIS_COLORS[m.classe_vis] ? '#fff' : 'var(--theme-text)',
                    }}>{m.classe_vis || '—'}</span>
                  </td>
                  <td>{m.recommandation || '—'}</td>
                  <td>
                    {(m.classe_vis === 'URGENCE' || m.classe_vis === 'CRITIQUE') ? (
                      <button className="btn-pmc-action urgent" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => navigate('/maintenance')}>
                        <Wrench size={10} /> Créer BT
                      </button>
                    ) : (m.action || '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Résumé statistique */}
      <div className="vis-section">
        <h3><BarChart3 size={16} /> Résumé statistique</h3>
        <div className="vis-stats-grid">
          <ResponsiveContainer width={300} height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="vis-stats-summary">
            <div className="vis-stats-line">Normal : {stats.normal} ({machines.length > 0 ? Math.round(stats.normal / machines.length * 100) : 0}%)</div>
            <div className="vis-stats-line">Attention : {stats.attention}</div>
            <div className="vis-stats-line">Critique : {stats.critique}</div>
            <div className="vis-stats-line">Urgence : {stats.urgence}</div>
            <div className="vis-stats-phrase">
              {needsAction > 0 ? (
                <><AlertTriangle size={14} color="#dc2626" /> {pctNeedsAction}% de votre parc nécessite une action dans les 30 prochains jours.</>
              ) : (
                <><CheckCircle2 size={14} color="#16a34a" /> Aucune action urgente nécessaire sur votre parc.</>
              )}
            </div>
          </div>
        </div>
      </div>
      </>}
    </div>
  );
};

export default ClassificationVIS;