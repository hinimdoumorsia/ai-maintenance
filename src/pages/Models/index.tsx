// src/pages/Models/index.tsx
import React from 'react';
import './models.css';
import AppLayout from '../../components/AppLayout';
import { Package } from 'lucide-react';
import MesModeles          from './components/MesModeles';
import PerformanceComparee from './components/PerformanceComparee';
import NouveauModele       from './components/NouveauModele';
import PerformanceChart    from './components/PerformanceChart';   // ← nouveau
import GestionDeploiement  from './components/GestionDeploiement';
import RegistreModeles     from './components/RegistreModeles';

const ModelsPage: React.FC = () => {
  return (
    <AppLayout
      title="Modèles"
      subtitle="Gérer, évaluer et déployer vos modèles de maintenance prédictive"
      icon={Package}
    >
      <div className="models-main">

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
    </AppLayout>
  );
};

export default ModelsPage;