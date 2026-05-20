// src/pages/Models/components/PerformanceChart.tsx
import React from 'react';

/**
 * Performance Globale — courbes d'entraînement par époque.
 *
 * Le TrainingAgent actuel ne logge pas les métriques epoch-by-epoch dans MLflow
 * (il enregistre uniquement le score final). Ce graphique reste donc en placeholder
 * tant que `mlflow.log_metric(..., step=epoch)` n'est pas câblé côté training.
 *
 * Pour activer ce graphique :
 * 1. Côté training, logger les métriques avec un step : `mlflow.log_metric("loss", loss, step=epoch)`
 * 2. Côté backend, exposer un endpoint GET /api/predictions/models/{id}/history
 * 3. Brancher ce composant sur l'endpoint
 */
const PerformanceChart: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon">
            <svg width="16" height="16" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
          </div>
          <div>
            <div className="card-title">Performance Globale</div>
            <div className="card-subtitle">Évolution loss / F1 par époque</div>
          </div>
        </div>
      </div>

      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}>
        <p style={{ marginBottom: 8 }}>
          Les courbes d'entraînement par époque ne sont pas encore exposées par MLflow.
        </p>
        <p style={{ fontSize: 11, color: '#cbd5e1' }}>
          Active <code>mlflow.log_metric(..., step=epoch)</code> côté entraînement pour les voir ici.
        </p>
      </div>
    </div>
  );
};

export default PerformanceChart;
