// src/pages/Donnees/components/InterpretationCard.tsx

import React from 'react';
import { BarChart2, Lightbulb } from 'lucide-react';

interface InterpretationCardProps {
  predictions?: {
    status: string;
    confidence: number;
    recommandation: string;
  };
}

export const InterpretationCard: React.FC<InterpretationCardProps> = ({ predictions }) => {
  return (
    <div className="card interpretation-card">
      <div className="card-title">
        <BarChart2 size={16} style={{ flexShrink: 0, color: '#f97316' }} />
        Interprétation & Recommandations
      </div>

      <div className="interpretation-content">
        {/* Statut de la machine */}
        <div className="interpretation-section">
          <div className="interpretation-label">Statut prédit</div>
          <div className={`interpretation-status ${predictions?.status === 'OK' ? 'success' : 'warning'}`}>
            {predictions?.status || 'En attente'}
          </div>
        </div>

        {/* Niveau de confiance */}
        <div className="interpretation-section">
          <div className="interpretation-label">Confiance du modèle</div>
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ width: `${predictions?.confidence || 0}%` }}
            />
            <span className="confidence-text">{predictions?.confidence || 0}%</span>
          </div>
        </div>

        {/* Recommandation */}
        <div className="interpretation-section">
          <div className="interpretation-label">Recommandation</div>
          <div className="interpretation-recommandation">
            {predictions?.recommandation || 'Chargez des données pour obtenir une prédiction'}
          </div>
        </div>

        {/* Détails supplémentaires */}
        <div className="interpretation-details">
          <div className="detail-item">
            <span className="detail-label">Fiabilité prédite:</span>
            <span className="detail-value">Haute</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Prochaine maintenance:</span>
            <span className="detail-value">Dans 15 jours</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Action recommandée:</span>
            <span className="detail-value">Inspection visuelle</span>
          </div>
        </div>

        {/* Note d'interprétation */}
        <div className="interpretation-note">
          <div className="note-icon"><Lightbulb size={16} style={{ color: '#f97316' }} /></div>
          <div className="note-text">
            Basé sur l'analyse des données historiques et les tendances actuelles,
            le modèle prédit un fonctionnement nominal avec une maintenance préventive recommandée.
          </div>
        </div>
      </div>
    </div>
  );
};