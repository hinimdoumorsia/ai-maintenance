// src/pages/Models/components/MesModeles.tsx
import React from 'react';
import { Model } from '../types';

interface MesModelesProps {
  models: Model[];
  loading?: boolean;
  error?: string | null;
  onView?: (model: Model) => void;
  onRetrain?: (model: Model) => void;
  onDeploy?: (model: Model) => void;
  onUndeploy?: (model: Model) => void;
}

const statusClass: Record<string, string> = {
  Deployed: 'deployed',
  'In-Training': 'in-training',
  Archived: 'archived',
};

const MesModeles: React.FC<MesModelesProps> = ({
  models,
  loading = false,
  error = null,
  onView,
  onRetrain,
  onDeploy,
  onUndeploy,
}) => (
  <div className="card">
    <div className="card-header">
      <div className="card-title-group">
        <div className="card-icon orange">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent-orange)">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
        </div>
        <div>
          <div className="card-title">Mes Modèles</div>
          <div className="card-subtitle">Modèles enregistrés dans MLflow</div>
        </div>
      </div>
    </div>

    {loading && (
      <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 12 }}>
        Chargement du registre MLflow…
      </div>
    )}
    {error && (
      <div style={{ marginBottom: 12, color: '#b91c1c', fontSize: 12 }}>{error}</div>
    )}
    {!loading && !error && models.length === 0 && (
      <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 12 }}>
        Aucun modèle disponible. Lance d'abord un entraînement.
      </div>
    )}

    {models.length > 0 && (
      <table className="models-table">
        <thead>
          <tr>
            <th>Model ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Score</th>
            <th>Dernière maj</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.id}>
              <td><span className="model-id">{m.id}</span></td>
              <td>{m.type}</td>
              <td>
                <span className={`status-badge ${statusClass[m.status]}`}>{m.status}</span>
              </td>
              <td>{m.performance > 0 ? `${(m.performance * 100).toFixed(0)}%` : '—'}</td>
              <td>{m.createdAt}</td>
              <td>
                <div className="action-links">
                  <button className="action-link" onClick={() => onView?.(m)}>View</button>
                  {m.status === 'Deployed' && (
                    <>
                      <button className="action-link" onClick={() => onRetrain?.(m)}>Retrain</button>
                      <button className="action-link red" onClick={() => onUndeploy?.(m)}>Undeploy</button>
                    </>
                  )}
                  {m.status === 'In-Training' && (
                    <button className="action-link orange" onClick={() => onDeploy?.(m)}>Promote</button>
                  )}
                  {m.status === 'Archived' && (
                    <button className="action-link orange" onClick={() => onDeploy?.(m)}>Deploy</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default MesModeles;
