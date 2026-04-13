// src/pages/Donnees/index.tsx
// Page principale — Données & Prédiction (AI Maintenance)

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Database, 
  GraduationCap, 
  Package, 
  Sparkles, 
  Wrench, 
  Bot, 
  Settings,
  Bell,
  ChevronDown,
  User,
  HelpCircle
} from 'lucide-react';
import './donnees.css';

import { PredictionCard } from './components/PredictionCard';
import { VisualisationCard } from './components/VisualisationCard';
import { KPICard } from './components/KPICard';

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

/* ─── Sidebar nav items ──────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Tableau de bord', icon: Home, path: '/' },
  { label: 'Données',         icon: Database,  path: '/donnees', active: true },
  { label: 'Entraînement',    icon: GraduationCap, path: '/entrainement' },
  { label: 'Modèles',         icon: Package, path: '/models' },  // ← Changé de '/modeles' à '/models'
  { label: 'Prédictions',     icon: Sparkles, path: '/predictions' },
  { label: 'Outils',          icon: Wrench, path: '/outils' },
  { label: 'Agents',          icon: Bot, path: '/agents' },
];

/* ─── DonneesPage ────────────────────────────────────────── */
const DonneesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<DonneesPageState>(defaultState);

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
    // TODO: appel API prédiction manuelle
    console.log('Lancement prédiction manuelle', state.predictionManuelle);
  };

  return (
    <div className="donnees-layout">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🤖</div>
          <div className="sidebar-logo-text">
            AI MAINTENANCE
            <span>Système intelligent</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={17} className="nav-icon-svg" />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`nav-item ${location.pathname === '/parametres' ? 'active' : ''}`}
            onClick={() => navigate('/parametres')}
          >
            <Settings size={17} className="nav-icon-svg" />
            <span className="nav-label">Paramètres</span>
          </button>

          <div className="sidebar-help">
            <h4>Besoin d'aide?</h4>
            <p>Voir la documentation</p>
            <a href="#">› Voir la documentation</a>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="donnees-main">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">
            <h1>Données &amp; Prédiction</h1>
            <p>Gérer les données, les prédictions et les KPI</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-notif">
              <Bell size={18} />
              <span className="badge">1</span>
            </button>
            <button className="topbar-user">
              <div className="topbar-user-avatar">A</div>
              Admin <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="donnees-content">

          {/* Col gauche : Prédiction */}
          <PredictionCard
            manuelle={state.predictionManuelle}
            onManuellChange={handleManuellChange}
            onFileSelect={handleFileSelect}
            onPredictManuelle={handlePredictManuelle}
          />

          {/* Col droite haut : Visualisation */}
          <VisualisationCard
            apercu={state.apercu}
            observations={state.observations}
          />

          {/* Col droite bas : KPI */}
          <KPICard
            fiabilite={state.kpiFiabilite}
            couts={state.kpiCouts}
            productivite={state.kpiProductivite}
            modele={state.kpiModele}
          />

        </div>
      </div>
    </div>
  );
};

export default DonneesPage;