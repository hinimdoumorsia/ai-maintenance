// src/pages/Models/components/RegistreModeles.tsx
import React from 'react';
import { ModelRegistry } from '../types';

const defaultRegistry: ModelRegistry[] = [
  { id: '1', name: 'LSTM_001', version: 'Version 23 version: 3', versionNumber: 3, icon: 'neural' },
  { id: '2', name: 'Random Forest_002', version: 'Version 23 version: 3', versionNumber: 3, icon: 'forest' },
  { id: '3', name: 'Random Forest_002', version: 'Version 23 version: 2', versionNumber: 2, icon: 'forest' },
  { id: '4', name: 'XGBoost_003', version: 'Version 20 version: 1', versionNumber: 1, icon: 'boost' },
];

interface RegistreModelesProps {
  registry?: ModelRegistry[];
}

const NeuralIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--accent-blue)">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ForestIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#16a34a">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 22V12m0 0L8 8m4 4l4-4M4 20h16M7 12l-3-4h16l-3 4" />
  </svg>
);

const BoostIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--accent-orange)">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const iconMap = { neural: <NeuralIcon />, forest: <ForestIcon />, boost: <BoostIcon /> };

const RegistreModeles: React.FC<RegistreModelesProps> = ({ registry = defaultRegistry }) => (
  <div className="card">
    <div className="card-header">
      <div className="card-title-group">
        <div style={{ width: 4, height: 20, background: 'var(--accent-blue)', borderRadius: 2 }} />
        <div>
          <div className="card-title">Registre des Modèles</div>
        </div>
      </div>
    </div>

    <div className="registry-list">
      {registry.map((item) => (
        <div className="registry-item" key={item.id}>
          <div className="registry-item-left">
            <div className={`registry-icon ${item.icon}`}>
              {iconMap[item.icon]}
            </div>
            <div>
              <div className="registry-name">{item.name}</div>
              <div className="registry-version">{item.version}</div>
            </div>
          </div>
          <button className="registry-menu-btn">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default RegistreModeles;