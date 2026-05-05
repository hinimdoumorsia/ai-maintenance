// src/pages/Donnees/index.tsx
// Page principale — Données & Prédiction (AI Maintenance)

import React, { useState } from 'react';
import { Database, BarChart2, Clock, TrendingUp, Cpu, Wifi, Star, Upload } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import './donnees.css';

import { PredictionCard } from './components/PredictionCard';
import { VisualisationCard } from './components/VisualisationCard';
import { KPICard } from './components/KPICard';
import ChargementPage from './components/ChargementPage';
import VueGenerale from './components/VueGenerale';
import PronosticPage from './components/PronosticPage';
import KPIsPage from './components/KPIsPage';
import DonneesParc from './components/DonneesParc';
import CapteurIoT from './components/CapteurIoT';
import ClassificationVIS from './components/ClassificationVIS';
import AnalyseVibratoire from './components/AnalyseVibratoire';

import {
  DonneesPageState,
  PredictionManuelle,
} from './types';

/* ─── Données initiales ──────────────────────────────────── */
const defaultState: DonneesPageState = {
  predictionFile: null,
  predictionManuelle: {
    temperature: '',
    vibration: '',
    pressure: '',
    status: 'OK',
    runtime: '',
  },
  apercu: {
    total_observations: 300,
    total_features: 15,
    values_missings: 13,
    features: 4,
    valuers_desentations: 0,
  },
  observations: [
    { timestamp: '2024-01-15 10:00:00', machine_id: 'MCH-001', temperature: 75.4, vibration: 0.023, status: 'OK' },
    { timestamp: '2024-01-15 10:01:00', machine_id: 'MCH-001', temperature: 76.1, vibration: 0.025, status: 'OK' },
    { timestamp: '2024-01-15 10:02:00', machine_id: 'MCH-002', temperature: 88.9, vibration: 0.018, status: 'OK' },
  ],
  kpiFiabilite: {
    taux_disponibilite: 95,
    taux_disponibilite_cible: 94,
    cible_atteinte: true,
  },
  kpiCouts: {
    reduction_pourcentage: '-20-30%',
    cible_atteinte: true,
  },
  kpiProductivite: {
    temps_arret_non_planifie: '-35-50%',
    oee: 150,
    oee_progress: 85,
    cible_oee_atteinte: false,
  },
  kpiModele: {
    precision: 85,
    precision_target: 85,
    faux_positifs_pct: 0,
    faux_positifs_cible: 10,
    lead_time_h: 72,
    lead_time_progress: 72,
  },
};

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
  items: { id: AnalyseId; label: string; icon: React.ElementType; badge?: number }[];
}[] = [
  {
    label: 'Données',
    items: [
      { id: 'chargement',  label: 'Chargement',          icon: Upload },
      { id: 'default',     label: 'Vue générale',        icon: Database },
    ],
  },
  {
    label: 'Analyses disponibles',
    items: [
      { id: 'vibratoire',  label: 'Analyse vibratoire', icon: BarChart2, badge: 7 },
      { id: 'pronostic',   label: 'Pronostic & DRBF',   icon: Clock },
      { id: 'kpis',        label: 'KPIs & Performance',  icon: TrendingUp },
    ],
  },
  {
    label: 'Actifs',
    items: [
      { id: 'machines',  label: 'Parc machines',      icon: Cpu,  badge: 3 },
      { id: 'capteurs',  label: 'Capteurs IoT',       icon: Wifi },
      { id: 'vis',       label: 'Classification VIS', icon: Star },
    ],
  },
];

/* ─── DonneesPage ────────────────────────────────────────── */
const DonneesPage: React.FC = () => {
  const [state,   setState]   = useState<DonneesPageState>(defaultState);
  const [analyse, setAnalyse] = useState<AnalyseId>('default');

  /* handlers */
  const handleManuellChange = (field: keyof PredictionManuelle, value: string) => {
    setState(s => ({
      ...s,
      predictionManuelle: { ...s.predictionManuelle, [field]: value },
    }));
  };

  const handleFileSelect = (file: File) => {
    setState(s => ({ ...s, predictionFile: file }));
  };

  const handlePredictManuelle = () => {
    console.log('Lancement prédiction manuelle', state.predictionManuelle);
  };

  const activeOption = NAV_GROUPS.flatMap(g => g.items).find(o => o.id === analyse);

  return (
    <AppLayout
      title="Données & Prédiction"
      subtitle="Gérer les données, les prédictions et les KPI"
      icon={Database}
    >
      <div className="donnees-main">

        {/* ── Navbar horizontale ── */}
        <nav className="donnees-navbar">
          {NAV_GROUPS.map((group, gi) => (
            <div className="donnees-navbar-group" key={gi}>
              <span className="donnees-navbar-group-label">{group.label}</span>
              <div className="donnees-navbar-items">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = analyse === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAnalyse(item.id)}
                      className={`donnees-nav-btn${isActive ? ' active' : ''}`}
                    >
                      <Icon size={14} />
                      {item.label}
                      {item.badge != null && (
                        <span className={`donnees-nav-badge${isActive ? ' active' : ''}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

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
            ) : (
              /* Placeholder "à venir" pour vibratoire */
              <div className="donnees-placeholder">
                {activeOption && (
                  <>
                    <div className="donnees-placeholder-icon">
                      <activeOption.icon size={32} />
                    </div>
                    <div className="donnees-placeholder-text">
                      <div className="donnees-placeholder-title">
                        {activeOption.label}
                      </div>
                      <div className="donnees-placeholder-subtitle">
                        Cette analyse est en cours de développement et sera disponible dans la prochaine version.
                      </div>
                    </div>
                    <div className="donnees-placeholder-badge">
                      Bientôt disponible
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

      </div>
    </AppLayout>
  );
};

export default DonneesPage;
