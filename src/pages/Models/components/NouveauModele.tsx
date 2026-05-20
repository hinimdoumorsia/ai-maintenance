// src/pages/Models/components/NouveauModele.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NouveauModele: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div>
            <div className="card-title">Nouveau Modèle</div>
            <div className="card-subtitle">Lancer un nouvel entraînement</div>
          </div>
        </div>
      </div>

      <div className="new-model-card">
        <div className="new-model-icon-wrap">
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="var(--accent-orange)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>

        <button className="btn-start" onClick={() => navigate('/entrainement')}>
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Démarrer l'entrainement
        </button>

        <span className="new-model-label">Créer Nouveau Modèle</span>
      </div>
    </div>
  );
};

export default NouveauModele;
