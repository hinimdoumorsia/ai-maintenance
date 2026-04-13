import React from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import "./agents.css";
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
  HelpCircle
} from 'lucide-react';

import FluxCard         from "./components/FluxCard";
import CompatibilityCard from "./components/CompatibilityCard";
import DelegationCard   from "./components/DelegationCard";
import PerformanceCard  from "./components/PerformanceCard";

import type {
  CompatibilityEntry,
  Agent,
  ToolPerformance,
  PerformanceBarPoint,
} from "./types";

// ─── Static Data ─────────────────────────────────────────────────────────────

const compatData: CompatibilityEntry[] = [
  {
    id: "1",
    incomentId: "source_01",
    status: "Compatible",
    actionLabel: "sent à modèle",
    message: "Modèle LSTM nécessite format X",
  },
  {
    id: "2",
    incomentId: "source_02",
    status: "Alert",
    actionLabel: "délégué",
    message: "Modèle LSTM nécessite format X",
  },
  {
    id: "3",
    incomentId: "source_03",
    status: "Non Compatible",
    actionLabel: "rejeté",
    message: "Modèle LSTM nécessite format X",
  },
  {
    id: "4",
    incomentId: "source_04",
    status: "Non Compatible",
    actionLabel: "rejeté",
    message: "Modèle LSTM nécessite format X",
  },
];

const agentData: Agent[] = [
  {
    id: "adc",
    name: "Agent_Data_Cleaner",
    role: "Nettoyage",
    description: "Rôle - Nettoyage - Actuall data re analyser",
    status: "Occupé",
    children: [
      {
        id: "afe",
        name: "Agent_Feature_Engineer",
        role: "Engineer",
        description: "Role - Engineer » - actuall - feature engineer",
        status: "Disponible",
      },
      {
        id: "apf1",
        name: "Agent_Prediction_Finalizer",
        role: "Prediction",
        description: "Role - Prediction - nowectable rand feature engineer",
        status: "Disponible",
      },
      {
        id: "apf2",
        name: "Agent_Prediction_Finalizer",
        role: "Prediction",
        description: "Role - Prediction - actuall predicton finalizer",
        status: "Disponible",
      },
    ],
  },
];

const toolData: ToolPerformance[] = [
  { name: "Data Validation",  execution: "9.3 ms",  temps: "0.0%", success: "99.2%", f1Score: 0.92, recall: 0.78 },
  { name: "Anomaly Detection", execution: "13.5m", temps: "0.0%", success: "99.2%", f1Score: 0.88, recall: 0.90 },
];

const chartData: PerformanceBarPoint[] = [
  { label: 10, f1Score: 0.82, recall: 0.70 },
  { label: 20, f1Score: 0.91, recall: 0.88 },
  { label: 30, f1Score: 0.75, recall: 0.85 },
  { label: 40, f1Score: 0.89, recall: 0.80 },
];

// ─── Nav items avec les mêmes chemins que DonneesPage ─────────────────────────
const NAV_ITEMS = [
  { label: 'Tableau de bord', icon: Home, path: '/' },
  { label: 'Données',         icon: Database, path: '/donnees' },
  { label: 'Entraînement',    icon: GraduationCap, path: '/entrainement' },  // ← Changé Formation → Entraînement
  { label: 'Modèles',         icon: Package, path: '/models' },               // ← Même chemin que DonneesPage
  { label: 'Prédictions',     icon: Sparkles, path: '/predictions' },
  { label: 'Outils',          icon: Wrench, path: '/outils' },
  { label: 'Agents',          icon: Bot, path: '/agents', active: true },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🤖</div>
          <div className="sidebar-logo-text">
            AI MAINTENANCE
            <span>Système intelligent</span>
          </div>
        </div>

        {/* Navigation avec useNavigate comme DonneesPage */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
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

        {/* Footer avec Paramètres comme DonneesPage */}
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

      {/* ── Main ────────────────────────────────── */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>Agents</h1>
            <p>Gérer les flux de données, les prédictions et la délégation d'agents</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-notif">
              <Bell size={18} />
              <span className="notif-badge">1</span>
            </button>
            <button className="topbar-user">
              <div className="user-avatar">A</div>
              Admin <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {/* Page content — 2-column grid */}
        <div className="page-content">
          {/* Row 1, Col 1 */}
          <FluxCard status="En Ligne" />

          {/* Row 1, Col 2 */}
          <CompatibilityCard entries={compatData} />

          {/* Row 2, Col 1 */}
          <DelegationCard agents={agentData} />

          {/* Row 2, Col 2 */}
          <PerformanceCard tools={toolData} chartData={chartData} />
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;