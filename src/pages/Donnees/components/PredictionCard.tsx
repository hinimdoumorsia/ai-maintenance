// src/pages/Donnees/components/PredictionCard.tsx
// Panneau gauche : Prédiction par Fichier + Saisie Manuelle

import React, { useRef, useState } from 'react';
import { PredictionManuelle, StatusType } from '../types';

interface Props {
  manuelle: PredictionManuelle;
  onManuellChange: (field: keyof PredictionManuelle, value: string) => void;
  onFileSelect: (file: File) => void;
  onPredictManuelle: () => void;
}

export const PredictionCard: React.FC<Props> = ({
  manuelle,
  onManuellChange,
  onFileSelect,
  onPredictManuelle,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFileName(f.name); onFileSelect(f); }
  };

  return (
    <div className="card prediction-card">
      <h2 className="card-title">
        <span className="card-icon">🤖</span>
        Interface de Prédiction &amp; Données
      </h2>

      {/* ── a) Prédiction par Fichier ── */}
      <div className="section-subtitle">a) Prédiction par Fichier (CSV/Excel)</div>

      <div className="upload-zone">
        <div className="upload-formats">
          <span className="format-badge csv">📄 CSV</span>
          <span className="format-badge xlsx">📊 X</span>
          <span className="format-badge json">{ }</span>
        </div>

        <p className="upload-label">
          {fileName ? fileName : 'Nouveau fichier pour prédiction'}
        </p>

        <button className="btn-browse" onClick={() => fileRef.current?.click()}>
          Parcourir les fichiers
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        <p className="upload-hint">
          Formats pris en charge: CSV, XLSX, JSON, etc.<br />
          Lancez la prédiction pour le fichier importé.
        </p>
      </div>

      {/* ── b) Saisie Manuelle ── */}
      <div className="section-subtitle">b) Saisie Manuelle d'Observation</div>

      <div className="form-group">
        <label className="form-label">Température (MCH-001)</label>
        <input
          className="form-input"
          type="number"
          placeholder=""
          value={manuelle.temperature}
          onChange={e => onManuellChange('temperature', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Vibration</label>
        <input
          className="form-input"
          type="number"
          placeholder=""
          value={manuelle.vibration}
          onChange={e => onManuellChange('vibration', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Pressure</label>
        <input
          className="form-input"
          type="number"
          placeholder=""
          value={manuelle.pressure}
          onChange={e => onManuellChange('pressure', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Status (Manual)</label>
        <select
          className="form-select"
          value={manuelle.status}
          onChange={e => onManuellChange('status', e.target.value as StatusType)}
        >
          <option value="OK">OK</option>
          <option value="Alerte">Alerte</option>
          <option value="Panne">Panne</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Runtime</label>
        <input
          className="form-input"
          type="number"
          placeholder=""
          value={manuelle.runtime}
          onChange={e => onManuellChange('runtime', e.target.value)}
        />
      </div>

      <button className="btn-predict" onClick={onPredictManuelle}>
        Lancer la Prédiction (Manuelle)
      </button>
    </div>
  );
};