// src/pages/Donnees/index.tsx
// Page principale — Données & Prédiction (AI Maintenance)

import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Database, BarChart2, Clock, TrendingUp, Cpu, Wifi, Star, Upload } from 'lucide-react';
import { useDatasets } from '../../contexts/DatasetContext';
import AppLayout from '../../components/AppLayout';
import './donnees.css';

import ChargementPage from './components/ChargementPage';
import VueGenerale from './components/VueGenerale';
import PronosticPage from './components/PronosticPage';
import KPIsPage from './components/KPIsPage';
import DonneesParc from './components/DonneesParc';
import CapteurIoT from './components/CapteurIoT';
import ClassificationVIS from './components/ClassificationVIS';
import AnalyseVibratoire from './components/AnalyseVibratoire';


/* ─── Options d'analyse ─────────────────────────────────── */
type AnalyseId =
  | 'default'
  | 'chargement'
  | 'vibratoire'
  | 'pronostic'
  | 'kpis'
  | 'machines'
  | 'capteurs'
  | 'vis';

const NAV_GROUPS: {
  label: string;
  items: { id: AnalyseId; label: string; icon: React.ElementType; badgeKey?: string }[];
}[] = [
  {
    label: 'Données',
    items: [
      { id: 'chargement', label: 'Chargement',    icon: Upload },
      { id: 'default',    label: 'Vue générale',  icon: Database },
    ],
  },
  {
    label: 'Analyses disponibles',
    items: [
      { id: 'vibratoire', label: 'Analyse vibratoire', icon: BarChart2, badgeKey: 'vibration' },
      { id: 'pronostic',  label: 'Pronostic & DRBF',   icon: Clock },
      { id: 'kpis',       label: 'KPIs & Performance',  icon: TrendingUp },
    ],
  },
  {
    label: 'Actifs',
    items: [
      { id: 'machines', label: 'Parc machines',      icon: Cpu,  badgeKey: 'zoneD' },
      { id: 'capteurs', label: 'Capteurs IoT',       icon: Wifi },
      { id: 'vis',      label: 'Classification VIS', icon: Star },
    ],
  },
];

/* ─── DonneesPage ────────────────────────────────────────── */
const DonneesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { datasets } = useDatasets();

  /* Tab routing via URL (?tab=vibratoire) */
  const VALID_IDS: AnalyseId[] = ['default', 'chargement', 'vibratoire', 'pronostic', 'kpis', 'machines', 'capteurs', 'vis'];
  const rawTab = searchParams.get('tab') as AnalyseId | null;
  const analyse: AnalyseId = rawTab && VALID_IDS.includes(rawTab) ? rawTab : 'default';
  const setAnalyse = (id: AnalyseId) => setSearchParams({ tab: id }, { replace: false });

  /* Badge counts — live from context */
  const badges = useMemo(() => ({
    vibration: datasets.filter(d => d.detected_type === 'vibration' && d.status === 'processed').length,
    zoneD: 0,  // populated by ClassificationVIS / VIS data if needed
  }), [datasets]);

  return (
    <AppLayout
      title="Données & Prédiction"
      subtitle="Gérer les données, les prédictions et les KPI"
      icon={Database}
    >
      <div className="donnees-main">

        {/* ── Sidebar verticale secondaire ── */}
        <aside className="donnees-subnav" aria-label="Navigation Données">
          {NAV_GROUPS.map((group, gi) => (
            <div className="donnees-subnav-group" key={gi}>
              <h4 className="donnees-subnav-group-label">{group.label}</h4>
              <ul className="donnees-subnav-items">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = analyse === item.id;
                  const badgeCount = item.badgeKey
                    ? badges[item.badgeKey as keyof typeof badges]
                    : 0;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setAnalyse(item.id)}
                        className={`donnees-subnav-item${isActive ? ' active' : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon size={15} className="donnees-subnav-item-icon" />
                        <span className="donnees-subnav-item-label">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className={`donnees-subnav-badge${isActive ? ' active' : ''}`}>
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* ── Zone principale ── */}
        <div className="donnees-analyse-content">
          {analyse === 'chargement' ? (
            <ChargementPage />
          ) : analyse === 'default' ? (
            <VueGenerale />
          ) : analyse === 'pronostic' ? (
            <PronosticPage />
          ) : analyse === 'kpis' ? (
            <KPIsPage />
          ) : analyse === 'machines' ? (
            <DonneesParc />
          ) : analyse === 'capteurs' ? (
            <CapteurIoT />
          ) : analyse === 'vis' ? (
            <ClassificationVIS />
          ) : analyse === 'vibratoire' ? (
            <AnalyseVibratoire />
          ) : null}
        </div>

      </div>
    </AppLayout>
  );
};

export default DonneesPage;
