// src/pages/Models/index.tsx
import React from 'react';
import './models.css';

import Sidebar             from './components/Sidebar';
import Header              from './components/Header';
import MesModeles          from './components/MesModeles';
import PerformanceComparee from './components/PerformanceComparee';
import NouveauModele       from './components/NouveauModele';
import PerformanceChart    from './components/PerformanceChart';   // ← nouveau
import GestionDeploiement  from './components/GestionDeploiement';
import RegistreModeles     from './components/RegistreModeles';

const ModelsPage: React.FC = () => {
  return (
    <div className="app-shell">

      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Contenu principal ── */}
      <div className="main-content">

        {/* En-tête */}
        <Header />

        {/* Grille */}
        <div className="page-body">

          {/* Ligne 1 — Mes Modèles | Performance Comparée */}
          <MesModeles />
          <PerformanceComparee />

          {/* Ligne 2 — Nouveau Modèle | Performance Globale (courbes) */}
          <NouveauModele />
          <PerformanceChart />          {/* ← placé exactement à droite de NouveauModele */}

          {/* Ligne 3 — Gestion de Déploiement | Registre des Modèles */}
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
            }}
          >
            <GestionDeploiement />
            <RegistreModeles />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModelsPage;