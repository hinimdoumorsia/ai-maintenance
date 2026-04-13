// src/pages/Models/components/MesModeles.tsx
import React from 'react';
import { Model } from '../types';

const models: Model[] = [
  { id: 'LSTM_001', type: 'LSTM', status: 'Deployed', performance: 0.87, createdAt: '2024-01-15' },
  { id: 'LSTM_002', type: 'XGBoost', status: 'In-Training', performance: 0.82, createdAt: '2024-01-15' },
  { id: 'XGBoost_003', type: 'XGBoost', status: 'Archived', performance: 0.82, createdAt: '2024-01-15' },
  { id: 'XGBoost_003', type: 'LSTM', status: 'Archived', performance: 0.82, createdAt: '2024-01-15' },
];

const statusClass: Record<string, string> = {
  Deployed: 'deployed',
  'In-Training': 'in-training',
  Archived: 'archived',
};

const MesModeles: React.FC = () => (
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
          <div className="card-subtitle">Modèle view activité les modèles</div>
        </div>
      </div>
      <button className="apercu-btn">
        Aperçu
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <table className="models-table">
      <thead>
        <tr>
          <th>Model ID</th>
          <th>Type</th>
          <th>Status</th>
          <th>Performance</th>
          <th>Création</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {models.map((m, i) => (
          <tr key={i}>
            <td><span className="model-id">{m.id}</span></td>
            <td>{m.type}</td>
            <td>
              <span className={`status-badge ${statusClass[m.status]}`}>{m.status}</span>
            </td>
            <td>{(m.performance * 100).toFixed(0)}%</td>
            <td>{m.createdAt}</td>
            <td>
              <div className="action-links">
                {m.status === 'Deployed' && (
                  <>
                    <button className="action-link">View</button>
                    <button className="action-link">Retrain</button>
                  </>
                )}
                {m.status === 'In-Training' && (
                  <>
                    <button className="action-link">View</button>
                    <button className="action-link">Retrain</button>
                  </>
                )}
                {m.status === 'Archived' && i === 2 && (
                  <>
                    <button className="action-link orange">Deploy</button>
                    <button className="action-link red">Undeploy</button>
                  </>
                )}
                {m.status === 'Archived' && i === 3 && (
                  <button className="action-link">View</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MesModeles;